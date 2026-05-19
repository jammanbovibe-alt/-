import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, BarChart3, Clock, ChevronRight } from 'lucide-react';
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
    <div className="p-8">
      <header className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">선생님 대시보드</h1>
          <p className="text-slate-500 font-medium">새로운 맞춤형 문항을 제작하고 학생들의 학습 데이터를 분석하세요.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/create')}
          className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all text-sm uppercase tracking-tight"
        >
          <Plus size={20} strokeWidth={3} />
          새 문항 제작하기
        </motion.button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard title="진행 중인 퀴즈" value={quizzes.filter(q => q.status === 'published').length} icon={Clock} color="indigo" />
        <StatCard title="총 참여 학생" value="--" icon={Users} color="slate" />
        <StatCard title="평균 정답률" value="--" icon={BarChart3} color="indigo" />
      </div>

      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">최근 제작 문항</h2>
          <button className="text-indigo-600 font-bold text-xs hover:underline flex items-center gap-1 uppercase tracking-wider">
            전체 보기 <ChevronRight size={14} strokeWidth={3} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 border-dashed p-16 text-center shadow-sm">
            <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <FileText className="text-slate-300" size={32} />
            </div>
            <p className="text-slate-500 mb-8 font-bold">아직 제작된 문항이 없습니다.</p>
            <button
               onClick={() => navigate('/create')}
               className="text-indigo-600 font-black hover:underline uppercase text-sm tracking-tight"
            >
              첫 번째 문항 제작 시작하기
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

      {/* Featured Banner */}
      <div className="mt-16 bg-slate-900 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 group-hover:bg-indigo-500/20 transition-all duration-700" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-md">
            <h3 className="text-2xl font-black mb-3 text-white tracking-tight">AI 맞춤형 평가 혁신</h3>
            <p className="text-slate-400 font-medium leading-relaxed">
              업로드한 문항을 분석하여 학생 개별 수준에 맞는 문제를 생성하고, 상세한 오답 유형을 리포트로 제공합니다.
            </p>
          </div>
          <button 
            onClick={() => navigate('/join')}
            className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/50 uppercase text-sm tracking-widest shrink-0"
          >
            학생 화면 체험하기
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center mb-4",
        color === "indigo" ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-600"
      )}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
    </div>
  );
}

function QuizCard({ quiz, index }: { quiz: Quiz, index: number }) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer flex justify-between items-center group relative overflow-hidden"
      onClick={() => navigate(`/report/${quiz.id}`)}
    >
      <div className="relative z-10 flex-1">
        <div className="flex items-center gap-3 mb-3">
           <span className={cn(
             "px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest",
             quiz.status === 'published' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
           )}>
             {quiz.status === 'published' ? "Published" : "Draft"}
           </span>
           <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(quiz.created_at).toLocaleDateString()}</span>
        </div>
        <h3 className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors tracking-tight mb-4">{quiz.title}</h3>
        <div className="flex items-center gap-4 text-xs font-bold">
          <span className="flex items-center gap-1.5 text-slate-400"><FileText size={14} strokeWidth={3} /> {quiz.questions.length} Questions</span>
          <span className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg font-mono uppercase tracking-widest">{quiz.invite_code}</span>
        </div>
      </div>
      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 transition-all duration-300">
        <ChevronRight size={20} strokeWidth={3} className="text-slate-300 group-hover:text-white transition-colors" />
      </div>
    </motion.div>
  );
}

import { FileText } from 'lucide-react'; 
