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
    <div className="h-full flex items-center justify-center font-sans text-white">
       <Loader2 className="animate-spin text-indigo-400" size={48} strokeWidth={2.5} />
    </div>
  );

  if (!quiz) return (
    <div className="p-12 text-white/40 font-bold font-sans">
      Quiz not found
    </div>
  );

  const avgScore = submissions.length > 0 
    ? Math.round(submissions.reduce((acc, s) => acc + s.analysis.score, 0) / submissions.length) 
    : 0;

  const avgAccuracy = submissions.length > 0
    ? Math.round((submissions.reduce((acc, s) => acc + s.analysis.accuracy, 0) / submissions.length) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full bg-transparent font-sans text-white">
       {/* Glass header for report view */}
       <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between shrink-0 relative">
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          <div className="flex items-center gap-4.5">
            <button 
              onClick={() => navigate('/')} 
              className="bg-white/5 hover:bg-white/10 border border-white/5 p-2.5 rounded-2xl text-white/55 hover:text-white transition-all shadow-sm"
            >
              <ArrowLeft size={16} strokeWidth={3} />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                 <h1 className="text-xl font-extrabold text-white tracking-tight leading-tight">{quiz.title}</h1>
                 <span className="bg-indigo-500/15 text-indigo-300 px-2.5 py-0.5 rounded-xl text-[9px] font-extrabold uppercase tracking-widest border border-indigo-500/20">
                    CODE: {quiz.invite_code}
                 </span>
              </div>
              <p className="text-[9px] text-white/40 font-extrabold uppercase tracking-widest mt-1">
                {new Date(quiz.created_at).toLocaleDateString()} · 참여 학생 {submissions.length}명
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex items-center gap-3.5 bg-white/5 border border-white/5 px-4 py-2 rounded-2xl">
               <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/10">
                 <Target size={16} strokeWidth={2.5} />
               </div>
               <div>
                  <p className="text-[8px] font-extrabold text-white/35 uppercase tracking-widest leading-none mb-1">Avg Score</p>
                  <p className="text-base font-extrabold text-white leading-none">{avgScore}점</p>
               </div>
            </div>
            <div className="flex items-center gap-3.5 bg-white/5 border border-white/5 px-4 py-2 rounded-2xl">
               <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/10">
                 <BarChart3 size={16} strokeWidth={2.5} />
               </div>
               <div>
                  <p className="text-[8px] font-extrabold text-white/35 uppercase tracking-widest leading-none mb-1">Accuracy</p>
                  <p className="text-base font-extrabold text-white leading-none">{avgAccuracy}%</p>
               </div>
            </div>
          </div>
       </header>

       <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Students List */}
          <aside className="w-80 border-r border-white/5 flex flex-col shrink-0 overflow-y-auto p-6 scrollbar-hide">
             <h2 className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Users size={12} strokeWidth={2.5} /> Student Participation ({submissions.length})
             </h2>
             <div className="space-y-3">
               {submissions.length === 0 ? (
                  <div className="bg-white/5 rounded-2xl p-12 text-center border border-white/5 shadow-inner">
                     <Users size={32} className="mx-auto text-white/20 mb-4" />
                     <p className="text-white/40 font-bold text-sm">참여한 학생이 없습니다.</p>
                  </div>
               ) : (
                  submissions.map((sub) => {
                    const isSelected = selectedSubmission?.id === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => setSelectedSubmission(sub)}
                        className={cn(
                          "w-full p-4.5 rounded-[22px] border transition-all text-left flex justify-between items-center group overflow-hidden relative",
                          isSelected 
                            ? "bg-white/10 border-white/15 shadow-lg shadow-black/10" 
                            : "bg-white/3 border border-white/5 hover:border-white/15"
                        )}
                      >
                        {isSelected && <div className="absolute left-0 inset-y-0 w-1.5 bg-gradient-to-b from-indigo-500 to-purple-500" />}
                        <div className="flex items-center gap-3.5">
                           <div className={cn(
                             "w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-base shadow-sm transition-all border",
                             isSelected ? "bg-indigo-600 border-white/10 text-white" : "bg-white/5 border-white/5 text-white/40 group-hover:text-white"
                           )}>
                              {sub.student_name[0]}
                           </div>
                           <div>
                              <p className="font-extrabold text-white tracking-tight text-sm leading-snug">{sub.student_name}</p>
                              <p className="text-[8px] font-extrabold text-white/30 uppercase tracking-widest mt-0.5">{sub.analysis.student_level}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-lg font-extrabold text-indigo-400 tracking-tight">{sub.analysis.score}점</p>
                        </div>
                      </button>
                    );
                  })
               )}
             </div>
          </aside>

          {/* Right Area: Detailed Report */}
          <section className="flex-1 overflow-y-auto p-8 lg:p-12 bg-black/10 relative">
             {selectedSubmission ? (
                <motion.div 
                  key={selectedSubmission.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, cubicBezier: [0.16, 1, 0.3, 1] }}
                  className="max-w-3xl mx-auto space-y-10"
                >
                   {/* Main Student details Card */}
                   <div className="ios-glass rounded-[40px] p-8 lg:p-12 border border-white/10 shadow-2xl relative overflow-hidden">
                      {/* Subtle top glare edge */}
                      <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      
                      <div className="absolute top-0 right-0 p-8">
                        <div className="bg-indigo-500/10 text-indigo-300 px-5 py-2.5 rounded-2xl font-extrabold flex items-center gap-2 shadow-inner border border-indigo-500/20 text-sm">
                           <Target size={18} strokeWidth={2.5} /> {selectedSubmission.analysis.score}점
                        </div>
                      </div>

                      <div className="flex items-center gap-6 mb-10 pb-6 border-b border-white/5">
                         <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-indigo-500/10">
                            {selectedSubmission.student_name[0]}
                         </div>
                         <div>
                            <h3 className="text-3xl font-extrabold text-white tracking-tight mb-2 leading-none">{selectedSubmission.student_name}</h3>
                            <div className="flex gap-2">
                              <span className="bg-white/5 text-white/55 font-extrabold px-3 py-1 rounded-xl text-[9px] uppercase tracking-widest border border-white/5">
                                등급: {selectedSubmission.analysis.student_level}
                              </span>
                              <span className="bg-emerald-500/10 text-emerald-400 font-extrabold px-3 py-1 rounded-xl text-[9px] uppercase tracking-widest border border-emerald-500/15">
                                Completed
                              </span>
                            </div>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                        <ReportDetailBox title="Strength & Insights" content={(selectedSubmission.analysis as any).strengths || "종합적인 풀이 능력이 우수함"} icon={CheckCircle2} color="emerald" />
                        <ReportDetailBox title="Areas for Growth" content={(selectedSubmission.analysis as any).weaknesses || "심화 응용 단계에서의 보완 필요"} icon={AlertCircle} color="amber" />
                      </div>

                      <div className="space-y-6">
                        <h4 className="font-black text-white/30 text-[9px] uppercase tracking-[0.25em] ml-1 mb-4 text-center">AI Diagnostics Details</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <DiagnosticSection title="검출된 오개념 분석 (Misconceptions)" items={selectedSubmission.analysis.misconception_types} color="rose" />
                          <DiagnosticSection title="부족한 핵심 개념 (Missing Concepts)" items={selectedSubmission.analysis.missing_concepts} color="amber" />
                        </div>
                        
                        <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-black/30 border border-white/5 rounded-[32px] p-7 text-white flex justify-between items-center shadow-xl relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-all duration-700 blur-xl" />
                           <div className="relative z-10">
                              <p className="text-[8px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-2">Next Recommended Level Focus</p>
                              <p className="text-xl font-extrabold tracking-tight text-white">{selectedSubmission.analysis.recommended_next_level}</p>
                           </div>
                           <div className="bg-white/5 border border-white/5 p-3.5 rounded-xl text-indigo-400">
                             <ChevronRight size={24} strokeWidth={3} />
                           </div>
                        </div>
                      </div>
                   </div>

                   {/* Student response detail view */}
                   <div className="space-y-6">
                      <h4 className="text-[9px] font-black text-white/30 uppercase tracking-widest text-center">문항별 세부 반응 분석</h4>
                      {quiz.questions.map((q, idx) => {
                         const studentAnswer = selectedSubmission.answers[idx];
                         const isCorrect = studentAnswer === q.answer;
                         return (
                            <div key={idx} className="ios-glass rounded-[32px] p-8 border border-white/10 shadow-sm relative overflow-hidden">
                               <div className={cn(
                                 "absolute top-0 left-0 w-1.5 h-full",
                                 isCorrect ? "bg-emerald-500" : "bg-rose-500"
                               )} />
                               
                               <div className="flex justify-between items-start mb-6">
                                  <div className="flex items-center gap-3.5">
                                     <div className={cn(
                                       "w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-base border shadow-sm",
                                       isCorrect ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                     )}>
                                        {idx + 1}
                                     </div>
                                     <p className="font-extrabold text-white tracking-tight leading-snug">{isCorrect ? "정답 처리됨" : "오답 반응 관찰"}</p>
                                  </div>
                                  {!isCorrect && (
                                     <span className="bg-rose-500/10 text-rose-400 border border-rose-500/15 px-3 py-1 rounded-xl text-[9px] font-extrabold uppercase tracking-widest">
                                       분석 대상
                                     </span>
                                  )}
                               </div>
                               <MathRenderer content={q.question} className="text-xl font-extrabold text-white mb-8 leading-snug tracking-tight" />
                               
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className={cn(
                                    "p-5 rounded-[22px] border-2 flex flex-col gap-1.5", 
                                    isCorrect ? "border-emerald-500/15 bg-emerald-500/5 text-emerald-300" : "border-rose-500/15 bg-rose-500/5 text-rose-300"
                                  )}>
                                     <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">학생 응답</span>
                                     <MathRenderer content={q.options[studentAnswer] || "무응답"} className="font-bold text-sm leading-tight" />
                                  </div>
                                  {!isCorrect && (
                                    <div className="p-5 rounded-[22px] border-2 border-emerald-500/15 bg-emerald-500/5 text-emerald-300 flex flex-col gap-1.5">
                                       <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">모범 정답</span>
                                       <MathRenderer content={q.options[q.answer]} className="font-bold text-sm leading-tight" />
                                    </div>
                                  )}
                               </div>
                            </div>
                         );
                      })}
                   </div>
                </motion.div>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-24">
                   <div className="bg-white/5 border border-white/5 w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-white/20 shadow-inner">
                      <User size={48} strokeWidth={2.5} />
                   </div>
                   <h3 className="text-xl font-extrabold text-white mb-2 tracking-tight">학생 데이터를 선택하세요</h3>
                   <p className="text-white/40 font-medium text-sm max-w-sm mx-auto leading-relaxed">
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
    emerald: "bg-emerald-500/5 text-emerald-300 border-emerald-500/15",
    amber: "bg-amber-500/5 text-amber-300 border-amber-500/15"
  };
  return (
    <div className={cn("p-5.5 rounded-[24px] border-2 shadow-sm", styles[color])}>
       <div className="flex items-center gap-2.5 mb-3.5 border-b border-white/5 pb-2">
          <Icon size={14} strokeWidth={2.5} />
          <h4 className="font-black text-[9px] uppercase tracking-widest leading-none mt-0.5">{title}</h4>
       </div>
       <p className="text-xs font-semibold leading-relaxed text-white/80">{content}</p>
    </div>
  );
}

function DiagnosticSection({ title, items, color }: { title: string, items: string[], color: 'rose' | 'amber' }) {
  const styles = {
    rose: "bg-rose-500/5 border-rose-500/15 text-rose-300",
    amber: "bg-amber-500/5 border-amber-500/15 text-amber-300"
  };
  return (
    <div className={cn("p-5.5 rounded-[24px] border-2 shadow-inner", styles[color] || "bg-white/5 border-white/10")}>
       <h4 className="text-[9px] font-black text-white/35 uppercase tracking-widest mb-4 inline-block px-1 pb-1">{title}</h4>
       <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
             <span key={i} className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-[10px] font-bold text-white shadow-sm">
                {item}
             </span>
          ))}
          {items.length === 0 && <span className="text-white/20 italic text-[10px] font-semibold">데이터 없음</span>}
       </div>
    </div>
  );
}
