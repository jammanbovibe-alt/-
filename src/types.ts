export interface Room {
  id: string;
  room_code: string;
  teacher_id: string;
  title: string;
  folder_name?: string;
  created_at: string;
}

export interface ChatMessage {
  role: 'student' | 'jambot';
  content: string;
  internal_analysis?: string;
  phase?: 'UNDERSTANDING_CHECK' | 'DEEPENING' | 'REAL_WORLD_TRANSFER' | 'COMPLETE';
  created_at: string;
}

export interface StudentSubmission {
  id: string;
  room_code: string;
  student_name: string;
  tiptap_json: string; // Serialized JSON string of the Tiptap document
  chat_history: ChatMessage[];
  current_phase: 'UNDERSTANDING_CHECK' | 'DEEPENING' | 'REAL_WORLD_TRANSFER' | 'COMPLETE';
  status: '미제출' | '진행중' | '완료';
  updated_at: string;
}
