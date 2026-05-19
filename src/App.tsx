import { StrictMode, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Upload, 
  FileText, 
  Settings, 
  CheckCircle2, 
  Send, 
  ChevronRight, 
  ChevronLeft, 
  BarChart3, 
  Users,
  LayoutDashboard,
  BrainCircuit,
  LogOut,
  Code
} from 'lucide-react';
import { cn } from './lib/utils';

// Views (Placeholder components initially)
import TeacherDashboard from './views/TeacherDashboard';
import QuizCreator from './views/QuizCreator';
import QuizReport from './views/QuizReport';
import StudentJoin from './views/StudentJoin';
import StudentQuiz from './views/StudentQuiz';
import StudentResult from './views/StudentResult';

import TeacherLayout from './components/TeacherLayout';
import { initAuth } from './lib/firebase';

export default function App() {
  useEffect(() => {
    initAuth().catch(console.error);
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen font-sans">
        <Routes>
          {/* Teacher Routes wrapping with layout */}
          <Route path="/" element={<TeacherLayout><TeacherDashboard /></TeacherLayout>} />
          <Route path="/create" element={<TeacherLayout><QuizCreator /></TeacherLayout>} />
          <Route path="/report/:quizId" element={<TeacherLayout><QuizReport /></TeacherLayout>} />
          
          {/* Student Routes - Full Screen */}
          <Route path="/join" element={<StudentJoin />} />
          <Route path="/quiz/:inviteCode" element={<StudentQuiz />} />
          <Route path="/result/:submissionId" element={<StudentResult />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
