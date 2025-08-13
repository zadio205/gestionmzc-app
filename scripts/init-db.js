const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.DB_NAME || 'masyzarac';

// Schéma utilisateur simplifié pour le script
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'collaborateur', 'client'], default: 'client' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function initDatabase() {
  try {
    // Connexion à MongoDB
  await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });
    console.log('✅ Connexion à MongoDB réussie');

    // Vérifier si un admin existe déjà
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('ℹ️  Un administrateur existe déjà');
      return;
    }

    // Créer un utilisateur administrateur par défaut
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = new User({
      email: 'admin@masyzarac.com',
      name: 'Administrateur',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    });

    await adminUser.save();
    console.log('✅ Utilisateur administrateur créé avec succès');
    console.log('📧 Email: admin@masyzarac.com');
    console.log('🔑 Mot de passe: admin123');
    console.log('⚠️  Pensez à changer le mot de passe après la première connexion');

    // Créer un collaborateur de test
    const collaborateurPassword = await bcrypt.hash('collab123', 12);
    const collaborateur = new User({
      email: 'collaborateur@masyzarac.com',
      name: 'Collaborateur Test',
      password: collaborateurPassword,
      role: 'collaborateur',
      isActive: true,
    });

    await collaborateur.save();
    console.log('✅ Collaborateur de test créé');
    console.log('📧 Email: collaborateur@masyzarac.com');
    console.log('🔑 Mot de passe: collab123');

    // Créer un client de test
    const clientPassword = await bcrypt.hash('client123', 12);
    const client = new User({
      email: 'client@masyzarac.com',
      name: 'Client Test',
      password: clientPassword,
      role: 'client',
      isActive: true,
    });

    await client.save();
    console.log('✅ Client de test créé');
    console.log('📧 Email: client@masyzarac.com');
    console.log('🔑 Mot de passe: client123');

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnexion de MongoDB');
  }
}

// Exécuter le script
initDatabase();