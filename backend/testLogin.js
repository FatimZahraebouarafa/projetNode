const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@rabta.com',
      password: 'admin123'
    });
    
    console.log('✓ Connexion réussie!');
    console.log('User:', response.data);
  } catch (error) {
    console.log('✗ Échec de connexion');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Message:', error.response.data.message);
    } else {
      console.log('Error:', error.message);
    }
  }
}

testLogin();
