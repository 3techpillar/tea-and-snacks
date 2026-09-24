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
      throw new ValidationError("Pick a valid stall to manage.");
    }
    if (await User.exists({ vendorId: data.vendorId })) {
      throw new ConflictError(
        "This stall already has a vendor account. Ask an admin to add staff.",
      );
    }
  }

  // Check if unverified user exists, we can allow re-register or resend OTP.
  // For simplicity, we just check if verified user exists.
  let user = await User.findOne({ email: data.email });
  if (user && user.isVerified) {
    throw new ConflictError("An account with this email already exists.");
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
    return { message: "Check mail and verify the user mail to login", userId: String(user._id) };
  }

  return { message: "OTP sent to email", userId: String(user._id) };
}

export async function resendOTP(email: string): Promise<{ message: string }> {
  await connectDB();
  const user = await User.findOne({ email });

  if (!user) throw new NotFoundError("User not found.");
  if (user.isVerified) throw new ConflictError("Email is already verified.");

  const otp = generateOTP();
  user.otpCode = otp;
  user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save();

  EmailService.send(user.email, EmailTemplates.VerificationOTP(otp)).catch(console.error);

  return { message: "A new OTP has been sent to your email." };
}

export async function verifyEmail(email: string, otp: string): Promise<{ user: PublicUser; tokens: TokenPair }> {
  await connectDB();
  const user = await User.findOne({ email });

  if (!user) throw new NotFoundError("User not found.");
  if (user.isVerified) throw new ConflictError("Email is already verified.");
  
  if (user.otpCode !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
    throw new ValidationError("Invalid or expired OTP.");
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
    throw new UnauthorizedError("Invalid email or password.");
  }

  if (!user.isVerified) {
    throw new UnauthorizedError("Please verify your email address first.");
  }

  if (!user.isActive) {
    throw new ForbiddenError("Your account has been deactivated. Contact support.");
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
    return { message: "If your email is registered and verified, you will receive an OTP shortly." };
  }

  const otp = generateOTP();
  user.otpCode = otp;
  user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
  await user.save();

  EmailService.send(user.email, EmailTemplates.PasswordResetOTP(otp)).catch(console.error);

  return { message: "If your email is registered and verified, you will receive an OTP shortly." };
}

export async function resetPassword(email: string, otp: string, newPassword: string): Promise<{ message: string }> {
  await connectDB();
  const user = await User.findOne({ email });

  if (!user) throw new ValidationError("Invalid or expired OTP.");

  if (user.otpCode !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
    throw new ValidationError("Invalid or expired OTP.");
  }

  user.passwordHash = await hashPassword(newPassword);
  user.otpCode = undefined;
  user.otpExpiresAt = undefined;
  // Invalidate existing sessions
  user.tokenVersion += 1;
  user.refreshTokenHash = undefined;
  
  await user.save();

  return { message: "Password reset successful. You can now log in." };
}

export async function refreshTokens(
  currentRefreshToken: string,
): Promise<{ user: PublicUser; tokens: TokenPair }> {
  const payload = verifyRefreshToken(currentRefreshToken);
  if (!payload) {
    throw new UnauthorizedError("Invalid or expired refresh token.");
  }

  await connectDB();
  const user = await User.findById(payload.sub);

  if (!user) {
    throw new UnauthorizedError("User not found.");
  }

  if (!user.isActive) {
    throw new ForbiddenError("Your account has been deactivated.");
  }

  if (user.tokenVersion !== payload.v) {
    throw new UnauthorizedError("Token has been revoked. Please sign in again.");
  }

  if (
    user.refreshTokenHash &&
    !(await verifyPassword(currentRefreshToken, user.refreshTokenHash))
  ) {
    user.tokenVersion += 1;
    user.refreshTokenHash = undefined;
    await user.save();
    throw new UnauthorizedError("Refresh token reuse detected. All sessions revoked.");
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
    throw new UnauthorizedError("User not found.");
  }

  if (!(await verifyPassword(data.oldPassword, user.passwordHash))) {
    throw new UnauthorizedError("Current password is incorrect.");
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
  data: { name?: string; phone?: string },
): Promise<{ user: PublicUser }> {
  await connectDB();
  const user = await User.findById(userId);
  if (!user) {
    throw new UnauthorizedError("User not found.");
  }

  if (data.name !== undefined) {
    const trimmed = data.name.trim();
    if (trimmed.length < 2) throw new ValidationError("Name is too short.");
    user.name = trimmed;
  }
  
  if (data.phone !== undefined) {
    user.phone = data.phone.trim();
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
