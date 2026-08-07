// Professional Medical Color Palette
export const medicalColors = {
  primary: {
    blue: '#0066CC',
    lightBlue: '#3B82F6',
    darkBlue: '#0E7CB8',
  },
  status: {
    critical: '#DC2626',
    warning: '#F59E0B',
    high: '#3B82F6',
    medium: '#8B5CF6',
    low: '#34D399',
    completed: '#10B981',
  },
  neutral: {
    white: '#FFFFFF',
    lightGray: '#F3F4F6',
    mediumGray: '#E5E7EB',
    gray: '#6B7280',
    darkGray: '#1F2937',
    charcoal: '#111827',
  },
};

// Priority badge styles
export const priorityStyles = {
  critical: {
    bg: 'bg-red-50 dark:bg-red-950',
    text: 'text-red-800 dark:text-red-200',
    border: 'border-red-200 dark:border-red-800',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  },
  high: {
    bg: 'bg-orange-50 dark:bg-orange-950',
    text: 'text-orange-800 dark:text-orange-200',
    border: 'border-orange-200 dark:border-orange-800',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
  },
  medium: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    text: 'text-blue-800 dark:text-blue-200',
    border: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  },
  low: {
    bg: 'bg-emerald-50 dark:bg-emerald-950',
    text: 'text-emerald-800 dark:text-emerald-200',
    border: 'border-emerald-200 dark:border-emerald-800',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
  },
} as const;

// Status badge styles
export const statusStyles = {
  waiting: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  called: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  inConsultation: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
  missed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
} as const;
