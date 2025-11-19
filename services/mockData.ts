import { Connection, ConnectionType, FileItem, SyncJob, SyncLogEntry } from '../types';

export const MOCK_CONNECTIONS: Connection[] = [
  { id: '1', name: 'AWS Production', type: ConnectionType.S3, status: 'connected', host: 's3.us-east-1.amazonaws.com', storageUsed: 450, storageLimit: 1000, lastSync: '10 min atrás' },
  { id: '2', name: 'Google Drive Marketing', type: ConnectionType.GDRIVE, status: 'connected', accountName: 'mkt@nexus.com', storageUsed: 12, storageLimit: 15, lastSync: '2 horas atrás' },
  { id: '3', name: 'Servidor Legacy (SFTP)', type: ConnectionType.SFTP, status: 'disconnected', host: '192.168.1.50', storageUsed: 800, storageLimit: 2000, lastSync: '1 dia atrás' },
  { id: '4', name: 'Dropbox Pessoal', type: ConnectionType.DROPBOX, status: 'connected', accountName: 'user@email.com', storageUsed: 1.2, storageLimit: 2, lastSync: 'Agora' },
  { id: '5', name: 'OneDrive Corporativo', type: ConnectionType.ONEDRIVE, status: 'error', accountName: 'admin@corp.com', storageUsed: 4500, storageLimit: 5000, lastSync: '3 dias atrás' },
];

