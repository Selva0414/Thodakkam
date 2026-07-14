import express from "express";
const router = express.Router();
import { protectStudent } from "../middleware/auth";
import {
  createCourseOrder,
  verifyCoursePayment,
  getMyEnrollments
} from "../controllers/courseController";

// Protected course routes (accessible only by logged-in students)
router.post("/create-order", protectStudent, createCourseOrder);
router.post("/verify-payment", protectStudent, verifyCoursePayment);
router.get("/my-enrollments", protectStudent, getMyEnrollments);

export default router;
