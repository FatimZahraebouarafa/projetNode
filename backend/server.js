require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const professionalRoutes = require('./routes/professional');
const appointmentRoutes = require('./routes/appointments');
const messageRoutes = require('./routes/messages');
const consultationRoutes = require('./routes/consultations');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: ['GET', 'POST']
  }
});

// Make io accessible to routes
app.set('io', io);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/professional', professionalRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/consultations', consultationRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Rabta API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// ============ Socket.IO - WebRTC Signaling ============
const consultationRooms = new Map(); // roomId -> { users: Map<socketId, userInfo> }

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
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO ready for consultations`);
});
