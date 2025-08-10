# 🧪 Lab Slot Management System

A comprehensive laboratory booking and management system built with **Next.js 14**, **TypeScript**, **Supabase**, and **Google OAuth**. This system provides seamless lab slot booking for students and powerful administrative tools for lab management.

## ✨ Features

### 🔐 Authentication & Security
- **Google OAuth Integration** - Secure login with Google accounts
- **Role-Based Access Control** - Admin and Student roles with appropriate permissions
- **Session Management** - Automatic session refresh and inactivity timeout (30 minutes)
- **Row Level Security (RLS)** - Database-level security policies

### 👨‍🎓 Student Features
- **Dashboard** - Overview of booked sessions, statistics, and upcoming sessions
- **Slot Booking** - Browse and book available lab slots with real-time availability
- **My Sessions** - View and manage all booked sessions
- **Sample Submission** - Submit sample counts and notes for completed sessions
- **Smart Booking Logic** - Prevents double booking and expired slot selection

### 👨‍🏫 Admin Features
- **Admin Dashboard** - Comprehensive overview with booking statistics
- **Lab Slot Management** - Create, edit, and delete lab slots with flexible time durations
- **Booking Management** - View all bookings, filter by status/date, and manage booking lifecycle
- **Booking System Control** - Flexible booking windows with scheduled and manual override options
- **Reports & Analytics** - Weekly attendance reports, sample analysis, and export functionality
- **Student Management** - View and manage student accounts

### 🎨 User Interface
- **Glass Morphism Design** - Modern, elegant UI with glass-like effects
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Real-time Updates** - Live data synchronization across all pages
- **Intuitive Navigation** - Clean, organized interface with clear visual hierarchy

## 🚀 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful, customizable icons
- **React Hot Toast** - Elegant notifications
- **React Hook Form** - Performant forms with validation

### Backend
- **Supabase** - Backend-as-a-Service (PostgreSQL database)
- **PostgreSQL** - Robust relational database
- **Row Level Security** - Database-level access control
- **Database Triggers** - Automated data processing

### Authentication
- **Google OAuth 2.0** - Secure authentication
- **Custom Session Management** - Cookie-based session handling
- **Middleware Protection** - Route-level security

## 📋 Prerequisites

Before running this project, ensure you have:

- **Node.js 18+** installed
- **npm** or **yarn** package manager
- **Google Cloud Console** account for OAuth setup
- **Supabase** account for database

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Lab_Slot_Management
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

### 4. Database Setup

#### Option A: Use Complete Production Schema
1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of `complete-production-schema.sql`
3. Run the script to create all tables, policies, and functions

#### Option B: Step-by-Step Setup
1. Run `supabase-schema.sql` for basic schema
2. Run `fix-rls-policies-v2.sql` for security policies
3. Run `populate-test-data.sql` for sample data

### 5. Google OAuth Setup
1. Go to **Google Cloud Console**
2. Create a new project or select existing one
3. Enable **Google+ API** and **Google OAuth2 API**
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)

### 6. Run the Application
```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## 🗄️ Database Schema

### Core Tables

#### `users`
- `id` (SERIAL PRIMARY KEY)
- `email` (VARCHAR UNIQUE)
- `role` (ENUM: 'admin', 'student')
- `created_at` (TIMESTAMP)

#### `lab_slots`
- `id` (UUID PRIMARY KEY)
- `date` (DATE)
- `start_time` (TIME)
- `end_time` (TIME)
- `status` (ENUM: 'available', 'booked', 'closed')
- `booked_by` (INTEGER REFERENCES users(id))
- `remarks` (TEXT)
- `created_at` (TIMESTAMP)

#### `bookings`
- `id` (UUID PRIMARY KEY)
- `user_id` (INTEGER REFERENCES users(id))
- `lab_slot_id` (INTEGER REFERENCES lab_slots(id))
- `status` (ENUM: 'booked', 'cancelled', 'no-show')
- `samples_count` (INTEGER)
- `created_at` (TIMESTAMP)

#### `booking_system_settings`
- `id` (SERIAL PRIMARY KEY)
- `is_regular_booking_enabled` (BOOLEAN)
- `is_emergency_booking_open` (BOOLEAN)
- `emergency_booking_start` (TIMESTAMP)
- `emergency_booking_end` (TIMESTAMP)
- `regular_allowed_days` (TEXT[])
- `regular_booking_start_time` (TIME)
- `regular_booking_end_time` (TIME)
- `message` (TEXT)
- `emergency_message` (TEXT)

#### `booking_slots`
- `id` (SERIAL PRIMARY KEY)
- `date` (DATE)
- `start_time` (TIME)
- `end_time` (TIME)
- `status` (ENUM: 'open', 'closed')
- `created_by` (INTEGER REFERENCES users(id))
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## 🔧 API Endpoints

### Authentication
- `GET /api/auth/session` - Get current session
- `POST /api/auth/signout` - Sign out user
- `GET /auth/callback` - Google OAuth callback

### Bookings
- `GET /api/bookings` - Get all bookings (admin)
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/[id]` - Update booking status

