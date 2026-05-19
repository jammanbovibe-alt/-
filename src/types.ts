export interface Question {
  question: string;
  options: string[];
  answer: number; // 0-3
  explanation: string;
  misconception_points: string;
  difficulty: '하' | '중' | '상';
  depth_of_knowledge: string;
}

export interface Quiz {
  id: string;
  teacher_id: string;
  title: string;
  source_type: 'pdf' | 'image' | 'text';
  student_level: string;
  question_count: number;
  questions: Question[];
  created_at: string;
  invite_code: string;
  status: 'draft' | 'published';
}

export interface Submission {
  id: string;
  quiz_id: string;
  student_name: string;
  student_id: string;
  answers: number[];
  analysis: {
    score: number;
    total_questions: number;
    accuracy: number;
    student_level: string;
    incorrect_questions: number[];
    misconception_types: string[];
    missing_concepts: string[];
    recommended_next_level: string;
  };
  created_at: string;
}
