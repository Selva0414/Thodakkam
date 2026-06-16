// Trigger TS recheck for Prisma generated client
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

// Multer Storage config - Use Memory Storage so we can store directly to DB
const storage = multer.memoryStorage();

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

    // Process uploaded files to Base64 strings
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    let profilePhotoPath = '';
    if (files?.['profilePhoto'] && files['profilePhoto'][0]) {
      const file = files['profilePhoto'][0];
      profilePhotoPath = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    }
    
    let resumeFilePath = '';
    if (files?.['resumeFile'] && files['resumeFile'][0]) {
      const file = files['resumeFile'][0];
      resumeFilePath = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    }

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
        location: user.location,
        profilePhoto: user.profilePhoto,
        resumeFile: user.resumeFile,
        skills: user.skills,
        education: user.education,
        experience: user.experience,
        portfolioUrl: user.portfolioUrl,
        githubUrl: user.githubUrl,
        linkedinUrl: user.linkedinUrl
      }
    });
  } catch (err) {
    console.error('Fetch user error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching user' });
  }
});

// GET all users for messaging directory
app.get('/api/users/all', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawUsers = await prisma.user.findMany({
      select: { id: true, fullName: true, email: true, profilePhoto: true }
    });
    const rawStartups = await prisma.startup.findMany({
      select: { id: true, companyName: true, email: true, profilePhoto: true, companyLogo: true }
    });
    
    const combined = [
      ...rawUsers.map(u => ({ id: u.id, fullName: u.fullName, email: u.email, role: 'Student', profilePhoto: u.profilePhoto })),
      ...rawStartups.map(s => ({ id: s.id, fullName: s.companyName, email: s.email, role: 'Startup', profilePhoto: s.companyLogo || s.profilePhoto }))
    ];
    
    res.status(200).json({ success: true, users: combined });
  } catch (err) {
    console.error('Fetch all users error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching all users' });
  }
});

// POST send a message
app.post('/api/messages', async (req: Request, res: Response): Promise<void> => {
  try {
    const { senderId, receiverId, text } = req.body;
    if (!senderId || !receiverId || !text) {
      res.status(400).json({ success: false, message: 'Missing fields' });
      return;
    }
    const message = await (prisma as any).message.create({
      data: { senderId, receiverId, text }
    });
    res.status(201).json({ success: true, message });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ success: false, message: 'Server error sending message' });
  }
});

// GET conversation between two users
app.get('/api/messages/:user1/:user2', async (req: Request, res: Response): Promise<void> => {
  try {
    const { user1, user2 } = req.params;
    const messages = await (prisma as any).message.findMany({
      where: {
        OR: [
          { senderId: user1, receiverId: user2 },
          { senderId: user2, receiverId: user1 }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });
    res.status(200).json({ success: true, messages });
  } catch (err) {
    console.error('Fetch messages error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching messages' });
  }
});

// GET all active conversation user IDs for a user
app.get('/api/messages/conversations/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const messages = await (prisma as any).message.findMany({
      where: {
        OR: [ { senderId: userId }, { receiverId: userId } ]
      },
      orderBy: { createdAt: 'desc' }
    });
    const uniqueIds = new Set<string>();
    messages.forEach((m: any) => {
      uniqueIds.add(m.senderId === userId ? m.receiverId : m.senderId);
    });
    res.status(200).json({ success: true, conversationIds: Array.from(uniqueIds) });
  } catch (err) {
    console.error('Fetch conversations error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching conversations' });
  }
});

// Update user profile
app.put('/api/user/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { 
      fullName, phone, location, profilePhoto, resumeFile, 
      skills, education, experience, portfolioUrl, githubUrl, linkedinUrl 
    } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        fullName, phone, location, profilePhoto, resumeFile,
        skills, education, experience, portfolioUrl, githubUrl, linkedinUrl
      } as any
    });

    res.status(200).json({ success: true, user: updatedUser });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ success: false, message: 'Server error updating user profile' });
  }
});

// Change user password
app.post('/api/user/change-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'All fields are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.password !== currentPassword) {
      res.status(400).json({ success: false, message: 'Incorrect current password' });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { password: newPassword }
    });

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, message: 'Server error updating password' });
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
      message: 'Verification code sent to your email address.' 
    });

  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ success: false, message: 'Server error while generating OTP' });
  }
});

