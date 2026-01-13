
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

export interface HomeworkTask {
  id: string;
  source: string; // e.g., "School Group 101"
  subject: Subject;
  category: AssignmentCategory;
  content: string;
  deadline: string;
  status: 'pending' | 'submitted' | 'graded';
  timestamp: number;
  submissionImage?: string; // 新增：采集时上传的原始作业图片 (Base64)
  result?: GradingResult; // 存储 AI 批改后的详细数据
}

export interface GradingResult {
  score: number;
  totalScore: number;
  strengths: string[];
  weaknesses: string[];
  detailedFeedback: string;
  extractedText?: string; // OCR 提取的原文本
  knowledgePoints: {
    point: string;
    mastery: number; // 0-100
  }[];
}

export interface LearningTask {
  id: string;
  title: string;
  type: 'video' | 'exercise' | 'reading';
  url?: string;
  description: string;
  completed?: boolean; // 是否已完成
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
