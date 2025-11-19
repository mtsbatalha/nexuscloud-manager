import React, { useState } from 'react';
import { X, FileText, Sparkles, Download, Share2 } from 'lucide-react';
import { FileItem } from '../types';
import { generateFileSummary } from '../services/gemini';

interface PreviewModalProps {
  file: FileItem | null;
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ file, onClose }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  if (!file) return null;

  const handleSummarize = async () => {
    setLoadingSummary(true);
    const content = file.content || "Conteúdo simulado para demonstração de IA.";
    const result = await generateFileSummary(file.name, content);
    setSummary(result);
    setLoadingSummary(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full max-w-4xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-900">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
               <FileText size={20} />
             </div>
             <div>
               <h3 className="font-semibold text-slate-100">{file.name}</h3>
               <p className="text-xs text-slate-500">{file.mimeType} • {(file.size / 1024).toFixed(1)} KB</p>
             </div>
           </div>
           <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                <Share2 size={20} />
              </button>
              <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                <Download size={20} />
              </button>
              <button onClick={onClose} className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-slate-400 transition-colors">
                <X size={20} />
              </button>
           </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 bg-slate-950 p-8 overflow-y-auto">
            {file.mimeType?.startsWith('image') ? (
               <div className="flex items-center justify-center h-full">
                 <div className="text-slate-500 flex flex-col items-center">
                    <FileText size={64} className="mb-4 opacity-20" />
                    <p>Preview de imagem simulado</p>
                 </div>
               </div>
            ) : (
              <pre className="text-slate-300 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                {file.content || "Conteúdo do arquivo não carregado na demonstração..."}
              </pre>
            )}
          </div>
          
          {/* AI Sidebar */}
          <div className="w-80 border-l border-slate-800 bg-slate-900/50 p-6 flex flex-col">
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-slate-300 mb-1 flex items-center gap-2">
                <Sparkles size={14} className="text-purple-400" />
                Analista IA
              </h4>
              <p className="text-xs text-slate-500">Obtenha insights instantâneos sobre este arquivo.</p>
            </div>

            {!summary ? (
              <button 
                onClick={handleSummarize}
                disabled={loadingSummary}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2"
              >
                {loadingSummary ? (
                  <>Carregando...</>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Gerar Resumo
                  </>
                )}
              </button>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <h5 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3">Resumo</h5>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {summary}
                  </p>
                </div>
                <button 
                  onClick={() => setSummary(null)}
                  className="mt-4 text-xs text-slate-500 hover:text-white underline"
                >
                  Gerar novamente
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;