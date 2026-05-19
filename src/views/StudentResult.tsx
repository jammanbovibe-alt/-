import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Submission, Quiz } from '../types';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  BrainCircuit, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  ChevronRight,
  ArrowRight,
  Users,
  X,
  AlertCircle
} from 'lucide-react';
import { MathRenderer } from '../components/MathRenderer';
import { cn } from '../lib/utils';

export default function StudentResult() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const subSnap = await getDoc(doc(db, 'submissions', submissionId!));
        if (subSnap.exists()) {
          const subData = { id: subSnap.id, ...subSnap.data() } as Submission;
          setSubmission(subData);
          
          const quizSnap = await getDoc(doc(db, 'quizzes', subData.quiz_id));
          if (quizSnap.exists()) {
            setQuiz({ id: quizSnap.id, ...quizSnap.data() } as Quiz);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [submissionId]);

  if (loading) return (
    <div className="h-screen bg-slate-50 flex items-center justify-center">
       <Loader2 className="animate-spin text-indigo-600" size={64} strokeWidth={3} />
    </div>
  );

  if (!submission || !quiz) return <div className="p-12 text-center text-slate-400 font-black uppercase tracking-widest">결과를 찾을 수 없습니다.</div>;

  const { analysis } = submission;
  const accuracy = Math.round(analysis.accuracy * 100);

  return (
    <div className="min-h-screen bg-slate-50 p-8 pb-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
      <div className="max-w-4xl mx-auto space-y-12">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[48px] p-16 shadow-2xl border border-slate-200 relative overflow-hidden text-center"
        >
           <div className="absolute top-0 inset-x-0 h-3 bg-indigo-600" />
           <div className="absolute top-0 right-0 p-12">
              <button 
                onClick={() => navigate('/join')}
                className="bg-slate-50 p-4 rounded-2xl text-slate-400 hover:text-indigo-600 transition-colors"
                title="종료"
              >
                <X size={24} strokeWidth={3} />
              </button>
           </div>

           <div className="inline-flex flex-col items-center mb-12">
              <div className="bg-indigo-50 w-24 h-24 rounded-[32px] flex items-center justify-center text-indigo-600 mb-6 shadow-lg shadow-indigo-100">
                <Target size={48} strokeWidth={2.5} />
              </div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">분석 결과 리포트</h1>
              <p className="text-slate-400 font-medium text-lg">수고하셨습니다, {submission.student_name}님! AI가 학습 패턴을 분석했습니다.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <ResultStatBox label="Score" value={`${analysis.score}점`} sub="Total Points" icon={CheckCircle2} />
              <ResultStatBox label="Accuracy" value={`${accuracy}%`} sub="Correct Answers" icon={Target} />
              <ResultStatBox label="Level" value={analysis.student_level} sub="Current Grade" icon={Users} />
           </div>

           <div className="bg-slate-900 rounded-[40px] p-12 text-white shadow-2xl relative overflow-hidden group mb-12">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 group-hover:bg-indigo-500/20 transition-all duration-700" />
              <div className="relative z-10 text-left">
                <div className="flex items-center gap-3 mb-6">
                   <div className="bg-indigo-600 p-3 rounded-xl text-white shadow-lg shadow-indigo-900/40">
                      <BrainCircuit size={24} strokeWidth={2.5} />
                   </div>
                   <h2 className="text-2xl font-black tracking-tight">AI 심층 학습 피드백</h2>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div>
                      <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Strength & Insights</h3>
                      <p className="text-slate-300 font-medium leading-relaxed bg-white/5 p-6 rounded-2xl border border-white/10">
                        {(analysis as any).strengths || "계산력이 우수하고 논리적인 풀이 과정을 잘 보여주고 있습니다."}
                      </p>
                   </div>
                   <div>
                      <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Improvement Focus</h3>
                      <p className="text-slate-300 font-medium leading-relaxed bg-white/5 p-6 rounded-2xl border border-white/10">
                        {(analysis as any).weaknesses || "복합 개념이 적용된 고난도 문항에 대해 조금 더 집중적인 연습이 필요합니다."}
                      </p>
                   </div>
                </div>

                <div className="mt-10 pt-8 border-t border-white/10 flex items-center justify-between">
                   <div>
                      <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Recommended Next Level</h3>
                      <p className="text-3xl font-black tracking-tighter text-white">{analysis.recommended_next_level}</p>
                   </div>
                   <button 
                    onClick={() => navigate('/join')}
                    className="bg-white text-slate-900 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all"
                   >
                     New Session
                   </button>
                </div>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
              <DiagnosticCategory title="Misconceptions detected" items={analysis.misconception_types} color="rose" />
              <DiagnosticCategory title="Missing core concepts" items={analysis.missing_concepts} color="amber" />
           </div>
        </motion.div>

        <section className="space-y-8">
           <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] text-center mb-4">Detailed Question Analysis</h2>
           {quiz.questions.map((q, idx) => {
              const studentAnswer = submission.answers[idx];
              const isCorrect = studentAnswer === q.answer;
              return (
                 <motion.div 
                   key={idx}
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   className="bg-white rounded-[40px] p-12 border border-slate-200 shadow-sm relative overflow-hidden"
                 >
                    <div className={cn(
                      "absolute top-0 left-0 w-2 h-full",
                      isCorrect ? "bg-emerald-500" : "bg-rose-500"
                    )} />
                    
                    <div className="flex justify-between items-start mb-10">
                       <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg",
                            isCorrect ? "bg-emerald-500 text-white shadow-emerald-100" : "bg-rose-500 text-white shadow-rose-100"
                          )}>
                             {idx + 1}
                          </div>
                          <div>
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Question Status</p>
                             <p className={cn("text-lg font-black tracking-tight", isCorrect ? "text-emerald-600" : "text-rose-600")}>
                                {isCorrect ? "정답입니다!" : "다시 확인이 필요해요"}
                             </p>
                          </div>
                       </div>
                    </div>

                    <MathRenderer content={q.question} className="text-2xl font-black text-slate-900 mb-10 leading-tight" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                        <AnswerOutcome 
                           label="내 선택" 
                           content={q.options[studentAnswer]} 
                           status={isCorrect ? 'correct' : 'incorrect'} 
                        />
                        {!isCorrect && (
                           <AnswerOutcome 
                              label="모범 정답" 
                              content={q.options[q.answer]} 
                              status="reference" 
                           />
                        )}
                    </div>

                    <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 mb-2">
                       <div className="flex items-center gap-3 mb-4">
                          <div className="bg-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center text-white">
                            <BrainCircuit size={16} strokeWidth={2.5} />
                          </div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI 맞춤 해설</h4>
                       </div>
                       <p className="text-slate-600 font-medium leading-relaxed bg-white p-6 rounded-2xl border border-slate-200">
                          {q.explanation}
                       </p>
                    </div>
                 </motion.div>
              );
           })}
        </section>

        <div className="text-center pt-8">
           <button 
             onClick={() => navigate('/join')}
             className="px-16 py-6 bg-slate-900 text-white rounded-3xl text-sm font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all"
           >
              다른 퀴즈 풀러가기
           </button>
        </div>
      </div>
    </div>
  );
}

