import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BookOpen,
  LogOut 
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white text-lg">Σ</div>
          <span className="text-white font-black text-xl tracking-tight">EduAI Math</span>
        </div>
        
        <nav className="flex-1 px-4 mt-4 space-y-2">
          <NavItem to="/" icon={LayoutDashboard} label="대시보드" />
          <NavItem to="/join" icon={Users} label="학생 접속 (미리보기)" />
          <NavItem to="#" icon={BookOpen} label="자료실" disabled />
        </nav>

        <div className="p-6 mt-auto">
          <div className="bg-slate-800 rounded-2xl p-4">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Account</p>
            <p className="text-sm text-white font-bold">선생님 계정</p>
            <p className="text-xs text-slate-500 italic">수학 전문가</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavItem({ to, icon: Icon, label, disabled = false }: { to: string, icon: any, label: string, disabled?: boolean }) {
  if (disabled) {
    return (
      <div className="flex items-center gap-3 p-3 text-slate-600 rounded-xl cursor-not-allowed opacity-50">
        <Icon size={20} />
        <span className="font-bold text-sm">{label}</span>
      </div>
    );
  }

  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => cn(
        "flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm",
        isActive 
          ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30" 
          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
      )}
    >
      <Icon size={20} />
      <span>{label}</span>
      {to === '/' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />}
    </NavLink>
  );
}
