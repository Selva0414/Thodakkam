import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const uploadFields = upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'resumeFile', maxCount: 1 }
]);

// ─── API Routes ───────────────────────────────────────────────────────────────

// 1. User Registration (Sign Up)
app.post('/api/register', uploadFields, async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      fullName, email, password, phone, location,
      skills, 
      educationInstitution, educationDegree, educationFieldOfStudy, educationStartYear, educationEndYear, educationDescription,
      experienceCompany, experienceRole, experienceLocation, experienceJobType, experienceStartDate, experienceEndDate, experienceDescription,
      portfolioUrl, githubUrl, linkedinUrl
    } = req.body;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'Email address already registered' });
      return;
    }

    // Process uploaded files
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const profilePhotoPath = files?.['profilePhoto'] ? files['profilePhoto'][0].path : '';
    const resumeFilePath = files?.['resumeFile'] ? files['resumeFile'][0].path : '';

    // Process skills array
    let skillsArray: string[] = [];
    if (skills) {
      skillsArray = Array.isArray(skills) ? skills : skills.split(',').map((s: string) => s.trim());
    }

    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        password, 
        phone,
        location,
        profilePhoto: profilePhotoPath,
        resumeFile: resumeFilePath,
        skills: skillsArray,
        education: {
          institution: educationInstitution,
          degree: educationDegree,
          fieldOfStudy: educationFieldOfStudy,
          startYear: educationStartYear,
          endYear: educationEndYear,
          description: educationDescription
        },
        experience: {
          company: experienceCompany,
          role: experienceRole,
          location: experienceLocation,
          jobType: experienceJobType,
          startDate: experienceStartDate,
          endDate: experienceEndDate,
          description: experienceDescription
        },
        portfolioUrl,
        githubUrl,
        linkedinUrl
      }
    });

    console.log(`User registered successfully: ${email}`);
    res.status(201).json({ success: true, message: 'User profile registered successfully!', userId: newUser.id });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// 2. User Authentication (Sign In)
app.post('/api/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Please provide email and password' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    if (user.password !== password) {
      res.status(400).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    res.status(200).json({ 
      success: true, 
      message: 'Login successful!', 
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        profilePhoto: user.profilePhoto
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during authentication' });
  }
});

app.get('/api/user/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.status(200).json({ 
      success: true, 
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        profilePhoto: user.profilePhoto
      }
    });
  } catch (err) {
    console.error('Fetch user error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching user' });
  }
});

// Configure Nodemailer Transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || ''
  }
});

