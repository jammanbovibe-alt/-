import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderPlus, Plus, Sparkles, BookOpen, Users, Folder, 
  ChevronRight, Calendar, User, FileText, Download, CheckCircle, 
  Clock, AlertCircle, RefreshCw, LogOut, Code
} from 'lucide-react';
import { getRoomsHelper, getSubmissionsHelper, isLocalStorageOnly } from '../lib/dbHelper';
import { auth } from '../lib/firebase';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Room, StudentSubmission, ChatMessage } from '../types';
import { cn } from '../lib/utils';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  
  // Folders and Rooms State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [folders, setFolders] = useState<string[]>(['기본 수업']);
  const [selectedFolder, setSelectedFolder] = useState<string>('기본 수업');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  
  // Students and Submissions State
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Dialog States
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  // Tiptap Read-only instance to display student note
  const readOnlyEditor = useEditor({
    editable: false,
    extensions: [StarterKit, Image, Link],
    content: '<p>학생을 선택하면 노트 본문이 여기에 보입니다.</p>'
  });

  // Load selected submission notes into the read-only editor
  useEffect(() => {
    if (readOnlyEditor && selectedSubmission) {
      try {
        const json = JSON.parse(selectedSubmission.tiptap_json);
        readOnlyEditor.commands.setContent(json);
      } catch (err) {
        readOnlyEditor.commands.setContent(`<p>${selectedSubmission.tiptap_json || '작성된 내용이 없습니다.'}</p>`);
      }
    }
  }, [selectedSubmission, readOnlyEditor]);

  // Fetch Rooms
  const fetchRoomsData = async () => {
    setRefreshing(true);
    try {
      const roomsList = await getRoomsHelper();
      const foldersList = new Set<string>(['기본 수업']);
      
      roomsList.forEach(r => {
        if (r.folder_name) {
          foldersList.add(r.folder_name);
        }
      });
      
      setRooms(roomsList);
      setFolders(Array.from(foldersList));
      
      // Auto select first room if none selected
      if (roomsList.length > 0 && !selectedRoom) {
        const filtered = roomsList.filter(r => (r.folder_name || '기본 수업') === selectedFolder);
        if (filtered.length > 0) {
          setSelectedRoom(filtered[0]);
        } else {
          setSelectedRoom(roomsList[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRoomsData();
  }, []);

  // Fetch Submissions (Students) for the selected Room
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!selectedRoom) {
        setSubmissions([]);
        setSelectedSubmission(null);
        return;
      }
      
      try {
        const subList = await getSubmissionsHelper(selectedRoom.room_code);
        setSubmissions(subList);
        
        if (subList.length > 0) {
          setSelectedSubmission(subList[0]);
        } else {
          setSelectedSubmission(null);
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchSubmissions();
  }, [selectedRoom]);

  // Folder creation handler
  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setFolders(prev => [...prev, newFolderName.trim()]);
    setSelectedFolder(newFolderName.trim());
    setNewFolderName('');
    setShowFolderModal(false);
  };

  // PDF Generation / Print layout trigger
  const handlePrintPDF = () => {
    if (!selectedSubmission || !selectedRoom) return;

    // Create a temporary beautiful print window styled exactly like A4 sheet
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const chatHtml = selectedSubmission.chat_history.map(m => `
      <div style="margin-bottom: 20px; padding: 15px; border-radius: 12px; background: ${m.role === 'student' ? '#f0f0f0' : '#f9f9f9'}; border: 1px solid #e0e0e0;">
        <strong style="color: ${m.role === 'student' ? '#111' : '#ff6b00'}">${m.role === 'student' ? '학생' : 'Jam봇 (AI)'}</strong>
        <p style="margin: 5px 0 0 0; white-space: pre-wrap; font-size: 13px; line-height: 1.5;">${m.content}</p>
        ${m.internal_analysis ? `
          <div style="margin-top: 8px; font-size: 11px; color: #888; border-top: 1px dashed #ddd; padding-top: 5px;">
            🔍 Jam봇 내부 분석: ${m.internal_analysis}
          </div>
        ` : ''}
      </div>
    `).join('');

    const editorHtml = readOnlyEditor?.getHTML() || '<p>작성된 노트가 없습니다.</p>';

    printWindow.document.write(`
      <html>
        <head>
          <title>JamClass 복습 보고서 - ${selectedSubmission.student_name}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              color: #333;
              margin: 40px;
              line-height: 1.6;
            }
            .header {
              border-bottom: 2px solid #ff6b00;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 30px;
              background: #fdfdfd;
              border: 1px solid #eee;
              padding: 15px;
              border-radius: 8px;
            }
            .section-title {
              font-size: 18px;
              font-weight: 800;
              color: #ff6b00;
              border-left: 4px solid #ff6b00;
              padding-left: 10px;
              margin-top: 40px;
              margin-bottom: 20px;
            }
            .editor-content {
              border: 1px solid #eee;
              padding: 20px;
              border-radius: 8px;
              background: #fafafa;
            }
            @media print {
              body { margin: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; color: #ff6b00;">JamClass 배움 성장 보고서</h1>
            <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">인공지능 소크라테스 대화를 통한 메타인지 성장 분석</p>
          </div>
          <div class="meta-grid">
            <div><strong>학생 이름:</strong> ${selectedSubmission.student_name}</div>
            <div><strong>수업방 코드:</strong> ${selectedRoom.room_code}</div>
            <div><strong>수업 주제:</strong> ${selectedRoom.title}</div>
            <div><strong>대화 단계:</strong> ${selectedSubmission.current_phase === 'COMPLETE' ? '복습 완료 🎉' : selectedSubmission.current_phase}</div>
          </div>
          
          <div class="section-title">학생 복습 노트 (Tiptap Workspace)</div>
          <div class="editor-content">
            ${editorHtml}
          </div>
          
          <div class="section-title">잼봇(AI) Socratic 대화 로그</div>
          <div>
            ${chatHtml}
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const activeRooms = rooms.filter(r => (r.folder_name || '기본 수업') === selectedFolder);

  if (loading) return (
    <div className="h-screen ios-wallpaper flex items-center justify-center font-sans text-white">
       <div className="flex flex-col items-center gap-6">
          <RefreshCw className="animate-spin text-orange-400" size={64} strokeWidth={2.5} />
          <p className="text-white/40 font-extrabold uppercase tracking-widest text-[10px]">Loading Instructor Console...</p>
       </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col font-sans text-white overflow-hidden p-6 gap-6">
      
      {/* 1. Header Toolbar */}
      <header className="ios-glass rounded-[28px] h-20 px-8 flex items-center justify-between shrink-0 shadow-2xl relative border border-white/5">
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-rose-500 rounded-xl flex items-center justify-center font-black shadow-lg shadow-orange-500/10">
            📊
          </div>
          <div>
            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none mb-0.5">교사용 모니터링</p>
            <h1 className="text-sm font-black text-white leading-none">JamClass 대시보드</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchRoomsData}
            className="p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 text-white/70 hover:text-white transition-all"
          >
            <RefreshCw size={16} />
          </button>
          
          <button 
            onClick={() => navigate('/create')}
            className="px-5 h-12 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:shadow-orange-500/25 transition-all flex items-center gap-2 glow-orange"
          >
            <Plus size={16} strokeWidth={3} /> 수업 개설하기
          </button>
        </div>
      </header>

      {/* Local Storage Fallback Toast */}
      {isLocalStorageOnly() && (
        <div className="ios-glass rounded-[20px] p-4 border border-amber-500/25 bg-amber-500/10 text-xs font-semibold text-amber-300 flex items-center gap-3 shrink-0">
          <AlertCircle size={16} strokeWidth={2.5} className="text-amber-400" />
          <span>파이어베이스 권한 제한으로 인해 <strong>'로컬 브라우저 저장소 모드'</strong>로 자동 전환되었습니다. 교사-학생 복습 및 잼봇 피드백 기능은 동일하게 정상 작동합니다! 🚀</span>
        </div>
      )}

      {/* 2. Core Dashboard Split View */}
      <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
        
        {/* A. Left Sidebar: Folder / Rooms / Students (Width: 320px) */}
        <aside className="w-80 flex flex-col gap-6 shrink-0 min-h-0">
          
          {/* Folders & Rooms list */}
          <div className="ios-glass border border-white/5 rounded-[32px] p-5 flex flex-col gap-4 max-h-[45%] overflow-hidden">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">수업 폴더</span>
              <button 
                onClick={() => setShowFolderModal(true)}
                className="p-1.5 hover:bg-white/5 rounded-lg text-orange-400 transition-all"
              >
                <FolderPlus size={16} />
              </button>
            </div>
            
            {/* Folder Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1 shrink-0 scrollbar-none">
              {folders.map(f => (
                <button
                  key={f}
                  onClick={() => {
                    setSelectedFolder(f);
                    const filtered = rooms.filter(r => (r.folder_name || '기본 수업') === f);
                    if (filtered.length > 0) setSelectedRoom(filtered[0]);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all border",
                    selectedFolder === f 
                      ? "bg-white/10 border-white/10 text-white" 
                      : "border-transparent text-white/45 hover:text-white"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Room List inside folder */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {activeRooms.length === 0 ? (
                <p className="text-[11px] text-white/30 text-center py-6">개설된 수업방이 없습니다.</p>
              ) : (
                activeRooms.map(room => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className={cn(
                      "w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-1",
                      selectedRoom?.id === room.id 
                        ? "bg-white/8 border-white/10" 
                        : "bg-transparent border-transparent hover:bg-white/3 text-white/60 hover:text-white"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black truncate">{room.title}</span>
                      <span className="text-[9px] font-black px-2 py-0.5 bg-orange-500/20 text-orange-300 rounded-md border border-orange-500/10">
                        {room.room_code}
                      </span>
                    </div>
                    <span className="text-[9px] text-white/30 font-bold">
                      {new Date(room.created_at).toLocaleDateString()} 개설
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Student Submissions List in selected room */}
          <div className="ios-glass border border-white/5 rounded-[32px] p-5 flex flex-col gap-4 flex-1 min-h-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">참여 학생 명단</span>
            
            <div className="flex-1 overflow-y-auto space-y-2">
              {submissions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-white/20">
                  <Users size={20} className="mb-2" />
                  <p className="text-[11px]">아직 접속한 학생이 없습니다.</p>
                </div>
              ) : (
                submissions.map(sub => {
                  const isComplete = sub.current_phase === 'COMPLETE';
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubmission(sub)}
                      className={cn(
                        "w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between",
                        selectedSubmission?.id === sub.id 
                          ? "bg-white/8 border-white/10" 
                          : "bg-transparent border-transparent hover:bg-white/3 text-white/60 hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-xs">
                          {sub.student_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold leading-none mb-1 text-white">{sub.student_name}</p>
                          <p className="text-[9px] text-white/40 leading-none">
                            {sub.chat_history?.length || 0}차 대화
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isComplete ? (
                          <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/15 rounded-lg text-[9px] font-bold text-emerald-400">
                            <CheckCircle size={8} /> 완료
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/15 rounded-lg text-[9px] font-bold text-amber-400">
                            <Clock size={8} /> 진행중
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* B. Main workspace: Student Details View (Left Note read-only, Right Chat read-only) */}
        <section className="flex-1 flex flex-col gap-6 min-h-0">
          
          {selectedSubmission ? (
            <>
              {/* Toolbar of Selected Student */}
              <div className="ios-glass rounded-[24px] px-6 py-4 flex items-center justify-between border border-white/5 shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black">{selectedSubmission.student_name} 학생의 배움 흔적</span>
                  <span className={cn(
                    "px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase",
                    selectedSubmission.current_phase === 'COMPLETE' ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/10" : "bg-orange-500/20 text-orange-300 border border-orange-500/10"
                  )}>
                    {selectedSubmission.current_phase === 'COMPLETE' ? '소크라테스 대화 완료' : `${selectedSubmission.chat_history?.length || 0}차 대화 피드백 진행 중`}
                  </span>
                </div>
                
                <button 
                  onClick={handlePrintPDF}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-white/5"
                >
                  <Download size={14} /> PDF 다운로드
                </button>
              </div>

              {/* Dual-Pane View */}
              <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
                {/* Left Note Render Area */}
                <div className="flex-1 ios-glass rounded-[32px] p-6 lg:p-8 flex flex-col overflow-hidden relative border border-white/5">
                  <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 block">학생 복습 노트 (Read-only)</span>
                  
                  <div className="flex-1 bg-white/2 border border-white/5 rounded-3xl p-6 overflow-y-auto mb-2 text-white/80 prose prose-invert max-w-none focus:outline-none tiptap-editor-styles">
                    <EditorContent editor={readOnlyEditor} />
                  </div>
                </div>

                {/* Right Chat & Analysis Area */}
                <div className="flex-1 ios-glass rounded-[32px] flex flex-col overflow-hidden relative border border-white/5">
                  <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  
                  <div className="px-6 py-4 border-b border-white/5 bg-white/2 flex items-center justify-between shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">잼봇 & 학생 실시간 대화 모니터</span>
                  </div>

                  <div className="flex-1 p-6 overflow-y-auto space-y-6">
                    {selectedSubmission.chat_history?.length === 0 ? (
                      <p className="text-xs text-white/35 text-center py-12">나눈 대화가 없습니다.</p>
                    ) : (
                      selectedSubmission.chat_history.map((m, idx) => {
                        const isBot = m.role === 'jambot';
                        return (
                          <div key={idx} className="space-y-2">
                            {/* Teacher-only grey hint block showing internal analysis */}
                            {isBot && m.internal_analysis && (
                              <div className="flex justify-start pl-11">
                                <div className="p-3 bg-white/3 border border-dashed border-white/10 rounded-2xl text-[11px] text-white/45 max-w-[85%] leading-relaxed">
                                  <strong className="text-[9px] uppercase tracking-wider text-orange-400/80 block mb-1">🔍 Jam봇 내부 추론 프로세스</strong>
                                  {m.internal_analysis}
                                </div>
                              </div>
                            )}

                            <div className={cn("flex gap-3", isBot ? "justify-start" : "justify-end")}>
                              {isBot && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center text-xs font-black shrink-0">
                                  🤖
                                </div>
                              )}
                              
                              <div className={cn(
                                "p-4 rounded-[20px] max-w-[80%] text-xs font-medium leading-relaxed",
                                isBot 
                                  ? "bg-white/6 border border-white/8 text-white rounded-tl-[4px]" 
                                  : "bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-tr-[4px]"
                              )}>
                                <p className="whitespace-pre-wrap">{m.content}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 ios-glass rounded-[32px] flex flex-col items-center justify-center text-center p-8 text-white/20 border border-white/5 shadow-2xl">
              <Users size={48} className="mb-4 text-white/10" />
              <h3 className="text-lg font-black text-white/30">참여 학생 분석 대기 중</h3>
              <p className="text-xs max-w-sm leading-relaxed mt-2 text-white/20">
                수업 초대 코드(예: <strong>{selectedRoom?.room_code}</strong>)로 학생들이 로그인하여 노트를 작성하고 잼봇에게 제출하면 분석 데이터가 실시간 업로드됩니다!
              </p>
            </div>
          )}

        </section>
      </div>

      {/* Folder Creation Modal */}
      <AnimatePresence>
        {showFolderModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.form 
              onSubmit={handleCreateFolder}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md ios-glass rounded-[32px] p-8 border border-white/10 shadow-2xl space-y-6 text-white"
            >
              <h3 className="text-lg font-black">새 폴더 생성</h3>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest">폴더명</label>
                <input 
                  type="text" 
                  placeholder="예: 5학년 과학 복습"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white focus:bg-white/10 focus:border-orange-500/40 outline-none transition-all"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold tracking-widest text-white/60 hover:text-white transition-all"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl"
                >
                  생성하기
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
