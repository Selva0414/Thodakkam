const { neon } = require("@neondatabase/serverless");
require("dotenv").config();

const sql = neon(process.env.DATABASE_URL);

const jobsForCurrentUser = [
  {
    title: "Senior AWS Cloud Engineer",
    department: "Cloud Engineering",
    emp_type: "Full-time",
    location: "Bangalore, India",
    sal_min: 1200000,
    sal_max: 1800000,
    description: "Lead our cloud infrastructure using AWS services. Design and implement scalable, secure cloud solutions. Experience with EC2, S3, RDS, Lambda, and CloudFormation required.",
    remote: true,
    status: "active"
  },
  {
    title: "DevOps Specialist",
    department: "Infrastructure",
    emp_type: "Full-time",
    location: "Chennai, India",
    sal_min: 1000000,
    sal_max: 1400000,
    description: "Automate deployment pipelines and manage containerized applications. Expertise in Docker, Kubernetes, Jenkins, and AWS CloudFormation needed.",
    remote: false,
    status: "active"
  },
  {
    title: "Full Stack Developer (MERN)",
    department: "Engineering",
    emp_type: "Full-time",
    location: "Hyderabad, India",
    sal_min: 800000,
    sal_max: 1200000,
    description: "Build modern web applications using MongoDB, Express.js, React, and Node.js. Experience with AWS deployment and CI/CD pipelines preferred.",
    remote: true,
    status: "active"
  },
  {
    title: "Cloud Solutions Architect",
    department: "Solutions",
    emp_type: "Full-time",
    location: "Mumbai, India",
    sal_min: 1500000,
    sal_max: 2200000,
    description: "Design enterprise-grade cloud architectures for clients. AWS Solutions Architect certification and 5+ years experience required.",
    remote: false,
    status: "active"
  },
  {
    title: "Backend Developer (Python)",
    department: "Engineering",
    emp_type: "Full-time",
    location: "Pune, India",
    sal_min: 700000,
    sal_max: 1100000,
    description: "Develop robust APIs using Python, Django/Flask, and PostgreSQL. Experience with AWS Lambda and serverless architectures preferred.",
    remote: true,
    status: "active"
  },
  {
    title: "Data Engineer",
    department: "Data",
    emp_type: "Full-time",
    location: "Delhi, India",
    sal_min: 1100000,
    sal_max: 1600000,
    description: "Build data pipelines and ETL processes using AWS Glue, Redshift, and Apache Airflow. Strong SQL and Python skills required.",
    remote: false,
    status: "draft"
  },
  {
    title: "Technical Writer",
    department: "Documentation",
    emp_type: "Contract",
    location: "Remote",
    sal_min: 400000,
    sal_max: 600000,
    description: "Create comprehensive documentation for AWS services and internal tools. Technical writing experience in cloud technologies preferred.",
    remote: true,
    status: "active"
  },
  {
    title: "Product Manager - Cloud Services",
    department: "Product",
    emp_type: "Full-time",
    location: "Bangalore, India",
    sal_min: 1300000,
    sal_max: 1900000,
    description: "Lead product strategy for cloud-based solutions. Experience in B2B SaaS products and AWS ecosystem required.",
    remote: true,
    status: "paused"
  }
];

async function addJobsForCurrentUser() {
  try {
    // Get the current user's startup ID (most recent)
    const currentStartup = await sql`
      SELECT id, founder_name, company_name
      FROM startups
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (currentStartup.length === 0) {
      console.error("❌ No startup found");
      return;
    }

    const startup = currentStartup[0];
    console.log(`🎯 Adding jobs for: ${startup.company_name} (ID: ${startup.id}) - ${startup.founder_name}`);

    // Add jobs for this startup
    const jobPromises = jobsForCurrentUser.map(async (job, index) => {
      const result = await sql`
        INSERT INTO jobs (
          startup_id, title, department, emp_type, location,
          sal_min, sal_max, description, remote, status
        ) VALUES (
          ${startup.id}, ${job.title}, ${job.department}, ${job.emp_type},
          ${job.location}, ${job.sal_min}, ${job.sal_max}, ${job.description},
          ${job.remote}, ${job.status}
        ) RETURNING id, title, status
      `;

      console.log(`   ✅ Added: "${result[0].title}" (Status: ${result[0].status})`);
      return result[0];
    });

    await Promise.all(jobPromises);

    console.log(`\n🎉 Successfully added ${jobsForCurrentUser.length} jobs for your startup!`);

    // Show summary
    const totalJobsForUser = await sql`SELECT COUNT(*) as count FROM jobs WHERE startup_id = ${startup.id}`;
    console.log(`📊 Total jobs for your startup: ${totalJobsForUser[0].count}`);

    // Show job counts by status
    const statusCounts = await sql`
      SELECT status, COUNT(*) as count
      FROM jobs
      WHERE startup_id = ${startup.id}
      GROUP BY status
      ORDER BY status
    `;
    console.log("\n📈 Jobs by status:");
    statusCounts.forEach(s => {
      console.log(`   ${s.status}: ${s.count}`);
    });

  } catch (error) {
    console.error("❌ Error adding jobs:", error.message);
  }

  process.exit(0);
}

addJobsForCurrentUser();