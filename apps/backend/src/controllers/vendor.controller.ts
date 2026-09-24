import type { Request, Response, NextFunction } from "express";
import { requireVendorAccess } from "../middleware/auth.middleware";
import * as vendorService from "../services/vendor.service";
import { Product } from "../models/Product.model";
import { NotFoundError, ValidationError } from "../utils/errors";

export async function getOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorId = req.params.vendorId as string;
    requireVendorAccess(req.user, vendorId);
    const orders = await vendorService.getVendorOrders(vendorId);
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorId = req.params.vendorId as string;
    requireVendorAccess(req.user, vendorId);
    const stats = await vendorService.getVendorStats(vendorId);
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorId = req.params.vendorId as string;
    const orderId = req.params.orderId as string;
    requireVendorAccess(req.user, vendorId);
    const order = await vendorService.updateOrderStatus(
      vendorId,
      orderId,
      req.body.status,
    );
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function confirmPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorId = req.params.vendorId as string;
    const orderId = req.params.orderId as string;
    requireVendorAccess(req.user, vendorId);
    const order = await vendorService.confirmPayment(
      vendorId,
      orderId,
    );
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function rejectPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorId = req.params.vendorId as string;
    const orderId = req.params.orderId as string;
    requireVendorAccess(req.user, vendorId);
    const order = await vendorService.rejectPayment(
      vendorId,
      orderId,
    );
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function addNote(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorId = req.params.vendorId as string;
    const orderId = req.params.orderId as string;
    requireVendorAccess(req.user, vendorId);
    const order = await vendorService.addVendorNote(
      vendorId,
      orderId,
      req.body.note,
    );
    res.json(order);
  } catch (err) {
    next(err);
  }
}

// ── Menu Management ──────────────────────────────────────────────────────

export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorId = req.params.vendorId as string;
    requireVendorAccess(req.user, vendorId);
    
    const { id, name, price, emoji, veg, tag, imageUrl, isAvailable } = req.body;
    if (!id || !name || price === undefined) {
      throw new ValidationError("ID, Name, and Price are required.");
    }

    const existing = await Product.findById(id);
    if (existing) {
      throw new ValidationError("Product with this ID already exists.");
    }

    const product = await Product.create({
      _id: id,
      vendorId,
      name, price, emoji: emoji || "🍲", veg: veg ?? true, tag, imageUrl, isAvailable
    });

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorId = req.params.vendorId as string;
    const productId = req.params.productId as string;
    requireVendorAccess(req.user, vendorId);

    const product = await Product.findOne({ _id: productId, vendorId });
    if (!product) {
      throw new NotFoundError("Product not found or doesn't belong to your stall.");
    }

    const updated = await Product.findByIdAndUpdate(productId, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorId = req.params.vendorId as string;
    const productId = req.params.productId as string;
    requireVendorAccess(req.user, vendorId);

    const product = await Product.findOne({ _id: productId, vendorId });
    if (!product) {
      throw new NotFoundError("Product not found or doesn't belong to your stall.");
    }

    // Instead of fully deleting, we deactivate it so old orders don't break
    await Product.findByIdAndUpdate(productId, { isActive: false });
    res.json({ message: "Product deleted (deactivated)." });
  } catch (err) {
    next(err);
  }
}
