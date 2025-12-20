import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="landing-container">
        <div className="landing-header">
          <img src="/rabtalogo.png" alt="RABT_______*A" className="logo" />
          <h1 className="hero-title">Excellence professionnelle à votre portée</h1>
          <p className="tagline">Connectez votre ambition avec l'expertise qui transforme</p>
        </div>

        <div className="landing-content">
          <div className="choice-cards">
            <div className="choice-card user-card">
              <div className="card-icon">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2>Utilisateur</h2>
              <p>Réservez l'expertise en un clic</p>
              <div className="professional-buttons">
                <button className="card-button" onClick={() => navigate('/user/auth?mode=login')}>
                  Connexion
                </button>
                <button className="card-button secondary" onClick={() => navigate('/user/auth?mode=register')}>
                  S'inscrire
                </button>
              </div>
            </div>

            <div className="choice-card professional-card">
              <div className="card-icon">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="8.5" cy="7" r="4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 8v6M23 11h-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2>Professionnel</h2>
              <p>Votre agenda, maîtrisé</p>
              <div className="professional-buttons">
                <button className="card-button" onClick={() => navigate('/professional/auth')}>
                  Connexion
                </button>
                <button className="card-button secondary" onClick={() => navigate('/professional/register')}>
                  S'inscrire
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
