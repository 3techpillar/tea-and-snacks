import type { Request, Response, NextFunction } from "express";
import { requireVendorAccess } from "../middleware/auth.middleware";
import * as vendorService from "../services/vendor.service";

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
