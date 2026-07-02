import express, { Request, Response } from 'express';

const router = express.Router();

const startupUser = {
  id: 1,
  founderName: 'Demo Founder',
  founder_name: 'Demo Founder',
  companyName: 'Demo Startup Labs',
  company_name: 'Demo Startup Labs',
  email: 'startup.demo@example.com',
  category: 'Technology',
  status: 'ACTIVE',
  avatar: '',
  timezone: '(GMT+05:30) India Standard Time',
  bio: 'Demo startup account running in mock mode.',
};

const MOCK_STARTUP_PASSWORD = 'Demo@1234';

const jobs = [
  {
    id: 101,
    title: 'Frontend Developer Intern',
    department: 'Engineering',
    emp_type: 'Internship',
    location: 'Remote',
    salary_min: 15000,
    salary_max: 25000,
    description: 'Build and improve candidate-facing web experiences.',
    remote: true,
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: 102,
    title: 'Backend Developer Intern',
    department: 'Engineering',
    emp_type: 'Internship',
    location: 'Chennai',
    salary_min: 18000,
    salary_max: 28000,
    description: 'Work on APIs, integrations, and data pipelines.',
    remote: false,
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: 103,
    title: 'Product Analyst Intern',
    department: 'Product',
    emp_type: 'Internship',
    location: 'Hybrid',
    salary_min: 12000,
    salary_max: 20000,
    description: 'Analyze product metrics and support roadmap decisions.',
    remote: true,
    status: 'draft',
    created_at: new Date().toISOString(),
  },
];

const applications = [
  {
    id: 201,
    job_id: 101,
    candidate_name: 'Sanjay K',
    role_applied: 'Frontend Developer Intern',
    status: 'reviewing',
    match_score: 82,
    applied_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Chennai',
    skills: ['React', 'TypeScript', 'CSS'],
    student_id: 501,
  },
  {
    id: 202,
    job_id: 102,
    candidate_name: 'Deepti N',
    role_applied: 'Backend Developer Intern',
    status: 'shortlisted',
    match_score: 88,
    applied_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Bengaluru',
    skills: ['Node.js', 'PostgreSQL', 'Express'],
    student_id: 502,
  },
  {
    id: 203,
    job_id: 101,
    candidate_name: 'Arun M',
    role_applied: 'Frontend Developer Intern',
    status: 'interview_scheduled',
    match_score: 91,
    applied_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Remote',
    skills: ['React', 'Figma', 'JavaScript'],
    student_id: 503,
  },
  {
    id: 204,
    job_id: 103,
    candidate_name: 'Lavanya S',
    role_applied: 'Product Analyst Intern',
    status: 'new',
    match_score: 74,
    applied_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Coimbatore',
    skills: ['Excel', 'SQL', 'Communication'],
    student_id: 504,
  },
];

let messages = [
  {
    id: 1,
    conversation_id: '1_student_501',
    sender_id: 1,
    sender_type: 'startup',
    receiver_id: 501,
    receiver_type: 'student',
    content: 'Hi Sanjay, thanks for applying. Can we connect for a quick screening call?',
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    status: 'sent',
  },
  {
    id: 2,
    conversation_id: '1_student_501',
    sender_id: 501,
    sender_type: 'student',
    receiver_id: 1,
    receiver_type: 'startup',
    content: 'Sure! I am available tomorrow after 11 AM.',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    status: 'delivered',
  },
];

