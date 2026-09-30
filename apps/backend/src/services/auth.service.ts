import { connectDB } from "../config/db";
import { User, toPublicUser } from "../models/User.model";
import { Vendor } from "../models/Vendor.model";
import { hashPassword, verifyPassword } from "../utils/password.util";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.util";
import {
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ValidationError,
  NotFoundError,
} from "../utils/errors";
import type { PublicUser, TokenPair } from "@tea-and-snacks/shared";
import { generateOTP } from "../utils/otp.util";
import { EmailService, EmailTemplates } from "../utils/email.util";
import { MESSAGES } from "../constants/messages";

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: "customer" | "vendor";
  vendorId?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type ChangePasswordInput = {
  oldPassword: string;
  newPassword: string;
};

function issueTokenPair(user: {
  _id: unknown;
  role: string;
  vendorId?: string;
  tokenVersion: number;
}): TokenPair {
  const accessToken = signAccessToken({
    sub: String(user._id),
    role: user.role as PublicUser["role"],
    vendorId: user.vendorId,
    v: user.tokenVersion,
  });

  const refreshToken = signRefreshToken({
    sub: String(user._id),
    v: user.tokenVersion,
  });

  return { accessToken, refreshToken };
}

export async function registerUser(
  data: RegisterInput,
): Promise<{ message: string; userId: string }> {
  await connectDB();

  if (data.role === "vendor") {
    if (!data.vendorId || !(await Vendor.exists({ _id: data.vendorId }))) {
      throw new ValidationError(MESSAGES.INVALID_STALL_SELECTION);
    }
    if (await User.exists({ vendorId: data.vendorId })) {
      throw new ConflictError(
        MESSAGES.STALL_ALREADY_CLAIMED,
      );
    }
  }

  // Check if unverified user exists, we can allow re-register or resend OTP.
  // For simplicity, we just check if verified user exists.
  let user = await User.findOne({ email: data.email });
  if (user && user.isVerified) {
    throw new ConflictError(MESSAGES.EMAIL_ALREADY_EXISTS);
  }

  const otp = generateOTP();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  const passwordHash = await hashPassword(data.password);

  if (user && !user.isVerified) {
    // Update existing unverified account
    user.name = data.name;
    user.passwordHash = passwordHash;
    user.phone = data.phone;
    user.role = data.role ?? "customer";
    user.vendorId = data.role === "vendor" ? data.vendorId : undefined;
    user.otpCode = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();
  } else {
    user = await User.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role ?? "customer",
      vendorId: data.role === "vendor" ? data.vendorId : undefined,
      passwordHash,
      tokenVersion: 0,
      isActive: true,
      isVerified: false,
      otpCode: otp,
      otpExpiresAt,
    });
  }

  // Send email asynchronously
  EmailService.send(user.email, EmailTemplates.VerificationOTP(otp)).catch(console.error);

  if (user && !user.isVerified && user.createdAt.getTime() < Date.now() - 5000) {
    return { message: MESSAGES.CHECK_MAIL_TO_VERIFY, userId: String(user._id) };
  }

  return { message: MESSAGES.OTP_SENT, userId: String(user._id) };
}

export async function resendOTP(email: string): Promise<{ message: string }> {
  await connectDB();
  const user = await User.findOne({ email });

  if (!user) throw new NotFoundError(MESSAGES.USER_NOT_FOUND);
  if (user.isVerified) throw new ConflictError(MESSAGES.ALREADY_VERIFIED);

  const otp = generateOTP();
  user.otpCode = otp;
  user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save();

  EmailService.send(user.email, EmailTemplates.VerificationOTP(otp)).catch(console.error);

  return { message: MESSAGES.OTP_SENT };
}

export async function verifyEmail(email: string, otp: string): Promise<{ user: PublicUser; tokens: TokenPair }> {
  await connectDB();
  const user = await User.findOne({ email });

  if (!user) throw new NotFoundError(MESSAGES.USER_NOT_FOUND);
  if (user.isVerified) throw new ConflictError(MESSAGES.ALREADY_VERIFIED);
  
  if (user.otpCode !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
    throw new ValidationError(MESSAGES.INVALID_OTP);
  }

  user.isVerified = true;
  user.otpCode = undefined;
  user.otpExpiresAt = undefined;
  user.lastLoginAt = new Date();

  const tokens = issueTokenPair(user);
  user.refreshTokenHash = await hashPassword(tokens.refreshToken);
  await user.save();

  return { user: toPublicUser(user), tokens };
}

