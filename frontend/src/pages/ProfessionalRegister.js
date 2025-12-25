import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import './ProfessionalRegister.css';

const ProfessionalRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    
    // Professional info
    specialty: '',
    description: '',
    profileImage: '',
    
    // Address
    street: '',
    city: '',
    postalCode: '',
    
    // Qualifications
    diploma: '',
    institution: '',
    year: '',
    certificationNumber: '',
    
    // Documents
    documents: [],
    
    // Pricing
    consultationDuration: '30',
    price: '',
    
    // Availability
    availabilities: []
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const specialties = [
    { value: '', label: 'Sélectionnez une spécialité' },
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

  const daysOfWeek = [
    { value: 'MONDAY', label: 'Lundi' },
    { value: 'TUESDAY', label: 'Mardi' },
    { value: 'WEDNESDAY', label: 'Mercredi' },
    { value: 'THURSDAY', label: 'Jeudi' },
    { value: 'FRIDAY', label: 'Vendredi' },
    { value: 'SATURDAY', label: 'Samedi' },
    { value: 'SUNDAY', label: 'Dimanche' }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('La taille de l\'image ne doit pas dépasser 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner une image valide');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          profileImage: reader.result
        });
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const getRequiredDocuments = (specialty) => {
    const documents = {
      'MEDECIN_GENERALISTE': ['Baccalauréat', 'Doctorat en Médecine', 'Diplôme d\'État de Docteur en Médecine'],
      'MEDECIN_SPECIALISTE': ['Baccalauréat', 'Doctorat en Médecine', 'DES (Diplôme d\'Études Spécialisées)'],
      'INFIRMIER': ['Baccalauréat', 'Diplôme d\'État d\'Infirmier (DEI)'],
      'KINESITHERAPEUTE': ['Baccalauréat', 'Diplôme d\'État de Masseur-Kinésithérapeute'],
      'PROFESSEUR': ['Baccalauréat', 'Licence en Éducation', 'Master ou Agrégation'],
      'COACH': ['Baccalauréat', 'Certification de Coach Professionnel'],
      'AVOCAT': ['Baccalauréat', 'Master en Droit', 'Certificat d\'Aptitude à la Profession d\'Avocat (CAPA)'],
      'PSYCHOLOGUE': ['Baccalauréat', 'Master en Psychologie'],
      'AUTRE': ['Baccalauréat', 'Diplôme Professionnel']
    };
    return documents[specialty] || [];
  };

  const handleDocumentUpload = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Seuls les fichiers PDF sont acceptés');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('La taille du fichier ne doit pas dépasser 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const newDoc = {
        name: file.name,
        type: docType,
        file: reader.result
      };

      const existingDocIndex = formData.documents.findIndex(d => d.type === docType);
      let updatedDocs;
      
      if (existingDocIndex >= 0) {
        updatedDocs = [...formData.documents];
        updatedDocs[existingDocIndex] = newDoc;
      } else {
        updatedDocs = [...formData.documents, newDoc];
      }

      setFormData({
        ...formData,
        documents: updatedDocs
      });
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const removeDocument = (docType) => {
    setFormData({
      ...formData,
      documents: formData.documents.filter(d => d.type !== docType)
    });
  };

  const toggleAvailability = (day) => {
    const exists = formData.availabilities.find(a => a.dayOfWeek === day);
    
    if (exists) {
      setFormData({
        ...formData,
        availabilities: formData.availabilities.filter(a => a.dayOfWeek !== day)
      });
    } else {
      setFormData({
        ...formData,
        availabilities: [...formData.availabilities, {
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          isActive: true
        }]
      });
    }
  };

  const updateAvailabilityTime = (day, field, value) => {
    setFormData({
      ...formData,
      availabilities: formData.availabilities.map(a =>
        a.dayOfWeek === day ? { ...a, [field]: value } : a
      )
    });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
        setError('Veuillez remplir tous les champs obligatoires');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        return;
      }
    }
    
    if (step === 2) {
      if (!formData.specialty || !formData.description) {
        setError('Veuillez remplir tous les champs obligatoires');
        return;
      }
      
      // Vérifier que tous les documents requis sont téléchargés
      const requiredDocs = getRequiredDocuments(formData.specialty);
      const uploadedDocTypes = formData.documents.map(d => d.type);
      const missingDocs = requiredDocs.filter(doc => !uploadedDocTypes.includes(doc));
      
      if (missingDocs.length > 0) {
        setError(`Veuillez télécharger tous les documents requis: ${missingDocs.join(', ')}`);
        return;
      }
    }
    
    setError('');
    setStep(step + 1);
  };

  const handlePrevious = () => {
    setStep(step - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.availabilities.length === 0) {
      setError('Veuillez sélectionner au moins une disponibilité');
      setLoading(false);
      return;
    }

    if (!formData.price) {
      setError('Veuillez indiquer votre tarif');
      setLoading(false);
      return;
    }

    try {
      const professionalData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        specialty: formData.specialty,
        description: formData.description,
        profileImage: formData.profileImage,
        address: {
          street: formData.street,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country
        },
        qualifications: [{
          diploma: formData.diploma,
          institution: formData.institution,
          year: parseInt(formData.year),
          certificationNumber: formData.certificationNumber
        }],
        documents: formData.documents,
        availabilities: formData.availabilities,
        pricing: [{
          consultationDuration: parseInt(formData.consultationDuration),
          price: parseFloat(formData.price),
          currency: 'EUR',
          type: 'STANDARD'
        }]
      };

      await authService.registerProfessional(professionalData);
      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="professional-register">
        <div className="success-container">
          <div className="success-card">
            <div className="success-icon">✓</div>
            <h1>Inscription réussie!</h1>
            <p className="success-message">
              Votre compte professionnel a été créé avec succès.
              Il est actuellement en attente d'approbation par un administrateur.
            </p>
            <p className="info-message">
              Vous recevrez un email une fois votre compte validé.
              Vous pourrez alors vous connecter à la plateforme.
            </p>
            <button onClick={() => navigate('/')} className="home-button">
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="professional-register">
      <div className="register-container">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Retour
        </button>

        <div className="register-card">
          <h1>Inscription Professionnel</h1>
          
          {/* Progress indicator */}
          <div className="progress-steps">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>
              <div className="step-number">1</div>
              <span>Informations personnelles</span>
            </div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <span>Informations professionnelles</span>
            </div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <span>Tarifs et disponibilités</span>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Information */}
            {step === 1 && (
              <div className="form-step">
                <h2>Informations personnelles</h2>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Prénom *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Nom *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Téléphone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+33 6 12 34 56 78"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Mot de passe *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength="6"
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirmer le mot de passe *</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      minLength="6"
                    />
                  </div>
                </div>

                <button type="button" onClick={handleNext} className="next-button">
                  Suivant →
                </button>
              </div>
            )}

            {/* Step 2: Professional Information */}
            {step === 2 && (
              <div className="form-step">
                <h2>Informations professionnelles</h2>

                <div className="form-group">
                  <label>Photo de profil</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="file-input"
                  />
                  {imagePreview && (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Aperçu" />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Spécialité *</label>
                  <select
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleChange}
                    required
                  >
                    {specialties.map(spec => (
                      <option key={spec.value} value={spec.value}>
                        {spec.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Décrivez votre expérience et vos compétences..."
                    required
                  />
                </div>

                <h3>Adresse</h3>
                
                <div className="form-group">
                  <label>Rue *</label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Ville *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Code postal *</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <h3>Qualifications</h3>
                
                <div className="form-group">
                  <label>Diplôme *</label>
                  <input
                    type="text"
                    name="diploma"
                    value={formData.diploma}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Institution *</label>
                    <input
                      type="text"
                      name="institution"
                      value={formData.institution}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Année *</label>
                    <input
                      type="number"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      min="1950"
                      max="2025"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Numéro de certification</label>
                  <input
                    type="text"
                    name="certificationNumber"
                    value={formData.certificationNumber}
                    onChange={handleChange}
                  />
                </div>

                <h3>Documents requis (PDF uniquement) *</h3>
                <p className="info-text">Veuillez télécharger les documents suivants pour vérification</p>
                
                {formData.specialty && getRequiredDocuments(formData.specialty).map((docType, index) => {
                  const uploadedDoc = formData.documents.find(d => d.type === docType);
                  
                  return (
                    <div key={index} className="document-upload">
                      <label>{docType}</label>
                      <div className="upload-control">
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => handleDocumentUpload(e, docType)}
                          id={`doc-${index}`}
                          style={{ display: 'none' }}
                        />
                        <label htmlFor={`doc-${index}`} className="upload-button">
                          {uploadedDoc ? '✓ Fichier téléchargé' : '📄 Choisir un fichier PDF'}
                        </label>
                        {uploadedDoc && (
                          <div className="uploaded-file">
                            <span>{uploadedDoc.name}</span>
                            <button 
                              type="button" 
                              onClick={() => removeDocument(docType)}
                              className="remove-doc-btn"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div className="button-group">
                  <button type="button" onClick={handlePrevious} className="prev-button">
                    ← Précédent
                  </button>
                  <button type="button" onClick={handleNext} className="next-button">
                    Suivant →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Pricing and Availability */}
            {step === 3 && (
              <div className="form-step">
                <h2>Tarifs et disponibilités</h2>

                <h3>Tarification</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Durée de consultation (minutes) *</label>
                    <select
                      name="consultationDuration"
                      value={formData.consultationDuration}
                      onChange={handleChange}
                      required
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">60 minutes</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tarif (€) *</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <h3>Disponibilités</h3>
                <p className="info-text">Sélectionnez vos jours de disponibilité et horaires</p>
                
                <div className="availability-section">
                  {daysOfWeek.map(day => {
                    const availability = formData.availabilities.find(a => a.dayOfWeek === day.value);
                    const isSelected = !!availability;
                    
                    return (
                      <div key={day.value} className="availability-day">
                        <label className="day-checkbox">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleAvailability(day.value)}
                          />
                          <span>{day.label}</span>
                        </label>
                        
                        {isSelected && (
                          <div className="time-inputs">
                            <input
                              type="time"
                              value={availability.startTime}
                              onChange={(e) => updateAvailabilityTime(day.value, 'startTime', e.target.value)}
                            />
                            <span>à</span>
                            <input
                              type="time"
                              value={availability.endTime}
                              onChange={(e) => updateAvailabilityTime(day.value, 'endTime', e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="button-group">
                  <button type="button" onClick={handlePrevious} className="prev-button">
                    ← Précédent
                  </button>
                  <button type="submit" className="submit-button" disabled={loading}>
                    {loading ? 'Inscription en cours...' : "S'inscrire"}
                  </button>
                </div>
              </div>
            )}
          </form>
          
          <div className="toggle-auth" style={{ marginTop: '20px', textAlign: 'center' }}>
            <p>
              Déjà inscrit ?{' '}
              <span style={{ color: '#d4af37', cursor: 'pointer', fontWeight: '500' }} onClick={() => navigate('/professional/auth')}>
                Se connecter
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalRegister;
