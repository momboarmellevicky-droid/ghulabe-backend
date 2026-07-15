import PDFDocument from 'pdfkit';
import { supabaseAdmin } from '../config/supabase';
import type { VulnerabilityFinding } from './geminiAnalysis';
import type { RawScanFacts } from './scanEngine';

/**
 * Génère un vrai rapport PDF d'audit à partir des faits réels du scan,
 * l'upload dans Supabase Storage (bucket "reports"), et retourne l'URL publique réelle.
 * Aucune donnée simulée : tout provient de facts/findings/score déjà calculés en amont.
 */
export async function generateScanReportPdf(
  domainUrl: string,
  score: number,
  facts: RawScanFacts,
  findings: VulnerabilityFinding[],
  scanId: string
): Promise<string> {
  const doc = new PDFDocument({ margin: 50 });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  const pdfBufferPromise = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  doc.fontSize(20).fillColor('#0066FF').text('GHULABE — Rapport d\'Audit de Cybersécurité', { align: 'left' });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#666666').text(`Généré le ${new Date().toLocaleString('fr-FR')}`, { align: 'left' });
  doc.moveDown(1.5);

  doc.fontSize(14).fillColor('#000000').text(`Domaine audité : ${domainUrl}`);
  doc.fontSize(28).fillColor(score >= 7 ? '#00CC6A' : score >= 4 ? '#FFB800' : '#FF2D2D')
    .text(`Score de sécurité : ${score} / 10`);
  doc.moveDown(1);

  doc.fontSize(14).fillColor('#000000').text('Faits techniques constatés', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#333333');
  doc.text(`HSTS actif : ${facts.headers_checked.hsts ? 'Oui' : 'Non'}`);
  doc.text(`CSP actif : ${facts.headers_checked.csp ? 'Oui' : 'Non'}`);
  doc.text(`X-Frame-Options : ${facts.headers_checked.x_frame_options ? 'Oui' : 'Non'}`);
  doc.text(`X-Content-Type-Options : ${facts.headers_checked.x_content_type_options ? 'Oui' : 'Non'}`);
  doc.moveDown(0.5);
  doc.text(`Certificat SSL valide : ${facts.ssl_status.valid ? 'Oui' : 'Non'}`);
  doc.text(`Expiration du certificat : ${facts.ssl_status.expires_in_days} jours`);
  doc.text(`Émetteur : ${facts.ssl_status.issuer}`);
  doc.moveDown(0.5);
  doc.text(`Fichiers sensibles exposés : ${facts.exposed_files.length > 0 ? facts.exposed_files.join(', ') : 'Aucun'}`);
  doc.moveDown(1.5);

  doc.fontSize(14).fillColor('#000000').text('Failles détectées', { underline: true });
  doc.moveDown(0.5);

  if (findings.length === 0) {
    doc.fontSize(10).fillColor('#00CC6A').text('Aucune faille détectée lors de ce scan.');
  } else {
    findings.forEach((f, i) => {
      const color = f.severity === 'critique' ? '#FF2D2D' : f.severity === 'eleve' ? '#FF6B2D' : f.severity === 'moyen' ? '#FFB800' : '#666666';
      doc.fontSize(11).fillColor(color).text(`${i + 1}. [${f.severity.toUpperCase()}] ${f.title}`);
      doc.fontSize(9).fillColor('#333333').text(f.description || '', { indent: 15 });
      if (f.recommendation) {
        doc.fontSize(9).fillColor('#0066FF').text(`Correctif recommandé : ${f.recommendation}`, { indent: 15 });
      }
      doc.moveDown(0.5);
    });
  }

  doc.moveDown(1.5);
  doc.fontSize(8).fillColor('#999999').text(
    `Rapport généré automatiquement par le moteur de scan GHULABE (Nuclei + Nmap + vérification TLS native). Scan ID: ${scanId}`,
    { align: 'left' }
  );

  doc.end();

  const pdfBuffer = await pdfBufferPromise;
  const fileName = `${scanId}-${Date.now()}.pdf`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('reports')
    .upload(fileName, pdfBuffer, { contentType: 'application/pdf', upsert: false });

  if (uploadError) {
    throw new Error(`Échec upload PDF: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from('reports')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}
