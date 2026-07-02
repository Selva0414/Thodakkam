import { Request, Response } from "express";
import * as studentModel from "../models/studentModel";

/**
 * Search candidates (students) by name or email
 * GET /api/users/search?query=farah
 */
export const searchCandidates = async (req: Request, res: Response): Promise<any> => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: "Search query is required." });
    }
    const candidates = await studentModel.searchStudents(query as string);
    res.status(200).json({ success: true, data: candidates });
  } catch (error: any) {
    console.error("Search candidates error:", error.message);
    res.status(500).json({ success: false, message: "An error occurred during search.", error: error.message });
  }
};
