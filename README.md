# Rabta - Professional Appointment Platform

A full-stack web application for managing appointments between users and professionals.

## Features

- **User Portal**: Browse professionals and book appointments
- **Professional Portal**: Register, manage availability and appointments
- **Admin Portal**: Approve/reject professional registrations
- **JWT Authentication**: Secure authentication with role-based access
- **Real-time Updates**: Modern React frontend with hooks

## Tech Stack

### Frontend
- React 18
- React Router DOM
- Axios
- CSS Modules

### Backend
- Node.js
- Express
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing

## Project Structure

```
rabta/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── server.js
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── App.js
└── docker-compose.yml
```

## 🚀 Quick Start with Docker

### Prerequisites
- Docker Desktop installed ([Download here](https://www.docker.com/products/docker-desktop/))

### Installation
1. Clone this repository:
```bash
git clone <your-repo-url>
cd projetNode
```

2. Start the application:
```bash
docker-compose up -d --build
```

3. Access the application:
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5000/api/health
- **MongoDB**: localhost:27017

### Docker Commands
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart
```

## 📖 Detailed Documentation
See [README-DOCKER.md](README-DOCKER.md) for complete Docker documentation.

## Getting Started (Without Docker)

### Prerequisites
- Node.js (v16+)
- MongoDB
- Docker (optional)

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

### Environment Variables

Create `.env` file in backend directory:
```
MONGODB_URI=mongodb://localhost:27017/rabta
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

### Running the Application

#### Without Docker
1. Start MongoDB
2. Start backend:
   ```bash
   cd backend
   npm start
   ```
3. Start frontend:
   ```bash
   cd frontend
   npm start
   ```

#### With Docker
```bash
docker-compose up
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - User login
- POST `/api/auth/professional/register` - Register professional

### Admin
- GET `/api/admin/professionals/pending` - Get pending professionals
- PUT `/api/admin/professionals/:id/approve` - Approve professional
- PUT `/api/admin/professionals/:id/reject` - Reject professional

### User
- GET `/api/user/professionals` - Get all approved professionals

## Roles
- **USER**: Regular user (can book appointments)
- **PROFESSIONAL**: Service provider (pending approval required)
- **ADMIN**: System administrator

## License
MIT
