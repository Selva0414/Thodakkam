const { neon } = require("@neondatabase/serverless");
require("dotenv").config();

const sql = neon(process.env.DATABASE_URL);

const sampleJobs = [
  {
    title: "Senior Full Stack Developer",
    department: "Engineering",
    emp_type: "Full-time",
    location: "San Francisco, CA",
    sal_min: 120000,
    sal_max: 160000,
    description: "Join our engineering team to build scalable web applications using React, Node.js, and PostgreSQL. You'll work on cutting-edge projects that impact millions of users.",
    remote: true,
    status: "active"
  },
  {
    title: "Frontend React Developer",
    department: "Engineering",
    emp_type: "Full-time",
    location: "New York, NY",
    sal_min: 90000,
    sal_max: 120000,
    description: "Looking for a passionate React developer to create beautiful, responsive user interfaces. Experience with TypeScript and modern CSS frameworks preferred.",
    remote: false,
    status: "active"
  },
  {
    title: "DevOps Engineer",
    department: "Infrastructure",
    emp_type: "Full-time",
    location: "Austin, TX",
    sal_min: 110000,
    sal_max: 145000,
    description: "Help us build and maintain our cloud infrastructure using AWS, Docker, and Kubernetes. Experience with CI/CD pipelines essential.",
    remote: true,
    status: "active"
  },
  {
    title: "UI/UX Designer",
    department: "Design",
    emp_type: "Full-time",
    location: "Los Angeles, CA",
    sal_min: 85000,
    sal_max: 115000,
    description: "Create intuitive and visually appealing user experiences. Proficiency in Figma, Adobe Creative Suite, and user research methodologies required.",
    remote: true,
    status: "active"
  },
  {
    title: "Data Scientist",
    department: "Analytics",
    emp_type: "Full-time",
    location: "Seattle, WA",
    sal_min: 130000,
    sal_max: 170000,
    description: "Analyze large datasets to drive business insights. Strong background in Python, R, machine learning, and statistical modeling required.",
    remote: false,
    status: "active"
  },
  {
    title: "Product Manager",
    department: "Product",
    emp_type: "Full-time",
    location: "Boston, MA",
    sal_min: 115000,
    sal_max: 150000,
    description: "Lead product strategy and roadmap development. Work closely with engineering, design, and business teams to deliver exceptional products.",
    remote: true,
    status: "active"
  },
  {
    title: "Backend Developer (Node.js)",
    department: "Engineering",
    emp_type: "Full-time",
    location: "Chicago, IL",
    sal_min: 95000,
    sal_max: 125000,
    description: "Build robust APIs and microservices using Node.js, Express, and MongoDB. Experience with cloud platforms and containerization preferred.",
    remote: false,
    status: "active"
  },
  {
    title: "Mobile App Developer (React Native)",
    department: "Engineering",
    emp_type: "Contract",
    location: "Miami, FL",
    sal_min: 80000,
    sal_max: 110000,
    description: "Develop cross-platform mobile applications using React Native. Experience publishing apps to App Store and Google Play required.",
    remote: true,
    status: "active"
  },
  {
    title: "QA Engineer",
    department: "Quality Assurance",
    emp_type: "Full-time",
    location: "Denver, CO",
    sal_min: 70000,
    sal_max: 95000,
    description: "Ensure product quality through manual and automated testing. Experience with Selenium, Jest, and API testing frameworks preferred.",
    remote: true,
    status: "active"
  },
  {
    title: "Marketing Manager",
    department: "Marketing",
    emp_type: "Full-time",
    location: "Atlanta, GA",
    sal_min: 75000,
    sal_max: 100000,
    description: "Develop and execute marketing campaigns across digital channels. Strong analytical skills and experience with marketing automation tools required.",
    remote: false,
    status: "active"
  },
  {
    title: "Customer Success Manager",
    department: "Customer Success",
    emp_type: "Full-time",
    location: "Portland, OR",
    sal_min: 65000,
    sal_max: 85000,
    description: "Build relationships with customers to ensure product adoption and satisfaction. Experience in SaaS customer success preferred.",
    remote: true,
    status: "active"
  },
  {
    title: "Sales Development Representative",
    department: "Sales",
    emp_type: "Full-time",
    location: "Phoenix, AZ",
    sal_min: 45000,
    sal_max: 65000,
    description: "Generate qualified leads and support the sales team. Great communication skills and experience with CRM systems required.",
    remote: false,
    status: "active"
  },
  {
    title: "Content Writer",
    department: "Marketing",
    emp_type: "Part-time",
    location: "Remote",
    sal_min: 35000,
    sal_max: 50000,
    description: "Create engaging content for our blog, social media, and marketing materials. Strong writing skills and SEO knowledge preferred.",
    remote: true,
    status: "active"
  },
  {
    title: "Cybersecurity Analyst",
    department: "Security",
    emp_type: "Full-time",
    location: "Washington, DC",
    sal_min: 100000,
    sal_max: 130000,
    description: "Monitor and protect our systems from security threats. Experience with penetration testing and security frameworks required.",
    remote: false,
    status: "active"
  },
  {
    title: "Machine Learning Engineer",
    department: "AI/ML",
    emp_type: "Full-time",
    location: "Palo Alto, CA",
    sal_min: 140000,
    sal_max: 180000,
    description: "Build and deploy machine learning models at scale. PhD in Computer Science or related field with strong Python/TensorFlow skills preferred.",
    remote: true,
    status: "active"
  },
  {
    title: "Business Analyst",
    department: "Operations",
    emp_type: "Full-time",
    location: "Dallas, TX",
    sal_min: 70000,
    sal_max: 90000,
    description: "Analyze business processes and identify improvement opportunities. Strong analytical skills and experience with data visualization tools required.",
    remote: false,
    status: "active"
  },
  {
    title: "Technical Writer",
    department: "Documentation",
    emp_type: "Contract",
    location: "Remote",
    sal_min: 60000,
    sal_max: 80000,
    description: "Create comprehensive technical documentation for our APIs and products. Experience with developer documentation and technical writing required.",
    remote: true,
    status: "active"
  },
  {
    title: "HR Coordinator",
    department: "Human Resources",
    emp_type: "Full-time",
    location: "Nashville, TN",
    sal_min: 50000,
    sal_max: 70000,
    description: "Support HR operations including recruiting, onboarding, and employee relations. SHRM certification and HRIS experience preferred.",
    remote: false,
    status: "active"
  },
  {
    title: "Finance Manager",
    department: "Finance",
    emp_type: "Full-time",
    location: "Minneapolis, MN",
    sal_min: 90000,
    sal_max: 120000,
    description: "Manage financial planning, budgeting, and reporting. CPA certification and experience with financial modeling preferred.",
    remote: true,
    status: "active"
  },
  {
    title: "Intern - Software Development",
    department: "Engineering",
    emp_type: "Internship",
    location: "San Diego, CA",
    sal_min: 25000,
    sal_max: 35000,
    description: "Summer internship program for computer science students. Gain hands-on experience building real products with mentorship from senior engineers.",
    remote: false,
    status: "active"
  }
];

