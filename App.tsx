
import React, { useState, useCallback } from 'react';
import { Project, ActivityLog, SystemConfig } from './types';
import Sidebar from './components/Sidebar';
import ProjectView from './components/ProjectView';

const PRESET_MODELS = [
  { value: 'gemini-3-pro-preview', label: 'Gemini 3 Pro (Ultimate Reasoning)' },
  { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash (High Throughput)' },
  { value: 'gemini-flash-lite-latest', label: 'Gemini Flash Lite (Near Instant)' },
];

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    conductorModel: 'gemini-3-pro-preview',
    researchModel: 'gemini-3-flash-preview',
    coderModel: 'gemini-3-pro-preview',
    validatorModel: 'gemini-3-pro-preview',
    searchEngineId: ''
  });

  const [isCustom, setIsCustom] = useState({
    conductor: false,
    research: false,
    coder: false,
    validator: false
  });

  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  const handleNewProject = useCallback(() => {
    const name = prompt("Designate project identifier:");
    if (!name) return;

    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name: name.toUpperCase(),
      files: [],
      createdAt: Date.now()
    };

    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    
    setActivity(prev => [...prev, {
      id: Math.random().toString(),
      timestamp: Date.now(),
      agent: 'Conductor',
      message: `Project workspace initialized: ${newProject.name}`,
      type: 'success'
    }]);
  }, []);

  const updateProject = useCallback((updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  }, []);

  const addLog = useCallback((log: ActivityLog) => {
    setActivity(prev => [...prev, log]);
  }, []);

  const renderModelSelect = (
    label: string, 
    value: string, 
    onChange: (val: string) => void, 
    engineKey: keyof typeof isCustom,
    description: string
  ) => {
    return (
      <div className="space-y-3">
        <label className="block">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] block mb-3">{label}</span>
          <div className="flex gap-3">
            {!isCustom[engineKey] ? (
              <select 
                value={value}
                onChange={(e) => {
                  if (e.target.value === 'CUSTOM') setIsCustom(prev => ({ ...prev, [engineKey]: true }));
                  else onChange(e.target.value);
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all appearance-none cursor-pointer hover:border-slate-700"
              >
                {PRESET_MODELS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
                <option value="CUSTOM">+ Use Custom Model Key...</option>
              </select>
            ) : (
              <div className="flex-1 flex gap-2">
                <input 
                  type="text"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="custom-model-id-v1"
                  className="flex-1 bg-slate-950 border border-indigo-500/40 rounded-xl px-4 py-3 text-sm text-slate-100 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  autoFocus
                />
                <button 
                  onClick={() => setIsCustom(prev => ({ ...prev, [engineKey]: false }))}
                  className="px-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 border border-slate-700 transition-all"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            )}
          </div>
          <p className="text-[10px] text-slate-600 mt-2 font-medium">{description}</p>
        </label>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-screen bg-[#020617] text-slate-200 overflow-hidden select-none selection:bg-indigo-500/30">
      <Sidebar 
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={setActiveProjectId}
        onNewProject={handleNewProject}
        onOpenSettings={() => setShowSettings(true)}
        activity={activity}
      />
      
      {activeProject ? (
        <ProjectView 
          project={activeProject} 
          onUpdateProject={updateProject}
          onAddLog={addLog}
          config={systemConfig}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-black/40 relative">
          {/* Abstract Grid Background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #4f46e5 1px, transparent 1px), linear-gradient(to bottom, #4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
          
          <div className="max-w-xl text-center z-10 animate-in fade-in zoom-in duration-700">
            <div className="w-28 h-28 bg-indigo-600/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 text-indigo-500 border border-indigo-500/20 shadow-[0_0_80px_rgba(79,70,229,0.1)] relative">
              <i className="fas fa-atom text-5xl animate-spin-slow"></i>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center border-4 border-black text-[10px] text-white font-black">3.0</div>
            </div>
            
            <h2 className="text-4xl font-black text-white mb-6 tracking-tight">TRINITY AGENT SYSTEM</h2>
            <p className="text-lg text-slate-500 leading-relaxed mb-12 font-medium">
              High-reasoning multi-agent environment powered by Gemini 3. 
              Automated research, synthesis, and validated code generation in one unified cluster.
            </p>
            
            <div className="flex gap-6 justify-center">
              <button 
                onClick={handleNewProject}
                className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black transition-all shadow-[0_20px_50px_rgba(79,70,229,0.3)] active:scale-95 uppercase tracking-widest text-xs"
              >
                Launch Workspace
              </button>
              <button 
                onClick={() => setShowSettings(true)}
                className="px-8 py-4 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-2xl font-black transition-all border border-slate-700 active:scale-95 uppercase tracking-widest text-xs"
              >
                Cluster Config
              </button>
            </div>
          </div>
          
          <div className="absolute bottom-12 left-0 right-0 grid grid-cols-4 gap-8 px-12 max-w-6xl mx-auto opacity-40">
            {[
              { label: 'Conductor', desc: 'Context Hub' },
              { label: 'Research', desc: 'Technical Grounding' },
              { label: 'Coder', desc: 'Logic Synthesis' },
              { label: 'Validator', desc: 'Proof Check' }
            ].map(agent => (
              <div key={agent.label} className="text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-1">{agent.label}</p>
                <p className="text-[10px] text-slate-600 font-bold">{agent.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SYSTEM CONFIG MODAL */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-[#020617]/95 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/50">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                  <i className="fas fa-sliders-h text-2xl"></i>
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight">System Engines</h2>
                  <p className="text-sm text-slate-500 font-medium">Configure specialized nodes for roles</p>
                </div>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-white bg-slate-800 rounded-2xl border border-slate-700 transition-all">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 space-y-10 scrollbar-thin">
              <div className="grid grid-cols-1 gap-10">
                {renderModelSelect(
                  "Core Conductor Node", 
                  systemConfig.conductorModel, 
                  (val) => setSystemConfig({...systemConfig, conductorModel: val}),
                  'conductor',
                  "Orchestrator responsible for intent parsing and agent delegation."
                )}

                {renderModelSelect(
                  "Research Swarm Agent", 
                  systemConfig.researchModel, 
                  (val) => setSystemConfig({...systemConfig, researchModel: val}),
                  'research',
                  "Node dedicated to technical grounding via Google Search API."
                )}

                {renderModelSelect(
                  "Synthesis Coder Agent", 
                  systemConfig.coderModel, 
                  (val) => setSystemConfig({...systemConfig, coderModel: val}),
                  'coder',
                  "Generative node for structural code and implementation."
                )}

                {renderModelSelect(
                  "Verification Validator Node", 
                  systemConfig.validatorModel, 
                  (val) => setSystemConfig({...systemConfig, validatorModel: val}),
                  'validator',
                  "Logical validation node used for proof-checking all code artifacts."
                )}

                <label className="block bg-black/30 p-8 rounded-[2rem] border border-slate-800 group hover:border-slate-700 transition-all">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] block mb-4">Grounding Engine ID</span>
                  <div className="relative">
                    <input 
                      type="text"
                      value={systemConfig.searchEngineId}
                      onChange={(e) => setSystemConfig({...systemConfig, searchEngineId: e.target.value})}
                      placeholder="Custom CX Engine Key (Optional)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder-slate-700"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none">
                      <i className="fas fa-fingerprint"></i>
                    </div>
                  </div>
                  <p className="mt-4 text-[10px] text-slate-600 font-medium leading-relaxed">Overrides default system grounding if specific indices are required for your domain.</p>
                </label>
              </div>

              <div className="bg-indigo-600/5 border border-indigo-500/20 rounded-3xl p-6 flex gap-6 items-center">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                  <i className="fas fa-info-circle text-xl"></i>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Configuring specialized engines allows the Trinity Cluster to leverage role-specific reasoning paths. 
                  Models like <b>Gemini 3 Pro</b> are recommended for Conductor and Validator roles to ensure high fidelity.
                </p>
              </div>
            </div>

            <div className="p-10 border-t border-slate-800 flex justify-end shrink-0 bg-slate-900/30">
              <button 
                onClick={() => setShowSettings(false)}
                className="px-12 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black transition-all shadow-[0_20px_50px_rgba(79,70,229,0.3)] active:scale-95 uppercase tracking-widest text-xs"
              >
                Apply Cluster Config
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 5px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default App;
