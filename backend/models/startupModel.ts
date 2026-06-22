import { sql } from "../config/database";

const StartupModel = {
  async create({ founder_name, company_name, company_reg_id, email, password_hash, category, logo_url, linkedin_url, website_url, instagram_url, github_url, physical_photos, msme_id, iso_id, reg_type, certificate_id, certificate_url }: any) {
    try {
      // Ensure columns exist
      try {
        await sql`ALTER TABLE startups ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(255), ADD COLUMN IF NOT EXISTS github_url VARCHAR(255), ADD COLUMN IF NOT EXISTS physical_photos JSONB, ADD COLUMN IF NOT EXISTS msme_id VARCHAR(255), ADD COLUMN IF NOT EXISTS iso_id VARCHAR(255), ADD COLUMN IF NOT EXISTS reg_type VARCHAR(255), ADD COLUMN IF NOT EXISTS certificate_id VARCHAR(255), ADD COLUMN IF NOT EXISTS certificate_url TEXT;`;
      } catch (err) {
        // ignore
      }

      const result = await sql`
        INSERT INTO startups (
          name, founder_name, company_name, company_reg_id, email, password_hash, category, status, rules_accepted,
          logo_url, linkedin_url, company_website, instagram_url, github_url, physical_photos, msme_id, iso_id, reg_type, certificate_id, certificate_url
        )
        VALUES (
          ${company_name}, ${founder_name}, ${company_name}, ${company_reg_id}, ${email}, ${password_hash}, ${category}, 'PENDING', FALSE,
          ${logo_url || null}, ${linkedin_url || null}, ${website_url || null}, ${instagram_url || null}, ${github_url || null}, ${physical_photos || null}, ${msme_id || null}, ${iso_id || null}, ${reg_type || null}, ${certificate_id || null}, ${certificate_url || null}
        )
        RETURNING id, founder_name, company_name, email, category, status, is_verified, rules_accepted, created_at, msme_id, iso_id, reg_type, certificate_id, certificate_url
      `;
      return result[0];
    } catch (error: any) {
      // Backward compatibility for schemas that do not include a `name` column.
      if (String(error?.message || '').toLowerCase().includes('column "name" of relation "startups" does not exist')) {
        const result = await sql`
          INSERT INTO startups (
            founder_name, company_name, company_reg_id, email, password_hash, category, status, rules_accepted,
            logo_url, linkedin_url, company_website, instagram_url, github_url, physical_photos, msme_id, iso_id, reg_type, certificate_id, certificate_url
          )
          VALUES (
            ${founder_name}, ${company_name}, ${company_reg_id}, ${email}, ${password_hash}, ${category}, 'PENDING', FALSE,
            ${logo_url || null}, ${linkedin_url || null}, ${website_url || null}, ${instagram_url || null}, ${github_url || null}, ${physical_photos || null}, ${msme_id || null}, ${iso_id || null}, ${reg_type || null}, ${certificate_id || null}, ${certificate_url || null}
          )
          RETURNING id, founder_name, company_name, email, category, status, is_verified, rules_accepted, created_at, msme_id, iso_id, reg_type, certificate_id, certificate_url
        `;
        return result[0];
      }
      throw error;
    }
  },

  async findByEmail(email: string) {
    const result = await sql`SELECT * FROM startups WHERE email = ${email}`;
    return result[0] || null;
  },

  async findById(id: number | string) {
    const result = await sql`SELECT id, founder_name, company_name, company_reg_id, email, category, status, is_verified, rules_accepted, created_at, profile_views, post_impressions, company_website, company_description, logo_url, linkedin_url, twitter_url, reject_reason, suspend_reason, msme_id, iso_id FROM startups WHERE id = ${id}`;
    return result[0] || null;
  },

  async acceptRules(id: number | string) {
    const result = await sql`
      UPDATE startups
      SET rules_accepted = TRUE, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, rules_accepted
    `;
    return result[0] || null;
  },

  async updateProfile(id: number | string, data: {
    founder_name: string;
    email: string;
    company_website?: string;
    company_description?: string;
    logo_url?: string;
    linkedin_url?: string;
    twitter_url?: string;
  }) {
    const result = await sql`
      UPDATE startups
      SET
        founder_name = ${data.founder_name},
        email = ${data.email},
        company_website = COALESCE(${data.company_website ?? null}, company_website),
        company_description = COALESCE(${data.company_description ?? null}, company_description),
        logo_url = COALESCE(${data.logo_url ?? null}, logo_url),
        linkedin_url = COALESCE(${data.linkedin_url ?? null}, linkedin_url),
        twitter_url = COALESCE(${data.twitter_url ?? null}, twitter_url),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, founder_name, company_name, company_reg_id, email, category, status, is_verified, created_at, company_website, company_description, logo_url, linkedin_url, twitter_url
    `;
    return result[0] || null;
  },

  async markVerified(email: string) {
    const result = await sql`UPDATE startups SET is_verified = TRUE, updated_at = NOW() WHERE email = ${email} RETURNING *`;
    return result[0];
  },

  async updateStatus(id: number | string, status: string) {
    const result = await sql`
      UPDATE startups
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0] || null;
  },
};

export default StartupModel;
