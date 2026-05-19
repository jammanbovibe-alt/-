import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  FileText, 
  Type, 
  BrainCircuit, 
  CheckCircle2, 
  ChevronRight, 
  Trash2,
  Edit2,
  Save,
  Loader2,
  Send,
  Users,
  BookOpen,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Question } from '../types';
import { MathRenderer } from '../components/MathRenderer';
import { cn } from '../lib/utils';

type Step = 'upload' | 'analyze' | 'settings' | 'generate' | 'review' | 'publish';

export default function QuizCreator() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [sourceType, setSourceType] = useState<'pdf' | 'image' | 'text'>('pdf');
  const [content, setContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [settings, setSettings] = useState({
    title: '',
    studentLevel: '중',
    questionCount: 5,
    useMathSymbols: true,
    includeRealLife: true,
    includeExplanations: true
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const cleanBase64 = base64.split(',')[1];
      setContent(cleanBase64);
      await analyzeContent(cleanBase64, file.type.includes('pdf') ? 'pdf' : 'image');
    };
    reader.readAsDataURL(file);
  };

  const analyzeContent = async (base64: string, type: 'pdf' | 'image' | 'text') => {
    setIsAnalyzing(true);
    setCurrentStep('analyze');
    try {
      const resp = await fetch('/api/quiz/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: base64, type })
      });
      
      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || '분석 중 오류가 발생했습니다.');
      }

      const data = await resp.json();
      setAnalysis(data);
      setSettings(prev => ({ 
        ...prev, 
        title: `${data.unit || '수학'} 맞춤형 문항`,
        studentLevel: data.recommended_level || '중'
      }));
    } catch (e: any) {
      console.error(e);
      alert(e.message || '분석 중 오류가 발생했습니다. 다시 시도해주세요.');
      setCurrentStep('upload');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startGeneration = async () => {
    setIsGenerating(true);
    setCurrentStep('generate');
    try {
      const resp = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceContent: content,
          sourceType,
          ...settings
        })
      });
      
      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || '문항 생성 중 오류가 발생했습니다.');
      }

      const data = await resp.json();
      if (!Array.isArray(data)) {
        throw new Error('생성된 문항 형식이 올바르지 않습니다.');
      }
      setQuestions(data);
      setCurrentStep('review');
    } catch (e: any) {
      console.error(e);
      alert(e.message || '문항 생성 중 오류가 발생했습니다. 구글 서버 트래픽이 몰려 잠시 거시기할 수 있으니 다시 시도해 주세요!');
      setCurrentStep('settings');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    const code = generateInviteCode();
    try {
      await addDoc(collection(db, 'quizzes'), {
        title: settings.title,
        teacher_id: auth.currentUser?.uid || 'temp_teacher',
        source_type: sourceType,
        student_level: settings.studentLevel,
        question_count: settings.questionCount,
        questions,
        invite_code: code,
        status: 'published',
        created_at: new Date().toISOString()
      });
      setInviteCode(code);
      setCurrentStep('publish');
    } catch (e) {
      console.error(e);
    } finally {
      setIsPublishing(false);
    }
  };

  const stepIndex = ['upload', 'analyze', 'settings', 'generate', 'review', 'publish'].indexOf(currentStep);

  return (
    <div className="flex flex-col h-full bg-transparent font-sans text-white">
      {/* Top Action Bar */}
      <header className="h-16 border-b border-white/5 px-8 flex items-center justify-between shrink-0 relative">
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        <div className="flex items-center gap-4.5">
          <span className="px-3 py-1 bg-white/5 border border-white/5 text-white/55 rounded-xl text-[9px] font-extrabold uppercase tracking-widest">
            STEP {stepIndex + 1}/6
          </span>
          <h1 className="text-lg font-extrabold tracking-tight text-white leading-none">
            {currentStep === 'upload' && "학습 자료 업로드"}
            {currentStep === 'analyze' && "자료 분석 결과"}
            {currentStep === 'settings' && "문항 생성 설정"}
            {currentStep === 'generate' && "문항 생성 중"}
            {currentStep === 'review' && "문항 검토 및 배포"}
            {currentStep === 'publish' && "배포 완료"}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          {currentStep === 'review' && (
            <>
              <button 
                onClick={() => setCurrentStep('settings')}
                className="px-4.5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 text-white rounded-xl text-xs font-bold transition-all"
              >
                설정 수정
              </button>
              <button 
                onClick={handlePublish}
                disabled={isPublishing}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-xs font-extrabold hover:shadow-indigo-500/20 transition-all flex items-center gap-2.5 disabled:opacity-50 uppercase tracking-widest glow-purple"
              >
                {isPublishing ? <Loader2 className="animate-spin" size={14} strokeWidth={2.5} /> : <Send size={14} strokeWidth={2.5} />}
                배포하기
              </button>
            </>
          )}
          {currentStep !== 'publish' && currentStep !== 'upload' && (
             <button 
               onClick={() => navigate('/')} 
               className="bg-white/5 hover:bg-white/10 border border-white/5 p-2 rounded-xl text-white/40 hover:text-white transition-all"
             >
                <Trash2 size={16} />
             </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Settings Panel (Sleek Glass Column) */}
        {(currentStep === 'review' || currentStep === 'settings') && (
          <aside className="w-80 border-r border-white/5 p-8 flex flex-col shrink-0 overflow-y-auto">
            <h2 className="text-[9px] uppercase font-black text-white/30 mb-8 tracking-[0.2em]">문항 생성 설정</h2>
            
            <div className="space-y-8 flex-1">
              <div>
                <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-3">문항 세트 제목</label>
                <input 
                  type="text" 
                  value={settings.title}
                  onChange={e => setSettings(p => ({ ...p, title: e.target.value }))}
                  className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl text-sm font-bold text-white focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-3">학생 수준</label>
                <div className="flex gap-2 bg-white/3 border border-white/5 p-1 rounded-2xl">
                  {['하', '중', '상'].map(level => (
                    <button 
                      key={level}
                      onClick={() => setSettings(p => ({ ...p, studentLevel: level }))}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-xs font-black transition-all border",
                        settings.studentLevel === level 
                          ? "bg-white/10 border-white/10 text-white shadow-md shadow-black/10" 
                          : "border-transparent text-white/45 hover:text-white"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <SettingsToggle label="실생활 문제 포함" checked={settings.includeRealLife} onChange={v => setSettings(p => ({ ...p, includeRealLife: v }))} />
                <SettingsToggle label="수학식 (LaTeX) 사용" checked={settings.useMathSymbols} onChange={v => setSettings(p => ({ ...p, useMathSymbols: v }))} />
                <SettingsToggle label="상세 해설 포함" checked={settings.includeExplanations} onChange={v => setSettings(p => ({ ...p, includeExplanations: v }))} />
              </div>

              <div className="pt-8 border-t border-white/5">
                <button 
                  onClick={startGeneration}
                  className="w-full py-4.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2.5 uppercase tracking-widest shadow-lg hover:shadow-indigo-500/25 transition-all glow-purple"
                >
                  <BrainCircuit size={16} strokeWidth={2.5} /> 문항 재생성
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* Main Workspace Area */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-black/10">
          <AnimatePresence mode="wait">
            {currentStep === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-xl mx-auto"
              >
                <div className="ios-glass rounded-[40px] p-12 lg:p-16 shadow-2xl border border-white/10 text-center relative overflow-hidden">
                  {/* Subtle top glare edge */}
                  <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-500 w-20 h-20 rounded-[28px] flex items-center justify-center mx-auto mb-10 shadow-lg shadow-indigo-500/20 glow-purple">
                    <Upload className="text-white" size={32} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-3xl font-extrabold mb-3 text-white tracking-tight leading-tight">문항의 시작</h2>
                  <p className="text-white/45 mb-10 font-medium text-sm leading-relaxed max-w-xs mx-auto">
                    AI가 정밀 분석하고 추천 문항을 생성할 원본 수학 학습 자료를 업로드하세요.
                  </p>

                  <div className="grid grid-cols-1 gap-4">
                    <UploadButton 
                      icon={FileText} 
                      title="PDF 또는 이미지 파일" 
                      sub="학습지, 교과서 캡처 이미지 등"
                      onClick={() => { setSourceType('pdf'); fileInputRef.current?.click(); }}
                    />
                    <UploadButton 
                      icon={Type} 
                      title="텍스트 직접 입력" 
                      sub="교재 개념 설명 및 문제 텍스트"
                      onClick={() => { setSourceType('text'); setCurrentStep('settings'); }} 
                    />
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".pdf,image/*"
                    onChange={handleFileUpload}
                  />
                </div>
              </motion.div>
            )}

            {currentStep === 'analyze' && (
              <motion.div
                key="analyze"
                className="max-w-2xl mx-auto"
              >
                {isAnalyzing ? (
                  <div className="ios-glass rounded-[40px] p-16 lg:p-20 shadow-2xl text-center border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    
                    <div className="relative w-28 h-28 mx-auto mb-10">
                      <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center text-indigo-400">
                        <BrainCircuit size={38} strokeWidth={2.5} />
                      </div>
                    </div>
                    <h3 className="text-2xl font-extrabold mb-3 tracking-tight text-white leading-tight">AI 심층 분석 중</h3>
                    <p className="text-white/45 text-sm font-medium">단원명, 핵심 연계 개념, AI 추천 학생 수준을 분석하고 있습니다.</p>
                  </div>
                ) : analysis && (
                  <div className="ios-glass rounded-[40px] p-10 lg:p-12 shadow-2xl border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    
                    <div className="flex items-center gap-4.5 mb-10 pb-6 border-b border-white/5">
                       <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-3.5 rounded-2xl text-white shadow-lg shadow-indigo-500/15 glow-purple">
                         <CheckCircle2 size={26} strokeWidth={2.5} />
                       </div>
                       <div>
                         <h3 className="text-2xl font-extrabold tracking-tight text-white leading-tight">분석이 완료되었습니다</h3>
                         <p className="text-indigo-400 font-extrabold uppercase text-[9px] tracking-widest mt-1">AI Recommendation Ready</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
                      <AnalysisBox label="추천 학년" value={analysis.expected_grade ? `${analysis.expected_grade}학년` : '자동 분석됨'} icon={Users} />
                      <AnalysisBox label="단원명" value={analysis.unit || '자동 분석됨'} icon={BookOpen} />
                      <AnalysisBox label="원본 수준" value={analysis.original_difficulty || '자동 분석됨'} icon={BarChart3} />
                      <AnalysisBox label="AI 추천 수준" value={analysis.recommended_level || '자동 분석됨'} icon={BrainCircuit} />
                    </div>

                    <div className="mb-10">
                      <p className="text-[9px] font-black text-white/35 uppercase tracking-widest mb-4">학습 연계 핵심 개념</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.key_concepts ? analysis.key_concepts.map((c: string) => (
                          <span key={c} className="bg-white/5 px-4.5 py-2 border border-white/5 rounded-2xl text-white/80 text-sm font-semibold">{c}</span>
                        )) : (
                          <span className="text-white/20 italic text-sm">분석된 개념이 없습니다.</span>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={() => setCurrentStep('settings')}
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-5 rounded-2xl font-extrabold shadow-xl hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 text-base tracking-tight glow-purple"
                    >
                      문항 생성 설정 진행 <ChevronRight size={18} strokeWidth={3} />
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {currentStep === 'generate' && (
               <motion.div
                key="generate"
                className="max-w-xl mx-auto"
               >
                 <div className="ios-glass rounded-[40px] p-20 shadow-2xl text-center border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    
                    <div className="relative w-24 h-24 mx-auto mb-8 flex items-center justify-center">
                      <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
                      <Loader2 className="animate-spin text-indigo-400" size={38} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-2xl font-extrabold mb-3 text-white tracking-tight leading-tight">맞춤형 문항 생성 중</h3>
                    <p className="text-white/45 text-sm font-medium leading-relaxed max-w-xs mx-auto">
                      설계된 학생 수준에 따라 완벽한 수학 문제를 정밀 설계 및 생성하고 있습니다.
                    </p>
                 </div>
               </motion.div>
            )}

            {currentStep === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                  <div className="flex justify-between items-end mb-4 border-b border-white/5 pb-3">
                    <h2 className="text-[9px] font-black text-white/35 uppercase tracking-widest">생성된 맞춤 문항 세트 ({questions.length}개)</h2>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 rounded-lg text-[9px] font-extrabold uppercase tracking-wider">High Accuracy</span>
                      <span className="px-3 py-1 bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 rounded-lg text-[9px] font-extrabold uppercase tracking-wider">AI Generated</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {questions.map((q, idx) => (
                        <QuestionEditor key={idx} question={q} index={idx} onChange={(newQ) => {
                          const newQuestions = [...questions];
                          newQuestions[idx] = newQ;
                          setQuestions(newQuestions);
                        }} />
                    ))}
                  </div>
              </motion.div>
            )}

            {currentStep === 'publish' && (
               <motion.div
                key="publish"
                className="max-w-xl mx-auto"
               >
                  <div className="ios-glass rounded-[40px] p-12 lg:p-16 shadow-2xl border border-white/10 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    
                    <div className="bg-gradient-to-br from-emerald-400 to-teal-500 w-20 h-20 rounded-[28px] flex items-center justify-center mx-auto mb-10 text-white shadow-lg shadow-emerald-500/15 glow-green">
                       <CheckCircle2 size={40} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-3xl font-extrabold mb-3 text-white tracking-tight leading-tight">배포 완료!</h2>
                    <p className="text-white/45 mb-10 font-medium text-sm leading-relaxed max-w-xs mx-auto">
                      학생들에게 전용 시험지 초대코드를 전달하여 맞춤 평가를 시작하세요.
                    </p>
                    
                    <div className="bg-white/3 border border-white/5 p-8 rounded-[32px] mb-10 shadow-inner">
                       <p className="text-[9px] font-black text-white/35 uppercase tracking-[0.2em] mb-3">Invite Code</p>
                       <p className="text-5xl font-extrabold tracking-tighter text-indigo-300 select-all uppercase">
                          {inviteCode}
                       </p>
                    </div>

                    <div className="flex flex-col gap-4">
                       <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/quiz/${inviteCode}`);
                          alert('진단 링크가 복사되었습니다!');
                        }}
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-5 rounded-2xl font-extrabold flex items-center justify-center gap-2.5 shadow-xl hover:shadow-indigo-500/25 transition-all text-sm tracking-wide glow-purple"
                       >
                          <Send size={18} strokeWidth={2.5} /> 링크 복사하기
                       </button>
                       <button 
                        onClick={() => navigate('/')}
                        className="bg-white/5 hover:bg-white/10 text-white border border-white/5 py-5 rounded-2xl font-bold uppercase text-xs tracking-wider transition-colors"
                       >
                          대시보드로 돌아가기
                       </button>
                    </div>
                  </div>
               </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function UploadButton({ icon: Icon, title, sub, onClick }: { icon: any, title: string, sub: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="p-6 bg-white/3 border border-white/5 rounded-3xl hover:border-indigo-500/40 hover:bg-white/8 transition-all duration-300 group flex items-center gap-5 text-left w-full"
    >
      <div className="bg-white/5 border border-white/5 p-3.5 rounded-2xl text-white/50 group-hover:text-indigo-400 group-hover:scale-105 transition-all duration-300 shadow-sm shrink-0">
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div>
        <p className="font-extrabold text-lg text-white tracking-tight mb-0.5">{title}</p>
        <p className="text-white/40 font-bold text-[10px] uppercase tracking-wider">{sub}</p>
      </div>
    </button>
  );
}

function AnalysisBox({ label, value, icon: Icon }: { label: string, value: string, icon: any }) {
  return (
    <div className="bg-white/3 border border-white/5 p-5.5 rounded-2xl flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-indigo-400 shadow-sm shrink-0">
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div className="min-w-0">
        <p className="text-[8px] font-black text-white/35 uppercase tracking-widest mb-0.5 leading-none">{label}</p>
        <p className="text-base font-extrabold text-white tracking-tight truncate leading-tight">{value}</p>
      </div>
    </div>
  );
}

function SettingsToggle({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <div className="flex justify-between items-center bg-white/3 border border-white/5 p-4 rounded-2xl">
      <span className="text-xs font-bold text-white/60 tracking-tight">{label}</span>
      <button 
        onClick={() => onChange(!checked)}
        className={cn(
          "w-11 h-6 rounded-full relative transition-all duration-300 border",
          checked ? "bg-indigo-600 border-indigo-500" : "bg-white/5 border-white/10"
        )}
      >
        <div className={cn(
          "absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full transition-transform duration-300 shadow-md",
          checked ? "translate-x-5" : ""
        )} />
      </button>
    </div>
  );
}

function QuestionEditor({ question, index, onChange }: { question: Question, index: number, onChange: (q: Question) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [edited, setEdited] = useState(question);

  return (
    <div className="ios-glass rounded-[32px] p-8 lg:p-10 border border-white/10 shadow-sm relative overflow-hidden group">
       <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
       
       <div className="flex justify-between items-start mb-8 pb-5 border-b border-white/5">
          <div className="flex items-center gap-4">
            <span className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-lg shadow-md shadow-indigo-500/10">
              {index + 1}
            </span>
            <div>
               <h4 className="text-[9px] font-black text-white/35 uppercase tracking-[0.2em] leading-none mb-1.5">Question Details</h4>
               <div className="flex gap-1.5 leading-none">
                 <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider">{question.difficulty}</span>
                 <span className="bg-sky-500/10 text-sky-400 border border-sky-500/15 px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider">{question.depth_of_knowledge}</span>
               </div>
            </div>
          </div>
          <div className="flex gap-1">
             <button 
              onClick={() => setIsEditing(!isEditing)}
              className="p-2.5 text-white/40 hover:text-indigo-400 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/5"
             >
                {isEditing ? <Save size={16} strokeWidth={2.5} /> : <Edit2 size={16} strokeWidth={2.5} />}
             </button>
             <button className="p-2.5 text-white/40 hover:text-rose-400 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/5">
                <Trash2 size={16} />
             </button>
          </div>
       </div>

       {isEditing ? (
         <div className="space-y-6">
            <div>
              <label className="block text-[9px] font-black text-white/35 uppercase tracking-widest mb-2 ml-1">Question Text</label>
              <textarea 
                value={edited.question} 
                onChange={e => setEdited({...edited, question: e.target.value})}
                className="w-full p-5 bg-white/5 border border-white/5 rounded-2xl font-bold text-white focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {edited.options.map((opt, i) => (
                <div key={i} className="space-y-2">
                  <label className="text-[9px] font-black text-white/35 uppercase tracking-widest mb-1.5 ml-1">Option {i + 1}</label>
                  <input 
                    value={opt}
                    onChange={e => {
                      const newOpts = [...edited.options];
                      newOpts[i] = e.target.value;
                      setEdited({...edited, options: newOpts});
                    }}
                    className={cn(
                      "w-full p-4 border rounded-2xl font-bold text-white transition-all bg-white/3", 
                      i === edited.answer ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300" : "border-white/5"
                    )}
                  />
                </div>
              ))}
            </div>
            <button 
              onClick={() => { onChange(edited); setIsEditing(false); }}
              className="bg-white text-slate-900 px-7 py-3 rounded-xl font-extrabold uppercase text-xs tracking-wider shadow-md hover:bg-indigo-50 transition-all"
            >
              Update Question
            </button>
         </div>
       ) : (
         <div>
            <MathRenderer content={question.question} className="text-2xl font-extrabold mb-8 text-white leading-snug tracking-tight" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
               {question.options.map((opt, i) => (
                 <div 
                  key={i} 
                  className={cn(
                    "p-5 rounded-[22px] border flex items-center gap-4 transition-all bg-white/3",
                    i === question.answer 
                      ? "border-indigo-500/30 bg-indigo-500/5 text-indigo-300" 
                      : "border-white/5"
                  )}
                 >
                    <span className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-base shrink-0 border shadow-sm",
                      i === question.answer ? "bg-indigo-600 border-white/10 text-white" : "bg-white/5 border-white/5 text-white/30"
                    )}>
                      {i + 1}
                    </span>
                    <MathRenderer content={opt} className="font-semibold text-sm text-white/80" />
                 </div>
               ))}
            </div>
            
            <div className="bg-white/3 border border-white/5 rounded-[28px] p-6.5">
               <div className="flex items-center gap-2.5 mb-4 border-b border-white/5 pb-2.5">
                  <BrainCircuit className="text-indigo-400" size={18} strokeWidth={2.5} />
                  <span className="font-black text-[9px] text-indigo-400 uppercase tracking-[0.2em] mt-0.5">Solution & Misconception Insights</span>
               </div>
               <p className="text-white/70 font-semibold text-xs leading-relaxed bg-white/3 p-5 rounded-2xl border border-white/5 mb-5">{question.explanation}</p>
               <div className="bg-indigo-500/10 p-5 rounded-2xl border border-indigo-500/20">
                  <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">AI Diagnostic Focus Point</p>
                  <p className="text-xs text-indigo-300 font-bold leading-normal">{question.misconception_points}</p>
               </div>
            </div>
         </div>
       )}
    </div>
  );
}
