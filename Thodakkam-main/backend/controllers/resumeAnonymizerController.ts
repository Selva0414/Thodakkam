import { Request, Response } from "express";
import FormData from "form-data";
import axios from "axios";

// ── Render Resume Anonymizer (hardcoded) ─────────────────────────────────────
const RESUME_ANONYMIZER_URL = "https://resume-anonymizer-t5bb.onrender.com";
const ANONYMIZER_TIMEOUT_MS = 60000; // 60 s — PDF processing can be slow

/**
 * POST /api/ai/anonymize-resume
 * Accepts a resume PDF (multipart/form-data, field name "file")
 * Proxies to the Render anonymizer service and returns:
 *   {
 *     success: true,
 *     masked_text: string,
 *     pii_summary: { phones_found, emails_found, linkedins_found, githubs_found, leetcodes_found },
 *     download_url: string   ← direct link to download the redacted PDF
 *   }
 */
export const anonymizeResume = async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No resume file uploaded. Send a PDF as field 'file'." });
    }

    const { originalname, buffer, mimetype } = req.file;
    console.log(`[ResumeAnonymizer] Proxying "${originalname}" (${buffer.length} bytes) to Render`);

    // Build multipart form to forward to the Render service
    const form = new FormData();
    form.append("file", buffer, { filename: originalname, contentType: mimetype || "application/pdf" });

    const resp = await axios.post(`${RESUME_ANONYMIZER_URL}/upload-resume`, form, {
      headers: form.getHeaders(),
      timeout: ANONYMIZER_TIMEOUT_MS,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    const data = resp.data;

    // If the service returns a relative download path, make it absolute
    let download_url: string = data.download_url || "";
    if (download_url && !download_url.startsWith("http")) {
      download_url = `${RESUME_ANONYMIZER_URL}${download_url.startsWith("/") ? "" : "/"}${download_url}`;
    }

    console.log(`[ResumeAnonymizer] ✅ Success — PII summary:`, data.pii_summary);

    return res.json({
      success: true,
      masked_text:  data.masked_text  || "",
      pii_summary:  data.pii_summary  || {},
      download_url,
    });
  } catch (err: any) {
    const status  = err?.response?.status;
    const message = err?.response?.data?.detail || err?.message || "Anonymizer service error";
    console.error(`[ResumeAnonymizer] ❌ Error (HTTP ${status}):`, message);
    return res.status(status || 500).json({ success: false, error: message });
  }
};
