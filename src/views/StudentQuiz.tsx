import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Loader2, Sparkles, AlertCircle, BookOpen, ChevronRight, 
  Bold, Italic, Heading1, Heading2, Heading3, List, ImageIcon, Link as LinkIcon, CheckCircle2 
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { ChatMessage, StudentSubmission } from '../types';
import { cn } from '../lib/utils';

export default function StudentQuiz() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  
  const [studentName] = useState(localStorage.getItem('studentName') || '익명 학생');
  const [roomTitle, setRoomTitle] = useState('복습 클래스룸');
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentPhase, setCurrentPhase] = useState<'UNDERSTANDING_CHECK' | 'DEEPENING' | 'REAL_WORLD_TRANSFER' | 'COMPLETE'>('UNDERSTANDING_CHECK');
  
  const [loading, setLoading] = useState(true);
  const [submittingNote, setSubmittingNote] = useState(false);
  const [sendingChat, setSendingChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // 1. Tiptap Editor Initialization
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: `<h1>오늘 배운 내용을 여기에 요약해보세요!</h1><p>여기에 오늘 알게 된 핵심 단어나 흥미로웠던 원리를 블록 형태로 자유롭게 기록해 보세요. 글자 굵기나 제목 레벨을 사용하면 <strong>Jam봇</strong>이 노트를 훨씬 더 똑똑하게 이해할 수 있어요!</p>`,
  });

  // 2. Fetch Class Room and Existing Submission (if any)
  useEffect(() => {
    const initWorkspace = async () => {
      try {
        if (!inviteCode) return;
        
        // Fetch Room Title
        const roomQ = query(collection(db, 'rooms'), where('room_code', '==', inviteCode.toUpperCase()));
        const roomSnap = await getDocs(roomQ);
        if (!roomSnap.empty) {
          setRoomTitle(roomSnap.docs[0].data().title);
        }

        // Fetch Submission
        const subQ = query(
          collection(db, 'submissions'),
          where('room_code', '==', inviteCode.toUpperCase()),
          where('student_name', '==', studentName)
        );
        const subSnap = await getDocs(subQ);
        
        if (!subSnap.empty) {
          const subDoc = subSnap.docs[0];
          setSubmissionId(subDoc.id);
          const subData = subDoc.data() as StudentSubmission;
          setMessages(subData.chat_history || []);
          setCurrentPhase(subData.current_phase || 'UNDERSTANDING_CHECK');
          
          if (editor && subData.tiptap_json) {
            try {
              editor.commands.setContent(JSON.parse(subData.tiptap_json));
            } catch (err) {
              console.error("Failed to parse editor JSON content:", err);
            }
          }
        }
      } catch (err) {
        console.error("Failed to initialize workspace:", err);
      } finally {
        setLoading(false);
      }
    };

    if (editor) {
      initWorkspace();
    }
  }, [inviteCode, editor]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. Tiptap Toolbar Actions Helpers
  const addImage = () => {
    const url = prompt('이미지 URL을 입력하세요:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = prompt('웹 주소(Link)를 입력하세요:');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  // 4. Save/Submit Note to Jam봇
  const handleSubmitNote = async () => {
    if (!editor || submittingNote) return;
    
    setSubmittingNote(true);
    const tiptapJsonObj = editor.getJSON();
    const tiptapJsonStr = JSON.stringify(tiptapJsonObj);
    
    try {
      // Call Jam봇 API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tiptapJson: tiptapJsonObj,
          chatHistory: messages,
        }),
      });

      if (!response.ok) throw new Error("Jam봇 응답 실패");
      const aiData = await response.json();
      
      const combinedMessage = `${aiData.praise_message}\n\n${aiData.socratic_question}`;
      const newBotMessage: ChatMessage = {
        role: 'jambot',
        content: combinedMessage,
        internal_analysis: aiData.internal_analysis,
        phase: aiData.current_phase,
        created_at: new Date().toISOString()
      };

      const updatedMessages = [...messages, newBotMessage];
      setMessages(updatedMessages);
      setCurrentPhase(aiData.current_phase);

      // Save to Firebase
      if (submissionId) {
        // Update existing
        await updateDoc(doc(db, 'submissions', submissionId), {
          tiptap_json: tiptapJsonStr,
          chat_history: updatedMessages,
          current_phase: aiData.current_phase,
          status: aiData.current_phase === 'COMPLETE' ? '완료' : '진행중',
          updated_at: new Date().toISOString()
        });
      } else {
        // Create new submission doc
        const newDocRef = await addDoc(collection(db, 'submissions'), {
          room_code: inviteCode?.toUpperCase(),
          student_name: studentName,
          tiptap_json: tiptapJsonStr,
          chat_history: updatedMessages,
          current_phase: aiData.current_phase,
          status: aiData.current_phase === 'COMPLETE' ? '완료' : '진행중',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        setSubmissionId(newDocRef.id);
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || '노트 전송에 실패했습니다.');
    } finally {
      setSubmittingNote(false);
    }
  };

  // 5. Send Chat Message
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || sendingChat || !editor) return;

    const studentText = chatInput.trim();
    setChatInput('');
    setSendingChat(true);

    const newStudentMessage: ChatMessage = {
      role: 'student',
      content: studentText,
      created_at: new Date().toISOString()
    };

    const intermediateMessages = [...messages, newStudentMessage];
    setMessages(intermediateMessages);

    try {
      // Promptly save student's intermediate response to Firestore
      if (submissionId) {
        await updateDoc(doc(db, 'submissions', submissionId), {
          chat_history: intermediateMessages,
          status: '진행중',
          updated_at: new Date().toISOString()
        });
      }

      // Call Jam봇 with updated history
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tiptapJson: editor.getJSON(),
          chatHistory: intermediateMessages,
        }),
      });

      if (!response.ok) throw new Error("Jam봇 대화 요청 실패");
      const aiData = await response.json();

      const combinedMessage = `${aiData.praise_message}\n\n${aiData.socratic_question}`;
      const newBotMessage: ChatMessage = {
        role: 'jambot',
        content: combinedMessage,
        internal_analysis: aiData.internal_analysis,
        phase: aiData.current_phase,
        created_at: new Date().toISOString()
      };

      const finalMessages = [...intermediateMessages, newBotMessage];
      setMessages(finalMessages);
      setCurrentPhase(aiData.current_phase);

      if (submissionId) {
        await updateDoc(doc(db, 'submissions', submissionId), {
          chat_history: finalMessages,
          current_phase: aiData.current_phase,
          status: aiData.current_phase === 'COMPLETE' ? '완료' : '진행중',
          updated_at: new Date().toISOString()
        });
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || '메시지 전송에 실패했습니다.');
    } finally {
      setSendingChat(false);
    }
  };

  if (loading) return (
    <div className="h-screen ios-wallpaper flex items-center justify-center font-sans text-white">
       <div className="flex flex-col items-center gap-6">
          <Loader2 className="animate-spin text-orange-400" size={64} strokeWidth={2.5} />
          <p className="text-white/40 font-extrabold uppercase tracking-widest text-[10px]">Loading Workspace...</p>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen ios-wallpaper flex flex-col font-sans text-white overflow-hidden p-6 gap-6">
      
      {/* Translucent iPadOS Header */}
      <header className="ios-glass rounded-[28px] h-20 px-8 flex items-center justify-between shrink-0 shadow-2xl relative">
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        
        {/* Student Info Widget */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-rose-500 rounded-xl flex items-center justify-center font-extrabold text-sm shadow-md">
            {studentName.charAt(0)}
          </div>
          <div>
            <p className="text-[9px] font-extrabold text-white/40 uppercase tracking-wider leading-none mb-0.5">STUDENT WORKSPACE</p>
            <p className="text-sm font-extrabold text-white leading-none">{studentName}</p>
          </div>
        </div>
        
        {/* Title Widget */}
        <div className="text-center hidden sm:block">
          <p className="text-[9px] font-extrabold text-orange-300 uppercase tracking-[0.2em] mb-0.5 flex items-center justify-center gap-1">
            <Sparkles size={10} className="animate-pulse" /> Socratic AI review
          </p>
          <p className="text-xs font-black text-white">{roomTitle}</p>
        </div>
        
        {/* Phase Badges */}
        <div className="flex items-center gap-2">
          {['UNDERSTANDING_CHECK', 'DEEPENING', 'REAL_WORLD_TRANSFER', 'COMPLETE'].map((phase, idx) => {
            const isActive = currentPhase === phase;
            const isCompleted = ['COMPLETE', 'REAL_WORLD_TRANSFER', 'DEEPENING', 'UNDERSTANDING_CHECK'].indexOf(currentPhase) >= idx;
            
            return (
              <div 
                key={phase} 
                className={cn(
                  "px-3 py-1.5 rounded-full text-[9px] font-extrabold tracking-tight transition-all",
                  isActive ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-105" :
                  isCompleted ? "bg-white/10 text-white/70" : "bg-white/3 text-white/20"
                )}
              >
                {phase === 'UNDERSTANDING_CHECK' && '개념 확인'}
                {phase === 'DEEPENING' && '심화 대화'}
                {phase === 'REAL_WORLD_TRANSFER' && '일상 적용'}
                {phase === 'COMPLETE' && '복습 완료'}
              </div>
            );
          })}
        </div>
      </header>

      {/* Main 2-Split Workspace (Left: Tiptap Editor, Right: KakaoTalk Chat) */}
      <main className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0">
        
        {/* Left Space: Tiptap Workspace (50%) */}
        <section className="flex-1 ios-glass rounded-[32px] p-6 lg:p-8 flex flex-col overflow-hidden relative shadow-2xl border border-white/5">
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          
          <h3 className="text-[10px] font-black text-white/35 uppercase tracking-widest mb-4">복습 에디터 (Notion-style Workspace)</h3>
          
          {/* Tiptap Custom Toolbar */}
          {editor && (
            <div className="flex flex-wrap gap-1.5 p-2 bg-white/3 border border-white/5 rounded-2xl mb-4 text-white/60">
              <button 
                type="button" 
                onClick={() => editor.chain().focus().toggleBold().run()} 
                className={cn("p-2.5 rounded-xl hover:bg-white/5 hover:text-white transition-all", editor.isActive('bold') && "bg-white/10 text-white")}
              >
                <Bold size={15} />
              </button>
              <button 
                type="button" 
                onClick={() => editor.chain().focus().toggleItalic().run()} 
                className={cn("p-2.5 rounded-xl hover:bg-white/5 hover:text-white transition-all", editor.isActive('italic') && "bg-white/10 text-white")}
              >
                <Italic size={15} />
              </button>
              <div className="w-[1px] h-6 bg-white/10 my-auto mx-1" />
              <button 
                type="button" 
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
                className={cn("p-2.5 rounded-xl hover:bg-white/5 hover:text-white transition-all", editor.isActive('heading', { level: 1 }) && "bg-white/10 text-white")}
              >
                <Heading1 size={15} />
              </button>
              <button 
                type="button" 
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
                className={cn("p-2.5 rounded-xl hover:bg-white/5 hover:text-white transition-all", editor.isActive('heading', { level: 2 }) && "bg-white/10 text-white")}
              >
                <Heading2 size={15} />
              </button>
              <button 
                type="button" 
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} 
                className={cn("p-2.5 rounded-xl hover:bg-white/5 hover:text-white transition-all", editor.isActive('heading', { level: 3 }) && "bg-white/10 text-white")}
              >
                <Heading3 size={15} />
              </button>
              <div className="w-[1px] h-6 bg-white/10 my-auto mx-1" />
              <button 
                type="button" 
                onClick={() => editor.chain().focus().toggleBulletList().run()} 
                className={cn("p-2.5 rounded-xl hover:bg-white/5 hover:text-white transition-all", editor.isActive('bulletList') && "bg-white/10 text-white")}
              >
                <List size={15} />
              </button>
              <button 
                type="button" 
                onClick={addImage} 
                className="p-2.5 rounded-xl hover:bg-white/5 hover:text-white transition-all"
              >
                <ImageIcon size={15} />
              </button>
              <button 
                type="button" 
                onClick={addLink} 
                className="p-2.5 rounded-xl hover:bg-white/5 hover:text-white transition-all"
              >
                <LinkIcon size={15} />
              </button>
            </div>
          )}
          
          {/* Editor Content Area */}
          <div className="flex-1 bg-white/2 border border-white/5 rounded-3xl p-6 overflow-y-auto mb-6 text-white/90 prose prose-invert max-w-none focus:outline-none tiptap-editor-styles">
            <EditorContent editor={editor} />
          </div>
          
          {/* Submit button */}
          <button 
            type="button"
            disabled={submittingNote}
            onClick={handleSubmitNote}
            className="w-full py-4.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:shadow-orange-500/25 transition-all flex items-center justify-center gap-2.5 disabled:opacity-40 glow-orange shrink-0"
          >
            {submittingNote ? (
              <>
                <Loader2 className="animate-spin" size={16} strokeWidth={2.5} /> Jam봇 분석 및 피드백 생성 중...
              </>
            ) : (
              <>
                <Sparkles size={16} strokeWidth={2.5} /> Jam봇에게 내 노트 제출하기
              </>
            )}
          </button>
        </section>

        {/* Right Space: Socratic Chat Interface (50%) */}
        <section className="flex-1 ios-glass rounded-[32px] flex flex-col overflow-hidden relative shadow-2xl border border-white/5">
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          
          <div className="px-8 py-5 border-b border-white/5 flex items-center gap-3 bg-white/2 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Jam봇 소크라테스 대화방</span>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-white/35 max-w-sm mx-auto space-y-4">
                <div className="p-4 bg-white/5 rounded-full">
                  <BookOpen size={24} className="text-white/40" />
                </div>
                <h4 className="font-extrabold text-sm text-white/50">아직 시작된 대화가 없습니다.</h4>
                <p className="text-[11px] leading-relaxed">
                  왼쪽 에디터에 오늘 복습 노트를 멋지게 작성한 뒤 <strong>[Jam봇에게 내 노트 제출하기]</strong> 버튼을 누르면 대화가 바로 시작돼요!
                </p>
              </div>
            ) : (
              messages.map((m, idx) => {
                const isBot = m.role === 'jambot';
                return (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-3",
                      isBot ? "justify-start" : "justify-end"
                    )}
                  >
                    {isBot && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center text-xs font-black shrink-0 shadow-lg shadow-orange-500/10">
                        🤖
                      </div>
                    )}
                    
                    <div className={cn(
                      "p-4.5 rounded-[22px] max-w-[80%] text-sm font-semibold leading-relaxed relative",
                      isBot 
                        ? "bg-white/6 border border-white/8 text-white rounded-tl-[4px]" 
                        : "bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-tr-[4px] shadow-lg shadow-orange-500/10"
                    )}>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Form Area */}
          <form onSubmit={handleSendChat} className="p-5 border-t border-white/5 bg-white/2 flex gap-3 shrink-0">
            <input 
              type="text" 
              placeholder={messages.length === 0 ? "먼저 노트를 제출해야 대화가 열립니다." : "잼봇에게 답변을 보내보세요..."}
              disabled={messages.length === 0 || sendingChat || currentPhase === 'COMPLETE'}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              className="flex-1 px-5 py-4 bg-white/3 border border-white/5 rounded-2xl text-sm font-bold text-white outline-none placeholder:text-white/20 focus:bg-white/6 focus:border-orange-500/40 focus:ring-4 focus:ring-orange-500/5 transition-all outline-none"
            />
            
            <button 
              type="submit"
              disabled={messages.length === 0 || sendingChat || !chatInput.trim() || currentPhase === 'COMPLETE'}
              className="p-4.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl transition-all shadow-lg hover:shadow-orange-500/20 disabled:opacity-30 disabled:pointer-events-none glow-orange flex items-center justify-center"
            >
              {sendingChat ? <Loader2 className="animate-spin" size={16} strokeWidth={2.5} /> : <Send size={16} strokeWidth={2.5} />}
            </button>
          </form>
        </section>

      </main>

      {/* Completion Overlay if complete */}
      <AnimatePresence>
        {currentPhase === 'COMPLETE' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/65 backdrop-blur-md z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md ios-glass rounded-[40px] p-10 border border-white/10 shadow-2xl text-center space-y-6 text-white"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 size={32} strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-black">🎉 복습 대화 완료!</h2>
              <p className="text-sm font-medium text-white/60 leading-relaxed">
                축하합니다! 잼봇과 함께 개념 확인부터 일상생활 적용 단계까지 완벽하게 소화해 냈어요! 훌륭한 배움의 흔적은 교사용 모니터링판에 예쁘게 저장되었습니다.
              </p>
              
              <button
                onClick={() => navigate('/join')}
                className="w-full py-4.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-500/25 transition-all"
              >
                메인화면으로 돌아가기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
