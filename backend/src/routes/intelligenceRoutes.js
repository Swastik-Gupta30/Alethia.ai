import { Router } from "express";
import { getIntelligence } from "../controllers/intelligenceController.js";

const router = Router();

router.route("/:ticker").get(getIntelligence);

export default router;
