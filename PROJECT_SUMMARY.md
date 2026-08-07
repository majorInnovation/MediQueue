# Professional Medical Queue Management System

## Overview
A complete, enterprise-grade healthcare queue and triage management system built with Next.js 16, React 19, TypeScript, and Tailwind CSS. The system resembles commercial platforms like Epic Systems, Cerner, and Athenahealth with professional medical UI/UX design.

## ✨ Key Features

### 🔐 Authentication
- Professional login page with medical branding
- Role-based access control (Administrator, Receptionist, Nurse)
- Demo credentials included: `admin@clinic.com` / `password123`

### 📊 Administrator Dashboard
- Real-time statistics cards (total patients, waiting, served, critical cases, SMS sent, active staff, queue efficiency)
- Queue trend charts
- Activity feed with real-time updates
- Quick action buttons for common tasks
- Comprehensive reporting and analytics

### 👥 Patient Management
- Multi-step patient registration form (Personal → Medical → Confirmation)
- Queue number generation
- Risk score calculation based on patient data
- Symptom and condition tracking
- Pregnancy status flag
- Medical notes

### 👨‍⚕️ Triage Module
- Patient queue list with filtering
- Detailed patient assessment interface
- Symptom and medical history display
- Risk score calculator with manual override
- Auto-calculate priority based on risk factors
- Assessment notes

### 🏥 Queue Management
- Real-time active queue display
- Large format queue number display for waiting rooms
- Dynamic status management (Waiting, Called, In Consultation, Completed, Missed, Cancelled)
- Patient details and phone numbers
- Quick action buttons (Mark Completed, Skip Patient, Recall Patient)
- Estimated waiting time display

### 📈 Reports & Analytics
- Daily, weekly, and monthly reports
- Patient flow trend charts
- Performance metrics (total patients, avg wait time, critical cases, efficiency score)
- Export functionality
- Key metrics dashboard

### ⚙️ Settings
- Clinic configuration (name, address, working hours, timezone)
- SMS settings and provider configuration
- Voice/announcement settings
- General system settings (dark mode, notifications, auto-refresh)

### 👨‍💼 Staff Management
- Staff directory with roles and status
- User activity tracking (last login)
- Edit and delete staff members
- Role-based permissions display

## 🎨 Design System

### Color Palette
- **Medical Blue**: Primary actions and navigation (#0066CC)
- **Emerald Green**: Success and completed actions (#10B981)
- **Critical Red**: Emergency and critical alerts (#DC2626)
- **Warning Orange**: High priority indicators (#F59E0B)
- **Neutral Grays**: Backgrounds and secondary elements
- **Professional White**: Primary backgrounds

### Typography
- **Headers**: Inter, Bold (24px-32px)
- **Body**: Inter, Regular (14px-16px)
- **Monospace**: Roboto Mono (queue numbers, timestamps)

### Components
- Glassmorphism styling with subtle shadows
- Responsive grid layouts
- Smooth transitions and animations
- Dark mode support throughout
- Mobile-first responsive design

## 📁 Project Structure

```
/app
  /page.tsx                 # Login page
  /dashboard/page.tsx       # Admin dashboard
  /register/page.tsx        # Patient registration
  /triage/page.tsx          # Triage assessment
  /queue/page.tsx           # Queue management
  /staff/page.tsx           # Staff management
  /reports/page.tsx         # Reports & analytics
  /settings/page.tsx        # System settings
  layout.tsx               # Root layout

/components
  /layout
    Sidebar.tsx            # Role-based navigation
    TopNavBar.tsx          # Header with notifications
    DashboardLayout.tsx    # Main layout wrapper
  /dashboard
    StatsCard.tsx          # KPI cards
    QueueChart.tsx         # Chart component
    ActivityFeed.tsx       # Activity logs
    QuickActions.tsx       # Action buttons
  /receptionist
    PatientRegistrationForm.tsx  # Multi-step form
  /triage
    TriageWorkspace.tsx    # Triage interface
  /queue
    QueueNumberDisplay.tsx # Queue number display
  /common
    StatusBadge.tsx        # Status indicators
    PriorityBadge.tsx      # Priority indicators

/lib
  colors.ts               # Color constants and styles
  types.ts                # TypeScript interfaces
  utils.ts                # Utility functions
```

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Run development server:**
   ```bash
   pnpm dev
   ```

3. **Open in browser:**
   - Navigate to `http://localhost:3000`
   - Login with demo credentials: `admin@clinic.com` / `password123`

## 🔑 Key Technologies

- **Framework**: Next.js 16 with App Router
- **UI Library**: Shadcn/ui components
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript (strict mode)
- **Icons**: Lucide React
- **Utilities**: Class-variance-authority, tailwind-merge

## 📱 Responsive Design

- **Mobile**: Hamburger menu, single column layouts
- **Tablet**: 2-3 column layouts
- **Desktop**: Full featured multi-column layouts
- **Accessibility**: WCAG AA compliance, keyboard navigation, ARIA labels

## 🎯 User Roles

### Administrator
- Full system access
- Staff management
- Reports and analytics
- Settings configuration

### Receptionist
- Patient registration
- Queue management
- Patient search
- Queue slip printing

### Nurse/Triage Officer
- Patient triage assessment
- Priority assignment
- Patient queue management
- Medical notes

## ✅ Features Implemented

- ✅ Professional login system
- ✅ Role-based navigation and access
- ✅ Dashboard with real-time statistics
- ✅ Multi-step patient registration form
- ✅ Priority scoring algorithm
- ✅ Queue management with real-time updates
- ✅ Triage assessment interface
- ✅ Staff management system
- ✅ Reports and analytics
- ✅ Settings management
- ✅ Dark mode support
- ✅ Responsive mobile design
- ✅ Professional medical UI/UX
- ✅ Sample data populated throughout

## 🎨 Sample Data

The system includes realistic sample data:
- 4-5 sample patients at various priority levels
- 4 staff members with different roles
- Queue statistics and trends
- Activity logs with realistic events
- Report metrics with patient flow data

## 🔄 Data Flow

The system uses:
- **React Context API** for theme and auth state
- **Local state** for UI interactions
- **TypeScript interfaces** for type safety
- **Utility functions** for business logic
- **Sample data** populated in components (ready for backend integration)

## 🌟 Professional Features

- Enterprise-grade sidebar navigation
- Breadcrumb navigation
- Notification center with badge counter
- Real-time activity feed
- Data export functionality
- Comprehensive audit logs
- User session management
- Timezone support
- Multi-language ready (framework in place)

## 🚀 Future Enhancements

- Backend API integration
- Real database (PostgreSQL/MongoDB)
- SMS notification service
- Voice announcement system
- Email integration
- Advanced analytics
- Print queue slips
- Patient portal
- Mobile app version

## 📞 Demo Credentials

- **Email**: `admin@clinic.com`
- **Password**: `password123`
- **Role**: Administrator (full access)

---

**Built with ❤️ for healthcare professionals** | Professional medical queue management system
