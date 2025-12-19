import axios from 'axios';

const API_URL = 'http://localhost:5000/api/professional';

// Get professional appointments
const getAppointments = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.get(`${API_URL}/appointments`, config);
  return response.data;
};

// Get pending appointments
const getPendingAppointments = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.get(`${API_URL}/appointments/pending`, config);
  return response.data;
};

// Confirm appointment
const confirmAppointment = async (appointmentId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.put(
    `${API_URL}/appointments/${appointmentId}/confirm`,
    {},
    config
  );
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
    `${API_URL}/appointments/${appointmentId}/cancel`,
    { reason },
    config
  );
  return response.data;
};

// Get professional profile
const getProfile = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.get(`${API_URL}/profile`, config);
  return response.data;
};

// Update professional profile
const updateProfile = async (profileData, token) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.put(`${API_URL}/profile`, profileData, config);
  return response.data;
};

const professionalService = {
  getAppointments,
  getPendingAppointments,
  confirmAppointment,
  cancelAppointment,
  getProfile,
  updateProfile
};

export default professionalService;
