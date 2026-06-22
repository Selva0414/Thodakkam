import { sql } from "../config/database";

const OtpModel = {
  async create(email: string, otpCode: string, expiresAt: Date | string) {
    const result = await sql`
      INSERT INTO otp_codes (email, otp_code, expires_at)
      VALUES (${email}, ${otpCode}, ${expiresAt})
      RETURNING *
    `;
    return result[0];
  },

  async findLatestValid(email: string, otpCode: string) {
    const result = await sql`
      SELECT * FROM otp_codes
      WHERE email = ${email} AND otp_code = ${otpCode}
        AND is_used = FALSE AND expires_at > NOW()
      ORDER BY created_at DESC LIMIT 1
    `;
    return result[0] || null;
  },

  async markUsed(id: number | string) {
    await sql`UPDATE otp_codes SET is_used = TRUE WHERE id = ${id}`;
  },

  async invalidateAll(email: string) {
    await sql`UPDATE otp_codes SET is_used = TRUE WHERE email = ${email}`;
  },
};

export default OtpModel;
