# Thodakkam – Mobile Application

A comprehensive mobile platform that connects job seekers with opportunities through skill-based matching and personalized guidance. Built with React Native and Expo.

## 🚀 Live Demo

Visit the live application:
[https://thodakkam.vercel.app](https://thodakkam.vercel.app) *(Note: Web deployment of the Expo app)*

## 🛠️ Tech Stack

### Frontend
- **Framework:** React Native & Expo (Expo Router)
- **Language:** TypeScript
- **Styling:** React Native StyleSheet
- **Icons:** lucide-react-native
- **Navigation:** Expo Router (File-based navigation)
- **Image Picker:** expo-image-picker
- **Build System:** Expo EAS

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL (via Prisma)
- **Authentication:** JWT (json-web-token)
- **Email:** Nodemailer
- **File Uploads:** Multer

## 📂 Project Structure

```
thodakkam-server/
├── src/
│   ├── controllers/      # Request handlers & business logic
│   ├── routes/          # API route definitions
│   ├── middlewares/     # Authentication, error handling
│   └── utils/           # Helpers, email clients, JWT utils
├── prisma/              # Database models & migrations
├── uploads/             # User-uploaded files (optional)
└── package.json         # Dependencies

thodakkam-app/              # React Native / Expo frontend
├── src/                 
│   ├── app/             # Expo Router Pages (screens like startup-community.tsx, student-dashboard.tsx)
│   ├── components/      # Reusable UI components (StudentHeader, StartupHeader, etc.)
│   └── utils/           # Utility functions (userStore, etc.)
├── assets/              # Static assets and images
├── app.json             # Expo configuration
└── package.json         # Dependencies
```

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (16 or higher)
- PostgreSQL database
- Email service credentials (for testing)

### 1. Backend Setup

```bash
# Clone repository
git clone <repository-url>
cd thodakkam-server

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database URL, JWT secret, email config, etc.

# Generate Prisma client
npm run prisma:generate

# Run migrations (if any)
npm run prisma:migrate

# Start server
npm start
```

### 2. Frontend Setup

```bash
# Open a new terminal
cd ../app

# Install dependencies
npm install

# Configure environment variables
cp .env.local .env.local
# Edit .env.local with backend URL (e.g., http://localhost:5000)

# Start development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## 🔐 Authentication

### Routes
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login
- POST `/api/auth/logout` - Logout
- POST `/api/auth/reset-password` - Password reset
- GET `/api/auth/me` - Get current user profile

### Authorization
Authenticated routes require a valid JWT token in the `Authorization: Bearer <token>` header.

## 📚 User Documentation

### Landing Page
Public pages accessible without login:
- Home - Introduction and features
- For Students - Guidance and opportunities
- For Job Seekers - Resume building and job matching
- Contact - Contact form and support

### Authenticated Features

#### Dashboard
- Quick stats and insights
- Personalized recommendations
- Navigation to key features

#### Guidance
- Career guidance tools
- AI-powered suggestions
- Learning paths

#### Jobs
- Browse and search job listings
- Application tracking
- Job recommendations

#### Profile
- View and edit personal information
- Upload resume and profile picture
- Manage skills and experience

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user profile

### Jobs
- `GET /api/jobs` - List jobs
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs` - Create job (admin)
- `PUT /api/jobs/:id` - Update job (admin)
- `DELETE /api/jobs/:id` - Delete job (admin)

### Applications
- `GET /api/applications` - List applications
- `GET /api/applications/:id` - Get application details
- `POST /api/applications` - Apply for job
- `PUT /api/applications/:id` - Update application status
- `DELETE /api/applications/:id` - Delete application

### Guidance
- `GET /api/guidance` - List guidance plans
- `GET /api/guidance/:id` - Get guidance plan details
- `POST /api/guidance` - Purchase guidance (user)
- `GET /api/guidance/my-plan` - Get current user's guidance

### Profile
- `GET /api/profile/:userId` - Get user profile
- `PUT /api/profile/:userId` - Update user profile
- `POST /api/profile/upload/resume` - Upload resume
- `POST /api/profile/upload/photo` - Upload profile photo

## 🧪 Testing

### Run Frontend Tests
```bash
cd ../app
npm test
```

### Run Backend Tests
```bash
cd thodakkam-server
npm test
```

## 📝 Database

### Prisma Models
- **User** - System users with comprehensive profile
- **Job** - Job postings
- **Application** - Job applications
- **GuidancePlan** - Career guidance plans
- **Notification** - System notifications

### Running Migrations
```bash
# Backend
cd thodakkam-server
npm run prisma:generate
npm run prisma:push  # or: npm run prisma:migrate

# Frontend (if using Prisma locally)
cd ../app
# Follow frontend setup instructions
```

## 🔄 Development

### Common Commands
```bash
# Start both servers
# Terminal 1: cd thodakkam-server && npm run dev
# Terminal 2: cd ../app && npm run dev

# Rebuild frontend
cd ../app
npm run build

# Clean & rebuild
npm run clean
```

## 🔐 Security Considerations
- Use strong, unique passwords
- Keep JWT secrets secure
- Implement rate limiting on authentication endpoints
- Validate all user inputs
- Use HTTPS in production

## 🎯 Deployment

### Frontend (Vercel)
```bash
# Push to GitHub
git add .
git commit -m "chore: prepare for deployment"
git push origin main

# Deploy on Vercel
vercel deploy --prod
```

### Backend (Render/Heroku/AWS)
```bash
# Push to GitHub
git push origin main

# Deploy on platform:
# Render: Create new service, connect GitHub, configure build & start commands
# Heroku: git push heroku main
# AWS: Use Elastic Beanstalk or EC2 with proper configuration
```

## 📚 Documentation

- [Backend API Documentation](docs/backend.md)
- [Frontend Usage Guide](docs/frontend.md)
- [Database Schema](docs/database.md)

## 📞 Support

For issues or questions, please:
1. Check existing issues in the GitHub repository
2. Review the documentation above
3. Create a new issue with