// 4. Startup Registration (Verify OTP & Create Account)
app.post('/api/startup/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { founderName, companyName, registrationId, email, password, category, otp, founderImage, companyLogo } = req.body;

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
        category,
        founderImage,
        companyLogo
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

// 5.1 Startup Profile (Get & Update)
app.get('/api/startup/profile/:companyName', async (req: Request, res: Response): Promise<void> => {
  try {
    const companyName = req.params.companyName as string;
    const startup = await prisma.startup.findFirst({ where: { companyName } });
    if (!startup) {
      res.status(404).json({ success: false, message: 'Startup not found' });
      return;
    }
    res.status(200).json({ 
      success: true, 
      startup: {
        id: startup.id,
        founderName: startup.founderName,
        companyName: startup.companyName,
        email: startup.email,
        profilePhoto: (startup as any).profilePhoto,
        founderImage: (startup as any).founderImage,
        companyLogo: (startup as any).companyLogo,
        role: (startup as any).role,
        timezone: (startup as any).timezone,
        bio: (startup as any).bio
      }
    });
  } catch (err) {
    console.error('Fetch startup profile error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching startup profile' });
  }
});

app.put('/api/startup/profile/:companyName', async (req: Request, res: Response): Promise<void> => {
  try {
    const companyName = req.params.companyName as string;
    const { founderName, email, role, timezone, bio, profilePhoto } = req.body;
    
    // We update by companyName. If email is being changed, check if it exists.
    if (email) {
      const existing = await prisma.startup.findUnique({ where: { email } });
      if (existing && existing.companyName !== companyName) {
         res.status(400).json({ success: false, message: 'Email already used by another account' });
         return;
      }
    }

    const updated = await prisma.startup.updateMany({
      where: { companyName },
      data: {
        founderName, email, role, timezone, bio, profilePhoto, founderImage: profilePhoto
      } as any
    });

    if (updated.count === 0) {
      res.status(404).json({ success: false, message: 'Startup not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Update startup profile error:', err);
    res.status(500).json({ success: false, message: 'Server error updating startup profile' });
  }
});

// --- STARTUP NETWORK ---
app.get('/api/startup/network/:companyName', async (req: Request, res: Response): Promise<void> => {
  try {
    const companyName = req.params.companyName as string;
    const startup = await prisma.startup.findFirst({ where: { companyName } });
    if (!startup) {
      res.status(404).json({ success: false, message: 'Startup not found' });
      return;
    }

    const formatAvatar = (photo?: string | null) => {
      if (!photo) return null;
      if (photo.startsWith('uploads/')) return `http://localhost:5000/${photo}`;
      return photo;
    };

    const followersRaw = await prisma.userFollowsStartup.findMany({
      where: { startupId: startup.id },
      include: { user: true }
    });
    
    const followingRaw = await prisma.startupFollowsUser.findMany({
      where: { startupId: startup.id },
      include: { user: true }
    });

    const followers = followersRaw.map((f: any) => ({
      id: f.user.id,
      name: f.user.fullName,
      role: 'User',
      avatar: formatAvatar(f.user.profilePhoto) || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.user.fullName)}`,
      following: followingRaw.some((fw: any) => fw.userId === f.userId)
    }));

    const following = followingRaw.map((f: any) => ({
      id: f.user.id,
      name: f.user.fullName,
      role: 'User',
      avatar: formatAvatar(f.user.profilePhoto) || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.user.fullName)}`,
      following: true
    }));

    const allUsers = await prisma.user.findMany({ take: 10 });
    const suggestions = allUsers
      .filter((u: any) => !followingRaw.some((fw: any) => fw.userId === u.id))
      .slice(0, 5)
      .map((u: any) => ({
        id: u.id,
        name: u.fullName,
        avatar: formatAvatar(u.profilePhoto) || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName)}`
      }));

    res.status(200).json({ success: true, followers, following, suggestions });
  } catch (err) {
    console.error('Fetch network error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching network' });
  }
});

app.post('/api/startup/network/:companyName/follow', async (req: Request, res: Response): Promise<void> => {
  try {
    const companyName = req.params.companyName as string;
    const { userId } = req.body;
    
    const startup = await prisma.startup.findFirst({ where: { companyName } });
    if (!startup) { res.status(404).json({ success: false, message: 'Startup not found' }); return; }

    const existing = await prisma.startupFollowsUser.findFirst({
      where: { startupId: startup.id, userId }
    });

    if (!existing) {
      await prisma.startupFollowsUser.create({
        data: { startupId: startup.id, userId }
      });
    }

    res.status(200).json({ success: true, message: 'Followed user' });
  } catch (err: any) {
    console.error('Follow Error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

app.post('/api/startup/network/:companyName/unfollow', async (req: Request, res: Response): Promise<void> => {
  try {
    const companyName = req.params.companyName as string;
    const { userId } = req.body;
    
    const startup = await prisma.startup.findFirst({ where: { companyName } });
    if (!startup) { res.status(404).json({ success: false, message: 'Startup not found' }); return; }

    await prisma.startupFollowsUser.deleteMany({
      where: { startupId: startup.id, userId }
    });

    res.status(200).json({ success: true, message: 'Unfollowed user' });
  } catch (err: any) {
    console.error('Unfollow Error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
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
    const { 
      title, location, type, salary, description, requirements, companyName,
      department, workMode, experience, education, openings, deadline, applicationMethod 
    } = req.body;

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
        // Force TS refresh
        department,
        workMode,
        experience,
        education,
        openings: String(openings || '1'),
        deadline,
        applicationMethod,
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
    const { 
      title, location, type, salary, description, requirements,
      department, workMode, experience, education, openings, deadline, applicationMethod, status
    } = req.body;

    const job = await prisma.job.update({
      where: { id: id as string },
      data: {
        title,
        location,
        type,
        salary,
        description,
        requirements: requirements || [],
        department,
        workMode,
        experience,
        education,
        openings: openings ? String(openings) : undefined,
        deadline,
        applicationMethod,
        ...(status ? { status } : {})
      }
    });

    res.status(200).json({ success: true, message: 'Job updated successfully', job });
  } catch (err) {
    console.error('Job update error:', err);
    res.status(500).json({ success: false, message: 'Server error updating job' });
  }
});

// Delete a Job
app.delete('/api/jobs/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if job exists
    const existingJob = await prisma.job.findUnique({
      where: { id: id as string }
    });

    if (!existingJob) {
      res.status(404).json({ success: false, message: 'Job not found' });
      return;
    }

    // Delete job (Prisma will automatically handle cascade deletion if set up, 
    // but if not, we might need to delete applications first depending on schema. 
    // Assuming Prisma schema handles it or we just delete the job).
    await prisma.job.delete({
      where: { id: id as string }
    });

    res.status(200).json({ success: true, message: 'Job deleted successfully' });
  } catch (err) {
    console.error('Job deletion error:', err);
    res.status(500).json({ success: false, message: 'Server error deleting job' });
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
          select: { companyName: true, profilePhoto: true, companyLogo: true }
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

// 11c-2. Get All Applications for a Student
app.get('/api/applications/user/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const applications = await prisma.application.findMany({
      where: { userId: userId as string },
      include: {
        job: {
          include: {
            startup: true
          }
        }
      },
      orderBy: { appliedAt: 'desc' }
    });

    res.status(200).json({ success: true, applications });
  } catch (err) {
    console.error('Error fetching applications for user:', err);
    res.status(500).json({ success: false, message: 'Server error fetching applications' });
  }
});
// 11d. Update Application Status
app.put('/api/applications/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, interviewDate, interviewTime } = req.body;
    const updatedApplication = await prisma.application.update({
      where: { id: id as string },
      data: { status, interviewDate, interviewTime }
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
      include: { 
        user: true, 
        startup: true,
        likes: { include: { user: true, startup: true } },
        comments: { include: { user: true, startup: true } },
        reposts: { include: { user: true, startup: true } },
        savedBy: { include: { user: true, startup: true } }
      } as any,
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
    let userId = null;
    let startupId = null;

    if (companyName) {
      const startup = await prisma.startup.findFirst({ where: { companyName } });
      if (startup) {
        startupId = startup.id;
      }
    } else if (email) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) userId = user.id;
    }
    
    if (!userId && !startupId) {
      res.status(400).json({ success: false, message: 'No valid user or startup found to post as.' });
      return;
    }

    let finalImageUrl = imageUrl;
    
    // Cloud setup: we will just store the base64 string directly in the database
    // instead of writing it to the local file system.

    const post = await prisma.post.create({
      data: {
        text,
        imageUrl: finalImageUrl,
        category: category || 'Project',
        userId: userId || undefined,
        startupId: startupId || undefined
      }
    });
    res.status(201).json({ success: true, post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error creating post' });
  }
});

app.post('/api/posts/:id/like', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { email, companyName } = req.body;
    if (!email && !companyName) { res.status(400).json({ success: false, message: 'Email or companyName required' }); return; }
    
    let userId = null;
    let startupId = null;

    if (email) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) userId = user.id;
    }
    
    if (!userId && companyName) {
      const startup = await prisma.startup.findFirst({ where: { companyName } });
      if (startup) startupId = startup.id;
    }

    if (!userId && !startupId) { res.status(404).json({ success: false, message: 'User or Startup not found' }); return; }

    // @ts-ignore
    const existingLike = await prisma.like.findFirst({
      where: { postId: id, OR: [ { userId: userId || undefined }, { startupId: startupId || undefined } ] }
    });

    if (existingLike) {
      // @ts-ignore
      await prisma.like.delete({ where: { id: existingLike.id } });
      res.status(200).json({ success: true, message: 'Unliked', liked: false });
    } else {
      // @ts-ignore
      await prisma.like.create({
        data: { postId: id, userId, startupId }
      });
      res.status(200).json({ success: true, message: 'Liked', liked: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error toggling like' });
  }
});

app.post('/api/posts/:id/repost', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { email, companyName } = req.body;
    if (!email && !companyName) { res.status(400).json({ success: false, message: 'Email or companyName required' }); return; }
    
    let userId = null;
    let startupId = null;

    if (email) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) userId = user.id;
    }
    
    if (!userId && companyName) {
      const startup = await prisma.startup.findFirst({ where: { companyName } });
      if (startup) startupId = startup.id;
    }

    if (!userId && !startupId) { res.status(404).json({ success: false, message: 'User or Startup not found' }); return; }

    // @ts-ignore
    const existingRepost = await prisma.repost.findFirst({
      where: { postId: id, OR: [ { userId: userId || undefined }, { startupId: startupId || undefined } ] }
    });

    if (existingRepost) {
      // @ts-ignore
      await prisma.repost.delete({ where: { id: existingRepost.id } });
      res.status(200).json({ success: true, message: 'Unreposted', reposted: false });
    } else {
      // @ts-ignore
      await prisma.repost.create({
        data: { postId: id, userId, startupId }
      });
      res.status(200).json({ success: true, message: 'Reposted', reposted: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error toggling repost' });
  }
});

app.post('/api/posts/:id/save', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { email, companyName } = req.body;
    if (!email && !companyName) { res.status(400).json({ success: false, message: 'Email or companyName required' }); return; }
    
    let userId = null;
    let startupId = null;

    if (email) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) userId = user.id;
    }
    
    if (!userId && companyName) {
      const startup = await prisma.startup.findFirst({ where: { companyName } });
      if (startup) startupId = startup.id;
    }

    if (!userId && !startupId) { res.status(404).json({ success: false, message: 'User or Startup not found' }); return; }

    // @ts-ignore
    const existingSave = await prisma.savedPost.findFirst({
      where: { postId: id, OR: [ { userId: userId || undefined }, { startupId: startupId || undefined } ] }
    });

    if (existingSave) {
      // @ts-ignore
      await prisma.savedPost.delete({ where: { id: existingSave.id } });
      res.status(200).json({ success: true, message: 'Unsaved', saved: false });
    } else {
      // @ts-ignore
      await prisma.savedPost.create({
        data: { postId: id, userId, startupId }
      });
      res.status(200).json({ success: true, message: 'Saved', saved: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error toggling save' });
  }
});

app.get('/api/posts/saved/:identifier', async (req: Request, res: Response): Promise<void> => {
  try {
    const identifier = req.params.identifier as string; // can be email or companyName
    const type = req.query.type as string; // 'student' or 'startup'
    
    let userId = null;
    let startupId = null;

    if (type === 'startup') {
      const startup = await prisma.startup.findFirst({ where: { companyName: identifier } });
      if (startup) startupId = startup.id;
    } else {
      const user = await prisma.user.findUnique({ where: { email: identifier } });
      if (user) userId = user.id;
    }

    if (!userId && !startupId) { res.status(404).json({ success: false, message: 'User or Startup not found' }); return; }

    // @ts-ignore
    const savedPostsRelations = await prisma.savedPost.findMany({
      where: { OR: [ { userId: userId || undefined }, { startupId: startupId || undefined } ] },
      include: {
        post: {
          include: { 
            user: true, 
            startup: true,
            likes: { include: { user: true, startup: true } },
            comments: { include: { user: true, startup: true } },
            reposts: { include: { user: true, startup: true } },
            savedBy: { include: { user: true, startup: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const posts = savedPostsRelations.map((sp: any) => sp.post);
    res.status(200).json({ success: true, posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching saved posts' });
  }
});

app.post('/api/posts/:id/comment', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { text, email, companyName } = req.body;
    if (!text || (!email && !companyName)) { res.status(400).json({ success: false, message: 'Text and email or companyName required' }); return; }
    
    let userId = null;
    let startupId = null;

    if (email) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) userId = user.id;
    }
    
    if (!userId && companyName) {
      const startup = await prisma.startup.findFirst({ where: { companyName } });
      if (startup) startupId = startup.id;
    }

    if (!userId && !startupId) { res.status(404).json({ success: false, message: 'User or Startup not found' }); return; }

    // @ts-ignore
    const comment = await prisma.comment.create({
      data: { text, postId: id, userId, startupId }
    });
    
    // @ts-ignore
    const populatedComment = await prisma.comment.findUnique({
      where: { id: comment.id },
      include: { user: true, startup: true }
    });
    
    res.status(201).json({ success: true, comment: populatedComment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error creating comment' });
  }
});

// ─── Assessment Routes ────────────────────────────────────────────────────────
// Create Assessment
app.post('/api/assessments', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startupId, jobId, title, description, selectedRounds, selectedCandidates, mcqConfig, codingConfig, interviewConfig } = req.body;
    if (!startupId || !title) {
      res.status(400).json({ success: false, message: 'startupId/companyName and title are required' });
      return;
    }
    
    // The frontend currently sends companyName in the startupId field. Let's look up the actual startup.
    let actualStartupId = startupId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(startupId);
    
    const startup = await prisma.startup.findFirst({
      where: {
        OR: [
          ...(isUuid ? [{ id: startupId }] : []),
          { companyName: startupId }
        ]
      }
    });

    if (startup) {
      actualStartupId = startup.id;
    } else {
      res.status(404).json({ success: false, message: 'Startup not found' });
      return;
    }

    const assessment = await prisma.assessment.create({
      data: {
        startupId: actualStartupId,
        jobId: jobId || null,
        title,
        description,
        selectedRounds,
        assignedCandidates: selectedCandidates || [],
        mcqConfig,
        codingConfig,
        interviewConfig
      }
    });
    if (selectedCandidates && selectedCandidates.length > 0) {
      await prisma.application.updateMany({
        where: { id: { in: selectedCandidates } },
        data: { status: 'ASSESSMENT SCHEDULED' }
      });
    }
    
    res.status(201).json({ success: true, assessment });
  } catch (error) {
    console.error('Error creating assessment:', error);
    res.status(500).json({ success: false, message: 'Server error creating assessment' });
  }
});

// Get Assessments by User
app.get('/api/assessments/user/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;
    
    // Fetch user to get email for broader application matching
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Get all application IDs for this user by ID or Email
    const applications = await prisma.application.findMany({
      where: { 
        OR: [
          { userId },
          { email: user.email }
        ]
      }
    });
    const appIds = applications.map(a => a.id);
    
    console.log(`[API] Fetching assessments for user ${userId}`);
    console.log(`[API] User Applications:`, appIds);

    // Find assessments where assignedCandidates array overlaps with user's application IDs
    const assessments = await prisma.assessment.findMany({
      where: {
        assignedCandidates: { hasSome: appIds }
      },
      include: {
        startup: true,
        job: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.status(200).json({ success: true, assessments });
  } catch (error) {
    console.error('Error fetching user assessments:', error);
    res.status(500).json({ success: false, message: 'Server error fetching user assessments' });
  }
});

// Get Single Assessment by ID
app.get('/api/assessments/single/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        startup: true,
        job: true
      }
    });
    
    if (!assessment) {
      res.status(404).json({ success: false, message: 'Assessment not found' });
      return;
    }
    
    res.status(200).json({ success: true, assessment });
  } catch (error) {
    console.error('Error fetching single assessment:', error);
    res.status(500).json({ success: false, message: 'Server error fetching assessment' });
  }
});

// Get Assessments by Startup
app.get('/api/assessments/:startupId', async (req: Request, res: Response): Promise<void> => {
  try {
    const startupId = req.params.startupId as string;
    
    // The frontend currently sends companyName in the startupId field. Let's look up the actual startup.
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(startupId);

    const startup = await prisma.startup.findFirst({
      where: {
        OR: [
          ...(isUuid ? [{ id: startupId }] : []),
          { companyName: startupId }
        ]
      }
    });

    if (!startup) {
      res.status(404).json({ success: false, message: 'Startup not found' });
      return;
    }

    const assessments = await prisma.assessment.findMany({
      where: { startupId: startup.id },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, assessments });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ success: false, message: 'Server error fetching assessments' });
  }
});


// Create or Update Assessment Result
app.post('/api/assessment-results', async (req: Request, res: Response): Promise<void> => {
  try {
    const { assessmentId, userId, jobId, roundType, score, status, details } = req.body;
    
    // Check if result already exists
    const existing = await prisma.assessmentResult.findFirst({
      where: { assessmentId, userId, roundType }
    });

    if (existing) {
      const updated = await prisma.assessmentResult.update({
        where: { id: existing.id },
        data: { score, status, details, completedAt: new Date() }
      });
      res.status(200).json({ success: true, result: updated });
    } else {
      const result = await prisma.assessmentResult.create({
        data: {
          assessmentId,
          userId,
          jobId,
          roundType,
          score,
          status,
          details,
          completedAt: new Date()
        } as any
      });
      res.status(201).json({ success: true, result });
    }
  } catch (error) {
    console.error('Error saving assessment result:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get Assessment Results for User and Job
app.get('/api/assessment-results/:userId/:jobId', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;
    const jobId = req.params.jobId as string;
    const results = await prisma.assessmentResult.findMany({
      where: { userId, jobId },
      orderBy: { createdAt: 'asc' }
    });
    res.status(200).json({ success: true, results });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── Job Saving & My Jobs Routes ─────────────────────────────────────────────
app.post('/api/jobs/:id/save', async (req: Request, res: Response): Promise<void> => {
  try {
    const jobId = req.params.id as string;
    const { email } = req.body;
    
    if (!email) {
      res.status(400).json({ success: false, message: 'Email required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // @ts-ignore
    const existingSave = await prisma.savedJob.findUnique({
      where: {
        jobId_userId: { jobId, userId: user.id }
      }
    });

    if (existingSave) {
      // @ts-ignore
      await prisma.savedJob.delete({ where: { id: existingSave.id } });
      res.status(200).json({ success: true, message: 'Job Unsaved', saved: false });
    } else {
      // @ts-ignore
      await prisma.savedJob.create({
        data: { jobId, userId: user.id }
      });
      res.status(200).json({ success: true, message: 'Job Saved', saved: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error toggling save job' });
  }
});

app.get('/api/jobs/my-jobs/:identifier', async (req: Request, res: Response): Promise<void> => {
  try {
    const identifier = req.params.identifier as string;
    
    const user = await prisma.user.findUnique({ where: { email: identifier } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // @ts-ignore
    const savedJobsRelations = await prisma.savedJob.findMany({
      where: { userId: user.id },
      include: {
        job: {
          include: { startup: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const applications = await prisma.application.findMany({
      where: { userId: user.id },
      include: {
        job: {
          include: { startup: true }
        }
      },
      orderBy: { appliedAt: 'desc' }
    });

    res.status(200).json({ 
      success: true, 
      savedJobs: savedJobsRelations.map((sj: any) => sj.job),
      applications
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching my jobs' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Thodakkam backend server running on http://localhost:${PORT}`);
});
