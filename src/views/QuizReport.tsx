import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Submission, Quiz } from '../types';
import { 
  Users, 
  ArrowLeft, 
  BarChart3, 
  Target, 
  Clock, 
  ChevronRight, 
  User,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { MathRenderer } from '../components/MathRenderer';

export default function QuizReport() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const quizSnap = await getDoc(doc(db, 'quizzes', quizId!));
        if (quizSnap.exists()) {
          setQuiz({ id: quizSnap.id, ...quizSnap.data() } as Quiz);
        }

        const q = query(collection(db, 'submissions'), where('quiz_id', '==', quizId));
        const subSnap = await getDocs(q);
        const subData = subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
        setSubmissions(subData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [quizId]);

  if (loading) return (
    <div className="h-full flex items-center justify-center">
       <Loader2 className="animate-spin text-indigo-600" size={48} strokeWidth={3} />
    </div>
  );

  if (!quiz) return <div className="p-12 text-slate-400 font-bold">Quiz not found</div>;

  const avgScore = submissions.length > 0 
    ? Math.round(submissions.reduce((acc, s) => acc + s.analysis.score, 0) / submissions.length) 
    : 0;

  const avgAccuracy = submissions.length > 0
    ? Math.round((submissions.reduce((acc, s) => acc + s.analysis.accuracy, 0) / submissions.length) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full bg-slate-50">
       <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
              <ArrowLeft size={20} strokeWidth={3} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                 <h1 className="text-xl font-black text-slate-900 tracking-tight">{quiz.title}</h1>
                 <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                    CODE: {quiz.invite_code}
                 </span>
              </div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">
                {new Date(quiz.created_at).toLocaleDateString()} · 참여 학생 {submissions.length}명
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex items-center gap-4 bg-slate-50 px-5 py-2 rounded-2xl border border-slate-100">
               <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                 <Target size={18} strokeWidth={3} />
               </div>
               <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Avg Score</p>
                  <p className="text-lg font-black text-slate-900 leading-none">{avgScore}점</p>
               </div>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 px-5 py-2 rounded-2xl border border-slate-100">
               <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                 <BarChart3 size={18} strokeWidth={3} />
               </div>
               <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Accuracy</p>
                  <p className="text-lg font-black text-slate-900 leading-none">{avgAccuracy}%</p>
               </div>
            </div>
          </div>
       </header>

       <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Students List */}
          <aside className="w-85 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto p-6 scrollbar-hide">
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Users size={14} strokeWidth={3} /> Student Participation ({submissions.length})
             </h2>
             <div className="space-y-3">
               {submissions.length === 0 ? (
                  <div className="bg-slate-50 rounded-2xl p-12 text-center border border-slate-100">
                     <Users size={32} className="mx-auto text-slate-200 mb-4" />
                     <p className="text-slate-400 font-bold text-sm">결과 없음</p>
                  </div>
               ) : (
                  submissions.map((sub) => (
                     <button
                      key={sub.id}
                      onClick={() => setSelectedSubmission(sub)}
                      className={cn(
                         "w-full p-5 rounded-[22px] border-2 transition-all text-left flex justify-between items-center group overflow-hidden relative",
                         selectedSubmission?.id === sub.id 
                            ? "border-indigo-600 bg-indigo-50/50 shadow-lg shadow-indigo-100" 
                            : "border-slate-50 bg-slate-50/50 hover:border-slate-200"
                      )}
                     >
                        {selectedSubmission?.id === sub.id && <div className="absolute left-0 inset-y-0 w-1 bg-indigo-600" />}
                        <div className="flex items-center gap-4">
                           <div className={cn(
                             "w-11 h-11 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm transition-all",
                             selectedSubmission?.id === sub.id ? "bg-indigo-600 text-white" : "bg-white text-slate-400"
                           )}>
                              {sub.student_name[0]}
                           </div>
                           <div>
                              <p className="font-black text-slate-900 tracking-tight">{sub.student_name}</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{sub.analysis.student_level}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-xl font-black text-indigo-600 tracking-tighter">{sub.analysis.score}점</p>
                        </div>
                     </button>
                  ))
               )}
             </div>
          </aside>

          {/* Right Area: Detailed Report */}
          <section className="flex-1 overflow-y-auto p-12 bg-slate-50">
             {selectedSubmission ? (
                <motion.div 
                  key={selectedSubmission.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="max-w-3xl mx-auto space-y-10"
                >
                   <div className="bg-white rounded-[40px] p-12 border border-slate-200 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-10">
                        <div className="bg-indigo-600/10 text-indigo-600 px-5 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-inner border border-indigo-100">
                           <Target size={20} strokeWidth={3} /> {selectedSubmission.analysis.score}점
                        </div>
                      </div>

                      <div className="flex items-center gap-8 mb-12">
                         <div className="w-24 h-24 rounded-[32px] bg-slate-900 flex items-center justify-center text-white text-4xl font-black shadow-2xl">
                            {selectedSubmission.student_name[0]}
                         </div>
                         <div>
                            <h3 className="text-4xl font-black text-slate-900 tracking-tight mb-2">{selectedSubmission.student_name}</h3>
                            <div className="flex gap-2">
                              <span className="bg-slate-100 text-slate-500 font-black px-4 py-1.5 rounded-xl text-[10px] uppercase tracking-widest border border-slate-200">
                                현 수준: {selectedSubmission.analysis.student_level}
                              </span>
                              <span className="bg-emerald-50 text-emerald-600 font-black px-4 py-1.5 rounded-xl text-[10px] uppercase tracking-widest border border-emerald-100">
                                Completed
                              </span>
                            </div>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 mb-12">
                        <ReportDetailBox title="Strength" content={(selectedSubmission.analysis as any).strengths || "종합적인 풀이 능력이 우수함"} icon={CheckCircle2} color="emerald" />
                        <ReportDetailBox title="Area for Growth" content={(selectedSubmission.analysis as any).weaknesses || "심화 응용 단계에서의 보완 필요"} icon={AlertCircle} color="amber" />
                      </div>

                      <div className="space-y-6">
                        <h4 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.3em] ml-1 mb-4 text-center">AI Diagnostics Details</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <DiagnosticSection title="오답 유형 (Misconceptions)" items={selectedSubmission.analysis.misconception_types} color="rose" />
                          <DiagnosticSection title="부족한 개념 (Missing Concepts)" items={selectedSubmission.analysis.missing_concepts} color="amber" />
                        </div>
                        
                        <div className="bg-indigo-900 rounded-[32px] p-8 text-white flex justify-between items-center shadow-2xl relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16" />
                           <div className="relative z-10">
                              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">Next Recommended Focus</p>
                              <p className="text-2xl font-black tracking-tight">{selectedSubmission.analysis.recommended_next_level}</p>
                           </div>
                           <div className="bg-white/10 p-4 rounded-2xl text-indigo-300">
                             <ChevronRight size={32} strokeWidth={3} />
                           </div>
                        </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">문항별 세부 반응 분석</h4>
                      {quiz.questions.map((q, idx) => {
                         const studentAnswer = selectedSubmission.answers[idx];
                         const isCorrect = studentAnswer === q.answer;
                         return (
                            <div key={idx} className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm">
                               <div className="flex justify-between items-start mb-6">
                                  <div className="flex items-center gap-4">
                                     <div className={cn(
                                       "w-10 h-10 rounded-2xl flex items-center justify-center font-black",
                                       isCorrect ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                                     )}>
                                        {idx + 1}
                                     </div>
                                     <p className="font-black text-slate-800 tracking-tight">{isCorrect ? "정답 처리됨" : "오답 반응 관찰"}</p>
                                  </div>
                                  {!isCorrect && (
                                     <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">분석 필요</span>
                                  )}
                               </div>
                               <MathRenderer content={q.question} className="text-xl font-black text-slate-800 mb-8 leading-tight" />
                               
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className={cn("p-5 rounded-2xl border-2 flex flex-col gap-1", isCorrect ? "border-emerald-100 bg-emerald-50/30" : "border-rose-100 bg-rose-50/30")}>
                                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">학생 응답</span>
                                     <MathRenderer content={q.options[studentAnswer] || "무응답"} className="font-black text-slate-700" />
                                  </div>
                                  {!isCorrect && (
                                    <div className="p-5 rounded-2xl border-2 border-emerald-100 bg-emerald-50/30 flex flex-col gap-1">
                                       <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">모범 정답</span>
                                       <MathRenderer content={q.options[q.answer]} className="font-black text-emerald-700" />
                                    </div>
                                  )}
                               </div>
                            </div>
                         );
                      })}
                   </div>
                </motion.div>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-32">
                   <div className="bg-white w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto mb-8 text-slate-200 shadow-sm border border-slate-100">
                      <User size={48} strokeWidth={3} />
                   </div>
                   <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">학생 데이터를 선택하세요</h3>
                   <p className="text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
                      학생을 선택하면 AI가 분석한 세부 오답 유형과 학습 강점 리포트를 확인할 수 있습니다.
                   </p>
                </div>
             )}
          </section>
       </div>
    </div>
  );
}

function ReportDetailBox({ title, content, icon: Icon, color }: { title: string, content: string, icon: any, color: 'emerald' | 'amber' }) {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100"
  };
  return (
    <div className={cn("p-6 rounded-[24px] border-2 shadow-sm", styles[color])}>
       <div className="flex items-center gap-2 mb-3">
          <Icon size={16} strokeWidth={3} />
          <h4 className="font-black text-[10px] uppercase tracking-widest">{title}</h4>
       </div>
       <p className="text-xs font-bold leading-relaxed">{content}</p>
    </div>
  );
}

function DiagnosticSection({ title, items, color }: { title: string, items: string[], color: 'rose' | 'amber' }) {
  const styles = {
    rose: "bg-rose-100 text-rose-700",
    amber: "bg-amber-100 text-amber-700"
  };
  return (
    <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 shadow-inner">
       <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 inline-block px-1 border-b border-slate-200 pb-1">{title}</h4>
       <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
             <span key={i} className={cn("px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight", styles[color])}>
                {item}
             </span>
          ))}
          {items.length === 0 && <span className="text-slate-300 italic text-[10px] font-bold">감지되지 않음</span>}
       </div>
    </div>
  );
}
