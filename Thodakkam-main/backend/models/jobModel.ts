import { query } from "../config/database";

const getAllJobs = async () => {
  return await query(
    `
    SELECT j.*, s.company_name,
           COALESCE(NULLIF(sp.avatar_url, ''), NULLIF(s.logo_url, '')) as company_logo,
           s.company_description, s.company_website, s.linkedin_url, s.twitter_url
    FROM jobs j
    JOIN startups s ON j.startup_id::text = s.id::text
    LEFT JOIN startup_profiles sp ON sp.startup_id::text = s.id::text
    WHERE j.status = $1 
    ORDER BY j.created_at DESC
  `,
    ["active"]
  );
};

const getJobById = async (id: number | string) => {
  const result = await query(
    `
    SELECT j.*, s.company_name,
           COALESCE(NULLIF(sp.avatar_url, ''), NULLIF(s.logo_url, '')) as company_logo,
           s.company_description, s.company_website, s.linkedin_url, s.twitter_url
    FROM jobs j
    JOIN startups s ON j.startup_id::text = s.id::text
    LEFT JOIN startup_profiles sp ON sp.startup_id::text = s.id::text
    WHERE j.id = $1
  `,
    [id]
  );
  return result[0];
};

const getRecommendedJobs = async (_skills: any) => {
  return await query(
    `
    SELECT j.*, s.company_name,
           COALESCE(NULLIF(sp.avatar_url, ''), NULLIF(s.logo_url, '')) as company_logo,
           s.company_description, s.company_website, s.linkedin_url, s.twitter_url
    FROM jobs j
    JOIN startups s ON j.startup_id::text = s.id::text
    LEFT JOIN startup_profiles sp ON sp.startup_id::text = s.id::text
    WHERE j.status = $1 
    ORDER BY j.created_at DESC
  `,
    ["active"]
  );
};

export const getJobsByStartupName = async (companyName: string) => {
  return await query(
    `
    SELECT j.*, s.company_name,
           COALESCE(NULLIF(sp.avatar_url, ''), NULLIF(s.logo_url, '')) as company_logo,
           s.company_description, s.company_website, s.linkedin_url, s.twitter_url
    FROM jobs j
    JOIN startups s ON j.startup_id::text = s.id::text
    LEFT JOIN startup_profiles sp ON sp.startup_id::text = s.id::text
    WHERE TRIM(s.company_name) ILIKE TRIM($1)
    ORDER BY j.created_at DESC
  `,
    [companyName]
  );
};

export { getAllJobs, getJobById, getRecommendedJobs };

