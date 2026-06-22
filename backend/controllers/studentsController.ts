import { Request, Response } from "express";
import { sql, query } from "../config/database";
import { sendStudentStatusEmail } from "../services/emailService";
import { resolveMediaUrl } from "../utils/mediaUrl";
import { logAdminAction } from "./auditLogController";

type StudentColumnMap = {
  roll: string;
  department: string;
  startup: string;
  joined: string;
};

const hasStudentColumn = async (columnName: string): Promise<boolean> => {
  const rows = await query(
    `SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'students' AND column_name = $1
    ) AS exists`,
    [columnName]
  );
  return Boolean(rows[0]?.exists);
};

const resolveStudentColumns = async (): Promise<StudentColumnMap> => {
  const [hasRollNumber, hasDepartment, hasAssignedStartup, hasJoinedAt] = await Promise.all([
    hasStudentColumn("roll_number"),
    hasStudentColumn("department"),
    hasStudentColumn("assigned_startup"),
    hasStudentColumn("joined_at"),
  ]);

  return {
    roll: hasRollNumber ? "roll_number" : "roll",
    department: hasDepartment ? "department" : "dept",
    startup: hasAssignedStartup ? "assigned_startup" : "startup",
    joined: hasJoinedAt ? "joined_at" : "join_date",
  };
};
/** List all students with filters and pagination */
export const listStudents = async (req: Request, res: Response): Promise<any> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;
  const { department, startup, search, status, unassigned } = req.query;

  try {
    const columns = await resolveStudentColumns();
    const [hasProfilePhoto, hasEmail, hasPhone, hasLocation, hasSkills, hasGithub, hasLinkedin, hasWebsite, hasEducations] = await Promise.all([
      hasStudentColumn("profile_photo"),
      hasStudentColumn("email"),
      hasStudentColumn("phone"),
      hasStudentColumn("location"),
      hasStudentColumn("skills"),
      hasStudentColumn("github_url"),
      hasStudentColumn("linkedin_url"),
      hasStudentColumn("website_url"),
      hasStudentColumn("educations"),
    ]);
    const conditions: string[] = [];
    const values: any[] = [];

    if (department && department !== "All Departments") {
      values.push(String(department).trim());
      conditions.push(`LOWER(TRIM(COALESCE(s.${columns.department}::text, ''))) = LOWER(TRIM($${values.length}::text))`);
    }
    if (startup && startup !== "All Startups") {
      const startupValue = String(startup).trim();
      const matchingStartups = await query(
        `
        SELECT id, company_name, name
        FROM startups
        WHERE LOWER(TRIM(COALESCE(company_name, name, ''))) = LOWER(TRIM($1))
           OR id::text = $1
        LIMIT 1
        `,
        [startupValue]
      ).catch(() => [] as any[]);

      const startupLabels = Array.from(
        new Set(
          [
            startupValue,
            matchingStartups[0]?.id,
            matchingStartups[0]?.company_name,
            matchingStartups[0]?.name
          ]
            .map((value) => String(value || "").trim().toLowerCase())
            .filter(Boolean)
        )
      );

      values.push(startupLabels);
      conditions.push(`LOWER(TRIM(COALESCE(s.${columns.startup}::text, ''))) = ANY($${values.length}::text[])`);
    }
    if (search) {
      const searchTerm = String(search).trim();
      if (searchTerm) {
        values.push(`%${searchTerm}%`);
        conditions.push(`(COALESCE(s.name, '') ILIKE $${values.length} OR COALESCE(s.email, '') ILIKE $${values.length})`);
      }
    }
    if (status && status !== "All Status") {
      values.push(String(status).trim());
      conditions.push(`LOWER(TRIM(COALESCE(s.status, ''))) = LOWER($${values.length}::text)`);
    }
    if (unassigned === "true") {
      conditions.push(`(s.${columns.startup} IS NULL OR TRIM(COALESCE(s.${columns.startup}::text, '')) = '' OR LOWER(COALESCE(s.${columns.startup}::text, '')) = 'unassigned')`);
    } else if (req.query.assigned === "true") {
      conditions.push(`(s.${columns.startup} IS NOT NULL AND TRIM(COALESCE(s.${columns.startup}::text, '')) <> '' AND LOWER(COALESCE(s.${columns.startup}::text, '')) <> 'unassigned')`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const countRows = await query(`SELECT count(*)::int AS count FROM students s ${whereClause}`, values);
    const count = countRows[0]?.count || 0;

    const students = await query(
      `
      SELECT
        s.id, s.name,
        s.${columns.roll} as roll_number,
        s.${columns.department} as department,
        ${hasEducations ? "s.educations" : "NULL as educations"},
        s.${columns.startup} as startup_name,
        s.role,
        s.status,
        COALESCE(${columns.joined === "joined_at" ? "to_char(s.joined_at, 'MM-DD-YYYY')" : `s.${columns.joined}`}, to_char(s.created_at, 'MM-DD-YYYY')) as joined_date,
        ${hasProfilePhoto ? "s.profile_photo" : "NULL as profile_photo"},
        ${hasEmail ? "s.email" : "NULL as email"},
        ${hasPhone ? "s.phone" : "NULL as phone"},
        ${hasLocation ? "s.location" : "NULL as location"},
        ${hasSkills ? "s.skills" : "NULL as skills"},
        ${hasGithub ? "s.github_url" : "NULL as github_url"},
        ${hasLinkedin ? "s.linkedin_url" : "NULL as linkedin_url"},
        ${hasWebsite ? "s.website_url" : "NULL as website_url"},
        COALESCE(app_stats.application_count, 0)::int AS application_count,
        app_stats.latest_status
      FROM students s
      LEFT JOIN LATERAL (
        SELECT
          count(*)::int AS application_count,
          (SELECT a2.status FROM applications a2 WHERE a2.student_id::text = s.id::text ORDER BY a2.applied_at DESC LIMIT 1) AS latest_status
        FROM applications a
        WHERE a.student_id::text = s.id::text
      ) app_stats ON true
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
      `,
      [...values, limit, offset]
    );

    const resolved = students.map((s: any) => {
      let degree = s.department;
      if (!degree && s.educations) {
        try {
          const edus = typeof s.educations === 'string' ? JSON.parse(s.educations) : s.educations;
          if (Array.isArray(edus) && edus.length > 0) {
            degree = edus[0].degree || null;
          }
        } catch {}
      }
      return {
        ...s,
        department: degree || s.department,
        profile_photo: resolveMediaUrl(req, s.profile_photo),
      };
    });

    res.json({ success: true, students: resolved, pagination: { current_page: page, page_size: limit, total_count: count, total_pages: Math.ceil(count / limit) } });
  } catch (error: any) {
    console.error("List students error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch students" });
  }
};

