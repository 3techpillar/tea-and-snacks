import type { Request, Response, NextFunction } from "express";
import { getCatalog, getCatalogSearch } from "../services/catalog.service";

export async function catalog(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getCatalog();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const results = await getCatalogSearch(q);
    res.json(results);
  } catch (err) {
    next(err);
  }
}
