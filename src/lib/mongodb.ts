// MongoDB retiré: ce module est conservé uniquement pour éviter des erreurs d'import résiduelles.
export default function dbConnect(): never {
  throw new Error('MongoDB retiré de l\'application. Migrez vers Supabase.');
}