let posts = [
  {
    id: 1,
    author_id: 1,
    author_name: startupUser.company_name,
    author_role: 'Startup',
    author_avatar: '',
    author_type: 'startup',
    content: 'We are hiring frontend and backend interns for Summer 2026.',
    tags: ['hiring', 'internship'],
    likes_count: 12,
    comments_count: 4,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
];

const students = [
  { id: 501, name: 'Sanjay K', email: 'sanjay@student.demo', profile_photo: '' },
  { id: 502, name: 'Deepti N', email: 'deepti@student.demo', profile_photo: '' },
  { id: 503, name: 'Arun M', email: 'arun@student.demo', profile_photo: '' },
  { id: 504, name: 'Lavanya S', email: 'lavanya@student.demo', profile_photo: '' },
];

const interviews = [
  {
    id: 301,
    application_id: 203,
    candidate_name: 'Arun M',
    role_applied: 'Frontend Developer Intern',
    status: 'scheduled',
    platform: 'Google Meet',
    scheduled_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    time_slot: '11:00 AM',
  },
];

const mockAssessments = [
  {
    id: 1,
    title: 'Frontend Technical Assessment',
    description: 'A comprehensive test covering React basics, CSS layout, and JavaScript internals.',
    startup_name: 'Demo Startup Labs',
    startup_id: 1,
    status: 'assigned',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    total_rounds: 3,
    rounds: [
      { type: 'mcq', name: 'Frontend Basics MCQ', duration: 20 },
      { type: 'coding', name: 'React Component Task', duration: 45 },
      { type: 'interview', name: 'Technical Discussion', duration: 30 }
    ],
    created_at: new Date().toISOString()
  }
];

const candidateAssessments = [
  {
    id: 1,
    assessment_id: 1,
    student_id: 501,
    status: 'pending',
    current_round: 1,
    created_at: new Date().toISOString()
  }
];

const getCountsByStatus = (items) => {
  const counts = {};
  items.forEach((item) => {
    counts[item.status] = (counts[item.status] || 0) + 1;
  });
  return Object.keys(counts).map((status) => ({ status, count: counts[status] }));
};

router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', database: 'mock', mockMode: true, timestamp: new Date().toISOString() });
});

router.post('/startup/auth/register', (req: Request, res: Response) => {
  res.status(201).json({ success: true, message: 'Registered (mock mode). Please verify your email.', email: req.body?.email || startupUser.email });
});

router.post('/startup/auth/verify-otp', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Email verified (mock mode).',
    user: startupUser,
  });
});

router.post('/startup/auth/resend-otp', (req: Request, res: Response) => {
  res.json({ success: true, message: 'OTP resent (mock mode).' });
});

router.post('/startup/auth/forgot-password/request-otp', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Password reset OTP sent (mock mode).' });
});

router.post('/startup/auth/forgot-password/reset', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Password reset successful (mock mode).' });
});

router.post('/startup/auth/login', (req: Request, res: Response) => {
  const email = String(req.body?.email || '').toLowerCase();
  const password = String(req.body?.password || '');

  if (email !== startupUser.email.toLowerCase() || password !== MOCK_STARTUP_PASSWORD) {
    return res.status(401).json({ success: false, message: 'Invalid credentials (mock mode).' });
  }

  res.json({
    success: true,
    token: 'mock-startup-token',
    user: startupUser,
  });
});

router.get('/startup/auth/me', (req: Request, res: Response) => {
  res.json({ success: true, user: startupUser });
});

router.put('/startup/auth/me', (req: Request, res: Response) => {
  const founderName = req.body?.founderName || startupUser.founderName;
  const email = req.body?.email || startupUser.email;
  startupUser.founderName = founderName;
  startupUser.founder_name = founderName;
  startupUser.email = email;
  res.json({ success: true, message: 'Profile updated (mock mode).', user: startupUser });
});

router.get('/startup/dashboard', (req: Request, res: Response) => {
  res.json({
    stats: {
      totalHires: 14,
      openRoles: jobs.filter((j) => j.status === 'active').length,
      newApps: applications.filter((a) => a.status === 'new').length,
      interviewRate: 68,
    },
    recentActivity: [
      { id: 1, title: 'New application received', subtitle: 'Sanjay K applied for Frontend Developer Intern', time: '2h ago' },
      { id: 2, title: 'Interview scheduled', subtitle: 'Arun M interview set for Friday', time: '5h ago' },
    ],
    candidateGrowth: [
      { label: 'Mon', value: 3 },
      { label: 'Tue', value: 5 },
      { label: 'Wed', value: 4 },
      { label: 'Thu', value: 7 },
      { label: 'Fri', value: 6 },
      { label: 'Sat', value: 2 },
      { label: 'Sun', value: 4 },
    ],
    departmentDistribution: [
      { name: 'Engineering', value: 62 },
      { name: 'Product', value: 21 },
      { name: 'Design', value: 17 },
    ],
  });
});

