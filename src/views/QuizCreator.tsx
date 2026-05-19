import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Loader2, ArrowLeft, Plus, CheckCircle, 
  Copy, Folder, BookOpen, Presentation, UserCheck, AlertCircle 
} from 'lucide-react';
import { addRoomHelper, getRoomsHelper, isLocalStorageOnly } from '../lib/dbHelper';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';

export default function QuizCreator() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('기본 수업');
  const [folders, setFolders] = useState<string[]>(['기본 수업']);
  const [newFolderInput, setNewFolderInput] = useState('');
  const [showNewFolderForm, setShowNewFolderForm] = useState(false);
  
  const [isCreating, setIsCreating] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<{ code: string; title: string } | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Load existing folders from rooms to let teachers select
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const roomsList = await getRoomsHelper();
        const folderSet = new Set<string>(['기본 수업']);
        roomsList.forEach(room => {
          if (room.folder_name) {
            folderSet.add(room.folder_name);
          }
        });
        setFolders(Array.from(folderSet));
      } catch (err) {
        console.error("Failed to load folders:", err);
      }
    };
    fetchFolders();
  }, []);

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isCreating) return;

    setIsCreating(true);
    const code = generateInviteCode();
    
    try {
      await addRoomHelper({
        title: title.trim(),
        room_code: code,
        folder_name: selectedFolder,
        teacher_id: auth.currentUser?.uid || 'temp_teacher',
        created_at: new Date().toISOString()
      });

      setCreatedRoom({ code, title: title.trim() });
    } catch (err: any) {
      console.error(err);
      alert(err.message || '수업 방 개설에 실패했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddFolder = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newFolderInput.trim()) return;
    if (!folders.includes(newFolderInput.trim())) {
      setFolders(prev => [...prev, newFolderInput.trim()]);
    }
    setSelectedFolder(newFolderInput.trim());
    setNewFolderInput('');
    setShowNewFolderForm(false);
  };

  const handleCopyCode = () => {
    if (!createdRoom) return;
    navigator.clipboard.writeText(createdRoom.code);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-8 lg:p-12 flex justify-center bg-black/10">
      <div className="w-full max-w-2xl">
        <button 
          onClick={() => navigate('/')}
          className="mb-8 flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-all uppercase tracking-widest"
        >
          <ArrowLeft size={14} /> 모니터링판으로 돌아가기
        </button>

        {isLocalStorageOnly() && (
          <div className="ios-glass rounded-[20px] p-4 mb-6 border border-amber-500/25 bg-amber-500/10 text-xs font-semibold text-amber-300 flex items-center gap-3">
            <AlertCircle size={16} strokeWidth={2.5} className="text-amber-400" />
            <span>파이어베이스 권한 제한으로 인해 <strong>'로컬 브라우저 저장소 모드'</strong>로 자동 전환되었습니다. 교사-학생 복습 및 잼봇 피드백 기능은 동일하게 정상 작동합니다! 🚀</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {!createdRoom ? (
            <motion.div
              key="creator-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="ios-glass rounded-[40px] p-10 border border-white/10 shadow-2xl relative text-white"
            >
              <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              
              <header className="mb-10">
                <div className="inline-flex p-3 bg-gradient-to-br from-amber-500 to-rose-500 rounded-2xl mb-4 shadow-lg shadow-orange-500/10">
                  <Presentation size={22} className="text-white" />
                </div>
                <h2 className="text-2xl font-black tracking-tight">새 복습 수업방 생성</h2>
                <p className="text-xs text-white/50 font-medium leading-relaxed mt-1">
                  학생들이 복습하고 잼봇 피드백을 받을 수 있는 고유 세션을 만듭니다.
                </p>
              </header>

              <form onSubmit={handleCreateRoom} className="space-y-8">
                {/* 1. Room Title Input */}
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest">수업 방 이름 (주제)</label>
                  <input 
                    type="text" 
                    placeholder="예: 5학년 1학기 과학 - 식물의 구조"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white placeholder:text-white/20 focus:bg-white/10 focus:border-orange-500/40 focus:ring-4 focus:ring-orange-500/5 outline-none transition-all"
                    required
                  />
                </div>

                {/* 2. Folder Selection */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest">소속 폴더 지정</label>
                    <button
                      type="button"
                      onClick={() => setShowNewFolderForm(!showNewFolderForm)}
                      className="text-[10px] font-bold text-orange-400 hover:text-orange-300 transition-all"
                    >
                      {showNewFolderForm ? '선택창으로 돌아가기' : '+ 새 폴더 추가'}
                    </button>
                  </div>

                  {showNewFolderForm ? (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="새 폴더 이름 입력"
                        value={newFolderInput}
                        onChange={e => setNewFolderInput(e.target.value)}
                        className="flex-1 p-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white outline-none"
                      />
                      <button
                        onClick={handleAddFolder}
                        className="px-5 py-4 bg-white/10 hover:bg-white/15 rounded-2xl text-xs font-bold transition-all"
                      >
                        추가
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2.5">
                      {folders.map(folder => (
                        <button
                          key={folder}
                          type="button"
                          onClick={() => setSelectedFolder(folder)}
                          className={cn(
                            "px-4.5 py-3 rounded-2xl text-xs font-bold border transition-all flex items-center gap-2",
                            selectedFolder === folder 
                              ? "bg-white/10 border-white/15 text-white shadow-md" 
                              : "border-transparent text-white/40 hover:text-white bg-white/3"
                          )}
                        >
                          <Folder size={12} className={selectedFolder === folder ? "text-orange-400" : "text-white/20"} />
                          {folder}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full py-5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:shadow-orange-500/25 transition-all flex items-center justify-center gap-2.5 glow-orange"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="animate-spin" size={16} strokeWidth={2.5} /> 수업방 개설 중...
                    </>
                  ) : (
                    <>
                      <Presentation size={16} strokeWidth={2.5} /> 수업 세션 방 개설하기
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="creator-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="ios-glass rounded-[40px] p-10 border border-white/10 shadow-2xl relative text-center text-white space-y-8"
            >
              <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-rose-500 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-orange-500/20 glow-orange">
                <CheckCircle size={32} strokeWidth={2.5} className="text-white animate-bounce" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black">수업방 개설 성공! 🎉</h2>
                <p className="text-sm font-medium text-white/50">
                  아래의 초대 코드를 복사하여 학생들에게 칠판에 크게 적어주세요.
                </p>
              </div>

              {/* Giant Room Code Display Card */}
              <div className="p-8 bg-white/3 border border-white/5 rounded-3xl max-w-sm mx-auto flex flex-col items-center gap-4 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />
                <span className="text-[10px] font-black tracking-widest text-white/30 uppercase leading-none">CLASSROOM INVITE CODE</span>
                
                <h1 className="text-5xl font-black tracking-widest text-orange-400 leading-none py-2 select-all font-mono">
                  {createdRoom.code}
                </h1>
                
                <button
                  onClick={handleCopyCode}
                  className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-[10px] font-bold text-white/60 hover:text-white flex items-center gap-1.5 transition-all"
                >
                  {copySuccess ? (
                    <>
                      <CheckCircle size={10} className="text-emerald-400" /> 복사 완료!
                    </>
                  ) : (
                    <>
                      <Copy size={10} /> 코드 클립보드 복사
                    </>
                  )}
                </button>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-4.5 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-bold tracking-widest border border-white/5 transition-all"
                >
                  교사용 모니터링판 바로가기
                </button>
                <button
                  onClick={() => navigate(`/quiz/${createdRoom.code}`)}
                  className="px-6 py-4.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  학생 대기방으로 직접 들어가기 <ArrowLeft className="rotate-180" size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
