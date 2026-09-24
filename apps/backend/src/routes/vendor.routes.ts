import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.middleware";
import { authMiddleware } from "../middleware/auth.middleware";
import * as vendorController from "../controllers/vendor.controller";

const router = Router();

// All vendor routes require authentication
router.use(authMiddleware);

const updateStatusSchema = z.object({
  status: z.enum([
    "Pending",
    "Accepted",
    "Preparing",
    "Ready",
    "Completed",
    "Cancelled",
  ]),
});

const addNoteSchema = z.object({
  note: z.string().max(500),
});

router.get("/:vendorId/orders", vendorController.getOrders);
router.get("/:vendorId/stats", vendorController.getStats);
router.patch(
  "/:vendorId/orders/:orderId/status",
  validate(updateStatusSchema),
  vendorController.updateStatus,
);
router.post(
  "/:vendorId/orders/:orderId/confirm-payment",
  vendorController.confirmPayment,
);
router.post(
  "/:vendorId/orders/:orderId/reject-payment",
  vendorController.rejectPayment,
);
router.patch(
  "/:vendorId/orders/:orderId/note",
  validate(addNoteSchema),
  vendorController.addNote,
);

// ── Menu Management ──
router.post("/:vendorId/products", vendorController.createProduct);
router.put("/:vendorId/products/:productId", vendorController.updateProduct);
router.delete("/:vendorId/products/:productId", vendorController.deleteProduct);

// ── Stall Profile ──
router.put("/:vendorId/profile", vendorController.updateProfile);

export default router;
