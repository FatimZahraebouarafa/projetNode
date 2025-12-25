import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import professionalService from '../services/professionalService';
import messageService from '../services/messageService';
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

      const currentUser = authService.getCurrentUser();
      setProfessional(currentUser);
      setProfileForm({
        phone: currentUser?.phone || '',
        specialty: currentUser?.specialty || ''
      });
      
      // Fetch appointments, pending requests, and profile
      const [appointmentsList, pendingList, profileData] = await Promise.all([
        professionalService.getAppointments(token),
        professionalService.getPendingAppointments(token),
        professionalService.getProfile(token)
      ]);
      
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
