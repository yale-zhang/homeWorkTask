
export enum Subject {
  MATH = 'Mathematics',
  SCIENCE = 'Science',
  ENGLISH = 'English',
  HISTORY = 'History',
  CHINESE = 'Chinese'
}

export interface HomeworkTask {
  id: string;
  source: string; // e.g., "School Group 101"
  subject: Subject;
  content: string;
  deadline: string;
  status: 'pending' | 'submitted' | 'graded';
  timestamp: number;
}

export interface GradingResult {
  score: number;
  totalScore: number;
  strengths: string[];
  weaknesses: string[];
  detailedFeedback: string;
  knowledgePoints: {
    point: string;
    mastery: number; // 0-100
  }[];
}

export interface LearningPlan {
  id: string;
  focusArea: string;
  tasks: {
    title: string;
    type: 'video' | 'exercise' | 'reading';
    url?: string;
    description: string;
  }[];
}

export interface WeeklyStats {
  date: string;
  completionRate: number;
  averageScore: number;
}
