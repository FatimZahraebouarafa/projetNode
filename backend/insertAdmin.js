const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function insertAdmin() {
  try {
    await mongoose.connect('mongodb://localhost:27017/rabta');
    console.log('✅ Connecté à MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({
      firstName: String,
      lastName: String,
      email: String,
      password: String,
      role: String,
      phone: String,
      createdAt: Date
    }));

    // Vérifier si admin existe
    const existing = await User.findOne({ email: 'admin@rabta.com' });
    if (existing) {
      console.log('✅ Admin existe déjà!');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Hacher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin123!', salt);

    // Créer admin
    await User.create({
      firstName: 'Admin',
      lastName: 'RABTA',
      email: 'admin@rabta.com',
      password: hashedPassword,
      role: 'ADMIN',
      phone: '0600000000',
      createdAt: new Date()
    });

    console.log('✅ Admin créé avec succès!');
    console.log('📧 Email: admin@rabta.com');
    console.log('🔑 Mot de passe: Admin123!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

insertAdmin();
