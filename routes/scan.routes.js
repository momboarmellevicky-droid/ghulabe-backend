// routes/scan.routes.js
// GHULABE — FICHIER AUTONOME. Ne dépend d'aucun autre fichier de ton projet.
// Tout est inclus dedans : connexion Supabase, vérification du token, moteur de scan réel, crédits.

const express = require('express');
const https = require('https');
const tls = require('tls');
const dns = require('dns').promises;
const net = require('net');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Non authentifié. Token manquant.' });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data || !data.user) return res.status(401).json({ error: 'Session invalide ou expirée.' });
  req.user = { id: data.user.id, email: data.user.email };
  next();
}

function fetchHeaders(hostname, path = '/', timeout = 8000) {
  return new Promise((resolve) => {
    const req = https.request(
      { hostname, path, method: 'GET', timeout, rejectUnauthorized: false },
      (res) => { resolve({ statusCode: res.statusCode, headers: res.headers }); res.resume(); }
    );
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.end();
  });
}

function getTlsCertificate(hostname, port = 443, timeout = 8000) {
  return new Promise((resolve) => {
    const socket = tls.connect(
      { host: hostname, port, servername: hostname, rejectUnauthorized: false, timeout },
      () => {
        const cert = socket.getPeerCertificate();
        const protocol = socket.getProtocol();
        socket.end();
        if (!cert || !cert.valid_to) return resolve(null);
        resolve({ issuer: cert.issuer && cert.issuer.O, validTo: cert.valid_to,
          daysRemaining: Math.floor((new Date(cert.valid_to) - new Date()) / 86400000), protocol });
      }
    );
    socket.on('error', () => resolve(null));
    socket.on('timeout', () => { socket.destroy(); resolve(null); });
  });
}

function checkPort(hostname, port, timeout = 3000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;
    socket.setTimeout(timeout);
    socket.on('connect', () => { done = true; socket.destroy(); resolve(true); });
    socket.on('timeout', () => { if (!done) { socket.destroy(); resolve(false); } });
    socket.on('error', () => { if (!done) resolve(false); });
    socket.connect(port, hostname);
  });
}

const COMMON_PORTS = [21, 22, 23, 25, 3306, 3389, 5432, 6379, 8080, 9200, 27017];

async function scanCommonPorts(hostname) {
  const results = await Promise.all(COMMON_PORTS.map(async (port) => ({ port, open: await checkPort(hostname, port) })));
  return results.filter((r) => r.open).map((r) => r.port);
}

async function checkDnsRecords(hostname) {
  const out = { spf: null, dmarc: null, mx: [] };
  try {
    const txt = await dns.resolveTxt(hostname);
    out.spf = txt.map((r) => r.join('')).find((r) => r.startsWith('v=spf1')) || null;
  } catch (_) {}
  try {
    const dmarcTxt = await dns.resolveTxt(`_dmarc.${hostname}`);
    out.dmarc = dmarcTxt.map((r) => r.join('')).find((r) => r.startsWith('v=DMARC1')) || null;
  } catch (_) {}
  try { out.mx = await dns.resolveMx(hostname); } catch (_) {}
  return out;
}

const EXPOSED_PATHS = ['/.env', '/.git/config', '/wp-config.php.bak', '/backup.zip', '/.DS_Store', '/config.json', '/phpinfo.php'];

async function checkExposedFiles(hostname) {
  const found = [];
  for (const p of EXPOSED_PATHS) {
    const res = await fetchHeaders(hostname, p, 5000);
    if (res && res.statusCode === 200) found.push(p);
  }
  return found;
}

function makeFinding(f) {
  return { ...f, remediation_code: f.remediation_code || null, detected_at: n
