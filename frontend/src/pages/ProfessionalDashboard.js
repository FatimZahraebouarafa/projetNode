import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import professionalService from '../services/professionalService';
import messageService from '../services/messageService';
import Chat from '../components/Chat';
import './ProfessionalDashboard.css';
import consultationService from '../services/consultationService';

const ProfessionalDashboard = () => {
  const navigate = useNavigate();
  const [professional, setProfessional] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('appointments');
  const [selectedAppointmentForChat, setSelectedAppointmentForChat] = useState(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [availabilities, setAvailabilities] = useState([]);
  const [editingDay, setEditingDay] = useState(null);
  const [tempAvailability, setTempAvailability] = useState({ startTime: '', endTime: '', isActive: true });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    phone: '',
    specialty: ''
  });

  useEffect(() => {
    loadData();
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const count = await messageService.getUnreadCount();
      setUnreadMessagesCount(count.unreadCount || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/user/auth');
        return;
      }
      
      // Fetch appointments, pending requests, and profile
      const [appointmentsList, pendingList, profileData] = await Promise.all([
        professionalService.getAppointments(token),
        professionalService.getPendingAppointments(token),
        professionalService.getProfile(token)
      ]);
      
      // Use profile data from API (includes profileImage)
      setProfessional(profileData);
      setProfileForm({
        phone: profileData?.phone || '',
        specialty: profileData?.specialty || ''
      });
      setAppointments(appointmentsList);
      setPendingRequests(pendingList);
      setAvailabilities(profileData.availabilities || []);
      
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

  const getDayAvailability = (dayName) => {
    const dayMap = {
      'Lundi': 'MONDAY',
      'Mardi': 'TUESDAY',
      'Mercredi': 'WEDNESDAY',
      'Jeudi': 'THURSDAY',
      'Vendredi': 'FRIDAY',
      'Samedi': 'SATURDAY',
      'Dimanche': 'SUNDAY'
    };
    
    const dayOfWeek = dayMap[dayName];
    return availabilities.find(a => a.dayOfWeek === dayOfWeek);
  };

  const handleEditAvailability = (dayName) => {
    const availability = getDayAvailability(dayName);
    if (availability) {
      setTempAvailability({
        startTime: availability.startTime,
        endTime: availability.endTime,
        isActive: availability.isActive
      });
    } else {
      setTempAvailability({ startTime: '09:00', endTime: '17:00', isActive: true });
    }
    setEditingDay(dayName);
  };

  const handleSaveAvailability = async () => {
    try {
      const dayMap = {
        'Lundi': 'MONDAY',
        'Mardi': 'TUESDAY',
        'Mercredi': 'WEDNESDAY',
        'Jeudi': 'THURSDAY',
        'Vendredi': 'FRIDAY',
        'Samedi': 'SATURDAY',
        'Dimanche': 'SUNDAY'
      };
      
      const dayOfWeek = dayMap[editingDay];
      const token = localStorage.getItem('token');
      
      // Update availabilities array
      const updatedAvailabilities = availabilities.filter(a => a.dayOfWeek !== dayOfWeek);
      
      if (tempAvailability.isActive) {
        updatedAvailabilities.push({
          dayOfWeek,
          startTime: tempAvailability.startTime,
          endTime: tempAvailability.endTime,
          isActive: tempAvailability.isActive
        });
      }
      
      await professionalService.updateProfile({ availabilities: updatedAvailabilities }, token);
      setAvailabilities(updatedAvailabilities);
      setEditingDay(null);
      alert('Disponibilité mise à jour avec succès!');
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleCancelEdit = () => {
    setEditingDay(null);
    setTempAvailability({ startTime: '', endTime: '', isActive: true });
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  const handleCancelProfileEdit = () => {
    setIsEditingProfile(false);
    setProfileForm({
      phone: professional?.phone || '',
      specialty: professional?.specialty || ''
    });
  };

  const handleUpdateProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      await professionalService.updateProfile(profileForm, token);
      
      // Mettre à jour les données locales
      const updatedUser = { ...professional, ...profileForm };
      setProfessional(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setIsEditingProfile(false);
      alert('Profil mis à jour avec succès!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Erreur lors de la mise à jour du profil');
    }
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
          <div className="header-left-section">
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
              <span className="user-title">Dr.</span> {professional?.firstName} {professional?.lastName}
            </span>
            <button onClick={handleLogout} className="logout-button">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-container">
        {/* Tabs and Stats */}
        <div className="tabs-wrapper">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'appointments' ? 'active' : ''}`}
              onClick={() => setActiveTab('appointments')}
            >
              Rendez-vous
            </button>
            <button
              className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              Demandes ({pendingRequests.length})
            </button>
            <button
              className={`tab ${activeTab === 'schedule' ? 'active' : ''}`}
              onClick={() => setActiveTab('schedule')}
            >
              Disponibilités
            </button>
            <button
              className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Mon Profil
            </button>
            <button
              className={`tab ${activeTab === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveTab('messages')}
            >
              Messages {unreadMessagesCount > 0 && `(${unreadMessagesCount})`}
            </button>
          </div>
          <div className="header-stats">
            <div className="mini-stat">
              <div className="mini-stat-content">
                <span className="stat-label">Aujourd'hui</span>
                <h4>{appointments.filter(a => {
                  const today = new Date().toISOString().split('T')[0];
                  return a.date === today && a.status === 'CONFIRMED';
                }).length}</h4>
              </div>
            </div>
            <div className="stat-divider"></div>
            <div className="mini-stat">
              <div className="mini-stat-content">
                <span className="stat-label">En attente</span>
                <h4>{pendingRequests.length}</h4>
              </div>
            </div>
            <div className="stat-divider"></div>
            <div className="mini-stat">
              <div className="mini-stat-content">
                <span className="stat-label">Ce mois</span>
                <h4>{appointments.filter(a => {
                  const now = new Date();
                  const month = now.getMonth();
                  const year = now.getFullYear();
                  const aptDate = new Date(a.date);
                  return aptDate.getMonth() === month && aptDate.getFullYear() === year;
                }).length}</h4>
              </div>
            </div>
          </div>
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
                      <div className="appointment-header">
                        <h3>Patient: {apt.userId?.firstName} {apt.userId?.lastName}</h3>
                        <span className={`status-badge status-${apt.status.toLowerCase()}`}>
                          {apt.status}
                        </span>
                      </div>
                      <div className="appointment-info">
                        <div className="info-row">
                          <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span><strong>Email:</strong> {apt.userId?.email}</span>
                        </div>
                        <div className="info-row">
                          <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span><strong>Téléphone:</strong> {apt.userId?.phone}</span>
                        </div>
                        <div className="info-row">
                          <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span><strong>Date:</strong> {formatDate(apt.date)}</span>
                        </div>
                        <div className="info-row">
                          <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span><strong>Heure:</strong> {formatTime(apt.startTime)} - {formatTime(apt.endTime)}</span>
                        </div>
                        <div className="info-row">
                          <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span><strong>Type:</strong> {apt.type}</span>
                        </div>
                        <div className="info-row">
                          <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          <span><strong>Raison:</strong> {apt.reason}</span>
                        </div>
                      </div>
                      {apt.status === 'CONFIRMED' && (
                        <div className="appointment-actions">
                          <button 
                            onClick={() => navigate(`/consultation/${apt._id}`)}
                            className="action-btn consultation-btn"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            CONSULTATION EN LIGNE
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedAppointmentForChat(apt);
                              setActiveTab('messages');
                            }}
                            className="action-btn chat-btn"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            CHAT
                          </button>
                          <button 
                            onClick={() => handleCancelAppointment(apt._id)}
                            className="action-btn cancel-btn"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            ANNULER
                          </button>
                        </div>
                      )}
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
                      <div className="appointment-header">
                        <h3>Nouveau Patient: {apt.userId?.firstName} {apt.userId?.lastName}</h3>
                      </div>
                      <div className="appointment-info">
                        <div className="info-row">
                          <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span><strong>Email:</strong> {apt.userId?.email}</span>
                        </div>
                        <div className="info-row">
                          <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span><strong>Téléphone:</strong> {apt.userId?.phone}</span>
                        </div>
                        <div className="info-row">
                          <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span><strong>Date demandée:</strong> {formatDate(apt.date)}</span>
                        </div>
                        <div className="info-row">
                          <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span><strong>Heure:</strong> {formatTime(apt.startTime)} - {formatTime(apt.endTime)}</span>
                        </div>
                        <div className="info-row">
                          <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span><strong>Type:</strong> {apt.type}</span>
                        </div>
                        <div className="info-row">
                          <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          <span><strong>Raison:</strong> {apt.reason}</span>
                        </div>
                      </div>
                      <div className="appointment-actions">
                        <button 
                          onClick={() => handleConfirmAppointment(apt._id)}
                          className="action-btn confirm-btn"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          CONFIRMER
                        </button>
                        <button 
                          onClick={() => handleCancelAppointment(apt._id)}
                          className="action-btn reject-btn"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          REFUSER
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
                  {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map(day => {
                    const availability = getDayAvailability(day);
                    const isEditing = editingDay === day;
                    
                    return (
                      <div key={day} className="day-card">
                        <h4>{day}</h4>
                        {isEditing ? (
                          <div className="edit-availability">
                            <label>
                              <input 
                                type="checkbox"
                                checked={tempAvailability.isActive}
                                onChange={(e) => setTempAvailability({...tempAvailability, isActive: e.target.checked})}
                              />
                              Disponible
                            </label>
                            {tempAvailability.isActive && (
                              <>
                                <input 
                                  type="time"
                                  value={tempAvailability.startTime}
                                  onChange={(e) => setTempAvailability({...tempAvailability, startTime: e.target.value})}
                                  className="time-input"
                                />
                                <span>à</span>
                                <input 
                                  type="time"
                                  value={tempAvailability.endTime}
                                  onChange={(e) => setTempAvailability({...tempAvailability, endTime: e.target.value})}
                                  className="time-input"
                                />
                              </>
                            )}
                            <div className="edit-actions">
                              <button onClick={handleSaveAvailability} className="save-btn">✓</button>
                              <button onClick={handleCancelEdit} className="cancel-edit-btn">✗</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="time-range">
                              {availability && availability.isActive 
                                ? `${availability.startTime} - ${availability.endTime}`
                                : 'Non disponible'
                              }
                            </p>
                            <button 
                              className="edit-btn"
                              onClick={() => handleEditAvailability(day)}
                            >
                              Modifier
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="profile-section">
              <h2>Mon Profil</h2>
              <div className="profile-details">
                {professional?.profileImage && (
                  <div className="profile-image-display">
                    <img src={professional.profileImage} alt="Photo de profil" />
                  </div>
                )}
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
                  {isEditingProfile ? (
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="profile-input"
                      placeholder="+212..."
                    />
                  ) : (
                    <p>{professional?.phone || 'Non renseigné'}</p>
                  )}
                </div>
                <div className="detail-group">
                  <label>Spécialité</label>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={profileForm.specialty}
                      onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}
                      className="profile-input"
                      placeholder="Votre spécialité"
                    />
                  ) : (
                    <p>{professional?.specialty}</p>
                  )}
                </div>
                <div className="detail-group">
                  <label>Statut du compte</label>
                  <p>
                    <span className="status-badge status-approved">
                      ✓ Approuvé
                    </span>
                  </p>
                </div>
                <div className="profile-actions">
                  {isEditingProfile ? (
                    <>
                      <button className="update-btn" onClick={handleUpdateProfile}>Enregistrer</button>
                      <button className="cancel-profile-btn" onClick={handleCancelProfileEdit}>Annuler</button>
                    </>
                  ) : (
                    <button className="update-btn" onClick={handleEditProfile}>Mettre à jour le profil</button>
                  )}
                </div>
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