/** Get Student Statistics */
export const getStudentStats = async (req: Request, res: Response): Promise<any> => {
  try {
    const columns = await resolveStudentColumns();
    const [{ total }] = await sql`SELECT count(*)::int as total FROM students`;
    const [{ active }] = await sql`SELECT count(*)::int as active FROM students WHERE status = 'Active'`;
    const [{ unassigned }] = await query(
      `SELECT count(*)::int as unassigned
      FROM students
      WHERE ${columns.startup} IS NULL
        OR TRIM(COALESCE(${columns.startup}, '')) = ''
        OR LOWER(${columns.startup}) = 'unassigned'`
    );
    const [{ startups_count }] = await query(
      `SELECT count(DISTINCT ${columns.startup})::int as startups_count
       FROM students
       WHERE ${columns.startup} IS NOT NULL
         AND TRIM(COALESCE(${columns.startup}, '')) <> ''
         AND LOWER(${columns.startup}) <> 'unassigned'`
    );
    const distribution = await query(
      `SELECT ${columns.startup} as name, count(*)::int as count
       FROM students
       WHERE ${columns.startup} IS NOT NULL
         AND TRIM(COALESCE(${columns.startup}, '')) <> ''
         AND LOWER(${columns.startup}) <> 'unassigned'
       GROUP BY ${columns.startup}
       ORDER BY count DESC`
    );
    const departmentDistribution = await query(
      `SELECT
         COALESCE(
           NULLIF(TRIM(COALESCE(${columns.department}::text, '')), ''),
           NULLIF(TRIM(COALESCE(educations::jsonb->0->>'degree', '')), ''),
           'Unspecified'
         ) as name,
         count(*)::int as count
       FROM students
       GROUP BY 1
       ORDER BY count DESC
       LIMIT 8`
    );

    // Get status distribution
    const statusDistribution = await query(
      `SELECT
         COALESCE(NULLIF(TRIM(COALESCE(status::text, '')), ''), 'Inactive') as name,
         count(*)::int as count
       FROM students
       GROUP BY 1
       ORDER BY count DESC`
    );

    // Get startup distribution
    const startupDistribution = await query(
      `SELECT ${columns.startup} as name, count(*)::int as count
       FROM students
       WHERE ${columns.startup} IS NOT NULL
         AND TRIM(COALESCE(${columns.startup}, '')) <> ''
         AND LOWER(${columns.startup}) <> 'unassigned'
       GROUP BY ${columns.startup}
       ORDER BY count DESC
       LIMIT 10`
    );

    // Get hired students (students who have an application with status selected or hired)
    const [{ hired_students }] = await query(
      `SELECT count(DISTINCT student_id)::int as hired_students
       FROM applications
       WHERE LOWER(status) IN ('selected', 'hired')`
    ).catch(() => [{ hired_students: 0 }]); // Fallback in case table is missing

    const [{ total_applications }] = await query(
      `SELECT count(*)::int as total_applications FROM applications`
    ).catch(() => [{ total_applications: 0 }]);

    res.json({
      success: true,
      stats: {
        totalStudents: total,
        activeStudents: active,
        unassignedStudents: unassigned,
        startupsCount: startups_count,
        hiredStudents: hired_students,
        totalApplications: total_applications
      },
      distribution,
      departmentDistribution,
      statusDistribution,
      startupDistribution,
    });
  } catch (error: any) {
    console.error("Student stats error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch student stats" });
  }
};

