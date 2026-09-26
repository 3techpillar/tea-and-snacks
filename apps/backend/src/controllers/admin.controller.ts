import { Request, Response, NextFunction } from "express";
import { Order } from "../models/Order.model";
import { Vendor } from "../models/Vendor.model";
import { User } from "../models/User.model";
import { NotFoundError, ValidationError } from "../utils/errors";
import { hashPassword } from "../utils/password.util";
import { generateOTP } from "../utils/otp.util";
import { EmailService, EmailTemplates } from "../utils/email.util";

export const AdminController = {
  // ── Orders ─────────────────────────────────────────────────────────────

  async getAllOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const skip = (page - 1) * limit;

      const query: any = {};
      const statusFilter = req.query.status as string;
      if (statusFilter && statusFilter !== "All") {
        if (statusFilter === "Live") {
          query.status = { $nin: ["Completed", "Cancelled"] };
        } else {
          query.status = statusFilter;
        }
      }

      const [orders, total] = await Promise.all([
        Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Order.countDocuments(query)
      ]);

      res.json({
        data: orders,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async forceCancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await Order.findById(id);
      
      if (!order) throw new NotFoundError("Order not found");
      
      if (order.status === "Completed" || order.status === "Cancelled") {
        throw new ValidationError(`Order is already ${order.status}`);
      }

      order.status = "Cancelled";
      order.adminNote = req.body.reason || "Cancelled by admin due to vendor unresponsiveness.";
      order.needsRebooking = true;
      
      await order.save();
      
      // TODO: Emit socket event to vendor and customer here!
      
      res.json({ message: "Order forcefully cancelled", order });
    } catch (err) {
      next(err);
    }
  },

  // ── Vendors ────────────────────────────────────────────────────────────

  async getAllVendors(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const skip = (page - 1) * limit;

      const [vendors, total] = await Promise.all([
        Vendor.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Vendor.countDocuments()
      ]);

      res.json({
        data: vendors,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async createVendor(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        id, name, cuisine, emoji, rating, eta, accent,
        tagline, counter, hours, specialty, upiId, highlights,
        imageUrl, isAcceptingOrders, ownerEmail, ownerMobile
      } = req.body;

      if (!id || !name || !ownerEmail || !ownerMobile) throw new ValidationError("Vendor ID, Name, Owner Email, and Owner Mobile are required");

      const existingUser = await User.findOne({ email: ownerEmail });
      if (existingUser) throw new ValidationError("An account with this email already exists");

      const existing = await Vendor.findById(id);
      if (existing) throw new ValidationError("Vendor with this ID already exists");

      const vendor = await Vendor.create({
        _id: id,
        name, cuisine, emoji, rating: rating || 5.0, eta, accent,
        tagline, counter, hours, specialty, upiId, highlights,
        imageUrl, isAcceptingOrders
      });

      // Automatically create an UNVERIFIED staff account for this vendor
      const passwordHash = await hashPassword("vendor123");
      const otp = generateOTP();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      await User.create({
        name: `${name} Staff`,
        email: ownerEmail,
        phone: ownerMobile,
        passwordHash,
        role: "vendor",
        vendorId: id,
        isVerified: false,
        isActive: false, // Activated after OTP
        otpCode: otp,
        otpExpiresAt,
      });

      EmailService.send(ownerEmail, EmailTemplates.VerificationOTP(otp)).catch(console.error);

      res.status(201).json({ 
        message: "Vendor stall created. OTP sent for verification.", 
        requiresOtp: true,
        email: ownerEmail,
        vendor
      });
    } catch (err) {
      next(err);
    }
  },

  async verifyVendorOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = req.body;
      const user = await User.findOne({ email, role: "vendor" });
      if (!user) throw new NotFoundError("Vendor account not found");
      
      if (user.isVerified) {
        return res.json({ message: "Vendor already verified", defaultAccount: { email, password: "vendor123" }});
      }

      if (user.otpCode !== otp) throw new ValidationError("Invalid OTP");
      if (user.otpExpiresAt && user.otpExpiresAt.getTime() < Date.now()) {
        throw new ValidationError("OTP has expired. Please request a new one.");
      }

      user.isVerified = true;
      user.isActive = true;
      user.otpCode = undefined;
      user.otpExpiresAt = undefined;
      await user.save();

      res.json({
        message: "Vendor verified successfully",
        defaultAccount: { email, password: "vendor123" }
      });
    } catch (err) {
      next(err);
    }
  },

  async resendVendorOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email, role: "vendor" });
      if (!user) throw new NotFoundError("Vendor account not found");
      if (user.isVerified) throw new ValidationError("Vendor is already verified");

      const otp = generateOTP();
      user.otpCode = otp;
      user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      EmailService.send(user.email, EmailTemplates.VerificationOTP(otp)).catch(console.error);

      res.json({ message: "OTP resent successfully" });
    } catch(err) {
      next(err);
    }
  },

  async updateVendor(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const vendor = await Vendor.findByIdAndUpdate(id, req.body, { new: true });
      if (!vendor) throw new NotFoundError("Vendor not found");
      res.json({ message: "Vendor updated", vendor });
    } catch (err) {
      next(err);
    }
  },

  async deleteVendor(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const vendor = await Vendor.findByIdAndUpdate(id, { isActive: false }, { new: true });
      if (!vendor) throw new NotFoundError("Vendor not found");
      
      // Deactivate all staff accounts for this vendor
      await User.updateMany({ vendorId: id }, { isActive: false });
      
      res.json({ message: "Vendor deactivated successfully" });
    } catch (err) {
      next(err);
    }
  }
};
