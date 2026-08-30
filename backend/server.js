require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const app = require('./app');

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

connectDB();

// ============ Socket.IO - WebRTC Signaling ============
const consultationRooms = new Map();

io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);

  // Join consultation room
  socket.on('join-room', ({ roomId, userId, userName, userRole }) => {
    socket.join(roomId);
    
    if (!consultationRooms.has(roomId)) {
      consultationRooms.set(roomId, { users: new Map() });
    }
    
    const room = consultationRooms.get(roomId);
    room.users.set(socket.id, { userId, userName, userRole, socketId: socket.id });
    
    console.log(`👤 ${userName} (${userRole}) joined room ${roomId}. Total: ${room.users.size}`);
    
    // Notify others in room
    socket.to(roomId).emit('user-joined', {
      socketId: socket.id,
      userId,
      userName,
      userRole
    });
    
    // Send existing users to the new participant
    const existingUsers = [];
    room.users.forEach((user, sid) => {
      if (sid !== socket.id) {
        existingUsers.push(user);
      }
    });
    socket.emit('existing-users', existingUsers);
  });

  // WebRTC signaling: offer
  socket.on('signal-offer', ({ to, offer }) => {
    io.to(to).emit('signal-offer', { from: socket.id, offer });
  });

  // WebRTC signaling: answer
  socket.on('signal-answer', ({ to, answer }) => {
    io.to(to).emit('signal-answer', { from: socket.id, answer });
  });

  // WebRTC signaling: ICE candidate
  socket.on('signal-ice-candidate', ({ to, candidate }) => {
    io.to(to).emit('signal-ice-candidate', { from: socket.id, candidate });
  });

  // Toggle audio/video
  socket.on('toggle-media', ({ roomId, type, enabled }) => {
    socket.to(roomId).emit('user-toggle-media', {
      socketId: socket.id,
      type,
      enabled
    });
  });

  // Screen sharing
  socket.on('screen-share-started', ({ roomId }) => {
    socket.to(roomId).emit('user-screen-share', { socketId: socket.id, sharing: true });
  });

  socket.on('screen-share-stopped', ({ roomId }) => {
    socket.to(roomId).emit('user-screen-share', { socketId: socket.id, sharing: false });
  });

  // Chat message in consultation
  socket.on('consultation-message', ({ roomId, message, userName }) => {
    io.to(roomId).emit('consultation-message', {
      socketId: socket.id,
      message,
      userName,
      timestamp: new Date()
    });
  });

  // End consultation
  socket.on('end-consultation', ({ roomId }) => {
    io.to(roomId).emit('consultation-ended', { endedBy: socket.id });
    
    if (consultationRooms.has(roomId)) {
      consultationRooms.delete(roomId);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected:', socket.id);
    
    // Remove user from all rooms
    consultationRooms.forEach((room, roomId) => {
      if (room.users.has(socket.id)) {
        const user = room.users.get(socket.id);
        room.users.delete(socket.id);
        
        socket.to(roomId).emit('user-left', {
          socketId: socket.id,
          userName: user.userName
        });
        
        // Clean up empty rooms
        if (room.users.size === 0) {
          consultationRooms.delete(roomId);
        }
      }
    });
  });
});

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO ready for consultations`);
});