const generateFiles = (connId: string, connName: string): FileItem[] => {
  // Generate some generic files for any new connection
  const files: FileItem[] = [
    { id: `f1-${connId}`, name: 'Documentos', type: 'folder', size: 0, modifiedAt: '2023-10-25T10:00:00Z', parentId: null, path: '/', connectionId: connId, connectionName: connName },
    { id: `f2-${connId}`, name: 'Imagens', type: 'folder', size: 0, modifiedAt: '2023-10-26T14:30:00Z', parentId: null, path: '/', connectionId: connId, connectionName: connName },
    { id: `f3-${connId}`, name: 'README.md', type: 'file', size: 1500, modifiedAt: '2023-10-27T09:15:00Z', mimeType: 'text/markdown', parentId: null, path: '/', connectionId: connId, connectionName: connName, content: '# Projeto\n\nArquivos do servidor ' + connName },
  ];

  // Specific Mocks for demo connections
  if (connId === '2') { // Google Drive
     files.push({ id: `f4-${connId}`, name: 'config.json', type: 'file', size: 1024, modifiedAt: '2023-10-28T11:20:00Z', mimeType: 'application/json', parentId: null, path: '/', connectionId: connId, connectionName: connName, content: '{\n  "appName": "Nexus",\n  "version": "1.0.0",\n  "debug": true\n}' });
     files.push({
       id: `dup-1-${connId}`,
       name: 'LOGO_PROJETO_FINAL.png', 
       type: 'file',
       size: 450000, 
       modifiedAt: '2023-10-26T14:35:00Z',
       mimeType: 'image/png',
       parentId: null,
       path: '/',
       connectionId: connId,
       connectionName: connName
     });
  } else if (connId === '4') { // Dropbox
    files.push({
      id: `dup-2-${connId}`,
      name: 'Relatorio Vendas Q3 (Backup).pdf', 
      type: 'file',
      size: 2500000,
      modifiedAt: '2023-10-27T09:15:00Z',
      mimeType: 'application/pdf',
      parentId: null,
      path: '/',
      connectionId: connId,
      connectionName: connName
    });
  } else if (connId === '5') { // OneDrive
     files.push({ id: `f6-docx-${connId}`, name: 'Contrato_2024.docx', type: 'file', size: 32000, modifiedAt: '2023-11-01T10:00:00Z', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', parentId: null, path: '/', connectionId: connId, connectionName: connName });
  } else if (connId === '1' || connId === '3') {
    files.push({ id: `f3-pdf-${connId}`, name: 'relatorio_vendas_q3.pdf', type: 'file', size: 2500000, modifiedAt: '2023-10-27T09:15:00Z', mimeType: 'application/pdf', parentId: null, path: '/', connectionId: connId, connectionName: connName });
    files.push({ id: `f5-png-${connId}`, name: 'logo_projeto.png', type: 'file', size: 450000, modifiedAt: '2023-10-26T14:35:00Z', mimeType: 'image/png', parentId: `f2-${connId}`, path: '/Imagens', connectionId: connId, connectionName: connName });
  }

  return files;
};

// Modified to accept either an ID (legacy) or the full connection object
export const getFilesForConnection = (connectionOrId: string | Connection): Promise<FileItem[]> => {
  let connName = 'Unknown';
  let connId = '';

  if (typeof connectionOrId === 'string') {
    connId = connectionOrId;
    const found = MOCK_CONNECTIONS.find(c => c.id === connId);
    connName = found?.name || 'Unknown';
  } else {
    connId = connectionOrId.id;
    connName = connectionOrId.name;
  }

  return new Promise((resolve) => {
    setTimeout(() => resolve(generateFiles(connId, connName)), 400); // Simulate latency
  });
};

export const getAllFilesFromAllConnections = async (): Promise<FileItem[]> => {
  // This mock function only works with the initial static set for the AI cleanup demo.
  // In a real app, you would pass the current dynamic connections list here.
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
    sourceId: '2', // GDrive 
    destinationId: '1', // AWS
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
  },
  { 
    id: 'j2', 
    name: 'Migração Legacy',
    sourceId: '3', 
    destinationId: '1', 
    type: 'one-way',
    progress: 45, 
    status: 'running', 
    filesProcessed: 450, 
    totalFiles: 1000,
    frequency: 'manual',
    excludePatterns: [],
    lastRun: 'Iniciado há 1h'
  },
  {
    id: 'j3',
    name: 'Sincronia Pessoal',
    sourceId: '4',
    destinationId: '2',
    type: 'two-way',
    progress: 0,
    status: 'idle',
    filesProcessed: 0,
    totalFiles: 0,
    frequency: 'realtime',
    excludePatterns: ['node_modules'],
    lastRun: '2 horas atrás'
  }
];

export const MOCK_ACTIVITY_LOGS: SyncLogEntry[] = [
  {
    id: 'log-1',
    jobId: 'j1',
    jobName: 'Backup Diário Marketing',
    startTime: '2023-10-27T02:00:00Z',
    endTime: '2023-10-27T02:15:00Z',
    status: 'success',
    filesTransferred: 150,
    sizeTransferred: 450000000, // 450MB
    details: 'Backup concluído com sucesso.',
    sourceName: 'Google Drive Marketing',
    destinationName: 'AWS Production'
  },
  {
    id: 'log-2',
    jobId: 'j2',
    jobName: 'Migração Legacy',
    startTime: '2023-10-26T10:00:00Z',
    endTime: '2023-10-26T10:05:00Z',
    status: 'failed',
    filesTransferred: 12,
    sizeTransferred: 5000000,
    details: 'Erro de conexão: Timeout ao conectar no host 192.168.1.50 na porta 22.',
    sourceName: 'Servidor Legacy',
    destinationName: 'AWS Production'
  },
  {
    id: 'log-3',
    jobId: 'j1',
    jobName: 'Backup Diário Marketing',
    startTime: '2023-10-26T02:00:00Z',
    endTime: '2023-10-26T02:12:00Z',
    status: 'warning',
    filesTransferred: 148,
    sizeTransferred: 440000000,
    details: 'Backup concluído, mas 2 arquivos foram ignorados por estarem em uso.',
    sourceName: 'Google Drive Marketing',
    destinationName: 'AWS Production'
  },
  {
    id: 'log-4',
    jobId: 'j3',
    jobName: 'Sincronia Pessoal',
    startTime: '2023-10-25T14:30:00Z',
    endTime: '2023-10-25T14:30:45Z',
    status: 'success',
    filesTransferred: 5,
    sizeTransferred: 12000000,
    details: 'Sincronização rápida finalizada.',
    sourceName: 'Dropbox Pessoal',
    destinationName: 'Google Drive Marketing'
  }
];

// New simulation for network testing
export const testNetworkConnection = async (
  host: string, 
  type: ConnectionType, 
  credentials?: { user?: string, pass?: string }
): Promise<{ success: boolean, message: string, latency?: number }> => {
  
  return new Promise((resolve) => {
    const latency = Math.floor(Math.random() * 800) + 200; // 200-1000ms
    
    setTimeout(() => {
      // Simulation logic
      if (!host) {
        resolve({ success: false, message: "Host/Endereço não especificado." });
        return;
      }

      if (type === ConnectionType.LOCAL) {
        // Local doesn't need credentials, just path existence (mocked)
        resolve({ 
          success: true, 
          message: "Diretório local verificado com sucesso.", 
          latency: 10 // Fast local access
        });
        return;
      }

      if (host.includes('error') || host.includes('offline')) {
        resolve({ success: false, message: `Host ${host} inacessível (Timeout).` });
        return;
      }

      if (type === ConnectionType.SFTP || type === ConnectionType.FTP) {
        if (!credentials?.user || !credentials?.pass) {
          resolve({ success: false, message: "Autenticação falhou: Usuário ou senha vazios." });
          return;
        }
        if (credentials.pass.length < 4) {
          resolve({ success: false, message: "Autenticação falhou: Credenciais rejeitadas pelo servidor." });
          return;
        }
      }

      resolve({ 
        success: true, 
        message: "Conexão estabelecida com sucesso.", 
        latency 
      });
    }, latency);
  });
};