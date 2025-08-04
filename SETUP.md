# Lab Slot Management System - Setup Guide

## 🚀 Quick Start

### 1. Supabase Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and anon key

2. **Run Database Schema**
   - Go to SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `supabase-schema.sql`
   - Run the script

3. **Configure Google OAuth**
   - Go to Authentication > Providers in Supabase
   - Enable "Google" provider
   - Add your Google OAuth credentials:
     - **Client ID:** Your Google OAuth client ID
     - **Client Secret:** Your Google OAuth client secret
   - Set redirect URL: `https://your-project.supabase.co/auth/v1/callback`

4. **Configure Authentication Settings**
   - Go to Authentication > Settings in Supabase
   - Add your domain to "Site URL" (e.g., `http://localhost:3000`)
   - Add redirect URL: `http://localhost:3000/auth/callback`

### 2. Google OAuth Setup (Required)

1. **Create Google OAuth App**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Go to "Credentials" > "Create Credentials" > "OAuth 2.0 Client IDs"
   - Set application type to "Web application"
   - Add authorized redirect URIs:
     - `https://your-project.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (for development)

2. **Get OAuth Credentials**
   - Copy the Client ID and Client Secret
   - Add them to Supabase Authentication > Providers > Google

### 3. Environment Setup

1. **Create `.env.local` file**
   ```bash
   cp env.example .env.local
   ```

2. **Add your Supabase credentials**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

### 6. Test the System

1. **Login with Google**
   - Click "Continue with Google" on the login page
   - Choose your Google account
   - You'll be automatically logged in as a student

2. **Set Admin Role (Optional)**
   - Go to Supabase > Table Editor > users
   - Find your user record
   - Change the `role` field from `'student'` to `'admin'`

3. **Create Lab Slots (Admin)**
   - Login as admin
   - Go to Admin > Lab Slots
   - Create some test slots

4. **Test Booking Flow (Student)**
   - Login as student
   - Try booking on Sunday vs other days
   - Test sample submission

## 📋 Features Implemented

### ✅ Core Features
- [x] Google OAuth authentication (one-click login)
- [x] Role-based access (student/admin)
- [x] Sunday-only booking system
- [x] FCFS (First Come First Serve) booking logic
- [x] Real-time slot availability
- [x] Sample submission system
- [x] Booking cancellation with 1-day advance rule
- [x] Row Level Security (RLS) policies
- [x] Beautiful glass morphism UI
- [x] Responsive design

### ✅ Student Features
- [x] Dashboard with stats
- [x] Book lab sessions (Sundays only)
- [x] View upcoming sessions
- [x] Submit sample counts
- [x] Cancel bookings (1-day advance)

### ✅ Admin Features
- [x] Admin dashboard
- [x] Manage lab slots
- [x] View all bookings
- [x] Student management
- [x] Reports generation

## 🔧 API Endpoints

### Bookings
- `POST /api/bookings` - Create booking (Sunday only)
- `GET /api/bookings` - Get user's bookings

### Samples
- `POST /api/samples/submit` - Submit sample count

## 🔐 Authentication

### Login Method
- **Google OAuth** - One-click Google sign-in
- No passwords needed
- Automatic account creation
- Session persistence

### User Roles
- **New users** automatically get 'student' role
- **Admin role** must be manually assigned in database
- Contact system administrator for admin access

## 🚀 Quick Test

1. **Start the server:** `npm run dev`
2. **Open:** `http://localhost:3000`
3. **Click "Continue with Google"**
4. **Choose your Google account**
5. **You're logged in!**

## 🔧 Troubleshooting

### Google OAuth Issues
1. **Check redirect URLs** in Google Cloud Console
2. **Verify OAuth credentials** in Supabase
3. **Ensure Google+ API is enabled**

### Authentication Issues
1. **Check Supabase project URL and keys**
2. **Verify Google OAuth configuration**
3. **Check browser console for errors**

The system now uses fast, reliable Google OAuth authentication! 