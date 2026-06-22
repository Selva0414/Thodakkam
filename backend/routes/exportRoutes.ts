import express from "express";
import { protect } from "../middleware/auth";
import {
  exportStartups,
  exportStudents,
  exportApplications,
  exportPending,
} from "../controllers/exportController";

const router = express.Router();

router.use(protect);

router.get("/startups",     exportStartups);
router.get("/students",     exportStudents);
router.get("/applications", exportApplications);
router.get("/pending",      exportPending);

export default router;
