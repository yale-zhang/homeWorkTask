
export enum Subject {
  MATH = 'Mathematics',
  SCIENCE = 'Science',
  ENGLISH = 'English',
  HISTORY = 'History',
  CHINESE = 'Chinese'
}

export enum AssignmentCategory {
  MAJOR_GRADE = 'Major Grade',
  QUIZ = 'Quiz',
  HOMEWORK = 'Homework',
  PRACTICE = 'Daily Practice'
}

export interface UserProfile {
  id: string; // WeChat OpenID
  nickname: string;
  avatar: string;
  grade: string;
}

export interface HomeworkTask {
  id: string;
  source: string;
  subject: Subject;
  category: AssignmentCategory;
  content: string;
  deadline: string;
  status: 'pending' | 'submitted' | 'graded';
  timestamp: number;
  submissionImage?: string;
  result?: GradingResult;
}

export interface GradingResult {
  score: number;
  totalScore: number;
  strengths: string[];
  weaknesses: string[];
  detailedFeedback: string;
  extractedText?: string;
  knowledgePoints: {
    point: string;
    mastery: number;
  }[];
}

export interface LearningTask {
  id: string;
  title: string;
  type: 'video' | 'exercise' | 'reading';
  url?: string;
  description: string;
  completed?: boolean;
  metadata?: {
    duration?: string;
    questionsCount?: number;
    difficulty?: string;
    readingTime?: string;
    topic?: string;
  };
}

export interface LearningPlan {
  id: string;
  focusArea: string;
  tasks: LearningTask[];
  createdAt: number; 
}

export interface WeeklyStats {
  date: string;
  completionRate: number;
  averageScore: number;
}
