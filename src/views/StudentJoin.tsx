import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, User, Search, Loader2, Hash, Rocket, Users } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function StudentJoin() {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode || !studentName) return;

    setIsLoading(true);
    setError('');
    
    try {
      const q = query(collection(db, 'quizzes'), where('invite_code', '==', inviteCode.toUpperCase()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setError('올바른 초대 코드를 입력해주세요.');
        setIsLoading(false);
      } else {
        localStorage.setItem('studentName', studentName);
        navigate(`/quiz/${inviteCode.toUpperCase()}`);
      }
    } catch (e: any) {
      console.error(e);
      setError('접속 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="bg-white rounded-[48px] p-16 shadow-2xl border border-slate-200 relative overflow-hidden">
           <div className="absolute top-0 inset-x-0 h-3 bg-indigo-600" />
           <div className="absolute top-0 right-0 p-8">
              <div className="bg-slate-50 w-16 h-16 rounded-[24px] flex items-center justify-center text-slate-300">
                <Users size={32} strokeWidth={2.5} />
              </div>
           </div>

           <header className="mb-12">
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">AI 맞춤형 평가</h1>
              <p className="text-slate-400 font-medium text-lg leading-relaxed">준비되셨나요? 초대 코드와 이름을 입력하고 시작하세요.</p>
           </header>

           <form onSubmit={handleJoin} className="space-y-8">
              <div className="space-y-4">
                 <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                       <Hash size={24} strokeWidth={3} />
                    </div>
                    <input 
                      type="text" 
                      placeholder="초대 코드 (6자리)" 
                      value={inviteCode}
                      onChange={e => setInviteCode(e.target.value.toUpperCase())}
                      className="w-full pl-16 pr-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-3xl text-2xl font-black tracking-widest placeholder:text-slate-300 placeholder:font-bold focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all uppercase"
                      maxLength={6}
                      required
                    />
                 </div>

                 <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                       <User size={24} strokeWidth={3} />
                    </div>
                    <input 
                      type="text" 
                      placeholder="이름 입력" 
                      value={studentName}
                      onChange={e => setStudentName(e.target.value)}
                      className="w-full pl-16 pr-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-3xl text-2xl font-black placeholder:text-slate-300 placeholder:font-bold focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                      required
                    />
                 </div>
              </div>

              {error && <p className="text-rose-500 text-xs font-black uppercase tracking-widest text-center">{error}</p>}

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
                className="w-full py-6 bg-slate-900 text-white rounded-3xl text-xl font-black flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all uppercase tracking-widest disabled:opacity-50"
              >
                 {isLoading ? <Loader2 className="animate-spin" size={24} strokeWidth={3} /> : <Rocket size={24} strokeWidth={3} />}
                 입장하기
              </motion.button>
           </form>

           <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
              <span>Powered by Gemini AI</span>
              <span>Secure Evaluation</span>
           </div>
        </div>

        <p className="mt-8 text-center text-slate-400 font-bold text-sm">
           교사이신가요? <button onClick={() => navigate('/')} className="text-indigo-600 hover:underline">선생님 대시보드로 이동</button>
        </p>
      </motion.div>
    </div>
  );
}
