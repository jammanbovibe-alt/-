import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  FileText, 
  Type, 
  Settings, 
  BrainCircuit, 
  CheckCircle2, 
  ChevronRight, 
  ArrowLeft,
  Loader2,
  Trash2,
  Edit2,
  Save,
  Plus,
  Send,
  Users,
  BookOpen,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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
      const data = await resp.json();
      setQuestions(data);
      setCurrentStep('review');
    } catch (e) {
      console.error(e);
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
    <div className="flex flex-col h-full bg-slate-50">
      {/* Top Action Bar */}
      <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase tracking-widest">
            STEP {stepIndex + 1}/6
          </span>
          <h1 className="text-lg font-black tracking-tight text-slate-900">
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
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors text-slate-600"
              >
                설정 수정
              </button>
              <button 
                onClick={handlePublish}
                disabled={isPublishing}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 disabled:opacity-50 uppercase tracking-tight"
              >
                {isPublishing ? <Loader2 className="animate-spin" size={18} strokeWidth={3} /> : <Send size={18} strokeWidth={3} />}
                배포하기
              </button>
            </>
          )}
          {currentStep !== 'publish' && currentStep !== 'upload' && (
             <button onClick={() => navigate('/')} className="text-slate-400 p-2 hover:bg-slate-50 rounded-lg">
                <Trash2 size={20} />
             </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Context/Settings (Only on specific steps) */}
        {(currentStep === 'review' || currentStep === 'settings') && (
          <aside className="w-80 bg-white border-r border-slate-200 p-8 flex flex-col shrink-0 overflow-y-auto">
            <h2 className="text-[10px] uppercase font-black text-slate-400 mb-8 tracking-[0.2em]">문항 생성 설정</h2>
            
            <div className="space-y-8 flex-1">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">문항 세트 제목</label>
                <input 
                  type="text" 
                  value={settings.title}
                  onChange={e => setSettings(p => ({ ...p, title: e.target.value }))}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">학생 수준</label>
                <div className="flex gap-2">
                  {['하', '중', '상'].map(level => (
                    <button 
                      key={level}
                      onClick={() => setSettings(p => ({ ...p, studentLevel: level }))}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-xs font-black transition-all border-2",
                        settings.studentLevel === level 
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm" 
                          : "border-slate-100 text-slate-400 hover:border-slate-200"
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

              <div className="pt-8 border-t border-slate-100">
                <button 
                  onClick={startGeneration}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 uppercase tracking-widest hover:bg-slate-800 transition-colors"
                >
                  <BrainCircuit size={18} strokeWidth={2.5} /> 문항 재생성
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* Main Area */}
        <div className="flex-1 overflow-y-auto p-12">
          <AnimatePresence mode="wait">
            {currentStep === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-xl mx-auto"
              >
                <div className="bg-white rounded-[40px] p-16 shadow-2xl border border-slate-200 text-center relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-2 bg-indigo-600" />
                  <div className="bg-indigo-50 w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-lg shadow-indigo-100">
                    <Upload className="text-indigo-600" size={40} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-4xl font-black mb-4 text-slate-900 tracking-tight">문항의 시작</h2>
                  <p className="text-slate-400 mb-12 font-medium text-lg leading-relaxed">
                    AI가 분석하고 추천 문항을 생성할 자료를 선택하세요.
                  </p>

                  <div className="grid grid-cols-1 gap-4">
                    <UploadButton 
                      icon={FileText} 
                      title="PDF 또는 이미지" 
                      sub="학습지, 교과서 캡처 등"
                      onClick={() => { setSourceType('pdf'); fileInputRef.current?.click(); }}
                    />
                    <UploadButton 
                      icon={Type} 
                      title="텍스트 직접 입력" 
                      sub="개념 설명이나 문제 텍스트"
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
                  <div className="bg-white rounded-[40px] p-20 shadow-2xl text-center border border-slate-200">
                    <div className="relative w-32 h-32 mx-auto mb-10">
                      <div className="absolute inset-0 border-8 border-slate-100 rounded-full"></div>
                      <div className="absolute inset-0 border-8 border-t-indigo-600 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
                        <BrainCircuit size={48} strokeWidth={2.5} />
                      </div>
                    </div>
                    <h3 className="text-3xl font-black mb-4 tracking-tight">AI 심층 분석 중</h3>
                    <p className="text-slate-500 font-medium">단원명, 핵심 개념, 추천 수준을 파악하고 있습니다.</p>
                  </div>
                ) : analysis && (
                  <div className="bg-white rounded-[40px] p-12 shadow-2xl border border-slate-200">
                    <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-100">
                       <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-lg shadow-indigo-200">
                         <CheckCircle2 size={32} strokeWidth={2.5} />
                       </div>
                       <div>
                         <h3 className="text-2xl font-black tracking-tight text-slate-900">분석이 완료되었습니다</h3>
                         <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">AI Recommendation Ready</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-12">
                      <AnalysisBox label="학년" value={analysis.expected_grade ? `${analysis.expected_grade}학년` : '자동 분석됨'} icon={Users} />
                      <AnalysisBox label="단원명" value={analysis.unit || '자동 분석됨'} icon={BookOpen} />
                      <AnalysisBox label="원본 수준" value={analysis.original_difficulty || '자동 분석됨'} icon={BarChart3} />
                      <AnalysisBox label="AI 추천 수준" value={analysis.recommended_level || '자동 분석됨'} icon={BrainCircuit} />
                    </div>

                    <div className="mb-12">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">학습 핵심 개념</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.key_concepts ? analysis.key_concepts.map((c: string) => (
                          <span key={c} className="bg-slate-100 px-4 py-2 rounded-xl text-slate-700 text-sm font-bold border border-slate-200">{c}</span>
                        )) : (
                          <span className="text-slate-400 italic text-sm">분석된 개념이 없습니다.</span>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={() => setCurrentStep('settings')}
                      className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 text-lg hover:bg-indigo-700 transition-all uppercase tracking-tight"
                    >
                      문항 생성 설정 진행 <ChevronRight size={20} strokeWidth={3} />
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {currentStep === 'generate' && (
               <motion.div
                key="generate"
                className="max-w-xl mx-auto bg-slate-900 rounded-[40px] p-24 shadow-2xl text-center relative overflow-hidden"
               >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16" />
                  <div className="relative z-10">
                    <Loader2 className="animate-spin text-indigo-500 mx-auto mb-8" size={64} strokeWidth={2.5} />
                    <h3 className="text-3xl font-black mb-4 text-white tracking-tight">맞춤형 문항 생성 중</h3>
                    <p className="text-slate-400 font-medium">설계된 수준에 따라 정밀한 수학 문제를 설계하고 있습니다.</p>
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
                  <div className="flex justify-between items-end mb-4">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">생성된 문항 ({questions.length}개)</h2>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest">High Accuracy</span>
                      <span className="px-3 py-1 bg-sky-50 text-sky-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Customized</span>
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
                  <div className="bg-white rounded-[40px] p-16 shadow-2xl border border-slate-200 text-center relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-2 bg-emerald-500" />
                    <div className="bg-emerald-50 w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto mb-10 text-emerald-600 shadow-lg shadow-emerald-50">
                       <CheckCircle2 size={56} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-4xl font-black mb-4 tracking-tight">배포 완료!</h2>
                    <p className="text-slate-400 mb-12 font-medium">학생들에게 초대코드를 공유하여 학습을 시작하세요.</p>
                    
                    <div className="bg-slate-50 p-10 rounded-[32px] border border-slate-100 mb-12 shadow-inner">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Invite Code</p>
                       <p className="text-6xl font-black tracking-tighter text-indigo-600 select-all uppercase">
                          {inviteCode}
                       </p>
                    </div>

                    <div className="flex flex-col gap-4">
                       <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/quiz/${inviteCode}`);
                          alert('링크가 복사되었습니다!');
                        }}
                        className="bg-indigo-600 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase text-sm tracking-widest"
                       >
                          <Send size={20} strokeWidth={3} /> 링크 복사하기
                       </button>
                       <button 
                        onClick={() => navigate('/')}
                        className="bg-white text-slate-600 py-5 rounded-2xl font-black hover:bg-slate-50 border border-slate-200 uppercase text-xs tracking-widest transition-colors"
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
      className="p-8 bg-slate-50 border-2 border-slate-100 rounded-3xl hover:border-indigo-600 hover:bg-indigo-50/30 transition-all duration-300 group flex items-center gap-6 text-left"
    >
      <div className="bg-white p-4 rounded-2xl shadow-sm text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 transition-all duration-300">
        <Icon size={32} strokeWidth={2.5} />
      </div>
      <div>
        <p className="font-black text-xl text-slate-800 tracking-tight mb-0.5">{title}</p>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-tight">{sub}</p>
      </div>
    </button>
  );
}

function AnalysisBox({ label, value, icon: Icon }: { label: string, value: string, icon: any }) {
  return (
    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-500 shadow-sm">
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-lg font-black text-slate-800 tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function SettingsToggle({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
      <span className="text-xs font-black text-slate-600 uppercase tracking-tight">{label}</span>
      <button 
        onClick={() => onChange(!checked)}
        className={cn(
          "w-12 h-6 rounded-full relative transition-all duration-300",
          checked ? "bg-indigo-600" : "bg-slate-300"
        )}
      >
        <div className={cn(
          "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm",
          checked ? "translate-x-6" : ""
        )} />
      </button>
    </div>
  );
}

function QuestionEditor({ question, index, onChange }: { question: Question, index: number, onChange: (q: Question) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [edited, setEdited] = useState(question);

  return (
    <div className="bg-white rounded-[32px] p-10 border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
       <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
       
       <div className="flex justify-between items-start mb-10">
          <div className="flex items-center gap-4">
            <span className="bg-indigo-600 text-white w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg shadow-indigo-100">
              {index + 1}
            </span>
            <div>
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Question Details</h4>
               <div className="flex gap-2 mt-1">
                 <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{question.difficulty}</span>
                 <span className="bg-sky-50 text-sky-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{question.depth_of_knowledge}</span>
               </div>
            </div>
          </div>
          <div className="flex gap-2">
             <button 
              onClick={() => setIsEditing(!isEditing)}
              className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
             >
                {isEditing ? <Save size={20} strokeWidth={2.5} /> : <Edit2 size={20} strokeWidth={2.5} />}
             </button>
             <button className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                <Trash2 size={20} />
             </button>
          </div>
       </div>

       {isEditing ? (
         <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Question Text</label>
              <textarea 
                value={edited.question} 
                onChange={e => setEdited({...edited, question: e.target.value})}
                className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {edited.options.map((opt, i) => (
                <div key={i} className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Option {i + 1}</label>
                  <input 
                    value={opt}
                    onChange={e => {
                      const newOpts = [...edited.options];
                      newOpts[i] = e.target.value;
                      setEdited({...edited, options: newOpts});
                    }}
                    className={cn(
                      "w-full p-4 border-2 rounded-2xl font-bold transition-all", 
                      i === edited.answer ? "border-emerald-600 bg-emerald-50" : "border-slate-100 bg-white"
                    )}
                  />
                </div>
              ))}
            </div>
            <button 
              onClick={() => { onChange(edited); setIsEditing(false); }}
              className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest"
            >
              Update Question
            </button>
         </div>
       ) : (
         <div>
            <MathRenderer content={question.question} className="text-2xl font-black mb-10 text-slate-800 leading-tight tracking-tight" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
               {question.options.map((opt, i) => (
                 <div 
                  key={i} 
                  className={cn(
                    "p-6 rounded-[24px] border-2 flex items-center gap-4 transition-all",
                    i === question.answer ? "border-indigo-600 bg-indigo-50" : "border-slate-50 bg-slate-50 shadow-inner"
                  )}
                 >
                    <span className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shrink-0 shadow-sm",
                      i === question.answer ? "bg-indigo-600 text-white" : "bg-white text-slate-400"
                    )}>
                      {i + 1}
                    </span>
                    <MathRenderer content={opt} className="font-bold text-lg text-slate-700" />
                 </div>
               ))}
            </div>
            
            <div className="bg-slate-900 rounded-[32px] p-8 border border-slate-800">
               <div className="flex items-center gap-3 mb-4">
                  <BrainCircuit className="text-indigo-400" size={20} strokeWidth={2.5} />
                  <span className="font-black text-[10px] text-indigo-400 uppercase tracking-[0.2em]">Solution & Misconception Insights</span>
               </div>
               <p className="text-slate-300 font-medium leading-relaxed mb-6 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">{question.explanation}</p>
               <div className="bg-indigo-500/10 p-5 rounded-2xl border border-indigo-500/20">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">AI Debug Point</p>
                  <p className="text-sm text-indigo-300 font-bold leading-snug">{question.misconception_points}</p>
               </div>
            </div>
         </div>
       )}
    </div>
  );
}
