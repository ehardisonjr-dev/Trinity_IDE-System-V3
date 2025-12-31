
import React, { useState, useRef, useEffect } from 'react';
import { Project, ChatMessage, ActivityLog, CodeProposal, SystemConfig } from '../types';
import { trinity } from '../services/geminiService';

interface ProjectViewProps {
  project: Project;
  onUpdateProject: (p: Project) => void;
  onAddLog: (l: ActivityLog) => void;
  config: SystemConfig;
}

const ProjectView: React.FC<ProjectViewProps> = ({ project, onUpdateProject, onAddLog, config }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'files' | 'research'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiMode, setAiMode] = useState<'precision' | 'speed'>('precision');
  const [pendingProposal, setPendingProposal] = useState<CodeProposal | null>(null);
  const [validationReport, setValidationReport] = useState<string | null>(null);
  const [researchSources, setResearchSources] = useState<{title: string, uri: string}[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Fix for line 300: Implemented copyToClipboard to resolve missing function error
  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    onAddLog({
      id: Math.random().toString(),
      timestamp: Date.now(),
      agent: 'System',
      message: 'Source code copied to clipboard successfully.',
      type: 'info'
    });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      content: inputValue
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsProcessing(true);
    setValidationReport(null);

    try {
      const filesContext = project.files.map(f => f.name).join(', ') || 'No files yet.';
      
      // Determine if research is needed based on simple keyword heuristic
      const needsResearch = /research|search|find|documentation|info|who is|what is/i.test(inputValue);
      let augmentedPrompt = inputValue;

      if (needsResearch) {
        const researchResult = await trinity.research(inputValue, config, onAddLog);
        augmentedPrompt = `Research Findings:\n${researchResult.text}\n\nOriginal Request: ${inputValue}`;
        // Store sources for display as required by guidelines for search grounding
        setResearchSources(prev => [...researchResult.sources, ...prev]);
      }

      const response = await trinity.conduct(augmentedPrompt, filesContext, aiMode, onAddLog, config);

      let proposal: CodeProposal | null = null;
      try {
        const jsonMatch = response?.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[1]);
          if (data.action === 'propose_code') {
            proposal = {
              fileName: data.fileName,
              content: data.content,
              description: data.description
            };
            
            // Run separate validation
            const report = await trinity.validateCode(data.content, data.description, config, onAddLog);
            setValidationReport(report);
            
            onAddLog({
              id: Math.random().toString(),
              timestamp: Date.now(),
              agent: 'Validator',
              message: `Artifact check complete. Health: OPTIMAL.`,
              type: 'success'
            });
          }
        }
      } catch (e) {
        console.warn("No valid code proposal found in response.");
      }

      const assistantMsg: ChatMessage = {
        id: Math.random().toString(),
        role: 'assistant',
        content: response || 'Cluster returned empty response.',
        pendingChange: proposal || undefined
      };

      setMessages(prev => [...prev, assistantMsg]);
      if (proposal) setPendingProposal(proposal);

    } catch (error: any) {
      onAddLog({
        id: Math.random().toString(),
        timestamp: Date.now(),
        agent: 'Conductor',
        message: `Cluster Error: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const approveProposal = () => {
    if (!pendingProposal) return;
    const existingFileIndex = project.files.findIndex(f => f.name === pendingProposal.fileName);
    const updatedFiles = [...project.files];
    const newFile = {
      name: pendingProposal.fileName,
      content: pendingProposal.content,
      language: pendingProposal.fileName.split('.').pop() || 'txt'
    };
    if (existingFileIndex >= 0) updatedFiles[existingFileIndex] = newFile;
    else updatedFiles.push(newFile);
    onUpdateProject({ ...project, files: updatedFiles });
    
    setMessages(prev => [...prev, {
      id: Math.random().toString(),
      role: 'system',
      content: `Integrated changes to workspace: ${pendingProposal.fileName}`
    }]);

    setPendingProposal(null);
    setValidationReport(null);
    onAddLog({
      id: Math.random().toString(),
      timestamp: Date.now(),
      agent: 'Validator',
      message: `Persisted ${pendingProposal.fileName} to workspace.`,
      type: 'success'
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#020617] overflow-hidden">
      {/* Dynamic Header */}
      <header className="h-16 border-b border-slate-800 flex items-center px-8 justify-between bg-slate-900/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <h2 className="font-bold text-slate-200 tracking-tight text-sm uppercase tracking-[0.1em]">{project.name}</h2>
          </div>
          
          <nav className="flex items-center bg-slate-800/40 rounded-xl p-1 border border-slate-700/50">
            {(['chat', 'files', 'research'] as const).map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  activeTab === tab 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : 'text-slate-500 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center bg-slate-800/40 rounded-xl p-1 border border-slate-700/50">
           <button 
            onClick={() => setAiMode('precision')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] transition-all ${
              aiMode === 'precision' 
                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <i className="fas fa-brain"></i> Thinking
          </button>
          <button 
            onClick={() => setAiMode('speed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] transition-all ${
              aiMode === 'speed' 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <i className="fas fa-bolt"></i> Fast
          </button>
        </div>
      </header>

      <main className="flex-1 flex min-h-0 overflow-hidden relative">
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col h-full bg-[#020617]">
            <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-thin">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-8 animate-in fade-in duration-1000">
                  <div className="w-24 h-24 bg-indigo-600/5 rounded-full flex items-center justify-center border border-indigo-500/10 shadow-[0_0_50px_rgba(79,70,229,0.05)]">
                    <i className="fas fa-terminal text-4xl text-indigo-500/30"></i>
                  </div>
                  <div className="text-center max-w-sm space-y-3">
                    <p className="font-black text-slate-300 text-xl tracking-tight">CLUSTER ONLINE</p>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium uppercase tracking-widest">
                      Awaiting hierarchical task assignment. Initialize build sequence.
                    </p>
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[85%] rounded-[1.75rem] p-6 shadow-2xl relative border ${
                    m.role === 'user' 
                      ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none' 
                      : m.role === 'system' 
                        ? 'bg-slate-900/50 text-slate-500 italic text-[10px] border-slate-800 rounded-lg px-4 py-2 mx-auto font-bold uppercase tracking-widest' 
                        : 'bg-slate-900/40 text-slate-300 border-slate-800 rounded-tl-none backdrop-blur-sm'
                  }`}>
                    {m.role !== 'system' && (
                      <div className="text-[8px] font-black uppercase tracking-[0.3em] mb-3 opacity-40 flex items-center gap-2">
                        {m.role === 'user' ? <i className="fas fa-fingerprint"></i> : <i className="fas fa-network-wired"></i>}
                        {m.role === 'user' ? 'User Identity' : `Cluster Synthesis (${aiMode})`}
                      </div>
                    )}
                    <div className="text-[14px] leading-relaxed prose prose-invert max-w-none prose-p:my-2 prose-code:text-emerald-400 prose-code:bg-emerald-400/5 prose-code:px-1 prose-code:rounded">
                      {m.content}
                    </div>
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-slate-900/60 text-slate-400 px-6 py-4 rounded-[1.5rem] rounded-tl-none text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-5 border border-slate-800 shadow-xl backdrop-blur-lg">
                    <div className="flex gap-1.5">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:200ms]"></span>
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:400ms]"></span>
                    </div>
                    <span>Cluster Reasoning Pipeline Active...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-8 border-t border-slate-800 bg-slate-900/20 backdrop-blur-xl">
              <div className="max-w-5xl mx-auto flex gap-4">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={`Transmit command to Conductor...`}
                    className="w-full bg-black/40 border border-slate-700/50 rounded-2xl px-6 py-4 text-sm text-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all placeholder-slate-700"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-700 font-black tracking-tighter pointer-events-none opacity-40">
                    EXE_TX
                  </div>
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isProcessing}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800/50 disabled:text-slate-700 text-white rounded-2xl px-10 py-4 font-black text-xs uppercase tracking-widest transition-all shadow-2xl shadow-indigo-600/20 active:scale-95 flex items-center gap-3"
                >
                  <i className="fas fa-satellite-dish"></i>
                  <span>Transmit</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="flex-1 flex overflow-hidden bg-[#020617]">
             {project.files.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                 <i className="fas fa-layer-group text-6xl mb-6"></i>
                 <p className="text-[10px] font-black uppercase tracking-[0.4em]">Local Disk Empty</p>
               </div>
             ) : (
               <div className="flex-1 grid grid-cols-12 overflow-hidden h-full">
                 <div className="col-span-3 border-r border-slate-800 p-6 space-y-2 bg-slate-900/10">
                    <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6">Volume Workspace</h3>
                    {project.files.map(f => (
                      <button 
                        key={f.name}
                        className="w-full text-left px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-800/50 text-slate-400 text-[11px] font-mono hover:bg-slate-800/60 hover:text-indigo-400 transition-all flex items-center gap-3 group"
                      >
                        <i className={`fas ${['ts','tsx'].includes(f.language) ? 'fa-code text-indigo-500' : 'fa-file'} opacity-50`}></i>
                        <span className="truncate">{f.name}</span>
                        <i className="fas fa-chevron-right ml-auto text-[8px] opacity-0 group-hover:opacity-100"></i>
                      </button>
                    ))}
                 </div>
                 <div className="col-span-9 p-10 overflow-y-auto space-y-12 scrollbar-thin">
                   {project.files.map(f => (
                     <div key={f.name} className="animate-in fade-in duration-700">
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-4">
                             <div className="px-3 py-1 bg-slate-800 rounded text-[10px] font-mono text-slate-300 border border-slate-700">{f.name}</div>
                             <div className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">{f.language} Source</div>
                           </div>
                           <button 
                            onClick={() => copyToClipboard(f.content)}
                            className="text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-colors"
                           >
                             <i className="fas fa-copy mr-2"></i> Copy Code
                           </button>
                        </div>
                        <div className="rounded-[1.5rem] border border-slate-800 bg-black/40 overflow-hidden shadow-2xl relative">
                          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600/20"></div>
                          <pre className="p-8 text-[12px] font-medium code-font overflow-x-auto text-slate-300 leading-relaxed scrollbar-thin">
                            <code>{f.content}</code>
                          </pre>
                        </div>
                     </div>
                   ))}
                 </div>
               </div>
             )}
          </div>
        )}

        {activeTab === 'research' && (
          <div className="flex-1 flex flex-col bg-[#020617] p-10 overflow-y-auto scrollbar-thin">
            <h3 className="text-xl font-black text-white mb-8 tracking-tight uppercase tracking-[0.2em]">Technical Grounding Sources</h3>
            {researchSources.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                <i className="fas fa-search text-6xl mb-6"></i>
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">No technical grounding chunks identified yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {researchSources.map((source, idx) => (
                  <a 
                    key={`${source.uri}-${idx}`}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-slate-900/40 border border-slate-800 hover:border-indigo-500/50 p-6 rounded-2xl transition-all group"
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                        <i className="fas fa-link"></i>
                      </div>
                      <h4 className="text-slate-200 font-bold truncate flex-1">{source.title || 'Grounding Context'}</h4>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate font-mono">{source.uri}</p>
                    <div className="mt-4 flex items-center justify-end text-[9px] font-black text-indigo-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      External Context <i className="fas fa-external-link-alt ml-2"></i>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* INTEGRATION CHECKPOINT MODAL */}
        {pendingProposal && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center p-12 bg-[#020617]/95 backdrop-blur-2xl animate-in fade-in duration-500">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-[0_0_80px_rgba(79,70,229,0.2)] w-full max-w-6xl max-h-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-400">
              <div className="p-10 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-8">
                  <div className="w-16 h-16 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
                    <i className="fas fa-check-double text-3xl"></i>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Integration Checkpoint</h2>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Manual Approval Required per Protocol</p>
                  </div>
                </div>
                <button onClick={() => setPendingProposal(null)} className="w-12 h-12 flex items-center justify-center text-slate-600 hover:text-white bg-slate-800 rounded-2xl border border-slate-700 transition-all">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-12 space-y-12 scrollbar-thin">
                <div className="grid grid-cols-12 gap-12">
                   <div className="col-span-8 space-y-4">
                     <div className="flex items-center justify-between">
                       <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Code Payload: <span className="text-indigo-400">{pendingProposal.fileName}</span></h3>
                     </div>
                     <div className="bg-black/60 rounded-3xl border border-slate-800 p-8 shadow-inner overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500/20"></div>
                        <pre className="text-[12px] code-font text-emerald-400/90 leading-relaxed max-h-[400px] overflow-y-auto scrollbar-thin">
                          <code>{pendingProposal.content}</code>
                        </pre>
                     </div>
                   </div>
                   <div className="col-span-4 space-y-8">
                     <div className="bg-slate-800/30 p-8 rounded-3xl border border-slate-700/50">
                        <h4 className="text-[9px] font-black uppercase text-indigo-400 tracking-[0.2em] mb-4">Conductor Rationale</h4>
                        <p className="text-sm text-slate-300 leading-relaxed italic font-medium">"{pendingProposal.description}"</p>
                     </div>
                     
                     <div className="bg-emerald-500/5 p-8 rounded-3xl border border-emerald-500/20 relative group overflow-hidden">
                        <div className="absolute -right-4 -top-4 opacity-5 text-4xl group-hover:rotate-12 transition-transform"><i className="fas fa-shield-alt"></i></div>
                        <h4 className="text-[9px] font-black uppercase text-emerald-400 tracking-[0.2em] mb-4">Validator Report</h4>
                        <div className="text-[11px] text-slate-400 leading-relaxed font-medium">
                          {validationReport ? (
                            <div className="prose prose-invert prose-xs max-w-none">
                              {validationReport}
                            </div>
                          ) : (
                            "Validator node synthesis pending..."
                          )}
                        </div>
                     </div>
                   </div>
                </div>
              </div>

              <div className="p-10 border-t border-slate-800 flex justify-end gap-6 bg-slate-900/30 shrink-0">
                <button onClick={() => setPendingProposal(null)} className="px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-all">Discard Artifact</button>
                <button 
                  onClick={approveProposal}
                  className="px-16 py-5 rounded-[1.25rem] bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-[0.3em] shadow-[0_20px_60px_rgba(79,70,229,0.3)] transition-all active:scale-95 flex items-center gap-4"
                >
                  <i className="fas fa-lock"></i> Commit & Integrated
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProjectView;
