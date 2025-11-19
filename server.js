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
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan('combined'));
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// --- Sistema de Usuários (Simples JSON DB) ---

// Inicializar arquivo de usuários se não existir
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

const getUsers = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
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
  // Não retornar o hash da senha
  const { passwordHash, ...userSafe } = user;
  res.json({ token, user: userSafe });
});

// Middleware de Verificação de Token
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

// --- Rotas de Sistema de Arquivos (Integração Real) ---

app.get('/api/fs/list', authenticate, (req, res) => {
  const targetPath = req.query.path || '.';
  
  // Segurança básica: Impedir sair do diretório raiz se necessário, 
  // mas para um File Manager de servidor, geralmente queremos acesso total ou chroot.
  // Aqui vamos permitir acesso, mas em produção deve-se ter cuidado.
  
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
          id: fullPath, // Usando path como ID para simplificar
          name,
          type: itemStats.isDirectory() ? 'folder' : 'file',
          size: itemStats.size,
          modifiedAt: itemStats.mtime.toISOString(),
          path: fullPath,
          parentId: targetPath,
          mimeType: itemStats.isDirectory() ? null : 'application/octet-stream' // Simplificado
        };
      } catch (e) {
        return null; // Ignorar arquivos sem permissão
      }
    }).filter(Boolean);

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota de Fallback para SPA
app.get('*', (req, res) => {
  // Ignorar chamadas de API
  if (req.path.startsWith('/api')) return res.status(404).send('API Endpoint not found');
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor NexusCloud rodando na porta ${PORT}`);
  console.log(`📂 Modo de persistência local ativado.`);
});
