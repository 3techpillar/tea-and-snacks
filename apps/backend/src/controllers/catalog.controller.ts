import type { Request, Response, NextFunction } from "express";
import { getCatalog } from "../services/catalog.service";

export async function catalog(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getCatalog();
    res.json(data);
  } catch (err) {
    next(err);
  }
}
