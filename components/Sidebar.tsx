
import React from 'react';
import { Project, ActivityLog } from '../types';

interface SidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onOpenSettings: () => void;
  activity: ActivityLog[];
}

const Sidebar: React.FC<SidebarProps> = ({ 
  projects, 
  activeProjectId, 
  onSelectProject, 
  onNewProject,
  onOpenSettings,
  activity 
}) => {
  return (
    <aside className="w-80 h-screen flex flex-col bg-[#0f172a] border-r border-slate-800 shadow-2xl z-20">
      {/* Header */}
      <div className="p-6 border-b border-slate-800 bg-[#1e293b]/10 backdrop-blur-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <i className="fas fa-layer-group text-2xl text-white"></i>
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-white">TRINITY</h1>
            <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">Multi-Agent System</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={onNewProject}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/10 active:scale-95"
          >
            <i className="fas fa-plus-circle"></i>
            New Project
          </button>
          <button 
            onClick={onOpenSettings}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-xl transition-all border border-slate-700 active:scale-95"
            title="System Configuration"
          >
            <i className="fas fa-cog"></i>
          </button>
        </div>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        <h2 className="text-[10px] uppercase font-bold text-slate-500 mb-4 px-3 tracking-[0.2em]">Workspaces</h2>
        {projects.length === 0 && (
          <div className="px-3 py-6 text-center border-2 border-dashed border-slate-800 rounded-2xl">
            <p className="text-xs text-slate-600 italic">Initialize a workspace to begin orchestration.</p>
          </div>
        )}
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className={`w-full group flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all duration-300 ${
              activeProjectId === project.id 
                ? 'bg-indigo-600/10 text-indigo-300 border border-indigo-500/30 shadow-lg' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3 truncate">
              <i className={`fas fa-folder ${activeProjectId === project.id ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-400'}`}></i>
              <span className="truncate font-medium">{project.name}</span>
            </div>
            {activeProjectId === project.id && <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>}
          </button>
        ))}
      </div>

      {/* Activity Feed */}
      <div className="h-[300px] border-t border-slate-800 bg-black/20 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <h2 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">System activity</h2>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[9px] text-emerald-500 font-bold uppercase">Online</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {activity.slice().reverse().map((log) => (
            <div key={log.id} className="text-[11px] group animate-in slide-in-from-bottom-1 duration-300">
              <div className="flex items-center justify-between mb-1">
                <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-tighter ${
                  log.agent === 'Conductor' ? 'bg-indigo-500/20 text-indigo-400' :
                  log.agent === 'Research Lead' ? 'bg-amber-500/20 text-amber-400' :
                  log.agent === 'Validator' ? 'bg-emerald-500/20 text-emerald-400' :
                  'bg-slate-700/50 text-slate-400'
                }`}>
                  {log.agent}
                </span>
                <span className="text-slate-600 text-[9px] font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
              <p className={`${
                log.type === 'error' ? 'text-red-400 border-l border-red-500/50 pl-2' : 
                log.type === 'success' ? 'text-emerald-400' : 
                'text-slate-400'
              } leading-relaxed font-medium`}>
                {log.message}
              </p>
            </div>
          ))}
          {activity.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
              <i className="fas fa-terminal text-2xl mb-2"></i>
              <p className="text-[10px] uppercase font-bold tracking-tighter text-center">Awaiting execution...</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
