import { ClientLedger, SupplierLedger, MiscellaneousLedger } from '@/types/accounting';

const normalize = (s: string | undefined | null) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

const dateKey = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : '');
const amtKey = (n: number | undefined | null) => (Number.isFinite(n as number) ? (Math.round(((n as number) + Number.EPSILON) * 100) / 100).toFixed(2) : '0.00');

export const getClientLedgerSignature = (e: ClientLedger) => [
  'client',
  dateKey(e.date),
  normalize(e.accountNumber),
  normalize(e.description),
  normalize(e.reference),
  amtKey(e.debit),
  amtKey(e.credit),
  normalize(e.clientId),
].join('|');

export const getSupplierLedgerSignature = (e: SupplierLedger) => [
  'supplier',
  dateKey(e.date),
  normalize(e.accountNumber),
  normalize(e.description),
  normalize(e.reference),
  amtKey(e.debit),
  amtKey(e.credit),
  normalize(e.clientId),
].join('|');

export const getMiscLedgerSignature = (e: MiscellaneousLedger) => [
  'misc',
  dateKey(e.date),
  normalize(e.accountNumber),
  normalize(e.accountName),
  normalize(e.description),
  normalize(e.reference),
  amtKey(e.debit),
  amtKey(e.credit),
  normalize(e.clientId),
  normalize(e.category),
].join('|');

export const dedupBySignature = <T>(items: T[], makeSig: (t: T) => string, existingSigs?: Set<string>) => {
  const seen = new Set(existingSigs);
  const out: T[] = [];
  for (const it of items) {
    const sig = makeSig(it);
    if (!seen.has(sig)) {
      seen.add(sig);
      out.push(it);
    }
  }
  return { unique: out, signatures: seen };
};
