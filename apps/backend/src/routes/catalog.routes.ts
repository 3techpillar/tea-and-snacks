import { Router } from "express";
import * as catalogController from "../controllers/catalog.controller";

const router = Router();

router.get("/search", catalogController.search);
router.get("/", catalogController.catalog);

export default router;
