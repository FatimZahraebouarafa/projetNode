import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import professionalService from '../services/professionalService';
import Chat from '../components/Chat';
import './ProfessionalDashboard.css';

const ProfessionalDashboard = () => {
  const navigate = useNavigate();
  const [professional, setProfessional] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('appointments');
  const [selectedAppointmentForChat, setSelectedAppointmentForChat] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/user/auth');
        return;
      }

      const currentUser = authService.getCurrentUser();
      setProfessional(currentUser);
      
      // Fetch appointments and pending requests
      const [appointmentsList, pendingList] = await Promise.all([
        professionalService.getAppointments(token),
        professionalService.getPendingAppointments(token)
      ]);
      
      setAppointments(appointmentsList);
      setPendingRequests(pendingList);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
      if (error.response?.status === 401) {
        authService.logout();
        navigate('/user/auth');
      }
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  const handleConfirmAppointment = async (appointmentId) => {
    try {
      const token = localStorage.getItem('token');
      await professionalService.confirmAppointment(appointmentId, token);
      loadData(); // Reload data
    } catch (error) {
      console.error('Error confirming appointment:', error);
      alert('Erreur lors de la confirmation');
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    const reason = prompt('Raison de l\'annulation:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('token');
      await professionalService.cancelAppointment(appointmentId, reason, token);
      loadData(); // Reload data
    } catch (error) {
      console.error('Error canceling appointment:', error);
      alert('Erreur lors de l\'annulation');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="professional-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-logo-title">
            <img 
              src="/rabtalogo.png" 
              alt="RABTA" 
              className="header-logo" 
              onClick={() => navigate('/')}
              style={{ cursor: 'pointer' }}
            />
          </div>
          <div className="header-right">
            <span className="user-name">
              Dr. {professional?.firstName} {professional?.lastName}
            </span>
            <button onClick={handleLogout} className="logout-button">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-container">
        {/* Profile Summary */}
        <div className="profile-summary">
          <div className="profile-card">
            <div className="profile-header">
              {professional?.profileImage && (
                <img 
                  src={professional.profileImage} 
                  alt="Profile" 
                  className="profile-avatar"
                />
              )}
              <div className="profile-info">
                <h2>{professional?.firstName} {professional?.lastName}</h2>
                <p className="specialty">{professional?.specialty}</p>
                <p className="email">{professional?.email}</p>
              </div>
            </div>
            <div className="profile-stats">
              <div className="stat">
                <h3>{appointments.filter(a => {
                  const today = new Date().toISOString().split('T')[0];
                  return a.date === today && a.status === 'CONFIRMED';
                }).length}</h3>
                <p>Rendez-vous aujourd'hui</p>
              </div>
              <div className="stat">
                <h3>{pendingRequests.length}</h3>
                <p>En attente</p>
              </div>
              <div className="stat">
                <h3>{appointments.filter(a => {
                  const now = new Date();
                  const month = now.getMonth();
                  const year = now.getFullYear();
                  const aptDate = new Date(a.date);
                  return aptDate.getMonth() === month && aptDate.getFullYear() === year;
                }).length}</h3>
                <p>Total ce mois</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            📅 Rendez-vous
          </button>
          <button
            className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            🔔 Demandes ({pendingRequests.length})
          </button>
          <button
            className={`tab ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            ⏰ Disponibilités
          </button>
          <button
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Mon Profil
          </button>
          <button
            className={`tab ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            💬 Messages
          </button>
        </div>

        {/* Content */}
        <div className="tab-content">
          {activeTab === 'appointments' && (
            <div className="appointments-section">
              <h2>Mes Rendez-vous</h2>
              <div className="appointments-list">
                {appointments.length === 0 ? (
                  <div className="empty-state">
                    <p>📅 Aucun rendez-vous pour le moment</p>
                    <span>Les rendez-vous confirmés apparaîtront ici</span>
                  </div>
                ) : (
                  appointments.map(apt => (
                    <div key={apt._id} className="appointment-card">
                      <div className="appointment-info">
                        <h3>Patient: {apt.userId?.firstName} {apt.userId?.lastName}</h3>
                        <p>📧 Email: {apt.userId?.email}</p>
                        <p>📞 Téléphone: {apt.userId?.phone}</p>
                        <p>📅 Date: {formatDate(apt.date)}</p>
                        <p>⏰ Heure: {formatTime(apt.startTime)} - {formatTime(apt.endTime)}</p>
                        <p>📋 Type: {apt.type}</p>
                        <p>💬 Raison: {apt.reason}</p>
                      </div>
                      <div className="appointment-actions">
                        <span className={`status-badge status-${apt.status.toLowerCase()}`}>
                          {apt.status}
                        </span>
                        {apt.status === 'CONFIRMED' && (
                          <>
                            <button 
                              onClick={() => {
                                setSelectedAppointmentForChat(apt);
                                setActiveTab('messages');
                              }}
                              className="chat-btn"
                            >
                              💬 Chat
                            </button>
                            <button 
                              onClick={() => handleCancelAppointment(apt._id)}
                              className="cancel-btn"
                            >
                              Annuler
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'pending' && (
            <div className="pending-section">
              <h2>Demandes de Consultation</h2>
              <div className="pending-list">
                {pendingRequests.length === 0 ? (
                  <div className="empty-state">
                    <p>🔔 Aucune nouvelle demande</p>
                    <span>Les demandes de rendez-vous apparaîtront ici</span>
                  </div>
                ) : (
                  pendingRequests.map(apt => (
                    <div key={apt._id} className="appointment-card pending">
                      <div className="appointment-info">
                        <h3>Nouveau Patient: {apt.userId?.firstName} {apt.userId?.lastName}</h3>
                        <p>📧 Email: {apt.userId?.email}</p>
                        <p>📞 Téléphone: {apt.userId?.phone}</p>
                        <p>📅 Date demandée: {formatDate(apt.date)}</p>
                        <p>⏰ Heure: {formatTime(apt.startTime)} - {formatTime(apt.endTime)}</p>
                        <p>📋 Type: {apt.type}</p>
                        <p>💬 Raison: {apt.reason}</p>
                      </div>
                      <div className="appointment-actions">
                        <button 
                          onClick={() => handleConfirmAppointment(apt._id)}
                          className="confirm-btn"
                        >
                          ✓ Confirmer
                        </button>
                        <button 
                          onClick={() => handleCancelAppointment(apt._id)}
                          className="reject-btn"
                        >
                          ✗ Refuser
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="schedule-section">
              <h2>Mes Disponibilités</h2>
              <div className="schedule-info">
                <p>Gérez vos horaires de consultation</p>
                <div className="availability-grid">
                  {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map(day => (
                    <div key={day} className="day-card">
                      <h4>{day}</h4>
                      <p className="time-range">09:00 - 17:00</p>
                      <button className="edit-btn">Modifier</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="profile-section">
              <h2>Mon Profil</h2>
              <div className="profile-details">
                <div className="detail-group">
                  <label>Nom complet</label>
                  <p>{professional?.firstName} {professional?.lastName}</p>
                </div>
                <div className="detail-group">
                  <label>Email</label>
                  <p>{professional?.email}</p>
                </div>
                <div className="detail-group">
                  <label>Téléphone</label>
                  <p>{professional?.phone || 'Non renseigné'}</p>
                </div>
                <div className="detail-group">
                  <label>Spécialité</label>
                  <p>{professional?.specialty}</p>
                </div>
                <div className="detail-group">
                  <label>Statut du compte</label>
                  <p>
                    <span className="status-badge status-approved">
                      ✓ Approuvé
                    </span>
                  </p>
                </div>
                <button className="update-btn">Mettre à jour le profil</button>
              </div>
            </div>
          )}

          {/* Tab: Messages */}
          {activeTab === 'messages' && (
            <div className="messages-section">
              <h2>Messagerie</h2>
              
              {selectedAppointmentForChat ? (
                <div className="chat-wrapper">
                  <button 
                    className="back-button"
                    onClick={() => setSelectedAppointmentForChat(null)}
                  >
                    ← Retour à la liste
                  </button>
                  <Chat 
                    appointment={selectedAppointmentForChat}
                    currentUser={professional}
                  />
                </div>
              ) : (
                <div className="conversations-list">
                  {appointments.filter(apt => apt.status === 'CONFIRMED').length === 0 ? (
                    <div className="empty-state">
                      <p>💬 Aucune conversation disponible</p>
                      <span>Les conversations avec vos patients apparaîtront ici après confirmation des rendez-vous</span>
                    </div>
                  ) : (
                    <div className="conversations-grid">
                      {appointments
                        .filter(apt => apt.status === 'CONFIRMED')
                        .map(apt => (
                          <div 
                            key={apt._id} 
                            className="conversation-card"
                            onClick={() => setSelectedAppointmentForChat(apt)}
                          >
                            <div className="conversation-header">
                              <h3>{apt.userId?.firstName} {apt.userId?.lastName}</h3>
                            </div>
                            <div className="conversation-info">
                              <p>📅 {formatDate(apt.date)} à {apt.startTime}</p>
                              <p>📋 {apt.type}</p>
                              <p>💬 {apt.reason}</p>
                            </div>
                            <button className="open-chat-btn">
                              Ouvrir la conversation →
                            </button>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDashboard;
