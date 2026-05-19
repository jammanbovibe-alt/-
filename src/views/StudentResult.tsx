import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Submission, Quiz } from '../types';
import { 
  Target, 
  BrainCircuit, 
  CheckCircle2, 
  Loader2,
  Users,
  X,
  Sparkles
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
    <div className="h-screen ios-wallpaper flex items-center justify-center font-sans text-white">
       <Loader2 className="animate-spin text-indigo-400" size={64} strokeWidth={2.5} />
    </div>
  );

  if (!submission || !quiz) return (
    <div className="p-12 text-center text-white/40 font-black uppercase tracking-widest font-sans">
      결과를 찾을 수 없습니다.
    </div>
  );

  const { analysis } = submission;
  const accuracy = Math.round(analysis.accuracy * 100);

  return (
    <div className="min-h-screen ios-wallpaper p-6 pb-20 relative overflow-hidden font-sans text-white">
      {/* Interactive blurred background blobs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse duration-5000" />
      
      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        {/* Main Score & Analytics Box */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, cubicBezier: [0.16, 1, 0.3, 1] }}
          className="ios-glass rounded-[40px] p-10 lg:p-16 shadow-2xl border border-white/10 relative overflow-hidden text-center"
        >
          {/* Subtle top glare edge */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[1.5px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          
          <div className="absolute top-0 right-0 p-8">
            <button 
              onClick={() => navigate('/join')}
              className="bg-white/5 hover:bg-white/10 border border-white/5 p-3 rounded-2xl text-white/55 hover:text-white transition-all shadow-sm"
              title="종료"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          <div className="inline-flex flex-col items-center mb-12">
            <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 w-20 h-20 rounded-[28px] flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-500/20 glow-purple">
              <Target size={38} strokeWidth={2.5} />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2 leading-tight">
              분석 결과 리포트
            </h1>
            <p className="text-white/55 font-medium text-sm max-w-md mx-auto">
              수고하셨습니다, <span className="text-white font-extrabold">{submission.student_name}</span>님! AI가 학습 패턴과 수학적 오개념을 완벽하게 분석했습니다.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <ResultStatBox label="Score" value={`${analysis.score}점`} sub="Total Points" icon={CheckCircle2} color="purple" />
            <ResultStatBox label="Accuracy" value={`${accuracy}%`} sub="Correct Answers" icon={Target} color="indigo" />
            <ResultStatBox label="Level" value={analysis.student_level} sub="Current Grade" icon={Users} color="emerald" />
          </div>

          {/* Deep Feedback Panel */}
          <div className="bg-white/5 border border-white/5 rounded-[32px] p-8 lg:p-10 text-white shadow-2xl relative overflow-hidden group mb-8 text-left">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 group-hover:bg-indigo-500/10 transition-all duration-700 blur-xl" />
            
            <div className="flex items-center gap-3.5 mb-8 border-b border-white/5 pb-4">
              <div className="bg-indigo-600/20 p-2.5 rounded-xl border border-indigo-500/30 text-indigo-300">
                <BrainCircuit size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-white leading-tight">AI 심층 학습 피드백</h2>
                <p className="text-[10px] text-white/30 font-semibold tracking-widest uppercase mt-0.5">Gemini 2.0 Evaluation System</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-3.5">Strength & Insights</h3>
                <p className="text-white/70 font-semibold text-sm leading-relaxed bg-white/5 p-5.5 rounded-2xl border border-white/5">
                  {(analysis as any).strengths || "기본 계산 메커니즘과 공식 이해도가 아주 뛰어납니다."}
                </p>
              </div>
              <div>
                <h3 className="text-[10px] font-black text-pink-300 uppercase tracking-widest mb-3.5">Improvement Focus</h3>
                <p className="text-white/70 font-semibold text-sm leading-relaxed bg-white/5 p-5.5 rounded-2xl border border-white/5">
                  {(analysis as any).weaknesses || "다소 복합적인 개념 결합 유형에 대해서는 지속적인 훈련이 권장됩니다."}
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Recommended Next Level</h3>
                <p className="text-2xl font-extrabold tracking-tight text-indigo-300">{analysis.recommended_next_level}</p>
              </div>
              <button 
                onClick={() => navigate('/join')}
                className="bg-white/10 hover:bg-white/15 border border-white/10 text-white px-6 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all self-stretch sm:self-auto text-center"
              >
                새 평가 세션 시작
              </button>
            </div>
          </div>

          {/* Diagnostic Categorizations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
            <DiagnosticCategory title="검출된 오개념 분석 (Misconceptions)" items={analysis.misconception_types} color="rose" />
            <DiagnosticCategory title="보완이 필요한 핵심 개념 (Missing Concepts)" items={analysis.missing_concepts} color="amber" />
          </div>
        </motion.div>

        {/* Detailed Question Review List */}
        <section className="space-y-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="h-[1px] w-12 bg-white/10" />
            <h2 className="text-xs font-black text-white/40 uppercase tracking-[0.25em]">Detailed Question Analysis</h2>
            <span className="h-[1px] w-12 bg-white/10" />
          </div>
          
          {quiz.questions.map((q, idx) => {
            const studentAnswer = submission.answers[idx];
            const isCorrect = studentAnswer === q.answer;
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="ios-glass rounded-[36px] p-8 lg:p-12 border border-white/10 shadow-lg relative overflow-hidden"
              >
                <div className={cn(
                  "absolute top-0 left-0 w-1.5 h-full",
                  isCorrect ? "bg-emerald-500" : "bg-rose-500"
                )} />
                
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-3.5">
                    <div className={cn(
                      "w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-lg border shadow-sm",
                      isCorrect 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    )}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-[9px] font-extrabold text-white/40 uppercase tracking-widest leading-none mb-1">Question Status</p>
                      <p className={cn("text-base font-extrabold tracking-tight", isCorrect ? "text-emerald-400" : "text-rose-400")}>
                        {isCorrect ? "정답입니다!" : "다시 확인이 필요해요"}
                      </p>
                    </div>
                  </div>
                </div>

                <MathRenderer content={q.question} className="text-2xl font-extrabold text-white mb-8 leading-snug tracking-tight" />

                {/* Option Outcomes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <AnswerOutcome 
                    label="내 선택 답안" 
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

                {/* Solution Insights */}
                <div className="bg-white/5 border border-white/5 p-6 rounded-[24px]">
                  <div className="flex items-center gap-2.5 mb-4.5">
                    <div className="bg-indigo-500/20 p-2 border border-indigo-500/30 rounded-xl text-indigo-300">
                      <BrainCircuit size={16} strokeWidth={2.5} />
                    </div>
                    <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">AI 맞춤 해설 및 피드백</h4>
                  </div>
                  <p className="text-white/70 font-semibold text-sm leading-relaxed bg-white/5 p-5.5 rounded-xl border border-white/5">
                    {q.explanation}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </section>

        {/* Global Exit button */}
        <div className="text-center pt-8">
          <button 
            onClick={() => navigate('/join')}
            className="px-14 py-5 bg-white text-slate-900 rounded-[20px] text-sm font-extrabold uppercase tracking-widest shadow-2xl hover:bg-indigo-50 transition-all"
          >
            다른 퀴즈 풀러가기
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultStatBox({ label, value, sub, icon: Icon, color }: { label: string, value: string, sub: string, icon: any, color: string }) {
  const glows: Record<string, string> = {
    indigo: "from-indigo-500/10 to-blue-500/10 border-indigo-500/20 text-indigo-300 glow-blue",
    purple: "from-purple-500/10 to-pink-500/10 border-purple-500/20 text-purple-300 glow-purple",
    emerald: "from-emerald-400/10 to-teal-500/10 border-emerald-500/20 text-emerald-400 glow-green",
  };

  return (
    <div className="ios-glass-interactive rounded-[28px] p-6.5 flex flex-col items-center text-center border border-white/5">
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border bg-gradient-to-br",
        glows[color] || "from-slate-700/10 to-slate-800/10 border-white/10 text-white"
      )}>
        <Icon size={22} strokeWidth={2.5} />
      </div>
      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-extrabold text-white tracking-tight mb-1">{value}</p>
      <p className="text-[9px] font-semibold text-white/20 uppercase tracking-wider">{sub}</p>
    </div>
  );
}

function DiagnosticCategory({ title, items, color }: { title: string, items: string[], color: 'rose' | 'amber' }) {
  const tints: Record<string, string> = {
    rose: "bg-rose-500/5 text-rose-400 border-rose-500/15",
    amber: "bg-amber-500/5 text-amber-400 border-amber-500/15"
  };
  return (
    <div className={cn("p-6.5 lg:p-8 rounded-[28px] border-2", tints[color] || "bg-white/5 border-white/10")}>
      <h4 className="text-[9px] font-black uppercase tracking-[0.2em] mb-5 text-white/40 text-center">{title}</h4>
      <div className="flex flex-wrap justify-center gap-2">
        {items.map((it, i) => (
          <span key={i} className="px-4.5 py-2 bg-white/5 border border-white/5 rounded-xl text-xs font-bold text-white shadow-sm">
            {it}
          </span>
        ))}
        {items.length === 0 && (
          <span className="text-white/20 font-semibold italic text-xs py-2">검출된 데이터가 없습니다.</span>
        )}
      </div>
    </div>
  );
}

function AnswerOutcome({ label, content, status }: { label: string, content: string, status: 'correct' | 'incorrect' | 'reference' }) {
  const styles = {
    correct: "border-emerald-500/20 bg-emerald-500/5 text-emerald-300",
    incorrect: "border-rose-500/20 bg-rose-500/5 text-rose-300",
    reference: "border-indigo-500/20 bg-indigo-500/5 text-indigo-300"
  };
  return (
    <div className={cn("p-5.5 rounded-[22px] border-2 flex flex-col gap-2", styles[status])}>
      <span className="text-[8px] font-black uppercase tracking-widest opacity-50">{label}</span>
      <MathRenderer content={content} className="font-extrabold text-base leading-tight" />
    </div>
  );
}
