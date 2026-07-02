import { sql } from "../config/database";

export const FollowModel = {
  async follow(followerId: number, followingId: number) {
    if (followerId === followingId) throw new Error("Cannot follow yourself");
    await sql`
      INSERT INTO startup_follows (follower_id, following_id)
      VALUES (${followerId}, ${followingId})
      ON CONFLICT DO NOTHING
    `;
  },
  async unfollow(followerId: number, followingId: number) {
    await sql`
      DELETE FROM startup_follows
      WHERE follower_id = ${followerId} AND following_id = ${followingId}
    `;
  },
  async getFollowers(userId: number) {
    return await sql`SELECT follower_id FROM startup_follows WHERE following_id = ${userId}`;
  },
  async getFollowing(userId: number) {
    return await sql`SELECT following_id FROM startup_follows WHERE follower_id = ${userId}`;
  },
  async isMutual(followerId: number, followingId: number) {
    const [a] = await sql`SELECT 1 FROM startup_follows WHERE follower_id = ${followerId} AND following_id = ${followingId}`;
    const [b] = await sql`SELECT 1 FROM startup_follows WHERE follower_id = ${followingId} AND following_id = ${followerId}`;
    return !!(a && b);
  }
};
