
import React, { useState, useEffect, useRef } from 'react';
import { FileItem, Connection } from '../types';
import { Folder, FileText, FileImage, MoreVertical, ChevronRight, Search, Filter, Plus, Trash2, Edit, Download, FolderPlus, Loader2, UploadCloud, X, Check, Copy, FolderInput, ArrowRight, Server, Globe } from 'lucide-react';
import { getFilesForConnection } from '../services/mockData';

interface FileExplorerProps {
  activeConnection: Connection | null;
  connections?: Connection[]; // List of all connections for cross-server ops
  onPreview: (file: FileItem) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ activeConnection, connections = [], onPreview }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Action States
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Move/Copy File State
  const [targetActionFile, setTargetActionFile] = useState<FileItem | null>(null);
  const [actionType, setActionType] = useState<'move' | 'copy' | null>(null);

  // Destination Browser State
  const [destConnection, setDestConnection] = useState<Connection | null>(null);
  const [destPath, setDestPath] = useState<string>('/');
  const [destFiles, setDestFiles] = useState<FileItem[]>([]);
  const [destLoading, setDestLoading] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Main File Load
  useEffect(() => {
    if (activeConnection) {
      setLoading(true);
      getFilesForConnection(activeConnection.id).then(data => {
        setFiles(data);
        setLoading(false);
      });
    } else {
      setFiles([]);
    }
  }, [activeConnection]);

  // Destination Browser File Load
  useEffect(() => {
    if (destConnection) {
      setDestLoading(true);
      getFilesForConnection(destConnection.id).then(data => {
        setDestFiles(data);
        setDestLoading(false);
      });
    } else {
      setDestFiles([]);
    }
  }, [destConnection]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // --- Actions ---

  const handleMenuClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir este item?')) {
      setFiles(prev => prev.filter(f => f.id !== id));
    }
    setActiveMenuId(null);
  };

  // Open Modal for Copy
  const handleInitiateCopy = (e: React.MouseEvent, file: FileItem) => {
    e.stopPropagation();
    setTargetActionFile(file);
    setActionType('copy');
    setActiveMenuId(null);
    // Reset Browser
    setDestConnection(null); 
    setDestPath('/');
  };

  // Open Modal for Move
  const handleInitiateMove = (e: React.MouseEvent, file: FileItem) => {
    e.stopPropagation();
    setTargetActionFile(file);
    setActionType('move');
    setActiveMenuId(null);
    // Reset Browser
    setDestConnection(null); 
    setDestPath('/');
  };

  const handleCloseModal = () => {
    setTargetActionFile(null);
    setActionType(null);
    setDestConnection(null);
    setDestPath('/');
  };

  const handleConfirmAction = () => {
    if (!targetActionFile || !destConnection) return;

    // Simulate Operation
    const isSameConnection = destConnection.id === activeConnection?.id;
    const isMove = actionType === 'move';

    if (isSameConnection) {
      // Local Operation
      if (isMove) {
        setFiles(prev => prev.map(f => 
          f.id === targetActionFile.id 
          ? { ...f, path: destPath, modifiedAt: new Date().toISOString() }
          : f
        ));
      } else {
        // Copy Local
        const newFile: FileItem = {
          ...targetActionFile,
          id: `copy-${Date.now()}`,
          name: `${targetActionFile.name} (Cópia)`,
          path: destPath,
          modifiedAt: new Date().toISOString()
        };
        // If copying to same folder we are viewing, add it to list
        if (destPath === currentPath) {
          setFiles(prev => [newFile, ...prev]);
        }
      }
    } else {
      // Cross-Server Operation
      if (isMove) {
        // Remove from source view
        setFiles(prev => prev.filter(f => f.id !== targetActionFile.id));
      }
      // In a real app, we would send API request to transfer here
      // For mock, we just remove from source if moving
    }

    handleCloseModal();
  };

  // --- Rename Logic ---
  const handleStartRename = (e: React.MouseEvent, file: FileItem) => {
    e.stopPropagation();
    setRenamingId(file.id);
    setRenameValue(file.name);
    setActiveMenuId(null);
  };

  const handleSaveRename = () => {
    if (renamingId && renameValue.trim()) {
      setFiles(prev => prev.map(f => f.id === renamingId ? { ...f, name: renameValue } : f));
      setRenamingId(null);
    }
  };

  const handleCancelRename = () => {
    setRenamingId(null);
    setRenameValue('');
  };

  // --- Create Folder Logic ---

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    
    const newFolder: FileItem = {
      id: `folder-${Date.now()}`,
      name: newFolderName,
      type: 'folder',
      size: 0,
      modifiedAt: new Date().toISOString(),
      parentId: null,
      path: currentPath,
      connectionId: activeConnection?.id,
      connectionName: activeConnection?.name
    };

    setFiles(prev => [newFolder, ...prev]);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleSimulateUpload = () => {
    setUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          // Add simulated file
          const newFile: FileItem = {
            id: `upload-${Date.now()}`,
            name: `Upload_Documento_${Math.floor(Math.random() * 100)}.pdf`,
            type: 'file',
            size: 1024 * 1024 * 2.5, // 2.5MB
            modifiedAt: new Date().toISOString(),
            mimeType: 'application/pdf',
            parentId: null,
            path: currentPath,
            connectionId: activeConnection?.id,
            connectionName: activeConnection?.name,
            content: "Conteúdo do arquivo enviado..."
          };
          setFiles(prev => [newFile, ...prev]);
          setUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  // Get current folder contents for destination browser
  const getDestFolderContents = () => {
    return destFiles.filter(f => 
      f.path === destPath && 
      f.type === 'folder' && 
      // Prevent moving folder into itself
      (actionType !== 'move' || f.id !== targetActionFile?.id)
    );
  };

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
    (f.path === currentPath || f.parentId === null)
  );

  const getIcon = (file: FileItem) => {
    if (file.type === 'folder') return <Folder className="text-yellow-500 fill-yellow-500/20" size={24} />;
    if (file.mimeType?.startsWith('image')) return <FileImage className="text-purple-400" size={24} />;
    return <FileText className="text-blue-400" size={24} />;
  };

  if (!activeConnection) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <div className="bg-slate-800 p-6 rounded-full mb-4">
          <Search size={48} className="text-slate-600" />
        </div>
        <p className="text-lg">Selecione uma conexão para explorar arquivos</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950/50 relative">
      {/* Toolbar */}
      <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2 text-sm text-slate-400">
           <span 
             className="font-semibold text-primary-400 cursor-pointer hover:underline flex items-center gap-1"
             onClick={() => setCurrentPath('/')}
           >
             <Server size={14} />
             {activeConnection.name}
           </span>
           <ChevronRight size={16} />
           <span 
             className={`text-white cursor-pointer ${currentPath === '/' ? 'font-bold' : 'hover:underline'}`}
             onClick={() => setCurrentPath('/')}
           >root</span>
           {currentPath !== '/' && (
             <>
              <ChevronRight size={16} />
              <span className="text-white font-bold">{currentPath.replace('/', '')}</span>
             </>
           )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Buscar arquivos..." 
              className="bg-slate-800 border border-slate-700 text-sm rounded-lg pl-9 pr-4 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:outline-none w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Filter size={18} className="rotate-90" />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <div className="grid grid-cols-2 gap-0.5">
                <div className="w-2 h-2 bg-current rounded-[1px]" />
                <div className="w-2 h-2 bg-current rounded-[1px]" />
                <div className="w-2 h-2 bg-current rounded-[1px]" />
                <div className="w-2 h-2 bg-current rounded-[1px]" />
              </div>
            </button>
          </div>
          
          <button 
            onClick={() => setIsCreatingFolder(true)}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border border-slate-700"
          >
            <FolderPlus size={18} />
          </button>

          <button 
            onClick={handleSimulateUpload}
            disabled={uploading}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
            <span>{uploading ? `${uploadProgress}%` : 'Upload'}</span>
          </button>
        </div>
      </div>
      
      {/* New Folder Input Modal */}
      {isCreatingFolder && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-2">
          <Folder size={20} className="text-yellow-500" />
          <input
            autoFocus
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Nome da pasta"
            className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-sm outline-none focus:border-primary-500"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
          <button onClick={handleCreateFolder} className="p-1 text-green-400 hover:bg-slate-700 rounded"><Check size={18} /></button>
          <button onClick={() => setIsCreatingFolder(false)} className="p-1 text-red-400 hover:bg-slate-700 rounded"><X size={18} /></button>
        </div>
      )}

      {/* Universal Action Modal (Move / Copy) */}
      {targetActionFile && (
        <div className="absolute inset-0 z-30 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-lg border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[80vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <div>
                <h3 className="font-medium text-white flex items-center gap-2 text-lg">
                  {actionType === 'move' ? <FolderInput className="text-primary-400" /> : <Copy className="text-primary-400" />}
                  {actionType === 'move' ? 'Mover' : 'Copiar'} "{targetActionFile.name}"
                </h3>
                <p className="text-xs text-slate-400 mt-1">Selecione o destino abaixo</p>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Browser Area */}
            <div className="flex-1 overflow-y-auto bg-slate-950 p-2">
              {/* Breadcrumbs inside modal */}
              <div className="px-2 py-2 text-sm text-slate-400 flex items-center gap-1 mb-2 border-b border-slate-800/50">
                 <button 
                   onClick={() => { setDestConnection(null); setDestPath('/'); }}
                   className={`hover:text-white ${!destConnection ? 'font-bold text-white' : ''}`}
                 >
                   Conexões
                 </button>
                 {destConnection && (
                   <>
                     <ChevronRight size={14} />
                     <button 
                       onClick={() => setDestPath('/')}
                       className={`hover:text-white ${destPath === '/' ? 'font-bold text-white' : ''}`}
                     >
                       {destConnection.name}
                     </button>
                   </>
                 )}
                 {destConnection && destPath !== '/' && (
                   <>
                     <ChevronRight size={14} />
                     <span className="text-white font-bold truncate max-w-[150px]">{destPath.replace('/', '')}</span>
                   </>
                 )}
              </div>

              {/* List Content */}
              <div className="space-y-1">
                {!destConnection ? (
                   // Level 1: List Connections
                   connections.map(conn => (
                     <button 
                       key={conn.id}
                       onClick={() => setDestConnection(conn)}
                       className="w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                     >
                       <Globe size={18} className="text-blue-400" />
                       <span className="font-medium">{conn.name}</span>
                       <span className="text-xs ml-auto bg-slate-800 px-2 py-0.5 rounded text-slate-500">{conn.type}</span>
                     </button>
                   ))
                ) : destLoading ? (
                   <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary-500" /></div>
                ) : (
                   // Level 2: List Folders
                   <>
                     {/* Option to select current root */}
                     <button 
                       onClick={() => {/* Already selected by being here */}}
                       className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 border border-transparent ${destPath === '/' ? 'bg-slate-800/50 border-primary-500/30 text-white' : 'text-slate-400'}`}
                     >
                        <Folder size={18} className="text-slate-500" />
                        <span className="italic text-sm">Pasta Raiz (/)</span>
                     </button>

                     {getDestFolderContents().map(folder => (
                       <button 
                         key={folder.id}
                         onClick={() => setDestPath(folder.path === '/' ? `/${folder.name}` : `${folder.path}/${folder.name}`)}
                         className="w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                       >
                          <Folder size={18} className="text-yellow-500" />
                          <span>{folder.name}</span>
                       </button>
                     ))}
                     
                     {getDestFolderContents().length === 0 && (
                       <div className="text-center py-4 text-xs text-slate-600">Nenhuma subpasta aqui.</div>
                     )}
                   </>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
              <button onClick={handleCloseModal} className="px-4 py-2 text-slate-400 hover:text-white text-sm">Cancelar</button>
              <button 
                onClick={handleConfirmAction}
                disabled={!destConnection}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                 {actionType === 'move' ? 'Mover Aqui' : 'Copiar Aqui'}
                 <Check size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
           <div className="flex justify-center items-center h-64">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
           </div>
        ) : (
          <>
            {viewMode === 'list' ? (
              <div className="min-w-full rounded-lg border border-slate-800 bg-slate-900/50 overflow-visible">
                <table className="w-full text-left text-sm text-slate-400">
                  <thead className="bg-slate-800/50 text-xs uppercase font-medium text-slate-300">
                    <tr>
                      <th className="px-6 py-3 w-12"></th>
                      <th className="px-6 py-3">Nome</th>
                      <th className="px-6 py-3">Tamanho</th>
                      <th className="px-6 py-3">Modificado</th>
                      <th className="px-6 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredFiles.map((file) => (
                      <tr 
                        key={file.id} 
                        className="hover:bg-slate-800/50 transition-colors cursor-pointer group relative"
                        onClick={() => {
                          if(file.type === 'folder') {
                            setCurrentPath(prev => prev === '/' ? `/${file.name}` : `${prev}/${file.name}`);
                          } else {
                            onPreview(file);
                          }
                        }}
                      >
                        <td className="px-6 py-4">{getIcon(file)}</td>
                        <td className="px-6 py-4 font-medium text-slate-200">
                          {renamingId === file.id ? (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <input 
                                autoFocus
                                className="bg-slate-950 border border-primary-500 rounded px-2 py-1 text-white text-sm outline-none w-full"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if(e.key === 'Enter') handleSaveRename();
                                  if(e.key === 'Escape') handleCancelRename();
                                }}
                              />
                              <button onClick={handleSaveRename} className="text-green-400 hover:text-green-300"><Check size={16}/></button>
                              <button onClick={handleCancelRename} className="text-red-400 hover:text-red-300"><X size={16}/></button>
                            </div>
                          ) : (
                            file.name
                          )}
                        </td>
                        <td className="px-6 py-4">{formatSize(file.size)}</td>
                        <td className="px-6 py-4">{new Date(file.modifiedAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right relative">
                           <button 
                             onClick={(e) => handleMenuClick(e, file.id)}
                             className={`p-2 rounded-lg hover:bg-slate-700 transition-all ${activeMenuId === file.id ? 'opacity-100 bg-slate-700 text-white' : 'text-slate-500 opacity-0 group-hover:opacity-100'}`}
                           >
                             <MoreVertical size={18} />
                           </button>
                           
                           {/* Dropdown Menu */}
                           {activeMenuId === file.id && (
                             <div ref={menuRef} className="absolute right-8 top-8 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                               <button onClick={(e) => handleStartRename(e, file)} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                                 <Edit size={14} /> Renomear
                               </button>
                               <button onClick={(e) => handleInitiateCopy(e, file)} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                                 <Copy size={14} /> Copiar para...
                               </button>
                               <button onClick={(e) => handleInitiateMove(e, file)} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                                 <FolderInput size={14} /> Mover para...
                               </button>
                               <button onClick={(e) => e.stopPropagation()} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                                 <Download size={14} /> Baixar
                               </button>
                               <div className="h-px bg-slate-700 my-1"></div>
                               <button onClick={(e) => handleDelete(e, file.id)} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                                 <Trash2 size={14} /> Excluir
                               </button>
                             </div>
                           )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredFiles.length === 0 && (
                   <div className="p-12 text-center text-slate-500">Pasta vazia ou nenhum arquivo encontrado.</div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredFiles.map((file) => (
                  <div 
                    key={file.id}
                    onClick={() => {
                      if(file.type === 'folder') {
                         setCurrentPath(prev => prev === '/' ? `/${file.name}` : `${prev}/${file.name}`);
                      } else {
                         onPreview(file);
                      }
                    }}
                    className="bg-slate-900 border border-slate-800 hover:border-primary-500/50 hover:bg-slate-800 rounded-xl p-4 flex flex-col items-center gap-3 cursor-pointer transition-all group relative"
                  >
                    {/* Grid Actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                         onClick={(e) => handleMenuClick(e, file.id)}
                         className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 border border-slate-700"
                       >
                        <MoreVertical size={14} />
                      </button>
                      {activeMenuId === file.id && (
                         <div ref={menuRef} className="absolute right-0 top-8 w-44 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                           <button onClick={(e) => handleStartRename(e, file)} className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                             <Edit size={12} /> Renomear
                           </button>
                           <button onClick={(e) => handleInitiateCopy(e, file)} className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                             <Copy size={12} /> Copiar para...
                           </button>
                           <button onClick={(e) => handleInitiateMove(e, file)} className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                             <FolderInput size={12} /> Mover para...
                           </button>
                           <button onClick={(e) => handleDelete(e, file.id)} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                             <Trash2 size={12} /> Excluir
                           </button>
                         </div>
                       )}
                    </div>

                    <div className="p-4 bg-slate-950 rounded-lg group-hover:scale-105 transition-transform">
                      {getIcon(file)}
                    </div>
                    <div className="text-center w-full relative">
                      {renamingId === file.id ? (
                         <input 
                            autoFocus
                            className="bg-slate-950 border border-primary-500 rounded px-1 py-0.5 text-white text-xs outline-none w-full text-center"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if(e.key === 'Enter') handleSaveRename();
                              if(e.key === 'Escape') handleCancelRename();
                            }}
                            onBlur={handleCancelRename}
                          />
                      ) : (
                        <>
                          <p className="text-sm font-medium text-slate-200 truncate w-full" title={file.name}>{file.name}</p>
                          <p className="text-xs text-slate-500 mt-1">{formatSize(file.size)}</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
