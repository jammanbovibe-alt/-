import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Loader2, Hash, Sparkles, BookOpen } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';

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
      // Find room code in 'rooms' collection
      const q = query(collection(db, 'rooms'), where('room_code', '==', inviteCode.toUpperCase()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setError('올바른 수업 초대 코드를 입력해 주세요! (예: FJ839A)');
        setIsLoading(false);
      } else {
        localStorage.setItem('studentName', studentName);
        localStorage.setItem('roomCode', inviteCode.toUpperCase());
        navigate(`/quiz/${inviteCode.toUpperCase()}`);
      }
    } catch (e: any) {
      console.error(e);
      setError('클래스룸 접속에 실패했습니다. 초대 코드를 확인해 주세요.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen ios-wallpaper flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Dynamic blurred iOS 26 blobs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse duration-5000" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="ios-glass rounded-[40px] p-10 lg:p-14 shadow-2xl border border-white/10 relative overflow-hidden text-white">
          <div className="absolute top-0 left-1/4 right-1/4 h-[1.5px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          
          <header className="mb-12 text-center">
            <div className="inline-flex p-3.5 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 rounded-3xl mb-6 shadow-lg shadow-orange-500/20 glow-orange">
              <BookOpen size={28} className="text-white" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2 leading-tight">
              JamClass
            </h1>
            <p className="text-white/55 font-medium text-sm leading-relaxed max-w-sm mx-auto">
              초대 코드와 이름을 입력하고 복습 에디터와 소크라테스 잼봇 대화방에 입장하세요! 🚀
            </p>
          </header>

          <form onSubmit={handleJoin} className="space-y-8">
            <div className="space-y-4.5">
              {/* Invite Code Input */}
              <div className="relative group">
                <div className="absolute left-5.5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-orange-400 transition-colors">
                  <Hash size={20} strokeWidth={2.5} />
                </div>
                <input 
                  type="text" 
                  placeholder="초대 코드 (6자리)" 
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-xl font-extrabold tracking-widest placeholder:text-white/20 placeholder:font-bold focus:border-orange-500/50 focus:bg-white/10 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all uppercase text-white text-center"
                  maxLength={6}
                  required
                />
              </div>

              {/* Student Name Input */}
              <div className="relative group">
                <div className="absolute left-5.5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-orange-400 transition-colors">
                  <User size={20} strokeWidth={2.5} />
                </div>
                <input 
                  type="text" 
                  placeholder="이름을 입력하세요" 
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-lg font-bold placeholder:text-white/25 placeholder:font-bold focus:border-orange-500/50 focus:bg-white/10 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all text-white"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-rose-400 text-xs font-bold tracking-tight text-center bg-rose-500/10 border border-rose-500/15 py-3.5 rounded-xl animate-shake">
                {error}
              </p>
            )}

            <motion.button 
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              className="w-full py-5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white rounded-2xl text-base font-extrabold flex items-center justify-center gap-2.5 shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all uppercase tracking-wider disabled:opacity-50 glow-orange"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} strokeWidth={2.5} /> : <Sparkles size={20} strokeWidth={2.5} />}
              잼봇과 함께 복습하기
            </motion.button>
          </form>

          <div className="mt-12 pt-8 border-t border-white/5 flex justify-between items-center text-[10px] font-extrabold text-white/30 uppercase tracking-widest">
            <span>Powered by Gemini 1.5 Pro</span>
            <span>JamClass v2.0</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
