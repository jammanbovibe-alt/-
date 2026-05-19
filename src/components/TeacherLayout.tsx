import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen,
  Settings,
  Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen ios-wallpaper font-sans text-slate-100 overflow-hidden p-6 gap-6">
      {/* Sidebar Navigation - Sleek iOS 26 Floating Glass Dock */}
      <aside className="w-72 ios-glass rounded-[32px] flex flex-col shrink-0 overflow-hidden shadow-2xl relative">
        {/* Glow effect on the top */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        
        {/* Logo Section */}
        <div className="p-8 flex items-center gap-3.5 cursor-pointer border-b border-white/5" onClick={() => navigate('/')}>
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 glow-purple">
            <Sparkles size={20} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-extrabold text-lg tracking-tight leading-tight">EduAI Math</span>
            <span className="text-[10px] text-purple-300/70 font-semibold tracking-wider uppercase">iOS 26 Engine</span>
          </div>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-8 space-y-2.5">
          <NavItem to="/" icon={LayoutDashboard} label="선생님 대시보드" />
          <NavItem to="/join" icon={Users} label="학생 접속 (미리보기)" />
          <NavItem to="#" icon={BookOpen} label="자료실 (준비중)" disabled />
        </nav>

        {/* Footer Account Widget */}
        <div className="p-6 mt-auto">
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4.5 flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 flex items-center justify-center font-black text-sm text-slate-300">
              T
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-xs text-white font-black truncate leading-tight">선생님 계정</p>
              <p className="text-[10px] text-purple-300/60 font-semibold tracking-tight mt-0.5">수학 전문가</p>
            </div>
            <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </aside>

      {/* Main Content Area - In a floating window */}
      <main className="flex-1 ios-glass rounded-[32px] flex flex-col overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
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
      <div className="flex items-center gap-3.5 px-4.5 py-4 text-white/30 rounded-2xl cursor-not-allowed opacity-40">
        <Icon size={20} strokeWidth={2} />
        <span className="font-bold text-sm tracking-tight">{label}</span>
      </div>
    );
  }

  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => cn(
        "flex items-center gap-3.5 px-4.5 py-4 rounded-2xl transition-all duration-300 font-bold text-sm tracking-tight",
        isActive 
          ? "bg-white/10 text-white border border-white/10 shadow-lg shadow-black/10" 
          : "text-white/60 hover:bg-white/5 hover:text-white"
      )}
    >
      {({ isActive }) => (
        <>
          <div className={cn(
            "p-1.5 rounded-lg transition-colors",
            isActive ? "text-indigo-400" : "text-white/60 group-hover:text-white"
          )}>
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
          </div>
          <span>{label}</span>
          {isActive && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
          )}
        </>
      )}
    </NavLink>
  );
}
