import { Router, Request, Response } from "express";

const router = Router();

const mockCourses = [
  {
    id: 'web-dev',
    title: 'Web Development',
    description: 'Master HTML, CSS, JavaScript & modern frameworks',
    level: 'Beginner to Advanced',
    hours: 48,
    students: 12400,
    rating: 4.8,
    progress: 0,
    topics: 5,
    themeColor: '#7c3aed', // Purple
    icon: 'Code',
  },
  {
    id: 'full-stack',
    title: 'Full Stack Development',
    description: 'Build complete apps with React, Node.js & databases',
    level: 'Intermediate',
    hours: 72,
    students: 9800,
    rating: 4.9,
    progress: 0,
    topics: 4,
    themeColor: '#10b981', // Green
    icon: 'Layers',
  },
  {
    id: 'ui-ux',
    title: 'UI/UX Design',
    description: 'Design stunning interfaces and exceptional user experiences',
    level: 'Beginner to Intermediate',
    hours: 36,
    students: 15600,
    rating: 4.7,
    progress: 0,
    topics: 3,
    themeColor: '#f97316', // Orange
    icon: 'Palette',
  }
];

const mockStats = {
  courses: 3,
  students: '37K+',
  contentHours: 156
};

// GET /api/practice/learning-path
router.get("/learning-path", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      stats: mockStats,
      courses: mockCourses
    }
  });
});

const mockDetailedCourses: Record<string, any> = {
  'web-dev': {
    ...mockCourses[0],
    originalPrice: 999,
    discountedPrice: 499,
    benefits: [
      { id: '1', title: 'Lifetime Access', subtitle: 'Learn at your own pace, forever', icon: 'Infinity' },
      { id: '2', title: 'Structured Modules', subtitle: '5 modules with guided topics', icon: 'BookOpen' },
      { id: '3', title: 'Verified Certificate', subtitle: 'Industry-recognized credential', icon: 'Award' },
      { id: '4', title: 'MCQ Assessments', subtitle: 'Test your knowledge at every step', icon: 'ShieldCheck' }
    ],
    features: {
      courseAccess: 'Lifetime',
      assessments: 'Included',
      certificate: 'Verified',
      updates: 'Free Forever'
    }
  },
  'full-stack': {
    ...mockCourses[1],
    originalPrice: 999,
    discountedPrice: 499,
    benefits: [
      { id: '1', title: 'Lifetime Access', subtitle: 'Learn at your own pace, forever', icon: 'Infinity' },
      { id: '2', title: 'Structured Modules', subtitle: '4 modules with guided topics', icon: 'BookOpen' },
      { id: '3', title: 'Verified Certificate', subtitle: 'Industry-recognized credential', icon: 'Award' },
      { id: '4', title: 'MCQ Assessments', subtitle: 'Test your knowledge at every step', icon: 'ShieldCheck' }
    ],
    features: {
      courseAccess: 'Lifetime',
      assessments: 'Included',
      certificate: 'Verified',
      updates: 'Free Forever'
    }
  },
  'ui-ux': {
    ...mockCourses[2],
    originalPrice: 999,
    discountedPrice: 499,
    benefits: [
      { id: '1', title: 'Lifetime Access', subtitle: 'Learn at your own pace, forever', icon: 'Infinity' },
      { id: '2', title: 'Structured Modules', subtitle: '3 modules with guided topics', icon: 'BookOpen' },
      { id: '3', title: 'Verified Certificate', subtitle: 'Industry-recognized credential', icon: 'Award' },
      { id: '4', title: 'MCQ Assessments', subtitle: 'Test your knowledge at every step', icon: 'ShieldCheck' }
    ],
    features: {
      courseAccess: 'Lifetime',
      assessments: 'Included',
      certificate: 'Verified',
      updates: 'Free Forever'
    }
  }
};

// GET /api/practice/course/:id
router.get("/course/:id", (req: Request, res: Response) => {
  const courseId = req.params.id as string;
  const course = mockDetailedCourses[courseId];
  
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  res.status(200).json({
    success: true,
    data: course
  });
});

export default router;
