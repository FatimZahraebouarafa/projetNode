import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import './UserAuth.css';

const ProfessionalAuth = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({
        email: formData.email,
        password: formData.password
      });
      
      // Vérifier que c'est bien un professionnel
      if (response.role === 'PROFESSIONAL') {
        navigate('/professional/dashboard');
      } else if (response.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        setError('Ce compte n\'est pas un compte professionnel');
        setLoading(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Retour
        </button>

        <div className="auth-card">
          <h1>Connexion Professionnel</h1>
          
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Mot de passe</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
              />
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Chargement...' : 'Se connecter'}
            </button>
          </form>

          <div className="toggle-auth">
            <p>
              Pas encore inscrit ?{' '}
              <span onClick={() => navigate('/professional/register')}>S'inscrire</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalAuth;
