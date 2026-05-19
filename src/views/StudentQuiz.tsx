import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Loader2, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Quiz } from '../types';
import { MathRenderer } from '../components/MathRenderer';
import { cn } from '../lib/utils';

export default function StudentQuiz() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filteredQuestions, setFilteredQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentName] = useState(localStorage.getItem('studentName') || '익명 학생');

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const q = query(collection(db, 'quizzes'), where('invite_code', '==', inviteCode?.toUpperCase()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = { id: snap.docs[0].id, ...snap.docs[0].data() } as Quiz;
          setQuiz(data);
          const studentLevel = localStorage.getItem('studentLevel') || '중';
          const filtered = data.questions.filter(q => q.difficulty === studentLevel);
          const finalQuestions = filtered.length > 0 ? filtered : data.questions;
          setFilteredQuestions(finalQuestions);
          setAnswers(new Array(finalQuestions.length).fill(-1));
        } else {
          navigate('/join');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [inviteCode]);

  const handleSelect = (idx: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = idx;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (answers.includes(-1)) {
        alert('모든 문제를 풀어주세요!');
        return;
    }

    setIsSubmitting(true);
    try {
      // Evaluate results with AI
      const resp = await fetch('/api/quiz/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: filteredQuestions,
          studentAnswers: answers,
          studentName
        })
      });
      const analysis = await resp.json();

      // Save submission
      const docRef = await addDoc(collection(db, 'submissions'), {
        quiz_id: quiz!.id,
        student_name: studentName,
        student_id: 'temp_student_id',
        answers,
        analysis,
        created_at: new Date().toISOString()
      });

      navigate(`/result/${docRef.id}`);
    } catch (e) {
      console.error(e);
      alert('제출 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="h-screen ios-wallpaper flex items-center justify-center font-sans text-white">
       <div className="flex flex-col items-center gap-6">
          <Loader2 className="animate-spin text-indigo-400" size={64} strokeWidth={2.5} />
          <p className="text-white/40 font-extrabold uppercase tracking-widest text-[10px]">Preparing evaluation environment...</p>
       </div>
    </div>
  );

  if (!quiz) return (
    <div className="h-screen ios-wallpaper flex items-center justify-center font-black text-white/50">
      퀴즈를 찾을 수 없습니다.
    </div>
  );

  const currentQuestion = filteredQuestions[currentIndex];
  const progress = ((currentIndex + 1) / filteredQuestions.length) * 100;

  return (
    <div className="min-h-screen ios-wallpaper flex flex-col font-sans text-white overflow-hidden p-6 gap-6">
      {/* Top Header - Translucent iOS Glass Pill */}
      <header className="ios-glass rounded-[28px] h-20 px-8 flex items-center justify-between shrink-0 shadow-2xl relative">
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        
        {/* Student Info Widget */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center font-extrabold text-sm shadow-md">
            {studentName.charAt(0)}
          </div>
          <div>
            <p className="text-[9px] font-extrabold text-white/40 uppercase tracking-wider leading-none mb-0.5">Student</p>
            <p className="text-sm font-extrabold text-white leading-none">{studentName}</p>
          </div>
        </div>
        
        {/* Title Widget */}
        <div className="text-center hidden sm:block">
          <p className="text-[9px] font-extrabold text-indigo-300 uppercase tracking-[0.2em] mb-0.5 flex items-center justify-center gap-1">
            <Sparkles size={10} className="animate-pulse" /> Evaluation In Progress
          </p>
          <p className="text-xs font-black text-white">{quiz.title}</p>
        </div>
        
        {/* Progress Counter */}
        <div className="flex items-center gap-2.5 text-white/40 font-extrabold text-sm bg-white/5 border border-white/5 px-4.5 py-2 rounded-2xl">
          <span className="text-indigo-300 font-extrabold">{currentIndex + 1}</span> 
          <span className="text-white/20">/</span> 
          <span>{filteredQuestions.length}</span>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 flex flex-col justify-between gap-6 overflow-hidden">
        {/* Question Panel */}
        <div className="flex-1 ios-glass rounded-[32px] p-8 lg:p-12 flex flex-col justify-center overflow-y-auto relative shadow-2xl">
          {/* Subtle top glare edge */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          
          <div className="max-w-4xl mx-auto w-full space-y-10 py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, cubicBezier: [0.16, 1, 0.3, 1] }}
                className="space-y-10"
              >
                {/* Math Question Text */}
                <div className="text-center space-y-4">
                  <MathRenderer 
                    content={currentQuestion.question} 
                    className="text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-tight max-w-3xl mx-auto" 
                  />
                  <div className="inline-flex gap-2">
                    <span className="bg-white/5 border border-white/10 text-white/55 px-3 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-widest">
                      Difficulty: {currentQuestion.difficulty}
                    </span>
                    <span className="bg-white/5 border border-white/10 text-white/55 px-3 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-widest">
                      {currentQuestion.depth_of_knowledge}
                    </span>
                  </div>
                </div>

                {/* Multiple Choice Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQuestion.options.map((opt, i) => {
                    const isSelected = answers[currentIndex] === i;
                    return (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.015, y: -1 }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => handleSelect(i)}
                        className={cn(
                          "group p-6 rounded-[28px] border text-left transition-all relative overflow-hidden flex items-center gap-5.5",
                          isSelected 
                            ? "bg-gradient-to-r from-indigo-500/80 via-purple-500/80 to-pink-500/80 border-white/20 text-white shadow-2xl glow-purple" 
                            : "ios-glass-interactive border-white/5 text-white/70 hover:border-white/15"
                        )}
                      >
                        {/* Option Number Squircle */}
                        <div className={cn(
                          "w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-lg shrink-0 transition-all border",
                          isSelected 
                            ? "bg-white text-indigo-600 border-white/10" 
                            : "bg-white/5 text-white/40 border-white/5 group-hover:bg-white/10 group-hover:text-white"
                        )}>
                          {i + 1}
                        </div>
                        <MathRenderer 
                          content={opt} 
                          className={cn("text-base font-bold transition-colors", isSelected ? "text-white" : "text-white/80")} 
                        />
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Navigation Panel */}
        <footer className="ios-glass rounded-[28px] p-5.5 flex justify-between items-center shadow-2xl relative shrink-0">
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          <button
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(currentIndex - 1)}
            className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white border border-white/5 rounded-2xl font-extrabold uppercase text-xs tracking-wider transition-all disabled:opacity-20 disabled:pointer-events-none"
          >
            이전 문제
          </button>

          {/* Dynamic Progress Indicator bar */}
          <div className="flex-1 max-w-xs mx-6 hidden md:block">
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
              />
            </div>
          </div>

          {currentIndex === filteredQuestions.length - 1 ? (
            <button
              disabled={answers[currentIndex] === -1 || isSubmitting}
              onClick={handleSubmit}
              className="px-8 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl font-extrabold uppercase text-xs tracking-widest shadow-xl hover:shadow-indigo-500/20 transition-all flex items-center gap-2.5 disabled:opacity-40 disabled:pointer-events-none glow-purple"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} strokeWidth={2.5} /> 채점 진단 중...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} strokeWidth={3} /> 최종 제출하기
                </>
              )}
            </button>
          ) : (
            <button
              disabled={answers[currentIndex] === -1}
              onClick={() => setCurrentIndex(currentIndex + 1)}
              className="px-8 py-4 bg-white/10 hover:bg-white/15 text-white border border-white/5 rounded-2xl font-extrabold uppercase text-xs tracking-widest transition-all flex items-center gap-2.5 disabled:opacity-40 disabled:pointer-events-none"
            >
              다음 문제 <ChevronRight size={16} strokeWidth={3} />
            </button>
          )}
        </footer>
      </main>
    </div>
  );
}
