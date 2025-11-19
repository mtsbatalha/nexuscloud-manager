import React, { useState } from 'react';
import { Sparkles, Trash2, ArrowRight, CheckCircle, AlertCircle, ScanLine, HardDrive } from 'lucide-react';
import { FileItem, DuplicateCandidate } from '../types';
import { getAllFilesFromAllConnections } from '../services/mockData';
import { detectDuplicatesWithAI } from '../services/gemini';

const DuplicateManager: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [candidates, setCandidates] = useState<DuplicateCandidate[]>([]);
  const [scanned, setScanned] = useState(false);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const handleScan = async () => {
    setIsScanning(true);
    setScanned(false);
    setCandidates([]);
    
    // 1. Get all files from all connections
    const allFiles = await getAllFilesFromAllConnections();
    
    // 2. Send to AI for analysis
    const results = await detectDuplicatesWithAI(allFiles);
    
    setCandidates(results);
    setIsScanning(false);
    setScanned(true);
  };

  const handleDelete = (id: string) => {
    setDeletedIds(prev => new Set(prev).add(id));
  };

  const formatSize = (bytes: number) => {
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const FileCard = ({ file, suggestion, onKeep }: { file: FileItem, suggestion: boolean, onKeep: () => void }) => (
    <div className={`flex-1 p-4 rounded-lg border ${suggestion ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-800 border-slate-700'} ${deletedIds.has(file.id) ? 'opacity-30 grayscale' : ''}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <HardDrive size={14} className="text-primary-400" />
          {file.connectionName}
        </div>
        {suggestion && !deletedIds.has(file.id) && <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Sugerido</span>}
      </div>
      
      <p className="text-sm text-white font-medium truncate mb-1" title={file.name}>{file.name}</p>
      
      <div className="text-xs text-slate-400 space-y-1">
        <p>{formatSize(file.size)}</p>
        <p>{new Date(file.modifiedAt).toLocaleDateString()}</p>
        <p className="truncate text-slate-500">{file.path}</p>
      </div>

      <div className="mt-4 flex gap-2">
        {deletedIds.has(file.id) ? (
          <div className="text-red-400 text-xs flex items-center gap-1">
            <Trash2 size={12} />
            Marcado para exclusão
          </div>
        ) : (
          <button 
            onClick={() => handleDelete(file.id)}
            className="flex-1 py-1.5 text-xs bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-300 rounded transition-colors flex items-center justify-center gap-1"
          >
            <Trash2 size={12} /> Excluir
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-8 h-full overflow-y-auto max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Sparkles className="text-purple-500" />
            Limpeza Inteligente
          </h2>
          <p className="text-slate-400 mt-2">
            A IA analisa seus arquivos em todos os provedores para encontrar duplicatas e liberar espaço.
          </p>
        </div>
        
        <button
          onClick={handleScan}
          disabled={isScanning}
          className={`px-6 py-3 rounded-xl font-semibold text-white flex items-center gap-2 transition-all shadow-lg shadow-purple-900/20 ${
            isScanning 
            ? 'bg-slate-700 cursor-not-allowed' 
            : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 hover:scale-105'
          }`}
        >
          {isScanning ? (
            <><ScanLine className="animate-pulse" /> Analisando...</>
          ) : (
            <><ScanLine /> Iniciar Scan IA</>
          )}
        </button>
      </div>

      {/* Empty State */}
      {!isScanning && !scanned && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="text-slate-500" size={40} />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Pronto para otimizar</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Nossa IA irá comparar metadados e semântica de nomes para encontrar cópias desnecessárias entre o Google Drive, AWS, Dropbox e seus servidores locais.
          </p>
        </div>
      )}

      {/* Scanning State */}
      {isScanning && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-pulse">
               <div className="h-4 bg-slate-800 rounded w-1/3 mb-4"></div>
               <div className="flex gap-4">
                 <div className="flex-1 h-32 bg-slate-800 rounded"></div>
                 <div className="flex-1 h-32 bg-slate-800 rounded"></div>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {scanned && candidates.length === 0 && (
         <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center flex flex-col items-center">
            <CheckCircle className="text-green-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-green-400">Tudo limpo!</h3>
            <p className="text-green-500/60">Nenhuma duplicata encontrada nos seus servidores.</p>
         </div>
      )}

      <div className="space-y-6">
        {candidates.map((group, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
            <div className="bg-slate-800/50 px-6 py-3 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className={`px-2 py-1 rounded text-xs font-bold ${group.similarity > 90 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                   {group.similarity}% Similaridade
                 </div>
                 <span className="text-xs text-slate-400 flex items-center gap-1">
                   <AlertCircle size={12} />
                   IA: {group.reason}
                 </span>
              </div>
            </div>
            
            <div className="p-6 flex flex-col md:flex-row items-center gap-6">
              <FileCard 
                file={group.fileA} 
                suggestion={group.suggestion === 'keep_a'} 
                onKeep={() => {}}
              />
              
              <div className="text-slate-600">
                <ArrowRight size={24} className="rotate-90 md:rotate-0" />
              </div>

              <FileCard 
                file={group.fileB} 
                suggestion={group.suggestion === 'keep_b'} 
                onKeep={() => {}}
              />
            </div>
          </div>
        ))}
      </div>
      
      {scanned && candidates.length > 0 && deletedIds.size > 0 && (
        <div className="fixed bottom-8 right-8 animate-in slide-in-from-bottom-5">
          <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold shadow-xl shadow-red-900/30 flex items-center gap-2">
            <Trash2 size={20} />
            Confirmar Exclusão ({deletedIds.size})
          </button>
        </div>
      )}
    </div>
  );
};

export default DuplicateManager;