const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function testAdmin() {
  try {
    await mongoose.connect('mongodb://localhost:27017/rendezvous_platform');
    console.log('✓ Connecté à MongoDB');

    // Chercher l'admin
    const admin = await User.findOne({ email: 'admin@rabta.com' });
    
    if (!admin) {
      console.log('✗ Admin NON trouvé - Création en cours...');
      
      const newAdmin = await User.create({
        firstName: 'Admin',
        lastName: 'Rabta',
        email: 'admin@rabta.com',
        password: 'admin123',
        role: 'ADMIN',
        isActive: true,
        isVerified: true
      });
      
      console.log('✓ Admin créé avec succès!');
      console.log('  Email: admin@rabta.com');
      console.log('  Mot de passe: admin123');
      console.log('  Role:', newAdmin.role);
    } else {
      console.log('✓ Admin trouvé:');
      console.log('  Email:', admin.email);
      console.log('  Role:', admin.role);
      console.log('  isActive:', admin.isActive);
      console.log('  isVerified:', admin.isVerified);
      
      // Tester le mot de passe
      const isPasswordCorrect = await admin.comparePassword('admin123');
      console.log('  Mot de passe "admin123" est correct:', isPasswordCorrect);
      
      if (!isPasswordCorrect) {
        console.log('✗ Le mot de passe est incorrect - Réinitialisation...');
        admin.password = 'admin123';
        await admin.save();
        console.log('✓ Mot de passe réinitialisé à: admin123');
      }
    }

    await mongoose.connection.close();
    console.log('\n✓ Terminé');
  } catch (error) {
    console.error('✗ Erreur:', error.message);
    process.exit(1);
  }
}

testAdmin();
