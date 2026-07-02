import { Request, Response } from "express";
import * as InterviewRoundModel from "../models/interviewRoundModel";
import * as messageModel from "../models/messageModel";

export async function assignRounds(req: Request, res: Response): Promise<any> {
  try {
    const interviewId = parseInt(req.params.id as string, 10);
    const { rounds } = req.body;

    if (!rounds || !Array.isArray(rounds) || rounds.length === 0) {
      return res.status(400).json({ success: false, message: "Rounds array is required." });
    }

    const validTypes = ["mcq", "live_coding", "interview"];
    for (const r of rounds) {
      if (!validTypes.includes(r.round_type)) {
        return res.status(400).json({ success: false, message: `Invalid round type: ${r.round_type}` });
      }
      if (!r.round_order || r.round_order < 1) {
        return res.status(400).json({ success: false, message: "Each round must have a valid round_order >= 1." });
      }
    }

    const result = await InterviewRoundModel.createRounds(interviewId, rounds);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    console.error("Assign rounds error:", error.message);
    res.status(500).json({ success: false, message: "Failed to assign rounds." });
  }
}

export async function getRounds(req: Request, res: Response): Promise<any> {
  try {
    const interviewId = parseInt(req.params.id as string, 10);
    const rounds = await InterviewRoundModel.getRoundsByInterview(interviewId);
    res.json({ success: true, data: rounds });
  } catch (error: any) {
    console.error("Get rounds error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch rounds." });
  }
}

export async function updateRoundStatus(req: Request, res: Response): Promise<any> {
  try {
    const roundId = parseInt(req.params.roundId as string, 10);
    const { status } = req.body;

    const validStatuses = ["pending", "in_progress", "passed", "failed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
    }

    const round = await InterviewRoundModel.getRoundById(roundId);
    if (!round) {
      return res.status(404).json({ success: false, message: "Round not found." });
    }

    if (status === "in_progress" || status === "passed") {
      const canProceed = await InterviewRoundModel.canProceedToRound(round.interview_id, round.round_order);
      if (!canProceed) {
        return res.status(400).json({ success: false, message: "Cannot proceed — previous rounds must be passed first." });
      }
    }

    const updated = await InterviewRoundModel.updateRoundStatus(roundId, status);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Update round status error:", error.message);
    res.status(500).json({ success: false, message: "Failed to update round status." });
  }
}

export async function addMeetLink(req: Request, res: Response): Promise<any> {
  try {
    const roundId = parseInt(req.params.roundId as string, 10);
    const { meetLink, shareInChat, candidateId, candidateType } = req.body;

    if (!meetLink) {
      return res.status(400).json({ success: false, message: "Meet link is required." });
    }

    const meetRegex = /^https:\/\/meet\.google\.com\/.+/i;
    if (!meetRegex.test(meetLink)) {
      return res.status(400).json({ success: false, message: "Invalid Google Meet URL." });
    }

    const updated = await InterviewRoundModel.setMeetLink(roundId, meetLink);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Round not found." });
    }

    if (shareInChat && candidateId && candidateType) {
      const senderId = (req as any).user.id;
      const senderType = (req as any).user.role || "startup";

      const roundInfo = await InterviewRoundModel.getRoundById(roundId);
      const roundLabel = roundInfo.round_type.replace("_", " ").toUpperCase();

      const chatMessage = await messageModel.createMessage(
        senderId, senderType, candidateId, candidateType,
        `📹 ${roundLabel} Round — Join the meeting: ${meetLink}`,
        { message_type: "meet_link", file_url: meetLink }
      );

      const io = req.app.get("io");
      if (io) {
        io.to(`${candidateId}_${candidateType}`).emit("new_message", chatMessage);
        io.to(`${senderId}_${senderType}`).emit("new_message", chatMessage);
      }
    }

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Add meet link error:", error.message);
    res.status(500).json({ success: false, message: "Failed to set meet link." });
  }
}