// 3. Startup OTP Generation & Sending
app.post('/api/startup/send-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, founderName, companyName } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email address is required' });
      return;
    }

    const existingStartup = await prisma.startup.findUnique({ where: { email } });
    if (existingStartup) {
      res.status(400).json({ success: false, message: 'This email is already registered to a startup' });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.otp.upsert({
      where: { email },
      update: { otp, createdAt: new Date() },
      create: { email, otp, createdAt: new Date() }
    });

    console.log(`\n==========================================`);
    console.log(`[OTP SERVICE] Generated OTP for ${email}: ${otp}`);
    console.log(`==========================================\n`);

    let emailSent = false;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const companyLabel = companyName || 'Thodakkam';
        const userLabel = founderName || 'User';
        
        // Generate initials (e.g. Echo Digital -> ED)
        const words = companyLabel.split(' ').filter((w: string) => w.length > 0);
        let initials = 'SU';
        if (words.length >= 2) {
          initials = (words[0][0] + words[1][0]).toUpperCase();
        } else if (words.length === 1 && words[0].length >= 2) {
          initials = words[0].substring(0, 2).toUpperCase();
        }

        const mailOptions = {
          from: `"Start Up Portal" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Your Start Up Portal Verification Code',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 40px 20px; color: #334155; max-width: 500px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
              
              <!-- Top Logo Area -->
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; background-color: #5A279B; color: #ffffff; width: 48px; height: 48px; line-height: 48px; border-radius: 12px; font-weight: bold; font-size: 16px; margin-bottom: 16px;">
                  ${initials}
                </div>
                <h2 style="color: #5A279B; margin: 0 0 8px 0; font-size: 22px;">Verify Your Email</h2>
                <p style="color: #64748b; margin: 0; font-size: 14px;">Secure access to your account</p>
              </div>

              <!-- Message Body -->
              <div style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 32px;">
                <p>Hello ${userLabel},</p>
                <p>Use the One-Time Password (OTP) below to complete your email verification. This ensures secure access to your account.</p>
              </div>

              <!-- OTP Box -->
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #5A279B; margin-bottom: 8px;">
                  ${otp}
                </div>
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">Valid for 5 minutes</p>
              </div>

              <!-- Warning Box -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; font-size: 13px; color: #475569; margin-bottom: 40px;">
                <p style="margin: 0 0 8px 0;">🔒 Never share your OTP with anyone.</p>
                <p style="margin: 0;">⚠️ If you didn't request this, you can ignore this email.</p>
              </div>

              <!-- Footer -->
              <div style="text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 24px;">
                <p style="font-weight: bold; color: #64748b; margin: 0 0 4px 0;">${companyLabel}</p>
                <p style="margin: 0 0 4px 0;">Startup • Student • Admin Platform</p>
                <p style="margin: 0 0 16px 0;">${email}</p>
                <p style="margin: 0;">© 2026 ${companyLabel}. All rights reserved.</p>
              </div>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        emailSent = true;
        console.log(`[OTP SERVICE] Email sent successfully to ${email}`);
      } catch (mailError: any) {
        console.error('[OTP SERVICE] Nodemailer Error (falling back to terminal log):', mailError.message);
      }
    }

    res.status(200).json({ 
      success: true, 
      message: emailSent 
        ? 'Verification code sent to your email address.' 
        : 'Verification code generated. (Check server console logs since SMTP credentials are not configured)' 
    });

  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ success: false, message: 'Server error while generating OTP' });
  }
});

// 4. Startup Registration (Verify OTP & Create Account)
app.post('/api/startup/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { founderName, companyName, registrationId, email, password, category, otp } = req.body;

    if (!founderName || !companyName || !registrationId || !email || !password || !category || !otp) {
      res.status(400).json({ success: false, message: 'All fields and OTP are required' });
      return;
    }

    const storedOtpDoc = await prisma.otp.findUnique({ where: { email } });
    if (!storedOtpDoc) {
      res.status(400).json({ success: false, message: 'OTP expired or not found. Please request a new code.' });
      return;
    }

    if (storedOtpDoc.otp !== otp) {
      res.status(400).json({ success: false, message: 'Invalid verification code. Please try again.' });
      return;
    }

    const existingStartup = await prisma.startup.findUnique({ where: { email } });
    if (existingStartup) {
      res.status(400).json({ success: false, message: 'This email is already registered' });
      return;
    }

    const newStartup = await prisma.startup.create({
      data: {
        founderName,
        companyName,
        registrationId,
        email,
        password,
        category
      }
    });

    await prisma.otp.delete({ where: { email } });

    console.log(`Startup registered successfully: ${companyName} (${email})`);
    res.status(201).json({ success: true, message: 'Startup account verified and created successfully!' });

  } catch (err) {
    console.error('Startup registration error:', err);
    res.status(500).json({ success: false, message: 'Server error during startup registration' });
  }
});

// 5. Startup Authentication (Sign In)
app.post('/api/startup/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Please provide email and password' });
      return;
    }

    const startup = await prisma.startup.findUnique({ where: { email } });
    if (!startup) {
      res.status(400).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    if (startup.password !== password) {
      res.status(400).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    res.status(200).json({ 
      success: true, 
      message: 'Startup login successful!', 
      startup: {
        id: startup.id,
        founderName: startup.founderName,
        companyName: startup.companyName,
        email: startup.email
      }
    });

  } catch (err) {
    console.error('Startup Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during startup authentication' });
  }
});

// 6. Admin Authentication (Sign In)
app.post('/api/admin/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Please provide email and password' });
      return;
    }

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      res.status(400).json({ success: false, message: 'Invalid admin credentials' });
      return;
    }

    if (admin.password !== password) {
      res.status(400).json({ success: false, message: 'Invalid admin credentials' });
      return;
    }

    res.status(200).json({ 
      success: true, 
      message: 'Master Admin login successful!', 
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (err) {
    console.error('Admin Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during admin authentication' });
  }
});

// 7. Admin Stats Dashboard
app.get('/api/admin/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const totalStudents = await prisma.user.count();
    const totalStartups = await prisma.startup.count();
    
    // As there is no "status" field for pending approvals in the current DB schema yet, 
    // we'll return a mock value for pending or 0.
    const pendingApprovals = 3; 

    res.status(200).json({ 
      success: true, 
      stats: {
        totalStudents,
        totalStartups,
        pendingApprovals
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching stats' });
  }
});

// ============================================
// JOB MANAGEMENT API
// ============================================

// 8. Create a New Job
app.post('/api/jobs', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, location, type, salary, description, requirements, companyName } = req.body;

    if (!title || !location || !companyName) {
      res.status(400).json({ success: false, message: 'Missing required job fields or companyName' });
      return;
    }

    // Find the startup by companyName
    const startup = await prisma.startup.findFirst({
      where: { companyName: companyName as string }
    });

    if (!startup) {
      res.status(404).json({ success: false, message: 'Startup not found' });
      return;
    }

    const job = await prisma.job.create({
      data: {
        title,
        location,
        type: type || 'Full-time',
        salary,
        description: description || '',
        requirements: requirements || [],
        startupId: startup.id,
      }
    });

    res.status(201).json({ success: true, message: 'Job created successfully', job });
  } catch (err) {
    console.error('Job creation error:', err);
    res.status(500).json({ success: false, message: 'Server error creating job' });
  }
});

// Update a Job
app.put('/api/jobs/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, location, type, salary, description, requirements } = req.body;

    const job = await prisma.job.update({
      where: { id: id as string },
      data: {
        title,
        location,
        type,
        salary,
        description,
        requirements: requirements || []
      }
    });

    res.status(200).json({ success: true, message: 'Job updated successfully', job });
  } catch (err) {
    console.error('Job update error:', err);
    res.status(500).json({ success: false, message: 'Server error updating job' });
  }
});

// 9. Get Jobs for a Startup
app.get('/api/jobs/startup/:companyName', async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyName } = req.params;

    const startup = await prisma.startup.findFirst({
      where: { companyName: companyName as string },
      include: {
        jobs: {
          orderBy: { createdAt: 'desc' },
          include: { applications: true }
        }
      } as any
    });

    if (!startup) {
      res.status(404).json({ success: false, message: 'Startup not found' });
      return;
    }

    res.status(200).json({ success: true, jobs: (startup as any).jobs });
  } catch (err) {
    console.error('Error fetching jobs:', err);
    res.status(500).json({ success: false, message: 'Server error fetching jobs' });
  }
});

// 10. Get All Jobs (For Students)
app.get('/api/jobs', async (req: Request, res: Response): Promise<void> => {
  try {
    const jobs = await prisma.job.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: {
        startup: {
          select: { companyName: true }
        }
      } as any
    });

    res.status(200).json({ success: true, jobs });
  } catch (err) {
    console.error('Error fetching all jobs:', err);
    res.status(500).json({ success: false, message: 'Server error fetching all jobs' });
  }
});

// 11. Apply for a Job
app.post('/api/apply', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId, userId, fullName, email, phone, resumeUrl } = req.body;

    if (!jobId || !fullName || !email) {
      res.status(400).json({ success: false, message: 'Missing required application fields' });
      return;
    }

    // Check if user already applied
    const existingApplication = await prisma.application.findFirst({
      where: {
        jobId,
        email
      } as any
    });

    if (existingApplication) {
      res.status(400).json({ success: false, message: 'You have already applied for this job' });
      return;
    }

    const application = await prisma.application.create({
      data: {
        jobId,
        userId: userId || null, // Optional if user isn't logged in with ID
        fullName,
        email,
        phone,
        resumeUrl
      } as any
    });

    res.status(201).json({ success: true, message: 'Application submitted successfully', application });
  } catch (err) {
    console.error('Application error:', err);
    res.status(500).json({ success: false, message: 'Server error submitting application' });
  }
});

// 11b. Check if user already applied
app.get('/api/apply/check', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId, email } = req.query;
    if (!jobId || !email) {
      res.status(400).json({ success: false, message: 'Missing jobId or email' });
      return;
    }

    const existing = await prisma.application.findFirst({
      where: {
        jobId: String(jobId),
        email: String(email)
      } as any
    });

    res.status(200).json({ success: true, applied: !!existing });
  } catch (err) {
    console.error('Error checking application:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 11c. Get All Applications for a Startup
app.get('/api/applications/startup/:companyName', async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyName } = req.params;
    const startup = await prisma.startup.findFirst({
      where: { companyName: companyName as string },
      include: {
        jobs: {
          include: {
            applications: {
              include: { user: true }
            }
          }
        }
      } as any
    });

    if (!startup) {
      res.status(404).json({ success: false, message: 'Startup not found' });
      return;
    }

    // Flatten all applications into one array
    let allApplications: any[] = [];
    (startup as any).jobs.forEach((job: any) => {
      if (job.applications && job.applications.length > 0) {
        job.applications.forEach((app: any) => {
          allApplications.push({
            ...app,
            jobTitle: job.title // Inject job title so startup knows what they applied for
          });
        });
      }
    });

    // Sort by appliedAt descending
    allApplications.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());

    res.status(200).json({ success: true, applications: allApplications });
  } catch (err) {
    console.error('Error fetching applications for startup:', err);
    res.status(500).json({ success: false, message: 'Server error fetching applications' });
  }
});

// 11d. Update Application Status
app.put('/api/applications/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedApplication = await prisma.application.update({
      where: { id: id as string },
      data: { status }
    });
    res.status(200).json({ success: true, application: updatedApplication });
  } catch (err) {
    console.error('Error updating application:', err);
    res.status(500).json({ success: false, message: 'Server error updating application' });
  }
});


// 14. Forgot Password Flow
// Request OTP
app.post('/api/auth/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, role } = req.body;
    if (!email || !role) { res.status(400).json({ success: false, message: 'Email and role are required' }); return; }

    let userExists = false;
    if (role === 'student') {
      userExists = !!(await prisma.user.findUnique({ where: { email } }));
    } else if (role === 'startup') {
      userExists = !!(await prisma.startup.findUnique({ where: { email } }));
    } else if (role === 'admin') {
      userExists = !!(await prisma.admin.findUnique({ where: { email } }));
    }

    if (!userExists) {
      res.status(404).json({ success: false, message: 'User not found with this email' }); return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    await prisma.otp.upsert({
      where: { email },
      update: { otp, createdAt: new Date() },
      create: { email, otp }
    });

    // Send email via nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com', // fallback for dev
        pass: process.env.EMAIL_PASS || 'your-app-password',
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER || 'Thodakkam Portal',
      to: email,
      subject: 'Password Reset OTP - Thodakkam',
      text: `Your OTP for password reset is: ${otp}\nThis OTP is valid for 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset for your Thodakkam account.</p>
          <p>Your One-Time Password (OTP) is:</p>
          <h1 style="color: #6a1b9a; letter-spacing: 5px;">${otp}</h1>
          <p>Please enter this code in the app to reset your password. It is valid for 10 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`[MAIL SENT] OTP ${otp} sent successfully to ${email}`);
      res.status(200).json({ success: true, message: 'OTP sent to your email successfully.' });
    } catch (mailError) {
      console.error("Nodemailer error:", mailError);
      // Fallback for development if credentials are bad
      console.log(`[DEV MODE FALLBACK] OTP for ${email} is ${otp}`);
      res.status(200).json({ success: true, message: 'OTP sent (Check terminal if email fails in Dev Mode)' });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Verify OTP
app.post('/api/auth/verify-otp-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;
    const otpRecord = await prisma.otp.findUnique({ where: { email } });
    
    if (!otpRecord || otpRecord.otp !== otp) {
      res.status(400).json({ success: false, message: 'Invalid OTP' }); return;
    }
    
    res.status(200).json({ success: true, message: 'OTP verified successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Reset Password
app.post('/api/auth/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, newPassword, role } = req.body;
    if (!email || !newPassword || !role) { res.status(400).json({ success: false, message: 'Missing fields' }); return; }

    if (role === 'student') {
      await prisma.user.update({ where: { email }, data: { password: newPassword } });
    } else if (role === 'startup') {
      await prisma.startup.update({ where: { email }, data: { password: newPassword } });
    } else if (role === 'admin') {
      await prisma.admin.update({ where: { email }, data: { password: newPassword } });
    }

    await prisma.otp.deleteMany({ where: { email } });

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Community Posts
app.get('/api/posts', async (req: Request, res: Response): Promise<void> => {
  try {
    const posts = await prisma.post.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching posts' });
  }
});

app.post('/api/posts', async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, imageUrl, category, email, companyName } = req.body;
    let userId = '';

    if (companyName) {
      const generatedEmail = `${companyName.replace(/\s+/g, '').toLowerCase()}@startup.local`;
      let startupUser = await prisma.user.findFirst({ where: { email: generatedEmail } });
      if (!startupUser) {
        startupUser = await prisma.user.create({
          data: {
            fullName: companyName,
            email: generatedEmail,
            password: 'mockpassword',
            skills: []
          } as any
        });
      }
      userId = startupUser.id;
    } else if (email) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) userId = user.id;
    }
    
    if (!userId) {
      const validUser = await prisma.user.findFirst();
      if (!validUser) {
         res.status(400).json({ success: false, message: 'No valid user found to post as.' });
         return;
      }
      userId = validUser.id;
    }

    let finalImageUrl = imageUrl;
    
    // If imageUrl is a base64 string, write it to disk and save the filename
    if (imageUrl && imageUrl.startsWith('data:image')) {
      try {
        const matches = imageUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const filename = `post-${uniqueSuffix}.${ext}`;
          const uploadDir = path.join(__dirname, '../uploads');
          if (!fs.existsSync(uploadDir)) {
             fs.mkdirSync(uploadDir, { recursive: true });
          }
          
          const uploadPath = path.join(uploadDir, filename);
          fs.writeFileSync(uploadPath, buffer);
          
          finalImageUrl = `uploads/${filename}`;
        }
      } catch (e) {
        console.error("Failed to decode base64 image", e);
      }
    }

    const post = await prisma.post.create({
      data: {
        text,
        imageUrl: finalImageUrl,
        category: category || 'Projects',
        userId: userId
      } as any
    });
    res.status(201).json({ success: true, post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error creating post' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Thodakkam backend server running on http://localhost:${PORT}`);
});
