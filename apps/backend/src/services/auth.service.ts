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
} from "../utils/errors";
import type { PublicUser, TokenPair } from "@tea-and-snacks/shared";

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
): Promise<{ user: PublicUser; tokens: TokenPair }> {
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

  if (await User.exists({ email: data.email })) {
    throw new ConflictError("An account with this email already exists.");
  }

  const user = await User.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: data.role ?? "customer",
    vendorId: data.role === "vendor" ? data.vendorId : undefined,
    passwordHash: await hashPassword(data.password),
    tokenVersion: 0,
    isActive: true,
    lastLoginAt: new Date(),
  });

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

  if (!user.isActive) {
    throw new ForbiddenError("Your account has been deactivated. Contact support.");
  }

  user.lastLoginAt = new Date();
  const tokens = issueTokenPair(user);

  user.refreshTokenHash = await hashPassword(tokens.refreshToken);
  await user.save();

  return { user: toPublicUser(user), tokens };
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

export async function logoutUser(userId: string): Promise<void> {
  await connectDB();
  await User.findByIdAndUpdate(userId, {
    $inc: { tokenVersion: 1 },
    $unset: { refreshTokenHash: 1 },
  });
}
