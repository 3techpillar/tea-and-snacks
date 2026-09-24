import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { authMiddleware, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

// All routes require authentication and the "admin" role
router.use(authMiddleware, (req, res, next) => {
  try {
    requireAdmin(req.user);
    next();
  } catch (err) {
    next(err);
  }
});

// Orders
router.get("/orders", AdminController.getAllOrders);
router.put("/orders/:id/cancel", AdminController.forceCancelOrder);

// Vendors
router.get("/vendors", AdminController.getAllVendors);
router.post("/vendors", AdminController.createVendor);
router.post("/vendors/verify-otp", AdminController.verifyVendorOtp);
router.post("/vendors/resend-otp", AdminController.resendVendorOtp);
router.put("/vendors/:id", AdminController.updateVendor);
router.delete("/vendors/:id", AdminController.deleteVendor);

export default router;
