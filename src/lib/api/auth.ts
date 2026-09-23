import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { connectDB } from "@/backend/db";
import { User, toPublicUser } from "@/backend/models/User";
import { Vendor } from "@/backend/models/Vendor";
import { hashPassword, verifyPassword } from "@/backend/auth/password";
import { signAuthToken } from "@/backend/auth/jwt";
import { setAuthCookie, clearAuthCookie } from "@/backend/auth/cookie";
import { authMiddleware } from "@/backend/auth/middleware";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is too short"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().trim().optional(),
  role: z.enum(["customer", "vendor"]).default("customer"),
  vendorId: z.string().optional(),
});

export const registerFn = createServerFn({ method: "POST" })
  .validator(registerSchema)
  .handler(async ({ data }) => {
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
      role: data.role,
      vendorId: data.role === "vendor" ? data.vendorId : undefined,
      passwordHash: await hashPassword(data.password),
    });

    const token = signAuthToken({
      sub: String(user._id),
      role: user.role,
      vendorId: user.vendorId,
    });
    setAuthCookie(token);
    return toPublicUser(user);
  });

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const loginFn = createServerFn({ method: "POST" })
  .validator(loginSchema)
  .handler(async ({ data }) => {
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
    setAuthCookie(token);
    return toPublicUser(user);
  });

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  clearAuthCookie();
  return { ok: true };
});

export const meFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => context.user);
