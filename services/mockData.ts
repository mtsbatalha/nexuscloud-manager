import { Connection, ConnectionType, FileItem, SyncJob, SyncLogEntry } from '../types';

export const MOCK_CONNECTIONS: Connection[] = [
  { id: '1', name: 'AWS Production', type: ConnectionType.S3, status: 'connected', host: 's3.us-east-1.amazonaws.com', storageUsed: 450, storageLimit: 1000, lastSync: '10 min atrás' },
  { id: '2', name: 'Google Drive Marketing', type: ConnectionType.GDRIVE, status: 'connected', accountName: 'mkt@nexus.com', storageUsed: 12, storageLimit: 15, lastSync: '2 horas atrás' },
  { id: '3', name: 'Servidor Legacy (SFTP)', type: ConnectionType.SFTP, status: 'disconnected', host: '192.168.1.50', storageUsed: 800, storageLimit: 2000, lastSync: '1 dia atrás' },
];

const generateFiles = (connId: string, connName: string): FileItem[] => {
  // Generate some generic files for any new connection
  const files: FileItem[] = [
    { id: `f1-${connId}`, name: 'Documentos', type: 'folder', size: 0, modifiedAt: '2023-10-25T10:00:00Z', parentId: null, path: '/', connectionId: connId, connectionName: connName },
    { id: `f2-${connId}`, name: 'Imagens', type: 'folder', size: 0, modifiedAt: '2023-10-26T14:30:00Z', parentId: null, path: '/', connectionId: connId, connectionName: connName },
    { id: `f3-${connId}`, name: 'README.md', type: 'file', size: 1500, modifiedAt: '2023-10-27T09:15:00Z', mimeType: 'text/markdown', parentId: null, path: '/', connectionId: connId, connectionName: connName, content: '# Projeto\n\nArquivos do servidor ' + connName },
  ];
  return files;
};

export const getFilesForConnection = async (connectionOrId: string | Connection): Promise<FileItem[]> => {
  let connName = 'Unknown';
  let connId = '';
  let connType: ConnectionType | undefined;
  let connHost = '';

  if (typeof connectionOrId === 'string') {
    connId = connectionOrId;
    const found = MOCK_CONNECTIONS.find(c => c.id === connId);
    connName = found?.name || 'Unknown';
    connType = found?.type;
  } else {
    connId = connectionOrId.id;
    connName = connectionOrId.name;
    connType = connectionOrId.type;
    connHost = connectionOrId.host || '';
  }

  // REAL BACKEND INTEGRATION
  // Se for conexão local, tenta buscar do servidor Node.js real
  if (connType === ConnectionType.LOCAL) {
    try {
      const token = localStorage.getItem('nexus_token');
      const queryPath = connHost ? `?path=${encodeURIComponent(connHost)}` : '';
      const res = await fetch(`/api/fs/list${queryPath}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Mapear para incluir connectionId
        return data.map((f: any) => ({ ...f, connectionId: connId, connectionName: connName }));
      }
    } catch (e) {
      console.warn("Backend local não acessível, usando fallback mock.");
    }
  }

  return new Promise((resolve) => {
    setTimeout(() => resolve(generateFiles(connId, connName)), 400); 
  });
};

export const getAllFilesFromAllConnections = async (): Promise<FileItem[]> => {
  let allFiles: FileItem[] = [];
  for (const conn of MOCK_CONNECTIONS) {
    if (conn.status === 'connected') {
      const files = await getFilesForConnection(conn.id);
      allFiles = [...allFiles, ...files];
    }
  }
  return allFiles;
};

export const MOCK_JOBS: SyncJob[] = [
  { 
    id: 'j1', 
    name: 'Backup Diário Marketing',
    sourceId: '2', 
    destinationId: '1', 
    type: 'one-way',
    progress: 100, 
    status: 'completed', 
    filesProcessed: 150, 
    totalFiles: 150,
    frequency: 'daily',
    scheduledTime: '02:00',
    excludePatterns: ['*.tmp', 'Thumbs.db'],
    lastRun: 'Ontem, 02:00',
    nextRun: 'Hoje, 02:00'
  }
];

export const MOCK_ACTIVITY_LOGS: SyncLogEntry[] = [];

export const testNetworkConnection = async (
  host: string, 
  type: ConnectionType, 
  credentials?: { user?: string, pass?: string }
): Promise<{ success: boolean, message: string, latency?: number }> => {
  
  return new Promise((resolve) => {
    const latency = Math.floor(Math.random() * 800) + 200;
    setTimeout(() => {
      if (!host && type !== ConnectionType.LOCAL) {
        resolve({ success: false, message: "Host não especificado." });
        return;
      }

      if (type === ConnectionType.LOCAL) {
         // Em um app real, aqui chamariamos uma rota do backend para verificar stat() do diretório
         resolve({ success: true, message: "Diretório validado (Backend Mock).", latency: 15 });
         return;
      }

      resolve({ 
        success: true, 
        message: "Conexão estabelecida com sucesso.", 
        latency 
      });
    }, latency);
  });
};
