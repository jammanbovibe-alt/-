import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Send, Clock, Loader2, BrainCircuit, CheckCircle2, Target } from 'lucide-react';
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
          setAnswers(new Array(data.questions.length).fill(-1));
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
          questions: quiz!.questions,
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
    <div className="h-screen bg-slate-50 flex items-center justify-center">
       <div className="flex flex-col items-center gap-6">
          <Loader2 className="animate-spin text-indigo-600" size={64} strokeWidth={3} />
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Preparing evaluation environment...</p>
       </div>
    </div>
  );

  if (!quiz) return <div className="h-screen bg-slate-50 flex items-center justify-center font-black text-slate-400">퀴즈를 찾을 수 없습니다.</div>;

  const currentQuestion = quiz.questions[currentIndex];
  const progress = ((currentIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
       {/* Top Status Bar */}
       <header className="h-2 bg-slate-200">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-indigo-600 transition-all duration-500 shadow-[0_0_15px_rgba(79,70,229,0.5)]"
          />
       </header>
       
       <header className="h-20 bg-white border-b border-slate-200 px-10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
             <div className="bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-indigo-100">
                {currentIndex + 1}
             </div>
             <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Student</p>
                <p className="text-sm font-black text-slate-900 leading-none">{studentName}</p>
             </div>
          </div>
          <div className="text-center">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Evaluation In Progress</p>
             <p className="text-xs font-black text-slate-900">{quiz.title}</p>
          </div>
          <div className="flex items-center gap-2 text-slate-400 font-black text-sm">
             <span className="text-indigo-600">{currentIndex + 1}</span> / {quiz.questions.length}
          </div>
       </header>

       <main className="flex-1 overflow-y-auto p-12 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
          <div className="max-w-3xl mx-auto space-y-12">
             <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-12"
                >
                   <div className="text-center">
                      <MathRenderer content={currentQuestion.question} className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight mb-4" />
                      <div className="inline-flex gap-2">
                        <span className="bg-white border border-slate-200 text-slate-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{currentQuestion.difficulty}</span>
                        <span className="bg-white border border-slate-200 text-slate-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{currentQuestion.depth_of_knowledge}</span>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentQuestion.options.map((opt, i) => (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelect(i)}
                          className={cn(
                            "group p-8 rounded-[32px] border-3 text-left transition-all relative overflow-hidden flex items-center gap-6",
                            answers[currentIndex] === i 
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-2xl shadow-indigo-200" 
                              : "bg-white border-slate-100 text-slate-600 hover:border-indigo-600"
                          )}
                        >
                           <div className={cn(
                             "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 shadow-sm transition-all",
                             answers[currentIndex] === i 
                               ? "bg-white text-indigo-600" 
                               : "bg-slate-50 text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                           )}>
                              {i + 1}
                           </div>
                           <MathRenderer content={opt} className={cn("text-lg font-black transition-colors", answers[currentIndex] === i ? "text-white" : "text-slate-800")} />
                        </motion.button>
                      ))}
                   </div>
                </motion.div>
             </AnimatePresence>

             <footer className="pt-8 flex justify-between items-center gap-4">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(currentIndex - 1)}
                  className="px-8 py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all disabled:opacity-30"
                >
                  Previous
                </button>

                {currentIndex === quiz.questions.length - 1 ? (
                  <button
                    disabled={answers[currentIndex] === -1 || isSubmitting}
                    onClick={handleSubmit}
                    className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-3 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} strokeWidth={3} />}
                    Complete Analysis
                  </button>
                ) : (
                  <button
                    disabled={answers[currentIndex] === -1}
                    onClick={() => setCurrentIndex(currentIndex + 1)}
                    className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center gap-3 disabled:opacity-50"
                  >
                    Next Question <ChevronRight size={20} strokeWidth={3} />
                  </button>
                )}
             </footer>
          </div>
       </main>
    </div>
  );
}
