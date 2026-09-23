import { connectDB } from "../config/db";
import { User, toPublicUser } from "../models/User.model";
import { Vendor } from "../models/Vendor.model";
import { hashPassword, verifyPassword } from "../utils/password.util";
import { signAuthToken } from "../utils/jwt.util";
import type { PublicUser } from "@tea-and-snacks/shared";

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

export async function registerUser(data: RegisterInput): Promise<{ user: PublicUser; token: string }> {
  await connectDB();

  if (data.role === "vendor") {
    if (!data.vendorId || !(await Vendor.exists({ _id: data.vendorId }))) {
      throw new Error("Pick a valid stall to manage.");
    }
    if (await User.exists({ vendorId: data.vendorId })) {
      throw new Error(
        "This stall already has a vendor account. Ask an admin to add staff.",
      );
    }
  }

  if (await User.exists({ email: data.email })) {
    throw new Error("An account with this email already exists.");
  }

  const user = await User.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: data.role ?? "customer",
    vendorId: data.role === "vendor" ? data.vendorId : undefined,
    passwordHash: await hashPassword(data.password),
  });

  const token = signAuthToken({
    sub: String(user._id),
    role: user.role,
    vendorId: user.vendorId,
  });

  return { user: toPublicUser(user), token };
}

export async function loginUser(data: LoginInput): Promise<{ user: PublicUser; token: string }> {
  await connectDB();
  const user = await User.findOne({ email: data.email });
  if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
    throw new Error("Invalid email or password.");
  }

  const token = signAuthToken({
    sub: String(user._id),
    role: user.role,
    vendorId: user.vendorId,
  });

  return { user: toPublicUser(user), token };
}
