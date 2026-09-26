import type { Request, Response, NextFunction } from "express";
import { requireUser } from "../middleware/auth.middleware";
import * as ordersService from "../services/orders.service";

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const user = requireUser(req.user);
    const order = await ordersService.placeOrder(req.body, user);
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const user = requireUser(req.user);
    const orders = await ordersService.getOrders(user);
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const user = requireUser(req.user);
    const orderId = req.params.orderId as string;
    const order = await ordersService.getOrder(orderId, user);
    if (!order) {
      res.status(404).json({ message: "Order not found." });
      return;
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function uploadProof(req: Request, res: Response, next: NextFunction) {
  try {
    const user = requireUser(req.user);
    const orderId = req.params.orderId as string;
    const order = await ordersService.uploadPaymentProof(
      orderId,
      req.body,
      user,
    );
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function addChatMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const user = requireUser(req.user);
    const orderId = req.params.orderId as string;
    const order = await ordersService.addChatMessage(orderId, req.body.text, user);
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function cancelOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const user = requireUser(req.user);
    const orderId = req.params.orderId as string;
    const order = await ordersService.cancelOrder(orderId, req.body.reason, user);
    res.json(order);
  } catch (err) {
    next(err);
  }
}
