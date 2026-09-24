import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.middleware";
import { authMiddleware } from "../middleware/auth.middleware";
import { authLimiter } from "../middleware/rate-limit.middleware";
import * as authController from "../controllers/auth.controller";

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is too short"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password is too long"),
  phone: z.string().trim().optional(),
  role: z.enum(["customer", "vendor"]).default("customer"),
  vendorId: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(6, "New password must be at least 6 characters")
    .max(128, "Password is too long"),
});

const verifyEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

const resetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

router.post("/register", authLimiter, validate(registerSchema), authController.register);
router.post("/verify-email", authLimiter, validate(verifyEmailSchema), authController.verifyEmail);
router.post("/resend-otp", authLimiter, validate(forgotPasswordSchema), authController.resendOTP);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.post("/refresh", authController.refresh);

router.post("/logout", authMiddleware, authController.logout);
router.get("/me", authMiddleware, authController.me);
router.post(
  "/change-password",
  authMiddleware,
  validate(changePasswordSchema),
  authController.changePasswordHandler,
);

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  phone: z.string().optional(),
});

router.patch(
  "/profile",
  authMiddleware,
  validate(updateProfileSchema),
  authController.updateProfileHandler,
);

export default router;
