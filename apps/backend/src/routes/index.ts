import { Router } from "express";
import { apiLimiter } from "../middleware/rate-limit.middleware";
import authRoutes from "./auth.routes";
import catalogRoutes from "./catalog.routes";
import ordersRoutes from "./orders.routes";
import vendorRoutes from "./vendor.routes";
import adminRoutes from "./admin.routes";
import uploadRoutes from "./upload.routes";

const router = Router();

// Apply general rate limiting to all API routes
router.use(apiLimiter);

router.use("/auth", authRoutes);
router.use("/catalog", catalogRoutes);
router.use("/orders", ordersRoutes);
router.use("/vendor", vendorRoutes);
router.use("/admin", adminRoutes);
router.use("/upload", uploadRoutes);

export default router;

