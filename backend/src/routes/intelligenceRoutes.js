import { Router } from "express";
import { getIntelligence, getTickers } from "../controllers/intelligenceController.js";

const router = Router();

router.route("/tickers").get(getTickers);
router.route("/:ticker").get(getIntelligence);

export default router;
