import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, adminService } from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [pendingProfessionals, setPendingProfessionals] = useState([]);
  const [allProfessionals, setAllProfessionals] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      
      const pending = await adminService.getPendingProfessionals();
      const all = await adminService.getAllProfessionals();
      const statistics = await adminService.getStats();
      
      console.log('Pending professionals:', pending);
      console.log('First professional profileImage:', pending[0]?.profileImage);
      
      setPendingProfessionals(pending);
      setAllProfessionals(all);
      setStats(statistics);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (window.confirm('Approuver ce professionnel ?')) {
      try {
        await adminService.approveProfessional(id);
        alert('Professionnel approuvé avec succès!');
        loadData();
      } catch (error) {
        alert('Erreur lors de l\'approbation: ' + error.response?.data?.message);
      }
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Raison du rejet:');
    if (reason) {
      try {
        await adminService.rejectProfessional(id, reason);
        alert('Professionnel rejeté');
        loadData();
      } catch (error) {
        alert('Erreur lors du rejet: ' + error.response?.data?.message);
      }
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      PENDING: 'status-pending',
      APPROVED: 'status-approved',
      REJECTED: 'status-rejected'
    };
    
    const statusLabels = {
      PENDING: 'En attente',
      APPROVED: 'Approuvé',
      REJECTED: 'Rejeté'
    };

    return (
      <span className={`status-badge ${statusColors[status]}`}>
        {statusLabels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
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
            <span className="user-name">Admin: {user?.firstName}</span>
            <button onClick={handleLogout} className="logout-button">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-container">
        {/* Statistics */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Utilisateurs</h3>
              <p className="stat-number">{stats.totalUsers}</p>
            </div>
            <div className="stat-card">
              <h3>Professionnels</h3>
              <p className="stat-number">{stats.totalProfessionals}</p>
            </div>
            <div className="stat-card highlight">
              <h3>En attente</h3>
              <p className="stat-number">{stats.pendingProfessionals}</p>
            </div>
            <div className="stat-card success">
              <h3>Approuvés</h3>
              <p className="stat-number">{stats.approvedProfessionals}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            En attente ({pendingProfessionals.length})
          </button>
          <button
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Tous les professionnels ({allProfessionals.length})
          </button>
        </div>

        {/* Professional List */}
        <div className="professionals-list">
          {activeTab === 'pending' && (
            <>
              {pendingProfessionals.length === 0 ? (
                <div className="no-results">
                  <p>Aucun professionnel en attente</p>
                </div>
              ) : (
                pendingProfessionals.map(prof => (
                  <div key={prof._id} className="professional-item">
                    <div className="admin-professional-image">
                      {prof.profileImage ? (
                        <img src={prof.profileImage} alt={`${prof.firstName} ${prof.lastName}`} />
                      ) : (
                        <div className="image-placeholder">
                          {prof.firstName?.charAt(0)}{prof.lastName?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="professional-info">
                      <h3>{prof.firstName} {prof.lastName}</h3>
                      <p className="email">{prof.email}</p>
                      <p className="specialty">{prof.specialty}</p>
                      <p className="description">{prof.description}</p>
                      <p className="date">Inscrit le: {formatDate(prof.createdAt)}</p>
                      
                      {prof.documents && prof.documents.length > 0 && (
                        <div className="documents-section">
                          <h4>📄 Documents fournis:</h4>
                          <div className="documents-list">
                            {prof.documents.map((doc, index) => (
                              <div key={index} className="document-item">
                                <span>{doc.type}</span>
                                <a 
                                  href={doc.file} 
                                  download={doc.name}
                                  className="download-btn"
                                >
                                  📥 Télécharger
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="professional-actions">
                      {getStatusBadge(prof.status)}
                      <button
                        onClick={() => handleApprove(prof._id)}
                        className="approve-button"
                      >
                        ✓ Approuver
                      </button>
                      <button
                        onClick={() => handleReject(prof._id)}
                        className="reject-button"
                      >
                        ✕ Rejeter
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'all' && (
            <>
              {allProfessionals.length === 0 ? (
                <div className="no-results">
                  <p>Aucun professionnel</p>
                </div>
              ) : (
                allProfessionals.map(prof => (
                  <div key={prof._id} className="professional-item">
                    <div className="admin-professional-image">
                      {prof.profileImage ? (
                        <img src={prof.profileImage} alt={`${prof.firstName} ${prof.lastName}`} />
                      ) : (
                        <div className="image-placeholder">
                          {prof.firstName?.charAt(0)}{prof.lastName?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="professional-info">
                      <h3>{prof.firstName} {prof.lastName}</h3>
                      <p className="email">{prof.email}</p>
                      <p className="specialty">{prof.specialty}</p>
                      <p className="description">{prof.description}</p>
                      <p className="date">Inscrit le: {formatDate(prof.createdAt)}</p>
                      {prof.rejectionReason && (
                        <p className="rejection-reason">
                          Raison du rejet: {prof.rejectionReason}
                        </p>
                      )}
                      
                      {prof.documents && prof.documents.length > 0 && (
                        <div className="documents-section">
                          <h4>📄 Documents fournis:</h4>
                          <div className="documents-list">
                            {prof.documents.map((doc, index) => (
                              <div key={index} className="document-item">
                                <span>{doc.type}</span>
                                <a 
                                  href={doc.file} 
                                  download={doc.name}
                                  className="download-btn"
                                >
                                  📥 Télécharger
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="professional-actions">
                      {getStatusBadge(prof.status)}
                      {prof.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(prof._id)}
                            className="approve-button"
                          >
                            ✓ Approuver
                          </button>
                          <button
                            onClick={() => handleReject(prof._id)}
                            className="reject-button"
                          >
                            ✕ Rejeter
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