async function addSampleJobs() {
  try {
    console.log("🔍 Checking for existing startups...");

    // Get all startup IDs
    const startups = await sql`SELECT id, founder_name, company_name FROM startups LIMIT 10`;

    if (startups.length === 0) {
      console.error("❌ No startups found in database. Please add startups first.");
      return;
    }

    console.log(`✅ Found ${startups.length} startups:`);
    startups.forEach(startup => {
      console.log(`   - ID ${startup.id}: ${startup.company_name} (${startup.founder_name})`);
    });

    console.log("\n🚀 Adding sample jobs...");

    // Add jobs for each startup (cycling through startups)
    const jobPromises = sampleJobs.map(async (job, index) => {
      const startupId = startups[index % startups.length].id;

      const result = await sql`
        INSERT INTO jobs (
          startup_id, title, department, emp_type, location,
          sal_min, sal_max, description, remote, status
        ) VALUES (
          ${startupId}, ${job.title}, ${job.department}, ${job.emp_type},
          ${job.location}, ${job.sal_min}, ${job.sal_max}, ${job.description},
          ${job.remote}, ${job.status}
        ) RETURNING id, title
      `;

      console.log(`   ✅ Added: "${result[0].title}" (ID: ${result[0].id}) for startup ${startupId}`);
      return result[0];
    });

    await Promise.all(jobPromises);

    console.log(`\n🎉 Successfully added ${sampleJobs.length} sample jobs!`);

    // Show summary
    const totalJobs = await sql`SELECT COUNT(*) as count FROM jobs`;
    console.log(`📊 Total jobs in database: ${totalJobs[0].count}`);

  } catch (error) {
    console.error("❌ Error adding sample jobs:", error.message);
  }

  process.exit(0);
}

addSampleJobs();