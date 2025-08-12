import mongoose, { Schema, Document as MongoDocument } from 'mongoose';

export interface IClientLedgerEntry extends MongoDocument {
  date: Date | null;
  accountNumber: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference: string;
  clientId: string;
  type: 'client';
  clientName: string;
  invoiceNumber?: string;
  createdAt: Date;
  isImported?: boolean;
  aiMeta?: {
    suspiciousLevel: 'low' | 'medium' | 'high';
    reasons: string[];
    suggestions?: string[];
  };
  signature: string; // unique content-based signature for deduplication
}

const ClientLedgerEntrySchema = new Schema<IClientLedgerEntry>({
  date: { type: Date, default: null },
  accountNumber: { type: String, required: true, trim: true },
  accountName: { type: String, required: false, trim: true, default: '' },
  description: { type: String, required: false, trim: true, default: '' },
  debit: { type: Number, required: true, min: 0, default: 0 },
  credit: { type: Number, required: true, min: 0, default: 0 },
  balance: { type: Number, required: true },
  reference: { type: String, required: false, trim: true, default: '' },
  clientId: { type: String, required: true, index: true },
  type: { type: String, enum: ['client'], default: 'client', required: true },
  clientName: { type: String, required: false, trim: true, default: '' },
  invoiceNumber: { type: String, required: false, trim: true },
  createdAt: { type: Date, default: Date.now },
  isImported: { type: Boolean, default: true },
  aiMeta: {
    suspiciousLevel: { type: String, enum: ['low', 'medium', 'high'], required: false },
    reasons: { type: [String], default: [] },
    suggestions: { type: [String], default: [] },
  },
  signature: { type: String, required: true, unique: true, index: true },
});

ClientLedgerEntrySchema.index({ clientId: 1, date: 1 });

export default mongoose.models.ClientLedgerEntry ||
  mongoose.model<IClientLedgerEntry>('ClientLedgerEntry', ClientLedgerEntrySchema);
