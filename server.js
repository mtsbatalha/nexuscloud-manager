import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import bodyParser from 'body-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'nexus-secret-key-change-me';
const DATA_FILE = path.join(__dirname, 'users.json');

// Configuração de Upload
const upload = multer({ dest: path.join(__dirname, 'uploads_temp') });

// Middlewares
app.use(helmet({ 
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(morgan('combined'));
app.use(cors());
app.use(bodyParser.json());

// Servir arquivos estáticos da build do Vite (pasta dist)
// Isso é crucial: o Dockerfile copia o build para ./dist
app.use(express.static(path.join(__dirname, 'dist')));

// --- Sistema de Usuários (Simples JSON DB) ---

if (!fs.existsSync(DATA_FILE)) {
  const initialUsers = [
    {
      id: '1',
      name: 'Administrador',
      email: 'admin@nexus.com',
      passwordHash: bcrypt.hashSync('admin123', 10),
      role: 'admin',
      createdAt: new Date().toISOString()
    }
  ];
  fs.writeFileSync(DATA_FILE, JSON.stringify(initialUsers, null, 2));
}

const getUsers = () => {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        return [];
    }
};
const saveUsers = (users) => fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));

// --- Rotas de Autenticação ---

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const users = getUsers();
  const user = users.find(u => u.email === email);

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
  const { passwordHash, ...userSafe } = user;
  res.json({ token, user: userSafe });
});

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Token inválido' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
  next();
};

// --- Rotas de Gestão de Usuários ---

app.get('/api/users', authenticate, requireAdmin, (req, res) => {
  const users = getUsers();
  res.json(users.map(({ passwordHash, ...u }) => u));
});

app.post('/api/users', authenticate, requireAdmin, (req, res) => {
  const { name, email, password, role } = req.body;
  const users = getUsers();
  
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email já cadastrado' });
  }

  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role: role || 'user',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);
  
  const { passwordHash, ...userSafe } = newUser;
  res.json(userSafe);
});

app.delete('/api/users/:id', authenticate, requireAdmin, (req, res) => {
  let users = getUsers();
  const initialLen = users.length;
  users = users.filter(u => u.id !== req.params.id);
  
  if (users.length === initialLen) return res.status(404).json({ error: 'Usuário não encontrado' });
  
  saveUsers(users);
  res.json({ success: true });
});

// --- Rotas de Sistema de Arquivos ---

app.get('/api/fs/list', authenticate, (req, res) => {
  const targetPath = req.query.path || '.';
  
  try {
    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: 'Caminho não encontrado' });
    }

    const stats = fs.statSync(targetPath);
    if (!stats.isDirectory()) {
      return res.status(400).json({ error: 'O caminho não é um diretório' });
    }

    const items = fs.readdirSync(targetPath).map(name => {
      try {
        const fullPath = path.join(targetPath, name);
        const itemStats = fs.statSync(fullPath);
        return {
          id: fullPath,
          name,
          type: itemStats.isDirectory() ? 'folder' : 'file',
          size: itemStats.size,
          modifiedAt: itemStats.mtime.toISOString(),
          path: fullPath,
          parentId: targetPath,
          mimeType: itemStats.isDirectory() ? null : 'application/octet-stream'
        };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fallback para o Frontend (SPA) - Redireciona qualquer rota desconhecida para o index.html do React
app.get('*', (req, res) => {
  // Ignora requisições de API
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API endpoint not found' });
  
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send('Erro: Build de frontend não encontrado. Verifique se "npm run build" foi executado.');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor NexusCloud rodando na porta ${PORT}`);
});