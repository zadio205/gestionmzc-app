import mongoose, { Schema, Document } from 'mongoose';
import { Client } from '@/types';

interface IClient extends Omit<Client, '_id'>, Document {}

const ClientSchema = new Schema<IClient>({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  contact: String,
  phone: String,
  address: String,
  siret: String,
  industry: String,
  dossierNumber: String,
  collaboratorId: {
    type: String,
    ref: 'User',
    required: true,
  },
  documents: [{
    type: String,
    ref: 'Document',
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema);