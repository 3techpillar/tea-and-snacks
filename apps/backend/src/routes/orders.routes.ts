import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.middleware";
import { authMiddleware } from "../middleware/auth.middleware";
import * as ordersController from "../controllers/orders.controller";

const router = Router();

// All order routes require authentication
router.use(authMiddleware);

const placeOrderSchema = z.object({
  customerName: z.string().trim().min(2),
  customerPhone: z.string().trim().min(8),
  items: z
    .array(
      z.object({ productId: z.string(), qty: z.number().int().min(1).max(50) }),
    )
    .min(1, "Your cart is empty."),
});

const uploadProofSchema = z.object({
  fileName: z.string(),
  dataUrl: z
    .string()
    .refine(
      (v) => v.startsWith("data:image/"),
      "Only image uploads are allowed.",
    ),
});

router.post("/", validate(placeOrderSchema), ordersController.create);
router.get("/", ordersController.list);
router.get("/:orderId", ordersController.getById);
router.post("/:orderId/proof", validate(uploadProofSchema), ordersController.uploadProof);

export default router;