router.get('/startup/jobs', (req: Request, res: Response) => {
  const status = req.query.status;
  const scoped = status ? jobs.filter((j) => j.status === status) : jobs;
  res.json({ jobs: scoped, counts: getCountsByStatus(jobs) });
});

router.get('/startup/jobs/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const job = jobs.find((j) => j.id === id) || null;
  if (!job) return res.status(404).json({ success: false, message: 'Job not found (mock mode).' });
  return res.json({ success: true, job });
});

router.post('/startup/jobs', (req: Request, res: Response) => {
  const nextId = jobs.reduce((max, item) => Math.max(max, item.id), 100) + 1;
  const newJob = {
    id: nextId,
    title: req.body?.title || 'Untitled Role',
    department: req.body?.department || 'Engineering',
    emp_type: req.body?.empType || req.body?.emp_type || 'Internship',
    location: req.body?.location || 'Remote',
    salary_min: Number(req.body?.salMin || req.body?.salary_min || 0),
    salary_max: Number(req.body?.salMax || req.body?.salary_max || 0),
    description: req.body?.description || '',
    remote: Boolean(req.body?.remote),
    status: req.body?.status || 'active',
    created_at: new Date().toISOString(),
  };
  jobs.unshift(newJob);
  res.status(201).json({ success: true, message: 'Job created (mock mode).', job: newJob });
});

router.put('/startup/jobs/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const idx = jobs.findIndex((j) => j.id === id);
  if (idx < 0) return res.status(404).json({ success: false, message: 'Job not found (mock mode).' });
  jobs[idx] = { ...jobs[idx], ...req.body, updated_at: new Date().toISOString() };
  return res.json({ success: true, message: 'Job updated (mock mode).', job: jobs[idx] });
});

router.patch('/startup/jobs/:id/status', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const idx = jobs.findIndex((j) => j.id === id);
  if (idx < 0) return res.status(404).json({ success: false, message: 'Job not found (mock mode).' });
  jobs[idx].status = req.body?.status || jobs[idx].status;
  return res.json({ success: true, message: 'Job status updated (mock mode).', job: jobs[idx] });
});

router.delete('/startup/jobs/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const idx = jobs.findIndex((j) => j.id === id);
  if (idx < 0) return res.status(404).json({ success: false, message: 'Job not found (mock mode).' });
  jobs.splice(idx, 1);
  return res.json({ success: true, message: 'Job deleted (mock mode).' });
});

router.get('/startup/applications', (req: Request, res: Response) => {
  const status = req.query.status;
  const jobId = req.query.jobId ? Number(req.query.jobId) : null;

  let scoped = [...applications];
  if (status) scoped = scoped.filter((a) => a.status === status);
  if (jobId) scoped = scoped.filter((a) => Number(a.job_id) === jobId);

  return res.json({ applications: scoped, counts: getCountsByStatus(applications) });
});

router.patch('/startup/applications/:id/status', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const idx = applications.findIndex((a) => a.id === id);
  if (idx < 0) return res.status(404).json({ success: false, message: 'Application not found (mock mode).' });
  applications[idx].status = req.body?.status || applications[idx].status;
  return res.json({ success: true, message: 'Application status updated (mock mode).', application: applications[idx] });
});

router.get('/startup/interviews', (req: Request, res: Response) => {
  return res.json({ success: true, interviews });
});

router.get('/startup/interviews/student/:studentId', (req: Request, res: Response) => {
  const studentId = Number(req.params.studentId);
  const rows = interviews
    .filter((interview) => {
      const app = applications.find((a) => a.id === interview.application_id);
      return app && Number(app.student_id) === studentId;
    })
    .map((interview) => ({
      ...interview,
      candidate_name: applications.find((a) => a.id === interview.application_id)?.candidate_name || 'Candidate',
    }));

  return res.json({ success: true, interviews: rows });
});