function ResultStatBox({ label, value, sub, icon: Icon }: { label: string, value: string, sub: string, icon: any }) {
  return (
    <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 flex flex-col items-center text-center group hover:bg-indigo-50/50 hover:border-indigo-100 transition-all">
       <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-indigo-600 mb-4 shadow-sm border border-slate-200">
          <Icon size={28} strokeWidth={2.5} />
       </div>
       <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
       <p className="text-3xl font-black text-indigo-600 tracking-tighter mb-1">{value}</p>
       <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{sub}</p>
    </div>
  );
}

function DiagnosticCategory({ title, items, color }: { title: string, items: string[], color: 'rose' | 'amber' }) {
  const styles = {
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100"
  };
  return (
    <div className={cn("p-8 rounded-[32px] border-2", styles[color])}>
       <h4 className="text-[9px] font-black uppercase tracking-[0.25em] mb-6 text-slate-400 text-center">{title}</h4>
       <div className="flex flex-wrap justify-center gap-2">
          {items.map((it, i) => (
             <span key={i} className="px-5 py-2 bg-white rounded-2xl text-xs font-black shadow-sm border border-slate-100">{it}</span>
          ))}
          {items.length === 0 && <span className="text-slate-300 font-bold italic text-sm">데이터 없음</span>}
       </div>
    </div>
  );
}

function AnswerOutcome({ label, content, status }: { label: string, content: string, status: 'correct' | 'incorrect' | 'reference' }) {
  const styles = {
    correct: "border-emerald-100 bg-emerald-50/30 text-emerald-900",
    incorrect: "border-rose-100 bg-rose-50/30 text-rose-900",
    reference: "border-indigo-100 bg-indigo-50/30 text-indigo-900"
  };
  return (
    <div className={cn("p-6 rounded-[28px] border-2 flex flex-col gap-2", styles[status])}>
       <span className="text-[8px] font-black uppercase tracking-widest opacity-50">{label}</span>
       <MathRenderer content={content} className="font-black text-lg" />
    </div>
  );
}
