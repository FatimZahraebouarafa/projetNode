import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import consultationService from '../services/consultationService';
import VideoConsultation from '../components/VideoConsultation';
import './ConsultationRoom.css';

const ConsultationRoom = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      navigate('/user/auth');
      return;
    }
    setCurrentUser(user);
    joinRoom(user);
  }, [appointmentId]);

  const joinRoom = async (user) => {
    try {
      setLoading(true);
      setError(null);

      let data;
      
      if (user.role === 'PROFESSIONAL') {
        // Professional starts consultation
        try {
          data = await consultationService.startConsultation(appointmentId);
        } catch (err) {
          // If already started, just join
          if (err.response?.status === 400) {
            data = await consultationService.joinConsultation(appointmentId);
          } else {
            throw err;
          }
        }
      } else {
        // User joins
        data = await consultationService.joinConsultation(appointmentId);
      }

      setRoomData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error joining consultation:', err);
      setError(err.response?.data?.message || 'Erreur lors de la connexion à la consultation');
      setLoading(false);
    }
  };

  const handleConsultationEnd = async (endData) => {
    try {
      if (currentUser?.role === 'PROFESSIONAL' && endData) {
        await consultationService.endConsultation(appointmentId, {
          notes: endData.notes,
          prescription: endData.prescription
        });
      }
    } catch (err) {
      console.error('Error ending consultation:', err);
    }

    // Navigate back to dashboard
    if (currentUser?.role === 'PROFESSIONAL') {
      navigate('/professional/dashboard');
    } else {
      navigate('/user/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="consultation-room-loading">
        <div className="cr-loading-spinner"></div>
        <h2>Préparation de la consultation...</h2>
        <p>Vérification des permissions et connexion à la salle...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="consultation-room-error">
        <div className="cr-error-icon">⚠️</div>
        <h2>Impossible de rejoindre la consultation</h2>
        <p>{error}</p>
        <button 
          onClick={() => navigate(-1)} 
          className="cr-back-btn"
        >
          ← Retour au tableau de bord
        </button>
      </div>
    );
  }

  if (!roomData) return null;

  return (
    <VideoConsultation
      roomId={roomData.roomId}
      currentUser={currentUser}
      appointmentInfo={roomData.appointment}
      onEnd={handleConsultationEnd}
    />
  );
};

export default ConsultationRoom;
