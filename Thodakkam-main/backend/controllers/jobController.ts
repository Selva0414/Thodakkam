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

import { query } from "../config/database";

export const getJobsByStartupName = async (req: Request, res: Response): Promise<any> => {
  try {
    const { companyName } = req.params;
    const jobs = await Job.getJobsByStartupName(String(companyName));
    
    const jobIds = jobs.map((j: any) => j.id);
    let applications: any[] = [];
    if (jobIds.length > 0) {
      applications = await query(
        `SELECT a.id, a.job_id, a.status, a.applied_at as "appliedAt", 
                s.full_name as "fullName", s.email, s.profile_photo as "profilePhoto"
         FROM applications a
         LEFT JOIN students s ON s.id::text = a.student_id::text OR LOWER(s.email) = LOWER(a.candidate_email)
         WHERE a.job_id IN (${jobIds.join(',')})`
      );
    }
    
    const resolved = jobs.map((j: any) => {
       const jobApps = applications.filter((app: any) => app.job_id === j.id);
       return { 
         ...j, 
         company_logo: resolveMediaUrl(req, j.company_logo),
         applications: jobApps
       };
    });
    res.json({ success: true, jobs: resolved });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