router.post(['/startup/interviews', '/startup/interviews/schedule'], (req: Request, res: Response) => {
  const nextId = interviews.reduce((max, item) => Math.max(max, item.id), 300) + 1;
  const applicationId = req.body?.applicationId || req.body?.application_id;
  const app = applications.find((a) => String(a.id) === String(applicationId));

  const interview = {
    id: nextId,
    application_id: applicationId,
    candidate_name: app?.candidate_name || 'Candidate',
    role_applied: app?.role_applied || 'Role',
    status: 'scheduled',
    platform: req.body?.platform || 'Google Meet',
    scheduled_date: req.body?.scheduledDate || req.body?.scheduledDateTime?.slice(0, 10) || new Date().toISOString(),
    time_slot: req.body?.timeSlot || '11:00 AM',
  };

  interviews.unshift(interview);

  if (app) {
    app.status = 'interview_scheduled';
  }

  return res.status(201).json({ success: true, message: 'Interview scheduled (mock mode).', interview });
});

router.post(['/assessments/assign', '/startup/assessments/assign', '/startup/assessments/:id/assign'], (req: Request, res: Response) => {
  const { studentId, jobId, assessmentId } = req.body;
  const finalAssessmentId = Number(assessmentId || req.params.id);
  
  const nextId = candidateAssessments.length + 1;
  const newAssignment = {
    id: nextId,
    assessment_id: finalAssessmentId,
    student_id: Number(studentId),
    status: 'pending',
    current_round: 1,
    created_at: new Date().toISOString()
  };
  
  candidateAssessments.unshift(newAssignment);
  return res.status(201).json({ success: true, message: 'Assessment assigned (mock mode).', candidateAssessment: newAssignment });
});

router.get(['/student/assessments', '/students/assessments'], (req: Request, res: Response) => {
  // In mock mode, we'll return assessments for demo student 501
  const studentId = 501; 
  const studentAssigned = candidateAssessments.filter(ca => ca.student_id === studentId);
  
  const result = studentAssigned.map(ca => {
    const assessment = mockAssessments.find(a => a.id === ca.assessment_id);
    return {
      ...assessment,
      ...ca,
      id: assessment?.id || ca.assessment_id,
      candidate_assessment_id: ca.id
    };
  });
  
  return res.json({ success: true, assessments: result });
});

router.get('/students/search', (req: Request, res: Response) => {
  const query = String(req.query.query || '').toLowerCase();
  const filtered = !query
    ? students
    : students.filter((s) => s.name.toLowerCase().includes(query) || s.email.toLowerCase().includes(query));

  return res.json(filtered);
});

router.get('/messages/conversations', (req: Request, res: Response) => {
  const mapped = students.map((s) => {
    const convoId = `1_student_${s.id}`;
    const convoMessages = messages.filter((m) => m.conversation_id === convoId);
    const latest = convoMessages[convoMessages.length - 1];
    return {
      conversation_id: convoId,
      other_user_id: s.id,
      other_user_type: 'student',
      other_user_name: s.name,
      other_user_avatar: s.profile_photo,
      last_message: latest?.content || '',
      last_message_time: latest?.created_at || new Date().toISOString(),
      unread_count: 0,
      is_online: true,
    };
  });

  return res.json(mapped);
});

router.get('/messages/:otherUserId', (req: Request, res: Response) => {
  const otherUserId = Number(req.params.otherUserId);
  const convoId = `1_student_${otherUserId}`;
  const rows = messages.filter((m) => m.conversation_id === convoId);
  return res.json(rows);
});

router.post('/messages', (req: Request, res: Response) => {
  const receiverId = Number(req.body?.receiverId);
  const receiverType = req.body?.receiverType || 'student';
  const convoId = `1_${receiverType}_${receiverId}`;
  const nextId = messages.reduce((max, m) => Math.max(max, Number(m.id)), 0) + 1;

  const newMessage = {
    id: nextId,
    conversation_id: convoId,
    sender_id: 1,
    sender_type: 'startup',
    receiver_id: receiverId,
    receiver_type: receiverType,
    content: req.body?.content || '',
    created_at: new Date().toISOString(),
    status: 'sent',
  };

  messages.push(newMessage);
  return res.status(201).json(newMessage);
});

