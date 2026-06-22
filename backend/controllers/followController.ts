import { Request, Response } from "express";
import { FollowModel } from "../models/followModel";

export const followUser = async (req: Request, res: Response) => {
  try {
    const followerId = (req as any).user.id;
    const followingId = Number(req.params.id);
    if (followerId === followingId) return res.status(400).json({ message: "Cannot follow yourself" });
    await FollowModel.follow(followerId, followingId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const unfollowUser = async (req: Request, res: Response) => {
  try {
    const followerId = (req as any).user.id;
    const followingId = Number(req.params.id);
    await FollowModel.unfollow(followerId, followingId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getFollowers = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const followers = await FollowModel.getFollowers(userId);
    res.json({ success: true, followers });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getFollowing = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const following = await FollowModel.getFollowing(userId);
    res.json({ success: true, following });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const isMutual = async (req: Request, res: Response) => {
  try {
    const followerId = (req as any).user.id;
    const followingId = Number(req.params.id);
    const mutual = await FollowModel.isMutual(followerId, followingId);
    res.json({ success: true, mutual });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
