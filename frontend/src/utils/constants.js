export const APP_NAME = 'SAARTHI';
export const APP_TAGLINE = 'Your Journey to Smarter Learning';

export const NAV_ITEMS = [
  { label: 'Dashboard', path: '/app/dashboard', icon: 'LayoutDashboard' },
  { label: 'AI Study Assistant', path: '/app/assistant', icon: 'Bot' },
  { label: 'PDF Study Lab', path: '/app/pdf-lab', icon: 'FileText' },
  { label: 'My Notes', path: '/app/notes', icon: 'StickyNote' },
  { label: 'Quiz Generator', path: '/app/quiz', icon: 'HelpCircle' },
  { label: 'Study Planner', path: '/app/planner', icon: 'CalendarDays' },
  { label: 'Analytics', path: '/app/analytics', icon: 'BarChart3' },
];

export const BOTTOM_NAV_ITEMS = [
  { label: 'Settings', path: '/app/settings', icon: 'Settings' },
];

// Sample data for UI previews
export const SAMPLE_USER = {
  name: 'Alex Johnson',
  email: 'alex.johnson@university.edu',
  avatar: null,
  university: 'Stanford University',
  year: '3rd Year',
  major: 'Computer Science',
};

export const SAMPLE_TASKS = [
  { id: 1, title: 'Review Linear Algebra Chapter 5', subject: 'Mathematics', time: '9:00 AM', done: true },
  { id: 2, title: 'Complete Data Structures Assignment', subject: 'Computer Science', time: '11:00 AM', done: false },
  { id: 3, title: 'Read Research Paper on ML', subject: 'Machine Learning', time: '2:00 PM', done: false },
  { id: 4, title: 'Practice Operating Systems MCQs', subject: 'Operating Systems', time: '4:00 PM', done: false },
];

export const SAMPLE_ACTIVITIES = [
  { id: 1, type: 'quiz', title: 'Scored 85% on Data Structures Quiz', time: '2 hours ago', icon: 'HelpCircle' },
  { id: 2, type: 'notes', title: 'Created notes for Thermodynamics', time: '4 hours ago', icon: 'StickyNote' },
  { id: 3, type: 'pdf', title: 'Studied "Algorithms Unlocked" PDF', time: '6 hours ago', icon: 'FileText' },
  { id: 4, type: 'assistant', title: 'AI session on Neural Networks', time: 'Yesterday', icon: 'Bot' },
];

export const SAMPLE_STATS = {
  studyHours: 24,
  notesCreated: 18,
  quizzesTaken: 12,
  avgScore: 78,
};

export const SAMPLE_SCHEDULE = [
  { id: 1, title: 'Mathematics Lecture', time: '9:00 AM - 10:30 AM', type: 'lecture' },
  { id: 2, title: 'Study Group - Physics', time: '11:00 AM - 12:00 PM', type: 'group' },
  { id: 3, title: 'CS Lab Session', time: '2:00 PM - 4:00 PM', type: 'lab' },
];
