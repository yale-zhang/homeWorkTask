
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

export enum EventType {
  HOMEWORK = 'Daily Homework',
  WEEKLY_QUIZ = 'Weekly Quiz',
  MONTHLY_TEST = 'Monthly Test',
  MIDTERM = 'Midterm Exam',
  FINAL = 'Final Exam'
}

export interface SchoolNode {
  id: string;
  name: string;
  order: number;
}

export interface EventNode {
  id: string;
  name: string;
  type: EventType;
  order: number;
  schoolId: string; // Link to a specific school
}

export interface AcademicEvent {
  id: string;
  type: EventType;
  title: string;
  date: string;
  level: 'School' | 'Class';
  description?: string;
}

export interface AppSettings {
  aiProvider: AIProvider;
  deepseekApiKey: string;
  deepseekBaseUrl: string;
  deepseekModel: string;
  supabaseUrl: string;
  supabaseKey: string;
  schools: SchoolNode[]; // Managed schools
  eventNodes: EventNode[]; // Managed event categories per school
}

export interface UserProfile {
  id: string;
  nickname: string;
  avatar: string;
  grade: string;
  school?: string; // This will now correspond to a SchoolNode.name or id
  password?: string;
}

export interface HomeworkTask {
  id: string;
  title: string;
  source: string;
  subject: Subject;
  category: string;
  content: string;
  deadline: string;
  status: 'pending' | 'submitted' | 'processing' | 'graded';
  timestamp: number;
  submissionImage?: string;
  result?: GradingResult;
  isGeneratingPlan?: boolean;
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
  sourceTaskId?: string;
  sourceTaskTitle?: string;
  sourceTaskSubject?: string;
}

export interface WeeklyStats {
  date: string;
  completionRate: number;
  averageScore: number;
}
