// User Roles - Extended with doctor role
export type UserRole = 'administrator' | 'receptionist' | 'nurse' | 'doctor' | 'patient';

// Priority Levels
export type Priority = 'critical' | 'high' | 'medium' | 'low';

// Appointment Types
export type AppointmentType = 'general' | 'follow-up' | 'emergency' | 'consultation';

// Appointment Status
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';

// Notification Types
export type NotificationType = 'appointment' | 'queue' | 'alert' | 'system' | 'message';

// Triage Category
export type TriageCategory = 'critical' | 'urgent' | 'standard' | 'minor';

// Queue Status
export type QueueStatus = 'waiting' | 'called' | 'inConsultation' | 'completed' | 'missed' | 'cancelled';

// User
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  lastLogin: Date;
  status: 'active' | 'inactive';
}

// Patient
export interface Patient {
  id: string;
  patientNumber?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  nrc?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  age?: number | null;
  gender?: 'male' | 'female' | 'other' | null;
  dob?: Date | string | null;
  pregnancyStatus?: 'pregnant' | 'not-pregnant' | 'unknown';
  symptoms?: string[];
  chronicConditions?: string[];
  address?: string | null;
  registrationDate?: Date | string | null;
  medicalNotes?: string;
  nationalId?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

// Queue Record
export interface QueueRecord {
  id: string;
  queueNumber: string;
  patientId: string;
  patient: Patient;
  priority: Priority;
  status: QueueStatus;
  arrivalTime: Date;
  calledTime?: Date;
  consultationStartTime?: Date;
  completionTime?: Date;
  estimatedWaitingTime: number; // in minutes
  riskScore: number; // 0-100
  notes?: string;
}

// Activity Log
export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  module: string;
  timestamp: Date;
  details?: Record<string, any>;
  status: 'success' | 'error';
}

// SMS Log
export interface SMSLog {
  id: string;
  patientId: string;
  phone: string;
  message: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  sentTime: Date;
  deliveredTime?: Date;
  failureReason?: string;
}

// Clinic Settings
export interface ClinicSettings {
  id: string;
  clinicName: string;
  address: string;
  workingHours: {
    open: string;
    close: string;
  };
  timezone: string;
}

// SMS Settings
export interface SMSSettings {
  id: string;
  apiKey: string;
  senderId: string;
  enabled: boolean;
}

// Voice Settings
export interface VoiceSettings {
  id: string;
  language: string;
  repeatCount: number;
  enabled: boolean;
  volume: number;
}

// Dashboard Stats
export interface DashboardStats {
  totalPatientsToday: number;
  waitingPatients: number;
  patientsServed: number;
  averageWaitingTime: number; // in minutes
  criticalCases: number;
  smsSent: number;
  activeStaff: number;
  queueEfficiency: number; // percentage
}

// Report Data
export interface ReportMetrics {
  patientsServed: number;
  averageWaitingTime: number;
  criticalCases: number;
  completionRate: number;
  smsUsage: number;
  queueEfficiency: number;
  peakHours: { hour: number; count: number }[];
  priorityDistribution: { priority: Priority; count: number }[];
}

// Appointment
export interface Appointment {
  id: string;
  patientId: string;
  patient: Patient;
  doctorId: string;
  date: Date;
  type: AppointmentType;
  status: AppointmentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Smart Insight
export interface SmartInsight {
  id: string;
  title: string;
  description: string;
  type: 'warning' | 'suggestion' | 'info' | 'success';
  confidence: number; // 0-100
  actionable: boolean;
  action?: {
    label: string;
    link: string;
  };
  timestamp: Date;
}

// Clinic
export interface Clinic {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  registrationNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

// Staff Member
export interface StaffMember {
  id: string;
  clinicId: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  specialization?: string;
  joinDate: Date;
  status: 'active' | 'inactive' | 'on-leave';
  performanceRating?: number;
  totalConsultations?: number;
}

// Notification
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, any>;
  createdAt: Date;
  readAt?: Date;
}

// Queue Analytics
export interface QueueAnalytics {
  timestamp: Date;
  totalInQueue: number;
  averageWaitTime: number;
  completedCount: number;
  noShowCount: number;
  byPriority: Record<Priority, number>;
  byTriageCategory: Record<TriageCategory, number>;
}

// Doctor Profile
export interface DoctorProfile {
  id: string;
  userId: string;
  specialization: string;
  licenseNumber: string;
  yearsOfExperience: number;
  consultationFee?: number;
  bio?: string;
  availableSlots: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
}

// Patient Health Record
export interface PatientHealthRecord {
  id: string;
  patientId: string;
  visitDate: Date;
  symptoms: string[];
  diagnosis?: string;
  treatment?: string;
  medications?: string[];
  notes?: string;
  doctorId: string;
  createdAt: Date;
}

// Command Palette Item
export interface CommandPaletteItem {
  id: string;
  label: string;
  description: string;
  category: string;
  icon: string;
  action: () => void;
  shortcut?: string;
  tags: string[];
}
