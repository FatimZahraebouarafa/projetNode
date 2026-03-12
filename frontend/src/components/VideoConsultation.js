import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import './VideoConsultation.css';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || window.location.origin;

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

const VideoConsultation = ({ roomId, currentUser, appointmentInfo, onEnd }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteUser, setRemoteUser] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connexion en cours...');
  const [callDuration, setCallDuration] = useState(0);
  const [isCallActive, setIsCallActive] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [consultationNotes, setConsultationNotes] = useState('');
  const [prescription, setPrescription] = useState('');
  const [remoteAudioEnabled, setRemoteAudioEnabled] = useState(true);
  const [remoteVideoEnabled, setRemoteVideoEnabled] = useState(true);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const screenStreamRef = useRef(null);
  const timerRef = useRef(null);
  const chatContainerRef = useRef(null);

  const userName = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim();
  const isProfessional = currentUser?.role === 'PROFESSIONAL';

  // Initialize socket
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      setConnectionStatus('Connecté - En attente de l\'autre participant...');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      setConnectionStatus('Déconnecté');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Setup media and join room
  useEffect(() => {
    if (!socket || !isConnected || !roomId) return;

    const setupMediaAndJoin = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'user' },
          audio: { echoCancellation: true, noiseSuppression: true }
        });
        
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Join room
        socket.emit('join-room', {
          roomId,
          userId: currentUser?._id,
          userName,
          userRole: currentUser?.role
        });
      } catch (error) {
        console.error('Error accessing media devices:', error);
        setConnectionStatus('Erreur: Impossible d\'accéder à la caméra/micro. Vérifiez les permissions.');
      }
    };

    setupMediaAndJoin();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [socket, isConnected, roomId]);

  // Create peer connection
  const createPeerConnection = useCallback((remoteSocketId, isInitiator) => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('Remote track received');
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      setIsCallActive(true);
      setConnectionStatus('En consultation');
      startTimer();
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('signal-ice-candidate', {
          to: remoteSocketId,
          candidate: event.candidate
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setConnectionStatus('Connexion perdue...');
        setIsCallActive(false);
      }
    };

    // If initiator, create offer
    if (isInitiator) {
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => {
          socket.emit('signal-offer', {
            to: remoteSocketId,
            offer: pc.localDescription
          });
        })
        .catch(err => console.error('Error creating offer:', err));
    }

    return pc;
  }, [socket]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    // When another user joins
    socket.on('user-joined', ({ socketId, userName: remoteName, userRole }) => {
      console.log(`${remoteName} joined`);
      setRemoteUser({ socketId, userName: remoteName, userRole });
      setConnectionStatus(`${remoteName} a rejoint - Connexion vidéo...`);
      
      // Create offer (initiator)
      createPeerConnection(socketId, true);
    });

    // Existing users in room
    socket.on('existing-users', (users) => {
      if (users.length > 0) {
        const other = users[0];
        setRemoteUser(other);
        setConnectionStatus(`${other.userName} est déjà dans la salle - Connexion vidéo...`);
        createPeerConnection(other.socketId, true);
      }
    });

    // Receive offer
    socket.on('signal-offer', async ({ from, offer }) => {
      const pc = createPeerConnection(from, false);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('signal-answer', { to: from, answer: pc.localDescription });
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    });

    // Receive answer
    socket.on('signal-answer', async ({ from, answer }) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('Error handling answer:', err);
        }
      }
    });

    // Receive ICE candidate
    socket.on('signal-ice-candidate', async ({ from, candidate }) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    });

    // Remote user toggled media
    socket.on('user-toggle-media', ({ type, enabled }) => {
      if (type === 'audio') setRemoteAudioEnabled(enabled);
      if (type === 'video') setRemoteVideoEnabled(enabled);
    });

    // Chat messages
    socket.on('consultation-message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
      if (chatContainerRef.current) {
        setTimeout(() => {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }, 100);
      }
    });

    // User left
    socket.on('user-left', ({ userName: leftUser }) => {
      setConnectionStatus(`${leftUser} a quitté la consultation`);
      setRemoteUser(null);
      setIsCallActive(false);
      stopTimer();
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    });

    // Consultation ended
    socket.on('consultation-ended', () => {
      setConnectionStatus('Consultation terminée');
      setIsCallActive(false);
      stopTimer();
      cleanup();
      if (onEnd) {
        setTimeout(() => onEnd(), 2000);
      }
    });

    return () => {
      socket.off('user-joined');
      socket.off('existing-users');
      socket.off('signal-offer');
      socket.off('signal-answer');
      socket.off('signal-ice-candidate');
      socket.off('user-toggle-media');
      socket.off('consultation-message');
      socket.off('user-left');
      socket.off('consultation-ended');
    };
  }, [socket, createPeerConnection, onEnd]);

  // Timer
  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopTimer();
  }, []);

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Media controls
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        socket?.emit('toggle-media', { roomId, type: 'audio', enabled: audioTrack.enabled });
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        socket?.emit('toggle-media', { roomId, type: 'video', enabled: videoTrack.enabled });
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Replace with camera
      if (peerConnectionRef.current && localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
      }
      
      setIsScreenSharing(false);
      socket?.emit('screen-share-stopped', { roomId });
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        
        const screenTrack = screenStream.getVideoTracks()[0];
        
        // Replace camera track with screen track
        if (peerConnectionRef.current) {
          const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        }
        
        // When user stops sharing via browser UI
        screenTrack.onended = () => {
          toggleScreenShare();
        };
        
        setIsScreenSharing(true);
        socket?.emit('screen-share-started', { roomId });
      } catch (err) {
        console.error('Error sharing screen:', err);
      }
    }
  };

  // Chat
  const sendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket) return;

    socket.emit('consultation-message', {
      roomId,
      message: chatInput.trim(),
      userName
    });
    setChatInput('');
  };

  // End consultation
  const handleEndConsultation = () => {
    if (isProfessional) {
      setShowEndModal(true);
    } else {
      // User just leaves
      cleanup();
      if (onEnd) onEnd();
    }
  };

  const confirmEndConsultation = () => {
    socket?.emit('end-consultation', { roomId });
    setShowEndModal(false);
    cleanup();
    if (onEnd) onEnd({ notes: consultationNotes, prescription });
  };

  const cleanup = () => {
    stopTimer();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
  };

  return (
    <div className="video-consultation">
      {/* Header */}
      <div className="vc-header">
        <div className="vc-header-info">
          <h3>🩺 Consultation en ligne</h3>
          <span className={`vc-status ${isCallActive ? 'active' : ''}`}>
            {connectionStatus}
          </span>
        </div>
        <div className="vc-header-right">
          {isCallActive && (
            <span className="vc-timer">
              🔴 {formatDuration(callDuration)}
            </span>
          )}
          {appointmentInfo && (
            <span className="vc-appointment-info">
              {appointmentInfo.reason}
            </span>
          )}
        </div>
      </div>

      {/* Video area */}
      <div className="vc-video-area">
        {/* Remote video (large) */}
        <div className="vc-remote-video-container">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="vc-remote-video"
          />
          {!isCallActive && (
            <div className="vc-waiting-overlay">
              <div className="vc-waiting-spinner"></div>
              <p>En attente de l'autre participant...</p>
            </div>
          )}
          {remoteUser && !remoteVideoEnabled && (
            <div className="vc-video-off-overlay">
              <div className="vc-avatar-placeholder">
                {remoteUser.userName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <p>Caméra désactivée</p>
            </div>
          )}
          {remoteUser && (
            <div className="vc-remote-name">
              {remoteUser.userName}
              {!remoteAudioEnabled && ' 🔇'}
            </div>
          )}
        </div>

        {/* Local video (small, picture-in-picture) */}
        <div className="vc-local-video-container">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="vc-local-video"
          />
          {!isVideoEnabled && (
            <div className="vc-local-video-off">
              <span>{userName?.charAt(0)?.toUpperCase() || '?'}</span>
            </div>
          )}
          <span className="vc-local-name">Vous</span>
        </div>

        {/* Chat panel */}
        {showChat && (
          <div className="vc-chat-panel">
            <div className="vc-chat-header">
              <h4>💬 Chat de consultation</h4>
              <button onClick={() => setShowChat(false)} className="vc-chat-close">✕</button>
            </div>
            <div className="vc-chat-messages" ref={chatContainerRef}>
              {chatMessages.length === 0 && (
                <div className="vc-chat-empty">Aucun message pour le moment</div>
              )}
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`vc-chat-msg ${msg.socketId === socket?.id ? 'own' : 'other'}`}
                >
                  <span className="vc-chat-msg-name">{msg.userName}</span>
                  <p>{msg.message}</p>
                  <span className="vc-chat-msg-time">
                    {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
            <form onSubmit={sendChatMessage} className="vc-chat-input-area">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Tapez un message..."
                className="vc-chat-input"
              />
              <button type="submit" className="vc-chat-send">➤</button>
            </form>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="vc-controls">
        <button
          onClick={toggleAudio}
          className={`vc-control-btn ${!isAudioEnabled ? 'off' : ''}`}
          title={isAudioEnabled ? 'Couper le micro' : 'Activer le micro'}
        >
          {isAudioEnabled ? '🎤' : '🔇'}
          <span>{isAudioEnabled ? 'Micro' : 'Muet'}</span>
        </button>

        <button
          onClick={toggleVideo}
          className={`vc-control-btn ${!isVideoEnabled ? 'off' : ''}`}
          title={isVideoEnabled ? 'Couper la caméra' : 'Activer la caméra'}
        >
          {isVideoEnabled ? '📹' : '📷'}
          <span>{isVideoEnabled ? 'Caméra' : 'Caméra off'}</span>
        </button>

        <button
          onClick={toggleScreenShare}
          className={`vc-control-btn ${isScreenSharing ? 'active' : ''}`}
          title={isScreenSharing ? 'Arrêter le partage' : 'Partager l\'écran'}
        >
          🖥️
          <span>{isScreenSharing ? 'Arrêter' : 'Partager'}</span>
        </button>

        <button
          onClick={() => setShowChat(!showChat)}
          className={`vc-control-btn ${showChat ? 'active' : ''}`}
          title="Chat"
        >
          💬
          <span>Chat</span>
        </button>

        <button
          onClick={handleEndConsultation}
          className="vc-control-btn end-call"
          title="Terminer la consultation"
        >
          📞
          <span>Terminer</span>
        </button>
      </div>

      {/* End consultation modal (Professional) */}
      {showEndModal && (
        <div className="vc-modal-overlay">
          <div className="vc-modal">
            <h3>📋 Terminer la consultation</h3>
            <p>Durée: {formatDuration(callDuration)}</p>
            
            <div className="vc-modal-field">
              <label>Notes de consultation :</label>
              <textarea
                value={consultationNotes}
                onChange={(e) => setConsultationNotes(e.target.value)}
                placeholder="Notes sur la consultation, diagnostic, recommandations..."
                rows={4}
              />
            </div>

            <div className="vc-modal-field">
              <label>Prescription (optionnel) :</label>
              <textarea
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                placeholder="Médicaments, posologie, instructions..."
                rows={3}
              />
            </div>

            <div className="vc-modal-actions">
              <button onClick={() => setShowEndModal(false)} className="vc-modal-cancel">
                Annuler
              </button>
              <button onClick={confirmEndConsultation} className="vc-modal-confirm">
                Terminer la consultation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoConsultation;
