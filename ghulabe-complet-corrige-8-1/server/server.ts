import express, { Request, Response } from 'express';
import authRoutes from './routes/authRoutes';
import scanRoutes from './routes/scanRoutes';
import missionRoutes from './routes/missionRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import certificationRoutes from './routes/certificationRoutes';
import paymentRoutes from './routes/paymentRoutes';
import { apiRateLimiter } from './middleware/rateLimiter';
import { testDbConnection } from './config/supabase';
import { generateAuditLog } from './utils/crypto';

const app = express();
const PORT = process.env.PORT || 5000;
const ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS || 'https://ghulabe.com').split(',').map(o => o.trim());

// ============================================================================
// 1. MIDDLEWARES DE SÉCURITÉ & EN-TÊTES HTTP STRICTS
// ============================================================================
app.use(express.json({ limit: '1mb' })); // Prévention d'injections et dénis de service par payload

app.use((req: Request, res: Response, next) => {
  // CORS restreint à une liste blanche d'origines autorisées (production + outils de test internes)
  const requestOrigin = req.headers.origin;
  if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // En-têtes HTTP de Sécurité obligatoires GHULABE (HSTS, CSP, X-Frame-Options, etc.)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-Frame-Options', 'DENY'); // Prévention du Clickjacking
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'self' https:; script-src 'self' 'unsafe-inline'; frame-ancestors 'none';");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

// Rate Limiter Global Strict (100 requêtes / minute)
app.use('/api', apiRateLimiter);

// ============================================================================
// 2. ENREGISTREMENT DES ROUTES API
// ============================================================================
app.use('/api/auth', authRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/public/certification', certificationRoutes);
app.use('/api/payment', paymentRoutes);

// Endpoint de santé & statut système
app.get('/api/health', async (_req: Request, res: Response) => {
  // Vraie vérification (réutilise testDbConnection déjà présent dans config/supabase.ts,
  // jusqu'ici jamais appelé) au lieu d'un message "database: connected" codé en dur.
  const isDbConnected = await testDbConnection();

  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'ONLINE' : 'DEGRADED',
    service: 'GHULABE SecOps Backend Engine',
    host: 'Render (Europe / Frankfurt)',
    encryption: 'AES-256 at rest | TLS 1.3 in transit',
    database: isDbConnected ? 'PostgreSQL connected via Supabase EU' : 'PostgreSQL UNREACHABLE via Supabase EU',
    timestamp: new Date().toISOString(),
  });
});

// Route de fallback
app.use('*', (req: Request, res: Response) => {
  generateAuditLog({
    action: 'UNMATCHED_API_ROUTE',
    ipAddress: req.ip || req.socket.remoteAddress || 'unknown-ip',
    targetUrl: req.originalUrl,
    status: 'BLOCKED',
    details: 'Tentative d\'accès à une route API inexistante.',
  });
  res.status(404).json({ error: "Endpoint non trouvé." });
});

// ============================================================================
// 3. DÉMARRAGE DU SERVEUR
// ============================================================================
export async function startServer(): Promise<void> {
  console.log('==========================================================');
  console.log('⚡ DÉMARRAGE DU BACKEND GHULABE © 2026');
  console.log('🛡️ Architecte Principal : Mombo Armelle Vicky');
  console.log('🌐 Hébergement Cible : Render (Europe) — Supabase EU (ghulabe.com)');
  console.log('==========================================================');

  await testDbConnection();

  app.listen(PORT, () => {
    console.log(`[GHULABE Server] Serveur API en écoute sur le port ${PORT}`);
    console.log(`[GHULABE Server] Rate Limiting Strict: Actif | CORS: ${ALLOWED_ORIGINS.join(', ')}`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer().catch(err => console.error('[GHULABE Server] Erreur critique au démarrage:', err));
}

export default app;