/** Edit a student */
export const editStudent = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { name, roll_number, department, role, assigned_startup } = req.body;
  try {
    const columns = await resolveStudentColumns();
    const [updated] = await query(
      `
      UPDATE students
      SET 
        name = $1,
        ${columns.roll} = $2,
        ${columns.department} = $3,
        role = $4,
        ${columns.startup} = $5
      WHERE id = $6
      RETURNING *
      `,
      [name, roll_number, department, role, assigned_startup || null, id]
    );
    if (!updated) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, message: "Student updated successfully", data: updated });
  } catch (error: any) {
    console.error("Edit student error:", error.message);
    res.status(500).json({ success: false, message: "Failed to update student" });
  }
};

/** Update student status */
export const updateStudentStatus = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const [student] = await sql`SELECT id, name, email, status as current_status FROM students WHERE id = ${id}`;
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const [updated] = await sql`UPDATE students SET status = ${status} WHERE id = ${id} RETURNING *`;

    if (student.current_status !== status && student.email && ["Active", "Suspended", "Inactive"].includes(status)) {
      sendStudentStatusEmail(student.email, student.name, status)
        .then(() => console.log(`Student status email sent to ${student.email} - Status: ${status}`))
        .catch((emailError: any) => console.error("Failed to send student status email:", emailError.message));
    }

    logAdminAction(req, 'UPDATE_STUDENT_STATUS', 'student', String(id), student.name, { previousStatus: student.current_status, newStatus: status });
    res.json({ success: true, message: `Student status updated to ${status}`, data: updated });
  } catch (error: any) {
    console.error("Update student status error:", error.message);
    res.status(500).json({ success: false, message: "Failed to update status" });
  }
};

/** Delete a student */
export const deleteStudent = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    // Clean up related records first
    await query(`DELETE FROM applications WHERE student_id::text = $1`, [id]).catch(() => {});
    const [deleted] = await sql`DELETE FROM students WHERE id = ${id} RETURNING id, name`;
    if (!deleted) return res.status(404).json({ success: false, message: "Student not found" });
    logAdminAction(req, 'DELETE_STUDENT', 'student', String(id), deleted.name);
    res.json({ success: true, message: "Student deleted successfully" });
  } catch (error: any) {
    console.error("Delete student error:", error.message);
    res.status(500).json({ success: false, message: "Failed to delete student" });
  }
};

/** Create a student (admin-only) */
export const createStudent = async (req: Request, res: Response): Promise<any> => {
  const { name, email, password, phone, location, skills, education, internships, website, github, linkedin } = req.body;
  try {
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required" });
    }
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);
    const [existing] = await sql`SELECT id FROM students WHERE email = ${email}`;
    if (existing) return res.status(409).json({ success: false, message: "A student with this email already exists" });

    const columns = await resolveStudentColumns();
    const [student] = await sql`
      INSERT INTO students (name, email, password, phone, location, skills, educations, website, github, linkedin, status, created_at)
      VALUES (${name}, ${email}, ${hashedPassword}, ${phone || null}, ${location || null}, ${skills ? JSON.stringify(skills) : '[]'}, ${education ? JSON.stringify(education) : '[]'}, ${website || null}, ${github || null}, ${linkedin || null}, 'Active', NOW())
      RETURNING id, name, email
    `;
    res.status(201).json({ success: true, message: "Student created successfully", student });
  } catch (error: any) {
    console.error("Create student error:", error.message);
    res.status(500).json({ success: false, message: "Failed to create student" });
  }
};
