const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const professionalSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    match: [/\+?[0-9\s\-\(\)]{10,20}/, 'Please enter a valid phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ['PROFESSIONAL'],
    default: 'PROFESSIONAL'
  },
  profileImage: {
    type: String,
    default: null
  },
  specialty: {
    type: String,
    required: [true, 'Specialty is required'],
    enum: [
      'MEDECIN_GENERALISTE',
      'MEDECIN_SPECIALISTE',
      'INFIRMIER',
      'KINESITHERAPEUTE',
      'PROFESSEUR',
      'COACH',
      'AVOCAT',
      'PSYCHOLOGUE',
      'AUTRE'
    ]
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true }
  },
  qualifications: [{
    diploma: { type: String, required: true },
    institution: { type: String, required: true },
    year: { type: Number, required: true },
    certificationNumber: String
  }],
  documents: [{
    name: { type: String, required: true },
    type: { type: String, required: true },
    file: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  }],
  availabilities: [{
    dayOfWeek: {
      type: String,
      enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      required: true
    },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  }],
  pricing: [{
    consultationDuration: { type: Number, required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: 'EUR' },
    type: {
      type: String,
      enum: ['STANDARD', 'URGENT', 'CONTROLE'],
      default: 'STANDARD'
    }
  }],
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isValidated: {
    type: Boolean,
    default: false
  },
  validationDate: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  rating: {
    type: Number,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  companyName: String,
  siret: String,
  website: String
}, {
  timestamps: true
});

// Hash password before saving
professionalSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
professionalSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Professional', professionalSchema);
