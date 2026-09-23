import { Router } from "express";
import authRoutes from "./auth.routes";
import catalogRoutes from "./catalog.routes";
import ordersRoutes from "./orders.routes";
import vendorRoutes from "./vendor.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/catalog", catalogRoutes);
router.use("/orders", ordersRoutes);
router.use("/vendor", vendorRoutes);

export default router;
