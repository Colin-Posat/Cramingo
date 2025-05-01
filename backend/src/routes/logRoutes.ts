import express from "express";
import { logSearch } from "../controllers/logController";
// … other imports …

const router = express.Router();


// add this:
router.post("/logSearch", logSearch);

export default router;
