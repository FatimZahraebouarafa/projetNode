import axios from 'axios';

const API_URL = 'http://localhost:5000/api/appointments';

// Create appointment request
const createAppointment = async (appointmentData, token) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.post(API_URL, appointmentData, config);
  return response.data;
};

// Get user appointments
const getUserAppointments = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.get(API_URL, config);
  return response.data;
};

// Cancel appointment
const cancelAppointment = async (appointmentId, reason, token) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.put(
    `${API_URL}/${appointmentId}/cancel`,
    { reason },
    config
  );
  return response.data;
};

const appointmentService = {
  createAppointment,
  getUserAppointments,
  cancelAppointment
};

export default appointmentService;
