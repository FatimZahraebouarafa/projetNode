import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, userService } from '../services/api';
import appointmentService from '../services/appointmentService';
import messageService from '../services/messageService';
import Chat from '../components/Chat';
import './UserDashboard.css';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [professionals, setProfessionals] = useState([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('professionals');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [selectedAppointmentForChat, setSelectedAppointmentForChat] = useState(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [appointmentForm, setAppointmentForm] = useState({
    date: '',
    startTime: '',
    endTime: '',
    type: 'CONSULTATION',
    reason: ''
  });

  const specialties = [
    { value: '', label: 'Toutes les spécialités' },
    { value: 'MEDECIN_GENERALISTE', label: 'Médecin Généraliste' },
    { value: 'MEDECIN_SPECIALISTE', label: 'Médecin Spécialiste' },
    { value: 'INFIRMIER', label: 'Infirmier' },
    { value: 'KINESITHERAPEUTE', label: 'Kinésithérapeute' },
    { value: 'PROFESSEUR', label: 'Professeur' },
    { value: 'COACH', label: 'Coach' },
    { value: 'AVOCAT', label: 'Avocat' },
    { value: 'PSYCHOLOGUE', label: 'Psychologue' },
    { value: 'AUTRE', label: 'Autre' }
  ];

  useEffect(() => {
    loadData();
    loadUnreadCount();
    // Rafraîchir le compteur toutes les 10 secondes
    const interval = setInterval(loadUnreadCount, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterProfessionals();
  }, [searchTerm, selectedSpecialty, professionals]);

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
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      
      const token = localStorage.getItem('token');
      const [professionalsList, userAppointments] = await Promise.all([
        userService.getProfessionals(),
        appointmentService.getUserAppointments(token)
      ]);
      
      setProfessionals(professionalsList);
      setFilteredProfessionals(professionalsList);
      setAppointments(userAppointments);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const filterProfessionals = () => {
    let filtered = professionals;

    if (selectedSpecialty) {
      filtered = filtered.filter(prof => prof.specialty === selectedSpecialty);
    }

    if (searchTerm) {
      filtered = filtered.filter(prof =>
        `${prof.firstName} ${prof.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prof.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProfessionals(filtered);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  const handleAppointmentRequest = (professional) => {
    setSelectedProfessional(professional);
    setShowAppointmentModal(true);
  };

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const appointmentData = {
        professionalId: selectedProfessional._id,
        ...appointmentForm
      };

      await appointmentService.createAppointment(appointmentData, token);
      
      alert('Demande de rendez-vous envoyée avec succès!');
      setShowAppointmentModal(false);
      setAppointmentForm({
        date: '',
        startTime: '',
        endTime: '',
        type: 'CONSULTATION',
        reason: ''
      });
      loadData(); // Recharger les données pour afficher le nouveau rendez-vous
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert(error.response?.data?.message || 'Erreur lors de la demande de rendez-vous');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  const getStatusLabel = (status) => {
    const labels = {
      REQUESTED: 'En attente',
      PENDING_CONFIRMATION: 'En attente de confirmation',
      CONFIRMED: 'Confirmé',
      CANCELLED: 'Annulé',
      COMPLETED: 'Terminé',
      NO_SHOW: 'Absent',
      RESCHEDULED: 'Reprogrammé'
    };
    return labels[status] || status;
  };

  const getStatusClass = (status) => {
    const classes = {
      REQUESTED: 'status-pending',
      PENDING_CONFIRMATION: 'status-pending',
      CONFIRMED: 'status-confirmed',
      CANCELLED: 'status-cancelled',
      COMPLETED: 'status-completed',
      NO_SHOW: 'status-cancelled',
      RESCHEDULED: 'status-pending'
    };
    return classes[status] || 'status-pending';
  };

  const handleCancelAppointment = async (appointmentId) => {
    const reason = prompt('Raison de l\'annulation:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('token');
      await appointmentService.cancelAppointment(appointmentId, reason, token);
      alert('Rendez-vous annulé avec succès');
      loadData();
    } catch (error) {
      console.error('Error canceling appointment:', error);
      alert('Erreur lors de l\'annulation');
    }
  };

  const formatSpecialty = (specialty) => {
    const found = specialties.find(s => s.value === specialty);
    return found ? found.label : specialty;
  };

  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  const formatFullName = (firstName, lastName) => {
    return `${capitalizeFirstLetter(firstName)} ${capitalizeFirstLetter(lastName)}`;
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
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
            <span className="user-name">Bienvenue, {user?.firstName}!</span>
            <button onClick={handleLogout} className="logout-button">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-container">
        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'professionals' ? 'active' : ''}`}
            onClick={() => setActiveTab('professionals')}
          >
            🔍 Trouver un professionnel
          </button>
          <button
            className={`tab ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            📅 Mes rendez-vous ({appointments.length})
          </button>
          <button
            className={`tab ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            💬 Messages {unreadMessagesCount > 0 && `(${unreadMessagesCount})`}
          </button>
        </div>

        {/* Tab: Professionals */}
        {activeTab === 'professionals' && (
          <>
            <div className="search-section">
              <h2>Trouver un professionnel</h2>
              
              <div className="search-filters">
                <input
                  type="text"
                  placeholder="Rechercher par nom ou description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="specialty-select"
                >
                  {specialties.map(spec => (
                    <option key={spec.value} value={spec.value}>
                      {spec.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="professionals-section">
              {filteredProfessionals.length === 0 ? (
                <div className="no-results">
                  <p>Aucun professionnel trouvé</p>
                </div>
              ) : (
                <div className="professionals-grid">
                  {filteredProfessionals.map(prof => (
                    <div key={prof._id} className="professional-card">
                      {prof.profileImage && (
                        <div className="professional-image">
                          <img src={prof.profileImage} alt={`${prof.firstName} ${prof.lastName}`} />
                        </div>
                      )}
                      
                      <div className="card-header">
                        <h3>{prof.firstName} {prof.lastName}</h3>
                        <span className="specialty-badge">
                          {formatSpecialty(prof.specialty)}
                        </span>
                      </div>
                      
                      <p className="description">{prof.description}</p>
                      
                      <div className="card-info">
                        <div className="info-item">
                          <strong>Adresse:</strong>
                          <span>{prof.address.city}, {prof.address.postalCode}</span>
                        </div>
                        
                        {prof.rating && (
                          <div className="info-item">
                            <strong>Note:</strong>
                            <span>⭐ {prof.rating.toFixed(1)} ({prof.reviewCount} avis)</span>
                          </div>
                        )}
                        
                        {prof.pricing && prof.pricing.length > 0 && (
                          <div className="info-item">
                            <strong>Tarif:</strong>
                            <span>{prof.pricing[0].price}€</span>
                          </div>
                        )}
                      </div>
                      
                      <button 
                        className="contact-button"
                        onClick={() => handleAppointmentRequest(prof)}
                      >
                        Prendre rendez-vous
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Tab: Appointments */}
        {activeTab === 'appointments' && (
          <div className="appointments-section">
            <h2>Mes rendez-vous</h2>
            
            {appointments.length === 0 ? (
              <div className="no-results">
                <p>Vous n'avez aucun rendez-vous pour le moment</p>
              </div>
            ) : (
              <div className="appointments-list">
                {appointments.map(apt => (
                  <div key={apt._id} className="appointment-card">
                    <div className="appointment-header">
                      <div className="appointment-title-section">
                        <h3>Dr. {formatFullName(apt.professionalId?.firstName, apt.professionalId?.lastName)}</h3>
                        {apt.professionalId?.specialty && (
                          <span className="specialty-subtitle">
                            {formatSpecialty(apt.professionalId.specialty)}
                          </span>
                        )}
                      </div>
                      <span className={`status-badge ${getStatusClass(apt.status)}`}>
                        {getStatusLabel(apt.status)}
                      </span>
                    </div>
                    
                    <div className="appointment-details">
                      <div className="detail-row">
                        <div className="detail-box">
                          <div className="detail-icon">📅</div>
                          <div className="detail-content">
                            <span className="detail-label">Date</span>
                            <span className="detail-value">{formatDate(apt.date)}</span>
                          </div>
                        </div>
                        <div className="detail-box">
                          <div className="detail-icon">⏰</div>
                          <div className="detail-content">
                            <span className="detail-label">Heure</span>
                            <span className="detail-value">{formatTime(apt.startTime)} - {formatTime(apt.endTime)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="detail-row">
                        <div className="detail-box">
                          <div className="detail-icon">📋</div>
                          <div className="detail-content">
                            <span className="detail-label">Type</span>
                            <span className="detail-value">{apt.type}</span>
                          </div>
                        </div>
                        {apt.professionalId?.phone && (
                          <div className="detail-box">
                            <div className="detail-icon">📞</div>
                            <div className="detail-content">
                              <span className="detail-label">Téléphone</span>
                              <span className="detail-value">{apt.professionalId.phone}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {apt.reason && (
                        <div className="reason-section">
                          <div className="detail-icon">💬</div>
                          <div className="detail-content">
                            <span className="detail-label">Raison de consultation</span>
                            <span className="detail-value">{apt.reason}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {(apt.status === 'REQUESTED' || apt.status === 'PENDING_CONFIRMATION' || apt.status === 'CONFIRMED') && (
                      <div className="appointment-actions">
                        {apt.status === 'CONFIRMED' && (
                          <>
                            <button 
                              onClick={() => navigate(`/consultation/${apt._id}`)}
                              className="consultation-button"
                            >
                              🎥 Rejoindre la consultation
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedAppointmentForChat(apt);
                                setActiveTab('messages');
                              }}
                              className="chat-button"
                            >
                              💬 Envoyer un message
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => handleCancelAppointment(apt._id)}
                          className="cancel-appointment-btn"
                        >
                          Annuler le rendez-vous
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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
                  currentUser={user}
                />
              </div>
            ) : (
              <div className="conversations-list">
                {appointments
                  .filter(apt => apt.status === 'CONFIRMED')
                  .length === 0 ? (
                  <div className="no-results">
                    <p>Aucune conversation disponible. Vous devez avoir un rendez-vous confirmé pour envoyer des messages.</p>
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
                            <h3>Dr. {formatFullName(apt.professionalId?.firstName, apt.professionalId?.lastName)}</h3>
                            <span className="conversation-specialty">
                              {formatSpecialty(apt.professionalId?.specialty)}
                            </span>
                          </div>
                          <div className="conversation-info">
                            <p>📅 {formatDate(apt.date)} à {apt.startTime}</p>
                            <p>📋 {apt.type}</p>
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

      {/* Appointment Modal */}
      {showAppointmentModal && (
        <div className="modal-overlay" onClick={() => setShowAppointmentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Demande de rendez-vous</h2>
            <p className="modal-professional">
              avec {selectedProfessional?.firstName} {selectedProfessional?.lastName}
            </p>

            <form onSubmit={handleAppointmentSubmit}>
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={appointmentForm.date}
                  onChange={(e) => setAppointmentForm({...appointmentForm, date: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Heure de début *</label>
                  <input
                    type="time"
                    required
                    value={appointmentForm.startTime}
                    onChange={(e) => setAppointmentForm({...appointmentForm, startTime: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Heure de fin *</label>
                  <input
                    type="time"
                    required
                    value={appointmentForm.endTime}
                    onChange={(e) => setAppointmentForm({...appointmentForm, endTime: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Type *</label>
                <select
                  required
                  value={appointmentForm.type}
                  onChange={(e) => setAppointmentForm({...appointmentForm, type: e.target.value})}
                >
                  <option value="CONSULTATION">Consultation</option>
                  <option value="FOLLOW_UP">Suivi</option>
                  <option value="URGENT">Urgence</option>
                </select>
              </div>

              <div className="form-group">
                <label>Raison de la consultation *</label>
                <textarea
                  required
                  rows="4"
                  placeholder="Décrivez brièvement la raison de votre consultation..."
                  value={appointmentForm.reason}
                  onChange={(e) => setAppointmentForm({...appointmentForm, reason: e.target.value})}
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowAppointmentModal(false)}
                  className="cancel-button"
                >
                  Annuler
                </button>
                <button type="submit" className="submit-button">
                  Envoyer la demande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
