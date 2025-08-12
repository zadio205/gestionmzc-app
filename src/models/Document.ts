import mongoose, { Schema, Document as MongoDocument } from 'mongoose';
import { Document } from '@/types';

interface IDocument extends Omit<Document, '_id'>, MongoDocument {}

const DocumentSchema = new Schema<IDocument>({
  name: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: 'justificatif',
  },
  path: {
    type: String,
    required: true,
  },
  url: String,
  provider: { type: String, enum: ['supabase', 'local'], default: 'local' },
  bucket: String,
  storageKey: String,
  size: {
    type: Number,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  clientId: {
    type: String,
    ref: 'Client',
    required: true,
  },
  uploadedBy: {
    type: String,
    ref: 'User',
    required: true,
  },
  tags: [String],
  category: {
    type: String,
    enum: ['comptable', 'juridique', 'social', 'autre'],
    default: 'autre',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'archived'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

export default mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);