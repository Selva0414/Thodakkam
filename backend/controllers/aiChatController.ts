import { Request, Response } from "express";
import * as AIChat from "../models/aiChatModel";
import FormData from "form-data";
import axios from "axios";
import http from "http";
import https from "https";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "https://ai-agent-v01.onrender.com/chat";
const AI_TIMEOUT_MS = Number.parseInt(process.env.AI_TIMEOUT_MS || "20000", 10);
const AI_RETRIES = Number.parseInt(process.env.AI_RETRIES || "2", 10);

// Shared keep-alive agents so repeated calls reuse TCP/TLS connections.
const aiHttpAgent = new http.Agent({ keepAlive: true, maxSockets: 25 });
const aiHttpsAgent = new https.Agent({ keepAlive: true, maxSockets: 25 });
const aiClient = axios.create({
  httpAgent: aiHttpAgent,
  httpsAgent: aiHttpsAgent,
  timeout: AI_TIMEOUT_MS,
  maxBodyLength: Infinity,
  maxContentLength: Infinity,
});

async function callAiService(formData: FormData): Promise<any> {
  let lastErr: any;
  for (let attempt = 0; attempt <= AI_RETRIES; attempt += 1) {
    try {
      const resp = await aiClient.post(AI_SERVICE_URL, formData, {
        headers: formData.getHeaders(),
      });
      return resp.data;
    } catch (err: any) {
      lastErr = err;
      const status = err?.response?.status;
      // Don't retry client errors (4xx); only network/5xx/timeouts.
      const retriable = !status || status >= 500 || err?.code === "ECONNABORTED" || err?.code === "ECONNRESET";
      if (!retriable || attempt === AI_RETRIES) break;
      const backoff = 250 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw lastErr;
}

export const getHistory = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    await (AIChat as any).createTable();
    const history = await (AIChat as any).getChatHistory(userId);
    res.json({ success: true, history });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const sendMessage = async (req: Request, res: Response): Promise<any> => {
  try {
    const { user_id, user_message, user_type = "student" } = req.body;
    const file = req.file;

    let ai_response = "";
    let responseType = "chat";
    let atsData = null;

    try {
      console.log(`[AI-Chat] Proxying message to ${AI_SERVICE_URL}: "${user_message}" (${user_type})`);

      const formData = new FormData();
      formData.append("message", user_message || "");
      formData.append("user_type", user_type);

      if (file) {
        console.log(`[AI-Chat] Forwarding file: ${file.originalname}`);
        formData.append("file", file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        });
      }

      const data: any = await callAiService(formData);

      console.log(`[AI-Chat] AI service response type: ${data.type}`);

      if (data.type === "error") {
        throw new Error(data.message || "AI service error");
      }

      ai_response = data.message || "";
      responseType = data.type || "chat";

      if (data.type === "ats" && data.data) {
        atsData = data.data;
      }
    } catch (aiErr: any) {
      console.warn("AI Service error, using fallback:", aiErr.message);
      ai_response = getSmartFallback(user_message, user_type);
    }

    let savedChat = null;
    try {
      await (AIChat as any).createTable();
      savedChat = await (AIChat as any).saveChatMessage({
        user_id,
        user_message,
        ai_response,
        context: user_type === "startup" ? "recruitment_assistance" : "career_coaching",
        user_type: user_type,
      });
    } catch (dbErr: any) {
      console.warn("Could not save chat to DB:", dbErr.message);
    }

    res.status(201).json({
      success: true,
      type: responseType,
      message: ai_response,
      atsData: atsData,
      chat: savedChat,
    });
  } catch (error: any) {
    console.error("AI Chat controller error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

function getSmartFallback(message: string, userType: string = "student") {
  const m = (message || "").toLowerCase();

  if (userType === "startup") {
    if (m.includes("job") || m.includes("description") || m.includes("posting")) {
      return `I can help you create optimized job descriptions:\n\n• **Clear Title:** Use standard industry titles for better search results\n• **Impact Summary:** Start with why the role matters to your startup\n• **Core Stack:** List MUST-HAVE skills separately from nice-to-haves\n• **Hiring Process:** Be transparent about the interview stages\n• **Perks:** Highlight remote work, equity, or unique culture bits\n\n💡 Paste a rough role outline here and I'll generate a professional JD for you!`;
    }
    if (m.includes("screen") || m.includes("evaluate") || m.includes("candidate")) {
      return `Here's how to screen candidates effectively:\n\n**Initial Filter:**\n• Look for relevant projects/GitHub for technical roles\n• Check for "hunger" and startup-fit (multi-tasking ability)\n\n**Screening Call Questions:**\n• "Why did you choose our company specifically?"\n• "Tell me about a time you solved a hard problem with limited resources."\n\n**Technical Evaluation:**\n• Focus on practical problem solving over academic puzzles\n• Use real-world tasks relevant to your product\n\nWould you like a list of questions for a specific role?`;
    }
    if (m.includes("interview") || m.includes("question")) {
      return `Recommended startup interview structure:\n\n• **Stage 1 (30m):** Cultural fit & motivation\n• **Stage 2 (60m):** Technical deep-dive or pair programming\n• **Stage 3 (45m):** Product/Context thinking\n• **Stage 4 (30m):** Leadership/Founder round\n\n💡 **Focus on:** Capability + Culture. Startup hires need to be "doers" who can handle ambiguity.\n\nWhat role are you currently interviewing for?`;
    }
    if (m.includes("hire") || m.includes("recruit")) {
      return `Top recruitment strategies for startups:\n\n• **Leverage Referrals:** Your early team is your best sourcing engine\n• **Be Fast:** Don't lose top talent to slow processes\n• **Founder Led:** Founders should be involved in at least the final call for the first 50 hires\n• **Niche Communities:** Source on Discord/GitHub/Slack groups relevant to the stack\n\nHow many hires are you planning in the next 3 months?`;
    }
    
    return `Hello! I'm your AI Recruitment Coach. I'm here to help you with:\n\n• 📝 **Job Posting** — creating optimized job descriptions\n• 🔍 **Candidate Screening** — identifying top talent faster\n• 🎯 **Interview Prep** — structured interview questions and rubrics\n• 📊 **Hiring Analytics** — insights into your recruitment funnel\n• 💡 **Best Practices** — building a world-class startup team\n\nHow can I help you grow your team today? Try saying "Help me write a Senior Dev JD" or "Suggest screening questions for a UI Designer".`;
  }

  // Student Fallbacks
  if (m.includes("resume") || m.includes("cv")) {
    return `Here are key resume tips for students:\n\n• **Keep it to 1 page** for fresher/intern roles\n• Start each bullet with **action verbs** (Built, Developed, Designed, Led)\n• Add a **Skills section** with relevant tech skills\n• Include **projects** — even personal or academic ones count!\n• Put your **education** near the top if you're a fresher\n• Use **quantified achievements** where possible (e.g., "Built a web app used by 200+ users")\n\n💡 Attach your PDF resume here and I can give you specific feedback!`;
  }
  if (m.includes("interview") || m.includes("prepare")) {
    return `Great question! Here's how to prepare for interviews:\n\n**Technical Interview:**\n• Practice DSA on LeetCode/HackerRank (Easy and Medium level)\n• Review core CS concepts: OOP, DBMS basics, OS fundamentals\n• Be ready to code in your strongest language\n\n**HR Interview:**\n• Prepare your "Tell me about yourself" (keep it 2 minutes)\n• Know your strengths/weaknesses honestly\n• Research the company before the interview\n• Prepare 3-5 questions to ask them\n\n**General Tips:**\n• Join mock interview platforms like Pramp or Interviewing.io\n• Practice out loud — speaking is different from knowing!\n\nWhich type of interview are you preparing for?`;
  }
  if (m.includes("job") || m.includes("internship") || m.includes("how to get") || m.includes("find")) {
    return `Here's a proven strategy to land internships/jobs as a student:\n\n**Step 1: Build your profile**\n• Update your LinkedIn with skills, projects, and education\n• Create a GitHub profile with your projects\n• Build 2-3 strong projects relevant to your target role\n\n**Step 2: Apply smartly**\n• Apply on LinkedIn, Internshala, Naukri, AngelList, and company career pages\n• Customize your resume for each role\n• Apply early — most companies open positions 2-3 months before joining\n\n**Step 3: Network**\n• Connect with seniors who are already working\n• Join tech communities (Discord, Slack groups)\n• Attend college placement drives and hackathons\n\nWhat kind of role are you targeting? I can give more specific advice!`;
  }
  if (m.includes("skill") || m.includes("learn") || m.includes("tech")) {
    return `For the current job market, here are the most in-demand skills by role:\n\n**Software Development:**\n• JavaScript/React or Python/Django\n• Git & GitHub\n• REST APIs and databases (SQL)\n\n**Data & AI:**\n• Python (Pandas, NumPy, Matplotlib)\n• Machine Learning basics (scikit-learn)\n• SQL for data analysis\n\n**Full Stack:**\n• React + Node.js or Django\n• PostgreSQL or MongoDB\n• Docker basics\n\n🎯 **My recommendation:** Pick ONE area → master the fundamentals → build 2 projects → apply!\n\nWhat field are you most interested in?`;
  }
  if (m.includes("ats") || m.includes("score") || m.includes("applicant tracking")) {
    return `ATS (Applicant Tracking System) tips for your resume:\n\n• **Use keywords** from the job description in your resume\n• Avoid tables, columns, headers/footers — ATS can't read them well\n• Use standard section names: "Experience", "Education", "Skills"\n• Save as **PDF** (unless the company asks for .docx)\n• Avoid images, logos, or fancy graphics\n\n💡 **To get your ATS score:** Attach your PDF resume using the paperclip button, and I'll analyze it against common job requirements!`;
  }

  return `That's a great question about your career! As your AI Career Coach, I'm here to help you with:\n\n• 📄 **Resume building** — crafting the perfect resume\n• 🎯 **Interview prep** — technical and HR rounds\n• 🔍 **Job search strategy** — where and how to apply\n• 📚 **Skill development** — what to learn next\n• 💡 **ATS optimization** — making your resume machine-readable\n\nCould you tell me more specifically what you'd like help with? For example: "Help me improve my resume" or "How do I prepare for a React developer interview?"`;
}
