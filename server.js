import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Segurança e Otimização
app.use(helmet({
  contentSecurityPolicy: false, // Desativado para permitir CDNs do exemplo
}));
app.use(compression());
app.use(morgan('combined')); // Logs de acesso

// Servir arquivos estáticos da raiz (onde estão index.html, etc)
app.use(express.static(__dirname));

// Rota de API de Exemplo (Placeholder para futura integração real com Linux)
app.get('/api/system-status', (req, res) => {
  res.json({
    os: process.platform,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  });
});

// SPA Fallback: Qualquer rota não encontrada redireciona para index.html
// Isso permite que o React Router funcione corretamente
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  🚀 NexusCloud Manager rodando!
  ---------------------------------------
  📡 Acesso Local:    http://localhost:${PORT}
  🌍 Acesso Externo:  http://0.0.0.0:${PORT}
  ---------------------------------------
  `);
});