### Reports
- `GET /api/reports/export` - Export reports (CSV/PDF)

### Samples
- `POST /api/samples/submit` - Submit sample data

## 🎯 Key Features Explained

### Smart Booking System
The booking system operates with two modes:

1. **Scheduled Booking** - Regular weekly booking windows (e.g., every Sunday 9 AM - 11 AM)
2. **Manual Override** - Admin can open/close booking anytime with custom time windows

**Priority Logic:**
- Manual "closed" overrides scheduled "open"
- Manual "open" adds extra booking time
- Both systems work simultaneously

### Real-time Slot Management
- **Flexible Duration** - Slots can be any duration (30 min, 1.5 hours, 2 hours, etc.)
- **Status Tracking** - Available, Booked, Closed states
- **Automatic Expiration** - Expired slots are automatically disabled
- **Conflict Prevention** - Prevents double booking and race conditions

### Comprehensive Reporting
- **Weekly Attendance** - Track booking patterns and completion rates
- **Sample Analysis** - Monitor sample submission trends
- **Export Options** - CSV and PDF export functionality
- **Real-time Statistics** - Live dashboard with key metrics

## 🚨 Error Handling

The system includes comprehensive error handling:

- **Database Errors** - Graceful handling of RLS violations and constraint errors
- **Authentication Errors** - Proper session validation and token refresh
- **Network Errors** - Retry mechanisms and user-friendly error messages
- **Validation Errors** - Form validation with clear feedback

## 🔒 Security Features

### Row Level Security (RLS)
- **User Isolation** - Users can only access their own data
- **Admin Access** - Admins can access all data
- **Policy Enforcement** - Database-level security policies

### Authentication Security
- **Token Validation** - Regular token verification with Google
- **Session Management** - Secure cookie-based sessions
- **Inactivity Timeout** - Automatic logout after 30 minutes of inactivity

### Data Protection
- **Input Validation** - Server-side validation of all inputs
- **SQL Injection Prevention** - Parameterized queries via Supabase
- **XSS Protection** - Content Security Policy headers

## 📱 Responsive Design

The application is fully responsive with:

- **Mobile-First Design** - Optimized for mobile devices
- **Tablet Support** - Adaptive layouts for tablet screens
- **Desktop Optimization** - Enhanced features for larger screens
- **Touch-Friendly** - Optimized touch targets and gestures

## 🧪 Testing

### Manual Testing Checklist
- [ ] Google OAuth login/logout
- [ ] Admin dashboard functionality
- [ ] Student booking process
- [ ] Lab slot management
- [ ] Booking system controls
- [ ] Report generation
- [ ] Sample submission
- [ ] Responsive design on different devices

### Automated Testing
```bash
# Run linting
npm run lint

# Build test
npm run build

# Type checking
npx tsc --noEmit
```

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production
```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_production_google_client_id
GOOGLE_CLIENT_SECRET=your_production_google_client_secret
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your_production_secret
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

1. **Check the documentation** - This README and inline code comments
2. **Review error logs** - Check browser console and Supabase logs
3. **Database issues** - Verify RLS policies and table structure
4. **OAuth issues** - Check Google Cloud Console configuration

## 🔄 Version History

### v1.0.0 (Current)
- ✅ Complete lab slot management system
- ✅ Google OAuth integration
- ✅ Admin and student dashboards
- ✅ Booking system with flexible controls
- ✅ Comprehensive reporting
- ✅ Responsive design
- ✅ Production-ready deployment

---

**Built with ❤️ using Next.js, TypeScript, and Supabase**