router.post('/messages/file', (req: Request, res: Response) => {
  const nextId = messages.reduce((max, m) => Math.max(max, Number(m.id)), 0) + 1;
  const newMessage = {
    id: nextId,
    conversation_id: '1_student_501',
    sender_id: 1,
    sender_type: 'startup',
    receiver_id: 501,
    receiver_type: 'student',
    content: 'Shared a file (mock mode)',
    file_url: '/uploads/mock-file.txt',
    created_at: new Date().toISOString(),
    status: 'sent',
  };

  messages.push(newMessage);
  return res.status(201).json(newMessage);
});

router.put('/messages/delivered/:messageId', (req: Request, res: Response) => {
  return res.json({ success: true, message: 'Delivered updated (mock mode).' });
});

router.put('/messages/seen/:conversationId', (req: Request, res: Response) => {
  return res.json({ success: true, message: 'Seen updated (mock mode).' });
});

router.put('/messages/unsend/:messageId', (req: Request, res: Response) => {
  return res.json({ success: true, message: 'Message unsent (mock mode).' });
});

router.put('/messages/delete/:messageId', (req: Request, res: Response) => {
  return res.json({ success: true, message: 'Message deleted (mock mode).' });
});

router.put('/messages/edit/:messageId', (req: Request, res: Response) => {
  return res.json({ success: true, message: 'Message edited (mock mode).', content: req.body?.content || '' });
});

router.get('/community/posts', (req: Request, res: Response) => {
  return res.json(posts);
});

router.post('/community/posts', (req: Request, res: Response) => {
  const nextId = posts.reduce((max, p) => Math.max(max, Number(p.id)), 0) + 1;
  const newPost = {
    id: nextId,
    author_id: 1,
    author_name: startupUser.company_name,
    author_role: 'Startup',
    author_avatar: '',
    author_type: 'startup',
    content: req.body?.content || '',
    tags: Array.isArray(req.body?.tags) ? req.body.tags : [],
    likes_count: 0,
    comments_count: 0,
    created_at: new Date().toISOString(),
  };

  posts.unshift(newPost);
  return res.status(201).json(newPost);
});

router.post('/community/posts/:id/like', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const post = posts.find((p) => p.id === id);
  if (!post) return res.status(404).json({ message: 'Post not found (mock mode).' });
  post.likes_count += 1;
  return res.json({ likes_count: post.likes_count });
});

router.post('/aichat/message', (req: Request, res: Response) => {
  return res.json({
    success: true,
    response: 'Mock AI response: your request has been processed in demo mode.',
    text: 'Mock AI response: your request has been processed in demo mode.',
  });
});

router.get('/aichat/history/:studentId', (req: Request, res: Response) => {
  return res.json({ success: true, history: [] });
});

router.post('/students/login', (req: Request, res: Response) => {
  return res.json({
    success: true,
    token: 'mock-student-token',
    student: {
      id: 501,
      name: 'Sanjay K',
      email: 'sanjay@student.demo',
      profile_photo: '',
    },
  });
});

router.post('/students/register', (req: Request, res: Response) => {
  return res.status(201).json({ success: true, message: 'Student registered (mock mode).' });
});

router.get('/students/:studentId/dashboard', (req: Request, res: Response) => {
  return res.json({
    success: true,
    data: {
      stats: { applied: 8, shortlisted: 3, interviews: 2 },
      recommendations: jobs.map((j) => ({ id: j.id, title: j.title, company: startupUser.company_name, location: j.location })),
    },
  });
});

router.get('/students/:studentId/notifications', (req: Request, res: Response) => {
  return res.json({ notifications: [] });
});

router.patch('/students/notifications/:id/read', (req: Request, res: Response) => {
  return res.json({ success: true });
});

router.patch('/students/:studentId/notifications/read-all', (req: Request, res: Response) => {
  return res.json({ success: true });
});

export default router;
