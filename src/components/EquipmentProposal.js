import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FiUpload, FiX, FiCamera, FiCheck, FiClock } from 'react-icons/fi';
import './EquipmentProposal.css';

const EquipmentProposal = ({ onClose, onSubmitSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    category: 'Football',
    type: 'Ball',
    description: '',
    brand: '',
    model: '',
    condition: 'Good',
    estimatedValue: '',
    purchaseDate: '',
    facility: '',
    room: '',
    justification: '',
    priority: 'Medium',
    tags: ''
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const categories = [
    'Football', 'Basketball', 'Tennis', 'Volleyball', 
    'Swimming', 'Gym', 'Track & Field', 'Other'
  ];

  const types = [
    'Ball', 'Net', 'Goal', 'Racket', 'Weight', 'Machine',
    'Protective Gear', 'Training Equipment', 'Accessory', 'Other'
  ];

  const conditions = ['Excellent', 'Good', 'Fair', 'Poor'];
  const priorities = ['Low', 'Medium', 'High', 'Urgent'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      alert('Vous ne pouvez télécharger que 5 images maximum');
      return;
    }

    const newImages = [...images, ...files];
    setImages(newImages);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, {
          file,
          preview: e.target.result
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom de l\'équipement est requis';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    }
    
    if (!formData.justification.trim()) {
      newErrors.justification = 'La justification est requise';
    }
    
    if (formData.estimatedValue && isNaN(formData.estimatedValue)) {
      newErrors.estimatedValue = 'Veuillez entrer un montant valide';
    }

    if (images.length === 0) {
      newErrors.images = 'Au moins une image est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      
      // Add form data
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          submitData.append(key, formData[key]);
        }
      });

      // Add images
      images.forEach(image => {
        submitData.append('images', image);
      });

      // Add tags as array
      if (formData.tags) {
        const tagsArray = formData.tags.split(',').map(tag => tag.trim());
        tagsArray.forEach(tag => {
          submitData.append('tags', tag);
        });
      }

      const token = localStorage.getItem('token');
      const response = await fetch('/api/equipment/proposals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitData
      });

      const result = await response.json();

      if (result.success) {
        alert('Proposition d\'équipement soumise avec succès! Elle sera examinée par un manager.');
        onSubmitSuccess && onSubmitSuccess(result.data);
        onClose && onClose();
      } else {
        alert('Erreur: ' + (result.message || 'Une erreur est survenue'));
      }
    } catch (error) {
      console.error('Error submitting proposal:', error);
      alert('Erreur lors de la soumission de la proposition');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="equipment-proposal-overlay">
      <div className="equipment-proposal-modal">
        <div className="modal-header">
          <h2>
            <FiUpload className="header-icon" />
            Proposer un Équipement
          </h2>
          <button className="close-button" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="proposal-form">
          <div className="form-section">
            <h3>Informations de base</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Nom de l'équipement *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={errors.name ? 'error' : ''}
                  placeholder="Ex: Ballon de football professionnel"
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Catégorie *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="type">Type *</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                >
                  {types.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={errors.description ? 'error' : ''}
                placeholder="Décrivez l'équipement en détail..."
                rows="3"
              />
              {errors.description && <span className="error-text">{errors.description}</span>}
            </div>
          </div>

          <div className="form-section">
            <h3>Détails techniques</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="brand">Marque</label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  placeholder="Ex: Nike, Adidas, Wilson..."
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="model">Modèle</label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  placeholder="Ex: Mercurial, Professional..."
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="condition">État *</label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                >
                  {conditions.map(condition => (
                    <option key={condition} value={condition}>
                      {condition === 'Excellent' ? 'Excellent' :
                       condition === 'Good' ? 'Bon' :
                       condition === 'Fair' ? 'Correct' : 'Mauvais'}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="estimatedValue">Valeur estimée (€)</label>
                <input
                  type="number"
                  id="estimatedValue"
                  name="estimatedValue"
                  value={formData.estimatedValue}
                  onChange={handleInputChange}
                  className={errors.estimatedValue ? 'error' : ''}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
                {errors.estimatedValue && <span className="error-text">{errors.estimatedValue}</span>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Images de l'équipement *</h3>
            
            <div className="image-upload-section">
              <div className="upload-area">
                <input
                  type="file"
                  id="images"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="images" className="upload-button">
                  <FiCamera />
                  Ajouter des images
                  <span className="upload-hint">Maximum 5 images</span>
                </label>
              </div>
              
              {errors.images && <span className="error-text">{errors.images}</span>}
              
              {imagePreviews.length > 0 && (
                <div className="image-previews">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="image-preview">
                      <img src={preview.preview} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-image"
                        onClick={() => removeImage(index)}
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3>Localisation et Priorité</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="facility">Installation</label>
                <input
                  type="text"
                  id="facility"
                  name="facility"
                  value={formData.facility}
                  onChange={handleInputChange}
                  placeholder="Ex: Gymnase principal, Terrain extérieur..."
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="room">Salle/Zone</label>
                <input
                  type="text"
                  id="room"
                  name="room"
                  value={formData.room}
                  onChange={handleInputChange}
                  placeholder="Ex: Vestiaire A, Local matériel..."
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priorité</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
              >
                {priorities.map(priority => (
                  <option key={priority} value={priority}>
                    {priority === 'Low' ? 'Faible' :
                     priority === 'Medium' ? 'Moyenne' :
                     priority === 'High' ? 'Élevée' : 'Urgente'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-section">
            <h3>Justification</h3>
            
            <div className="form-group">
              <label htmlFor="justification">Pourquoi cet équipement est-il nécessaire ? *</label>
              <textarea
                id="justification"
                name="justification"
                value={formData.justification}
                onChange={handleInputChange}
                className={errors.justification ? 'error' : ''}
                placeholder="Expliquez pourquoi votre équipe/club a besoin de cet équipement..."
                rows="4"
              />
              {errors.justification && <span className="error-text">{errors.justification}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags (optionnel)</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="Ex: entraînement, compétition, jeunes (séparés par des virgules)"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </button>
            
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <FiClock className="spin" />
                  Soumission...
                </>
              ) : (
                <>
                  <FiCheck />
                  Soumettre la proposition
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EquipmentProposal;