export async function loginUser(
  data: LoginInput,
): Promise<{ user: PublicUser; tokens: TokenPair }> {
  await connectDB();
  const user = await User.findOne({ email: data.email });

  if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
    throw new UnauthorizedError(MESSAGES.INVALID_CREDENTIALS);
  }

  if (!user.isVerified) {
    throw new UnauthorizedError(MESSAGES.EMAIL_NOT_VERIFIED);
  }

  if (!user.isActive) {
    throw new ForbiddenError(MESSAGES.ACCOUNT_DEACTIVATED);
  }

  user.lastLoginAt = new Date();
  const tokens = issueTokenPair(user);

  user.refreshTokenHash = await hashPassword(tokens.refreshToken);
  await user.save();

  return { user: toPublicUser(user), tokens };
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  await connectDB();
  const user = await User.findOne({ email });

  if (!user || !user.isVerified || !user.isActive) {
    // Do not leak information, always return the same message
    return { message: MESSAGES.OTP_SENT_IF_REGISTERED };
  }

  const otp = generateOTP();
  user.otpCode = otp;
  user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
  await user.save();

  EmailService.send(user.email, EmailTemplates.PasswordResetOTP(otp)).catch(console.error);

  return { message: MESSAGES.OTP_SENT_IF_REGISTERED };
}

export async function resetPassword(email: string, otp: string, newPassword: string): Promise<{ message: string }> {
  await connectDB();
  const user = await User.findOne({ email });

  if (!user) throw new ValidationError(MESSAGES.INVALID_OTP);

  if (user.otpCode !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
    throw new ValidationError(MESSAGES.INVALID_OTP);
  }

  user.passwordHash = await hashPassword(newPassword);
  user.otpCode = undefined;
  user.otpExpiresAt = undefined;
  // Invalidate existing sessions
  user.tokenVersion += 1;
  user.refreshTokenHash = undefined;
  
  await user.save();

  return { message: MESSAGES.PASSWORD_RESET_SUCCESSFUL };
}

export async function refreshTokens(
  currentRefreshToken: string,
): Promise<{ user: PublicUser; tokens: TokenPair }> {
  const payload = verifyRefreshToken(currentRefreshToken);
  if (!payload) {
    throw new UnauthorizedError(MESSAGES.INVALID_REFRESH_TOKEN);
  }

  await connectDB();
  const user = await User.findById(payload.sub);

  if (!user) {
    throw new UnauthorizedError(MESSAGES.USER_NOT_FOUND);
  }

  if (!user.isActive) {
    throw new ForbiddenError(MESSAGES.ACCOUNT_DEACTIVATED);
  }

  if (user.tokenVersion !== payload.v) {
    throw new UnauthorizedError(MESSAGES.TOKEN_REVOKED);
  }

  if (
    user.refreshTokenHash &&
    !(await verifyPassword(currentRefreshToken, user.refreshTokenHash))
  ) {
    user.tokenVersion += 1;
    user.refreshTokenHash = undefined;
    await user.save();
    throw new UnauthorizedError(MESSAGES.TOKEN_REUSE_DETECTED);
  }

  const tokens = issueTokenPair(user);
  user.refreshTokenHash = await hashPassword(tokens.refreshToken);
  await user.save();

  return { user: toPublicUser(user), tokens };
}

export async function changePassword(
  userId: string,
  data: ChangePasswordInput,
): Promise<{ user: PublicUser; tokens: TokenPair }> {
  await connectDB();
  const user = await User.findById(userId);
  if (!user) {
    throw new UnauthorizedError(MESSAGES.USER_NOT_FOUND);
  }

  if (!(await verifyPassword(data.oldPassword, user.passwordHash))) {
    throw new UnauthorizedError(MESSAGES.INCORRECT_PASSWORD);
  }

  user.passwordHash = await hashPassword(data.newPassword);
  user.tokenVersion += 1;
  const tokens = issueTokenPair(user);
  user.refreshTokenHash = await hashPassword(tokens.refreshToken);
  await user.save();

  return { user: toPublicUser(user), tokens };
}

export async function updateProfile(
  userId: string,
  data: { 
    name?: string; 
    phone?: string;
    defaultAddress?: {
      building: string;
      floor: string;
      officeNumber: string;
    };
  },
): Promise<{ user: PublicUser }> {
  await connectDB();
  const user = await User.findById(userId);
  if (!user) {
    throw new UnauthorizedError(MESSAGES.USER_NOT_FOUND);
  }

  if (data.name !== undefined) {
    const trimmed = data.name.trim();
    if (trimmed.length < 2) throw new ValidationError(MESSAGES.NAME_TOO_SHORT);
    user.name = trimmed;
  }
  
  if (data.phone !== undefined) {
    user.phone = data.phone.trim();
  }

  if (data.defaultAddress !== undefined) {
    user.defaultAddress = {
      building: data.defaultAddress.building.trim(),
      floor: data.defaultAddress.floor.trim(),
      officeNumber: data.defaultAddress.officeNumber.trim(),
    };
  }

  await user.save();
  return { user: toPublicUser(user) };
}

export async function logoutUser(userId: string): Promise<void> {
  await connectDB();
  await User.findByIdAndUpdate(userId, {
    $inc: { tokenVersion: 1 },
    $unset: { refreshTokenHash: 1 },
  });
}
