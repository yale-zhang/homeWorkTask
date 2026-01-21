
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

export enum AIProvider {
  GEMINI = 'gemini',
  DEEPSEEK = 'deepseek'
}

export interface AppSettings {
  aiProvider: AIProvider;
  deepseekApiKey: string;
  deepseekBaseUrl: string;
  deepseekModel: string;
  supabaseUrl: string;
  supabaseKey: string;
}

export interface UserProfile {
  id: string; // WeChat OpenID, GitHub ID, or email_{email}
  nickname: string;
  avatar: string;
  grade: string;
  password?: string; // Stored for traditional login
}

export interface HomeworkTask {
  id: string;
  title: string;
  source: string;
  subject: Subject;
  category: AssignmentCategory;
  content: string;
  deadline: string;
  status: 'pending' | 'submitted' | 'processing' | 'graded';
  timestamp: number;
  submissionImage?: string;
  result?: GradingResult;
  isGeneratingPlan?: boolean; // New flag for plan generation sync
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
  deepAnalysis?: string;
  tasks: LearningTask[];
  createdAt: number;
  sourceTaskId?: string; // 新增：关联的具体作业 ID
  sourceTaskTitle?: string;
  sourceTaskSubject?: string;
}

export interface WeeklyStats {
  date: string;
  completionRate: number;
  averageScore: number;
}
