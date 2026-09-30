import type { Request, Response, NextFunction } from "express";
import { requireVendorAccess } from "../middleware/auth.middleware";
import * as vendorService from "../services/vendor.service";
import { Product } from "../models/Product.model";
import { NotFoundError, ValidationError } from "../utils/errors";
import { MESSAGES } from "../constants/messages";

export async function getOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorId = req.params.vendorId as string;
    const status = req.query.status as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    
    requireVendorAccess(req.user, vendorId);
    
    const orders = await vendorService.getVendorOrders(vendorId, status, page, limit);
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
    
    const { id, name, price, emoji, veg, tag, imageUrl, isAvailable, status, prepTime, hasVariants, variantLabel, variants } = req.body;
    if (!id || !name || price === undefined) {
      throw new ValidationError(MESSAGES.MISSING_PRODUCT_DETAILS);
    }

    // Auto-generate backend-oriented ID using vendor stall ID to avoid collisions
    const productId = id.startsWith(`${vendorId}-`) ? id : `${vendorId}-${id}`;

    const existing = await Product.findById(productId);
    if (existing) {
      throw new ValidationError(MESSAGES.PRODUCT_ALREADY_EXISTS);
    }

    const isQuickDelivery = prepTime === 10;

    const product = await Product.create({
      _id: productId,
      vendorId,
      name, price, emoji: emoji || "🍲", veg: veg ?? true, tag, imageUrl, isAvailable, status, prepTime, isQuickDelivery, hasVariants, variantLabel, variants
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
      throw new NotFoundError(MESSAGES.PRODUCT_NOT_FOUND);
    }

    if (req.body.prepTime !== undefined) {
      req.body.isQuickDelivery = req.body.prepTime === 10;
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
      throw new NotFoundError(MESSAGES.PRODUCT_NOT_FOUND);
    }

    // Instead of fully deleting, we deactivate it so old orders don't break
    await Product.findByIdAndUpdate(productId, { isActive: false });
    res.json({ message: MESSAGES.PRODUCT_DELETED });
  } catch (err) {
    next(err);
  }
}

// ── Stall Profile ────────────────────────────────────────────────────────

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorId = req.params.vendorId as string;
    requireVendorAccess(req.user, vendorId);

    const { Vendor } = await import("../models/Vendor.model");
    
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      throw new NotFoundError(MESSAGES.STALL_NOT_FOUND);
    }

    const { tagline, hours, upiId, isAcceptingOrders, location } = req.body;
    
    if (tagline !== undefined) vendor.tagline = tagline;

    if (hours !== undefined) vendor.hours = hours;
    if (upiId !== undefined) vendor.upiId = upiId;
    if (isAcceptingOrders !== undefined) vendor.isAcceptingOrders = isAcceptingOrders;
    if (location !== undefined) vendor.location = location;

    await vendor.save();
    res.json(vendor);
  } catch (err) {
    next(err);
  }
}
