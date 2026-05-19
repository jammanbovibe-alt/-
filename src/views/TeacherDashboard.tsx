import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, BarChart3, Clock, ChevronRight, FileText, Sparkles } from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Quiz } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const q = query(collection(db, 'quizzes'), orderBy('created_at', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const quizData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quiz));
        setQuizzes(quizData);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Firebase not ready yet", e);
      setLoading(false);
    }
  }, []);

  return (
    <div className="p-8 lg:p-12 space-y-12">
      {/* Premium Apple Dashboard Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <Sparkles size={10} className="animate-pulse" /> EduAI Teacher Dashboard
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            선생님 대시보드
          </h1>
          <p className="text-white/50 font-medium text-sm mt-1.5">
            새로운 맞춤형 문항을 제작하고 학생들의 학습 데이터를 실시간 분석하세요.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/create')}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-7 py-4 rounded-[20px] font-extrabold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all text-sm tracking-tight border border-white/10 shrink-0 glow-purple"
        >
          <Plus size={18} strokeWidth={3} />
          새 문항 제작하기
        </motion.button>
      </header>

      {/* Control Center Grid (Stats Widgets) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="진행 중인 퀴즈" 
          value={quizzes.filter(q => q.status === 'published').length} 
          icon={Clock} 
          color="indigo" 
          description="실시간 참여가 가능한 시험지 수"
        />
        <StatCard 
          title="총 참여 학생" 
          value="--" 
          icon={Users} 
          color="purple" 
          description="전체 퀴즈에 참여한 학생 수"
        />
        <StatCard 
          title="평균 정답률" 
          value="--" 
          icon={BarChart3} 
          color="emerald" 
          description="학생들의 전반적인 문항 이해도"
        />
      </div>

      {/* Main List Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <h2 className="text-xs font-black text-white/40 uppercase tracking-widest">최근 제작 문항 목록</h2>
          <button className="text-indigo-400 font-bold text-xs hover:text-indigo-300 flex items-center gap-1 transition-colors uppercase tracking-wider">
            전체 보기 <ChevronRight size={14} strokeWidth={3} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="ios-glass rounded-[32px] p-16 text-center border border-white/5 shadow-inner">
            <div className="bg-white/5 border border-white/5 w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-sm">
              <FileText className="text-white/30" size={32} />
            </div>
            <p className="text-white/60 mb-6 font-bold text-lg">아직 제작된 시험지(문항)가 없습니다.</p>
            <button
               onClick={() => navigate('/create')}
               className="text-indigo-400 font-black hover:text-indigo-300 transition-colors uppercase text-sm tracking-tight inline-flex items-center gap-1.5"
            >
              첫 번째 문항 제작 시작하기 <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {quizzes.map((quiz, idx) => (
              <QuizCard key={quiz.id} quiz={quiz} index={idx} />
            ))}
          </div>
        )}
      </section>

      {/* Featured iOS 26 Intelligent Banner */}
      <div className="bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-black/30 border border-white/10 rounded-[32px] p-10 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full -mr-20 -mt-20 group-hover:bg-indigo-500/20 transition-all duration-700 blur-2xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="max-w-xl">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-block mb-3.5 shadow-sm">
              Intelligent Analytics
            </span>
            <h3 className="text-2xl font-black mb-3 text-white tracking-tight leading-tight">
              AI 기반 맞춤형 평가 분석 엔진
            </h3>
            <p className="text-white/50 font-medium text-sm leading-relaxed">
              업로드한 문항을 정밀 분석하여 학생의 수준에 맞는 수학 문항을 자동 출제하고, 
              학생의 미개념/오개념 요소를 심층 진단해주는 리포트를 제공합니다.
            </p>
          </div>
          <button 
            onClick={() => navigate('/join')}
            className="bg-white/10 hover:bg-white/15 text-white border border-white/10 px-8 py-4 rounded-2xl font-extrabold transition-all shadow-xl uppercase text-xs tracking-wider shrink-0"
          >
            학생 참여 화면 체험하기
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, description }: { title: string, value: string | number, icon: any, color: string, description: string }) {
  const colorGlows: Record<string, string> = {
    indigo: "from-indigo-500 to-blue-500 text-white glow-blue shadow-indigo-500/10",
    purple: "from-purple-500 to-pink-500 text-white glow-purple shadow-purple-500/10",
    emerald: "from-emerald-400 to-teal-500 text-white glow-green shadow-emerald-500/10",
  };

  return (
    <div className="ios-glass-interactive rounded-[28px] p-6.5 flex flex-col border border-white/5 shadow-xl relative overflow-hidden group">
      {/* Sleek top glow accent */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <div className="flex items-center justify-between mb-5">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br border border-white/10",
          colorGlows[color] || "from-slate-700 to-slate-800 text-white"
        )}>
          <Icon size={22} strokeWidth={2.5} />
        </div>
        <span className="text-[10px] font-extrabold text-white/30 uppercase tracking-widest">{title}</span>
      </div>
      
      <div className="space-y-1">
        <p className="text-4xl font-extrabold text-white tracking-tight">{value}</p>
        <p className="text-[11px] text-white/40 font-semibold tracking-tight">{description}</p>
      </div>
    </div>
  );
}

function QuizCard({ quiz, index }: { quiz: Quiz, index: number }) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, cubicBezier: [0.16, 1, 0.3, 1] }}
      onClick={() => navigate(`/report/${quiz.id}`)}
      className="ios-glass-interactive rounded-[28px] p-6 border border-white/5 shadow-lg flex justify-between items-center group relative overflow-hidden cursor-pointer"
    >
      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10 flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-2.5 mb-3">
          <span className={cn(
            "px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border",
            quiz.status === 'published' 
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
          )}>
            {quiz.status === 'published' ? "Published" : "Draft"}
          </span>
          <span className="text-[9px] font-semibold text-white/40 uppercase">
            {new Date(quiz.created_at).toLocaleDateString()}
          </span>
        </div>
        
        <h3 className="text-lg font-extrabold text-white group-hover:text-indigo-400 transition-colors tracking-tight leading-snug mb-4.5 truncate">
          {quiz.title}
        </h3>
        
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-white/40">
            <FileText size={13} strokeWidth={2.5} /> {quiz.questions.length} Questions
          </span>
          <span className="flex items-center gap-2 text-indigo-300 bg-indigo-500/15 border border-indigo-500/20 px-3 py-1 rounded-xl font-mono uppercase tracking-widest text-[10px]">
            {quiz.invite_code}
          </span>
        </div>
      </div>
      
      <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 shrink-0 shadow-sm text-white/40">
        <ChevronRight size={18} strokeWidth={3} className="group-hover:translate-x-0.5 transition-transform duration-300" />
      </div>
    </motion.div>
  );
}
