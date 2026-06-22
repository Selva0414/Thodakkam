import { Request, Response } from "express";
import * as Job from "../models/jobModel";
import { resolveMediaUrl } from "../utils/mediaUrl";

export const listJobs = async (req: Request, res: Response): Promise<any> => {
  try {
    const jobs = await Job.getAllJobs();
    const resolved = jobs.map((j: any) => ({ ...j, company_logo: resolveMediaUrl(req, j.company_logo) }));
    res.json(resolved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getJobById = async (req: Request, res: Response): Promise<any> => {
  try {
    const job = await Job.getJobById(String(req.params.id));
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json({ ...job, company_logo: resolveMediaUrl(req, job.company_logo) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getRecommended = async (req: Request, res: Response): Promise<any> => {
  try {
    const { skills } = req.query;
    const jobs = await Job.getRecommendedJobs(skills);
    const resolved = jobs.map((j: any) => ({ ...j, company_logo: resolveMediaUrl(req, j.company_logo) }));
    res.json(resolved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
