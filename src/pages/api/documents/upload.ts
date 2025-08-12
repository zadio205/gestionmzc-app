import type { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dbConnect from '@/lib/mongodb';
import DocumentModel from '@/models/Document';
import { supabaseServer } from '@/lib/supabase';

// Stockage local dans /tmp/uploads (Vercel: /tmp seulement). En dev: ./.uploads
const uploadDir = process.env.NODE_ENV === 'production' ? '/tmp/uploads' : path.join(process.cwd(), '.uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Type de fichier non supporté'));
  },
});

// Désactiver le bodyParser par défaut de Next pour gérer multipart/form-data
export const config = { api: { bodyParser: false } };

// Utilitaire pour exécuter un middleware de type Express avec Next.js
function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: any) {
  return new Promise<void>((resolve, reject) => {
    fn(req, res, (result: unknown) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve();
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    await runMiddleware(req, res, upload.single('file'));
  } catch (err) {
    console.error('Upload middleware error:', err);
    return res.status(400).json({ error: (err as Error).message || 'Erreur upload' });
  }

  try {
    await dbConnect();

    const userId = (req.headers['x-user-id'] as string | undefined) || undefined;
    // multer ajoute file et body sur req as any
    const anyReq = req as any;
    const clientId = anyReq.body?.clientId as string | undefined;
    const entryId = anyReq.body?.entryId as string | undefined; // réservé futur
    const file = anyReq.file as Express.Multer.File | undefined;

    if (!userId) return res.status(401).json({ error: 'Utilisateur non authentifié' });
    if (!clientId) return res.status(400).json({ error: 'clientId requis' });
    if (!file) return res.status(400).json({ error: 'Aucun fichier reçu' });

    const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET as string;
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_BUCKET) {
      return res.status(500).json({ error: 'Configuration Supabase manquante' });
    }

    const supabase = supabaseServer();
    const storageKey = `${clientId}/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    const uploadRes = await supabase.storage.from(SUPABASE_BUCKET).upload(storageKey, fs.readFileSync(file.path), {
      contentType: file.mimetype,
      upsert: false,
    });
    if (uploadRes.error) {
      console.error('Supabase upload error:', uploadRes.error);
      return res.status(500).json({ error: 'Échec upload Supabase', details: uploadRes.error.message || uploadRes.error.name || 'unknown' });
    }

    // Try signed URL first (works with private buckets). Fallback to public URL.
    let url: string | undefined;
    const signed = await supabase.storage.from(SUPABASE_BUCKET).createSignedUrl(storageKey, 3600);
    if (signed.data?.signedUrl) {
      url = signed.data.signedUrl;
    } else {
      const { data: publicUrlData } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(storageKey);
      url = publicUrlData.publicUrl;
    }

    const saved = await DocumentModel.create({
      name: path.basename(storageKey),
      originalName: file.originalname,
      path: storageKey,
      url,
      provider: 'supabase',
      bucket: SUPABASE_BUCKET,
      storageKey,
      size: file.size,
      mimeType: file.mimetype,
      clientId,
      uploadedBy: userId,
      tags: ['justificatif'],
      category: 'comptable',
      status: 'pending',
      type: 'justificatif',
    });

    return res.status(201).json({
      document: {
        _id: saved._id.toString(),
        name: saved.name,
        originalName: saved.originalName,
  path: saved.path,
  url: saved.url,
  provider: saved.provider,
  bucket: saved.bucket,
  storageKey: saved.storageKey,
        size: saved.size,
        mimeType: saved.mimeType,
        clientId: saved.clientId,
        uploadedBy: saved.uploadedBy,
        status: saved.status,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      },
      entryId,
    });
  } catch (e) {
    console.error('Upload handler error:', e);
    return res.status(500).json({ error: 'Erreur interne' });
  }
}
