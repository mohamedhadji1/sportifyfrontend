import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaTimes,
  FaBox,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaSearch,
  FaPlus
} from 'react-icons/fa';
import { useAuth } from '../../../hooks/useAuth';
import axios from 'axios';
import toast from 'react-hot-toast';

const CreateDisposalRequestModal = ({ onClose, onRequestCreated }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [equipment, setEquipment] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    equipmentId: '',
    equipmentName: '',
    quantity: 1,
    requestType: 'Temporary',
    priority: 'Normal',
    purpose: '',
    requestedStartDate: '',
    requestedEndDate: '',
    description: '',
    teamId: '',
    teamName: ''
  });

  const [errors, setErrors] = useState({});

  // Charger la liste des équipements disponibles
  useEffect(() => {
    const loadEquipment = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/service-equipement/api/equipment/available`, {
          headers: {
            'x-auth-token': localStorage.getItem('token')
          }
        });

        if (response.data.success) {
          setEquipment(response.data.data);
        }
      } catch (error) {
        console.error('Error loading equipment:', error);
        toast.error('Erreur lors du chargement des équipements');
      }
    };

    loadEquipment();
  }, []);

  // Filtrer les équipements selon la recherche
  const filteredEquipment = equipment.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur pour ce champ
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleEquipmentSelect = (selectedEquipment) => {
    setFormData(prev => ({
      ...prev,
      equipmentId: selectedEquipment._id,
      equipmentName: selectedEquipment.name
    }));
    setSearchTerm(selectedEquipment.name);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.equipmentId) {
      newErrors.equipmentId = 'Veuillez sélectionner un équipement';
    }
    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Le but de la demande est requis';
    }
    if (!formData.requestedStartDate) {
      newErrors.requestedStartDate = 'La date de début est requise';
    }
    if (formData.requestType !== 'Permanent' && !formData.requestedEndDate) {
      newErrors.requestedEndDate = 'La date de fin est requise pour ce type de demande';
    }
    if (formData.requestedEndDate && formData.requestedStartDate && 
        new Date(formData.requestedEndDate) <= new Date(formData.requestedStartDate)) {
      newErrors.requestedEndDate = 'La date de fin doit être après la date de début';
    }
    if (formData.quantity < 1) {
      newErrors.quantity = 'La quantité doit être d\'au moins 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const requestData = {
        ...formData,
        quantity: parseInt(formData.quantity),
        // Si l'utilisateur est dans une équipe, inclure les infos
        ...(user.teamId && {
          teamId: user.teamId,
          teamName: user.teamName
        })
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/service-equipement/api/equipment/disposal/request`,
        requestData,
        {
          headers: {
            'x-auth-token': localStorage.getItem('token'),
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        onRequestCreated();
      }
    } catch (error) {
      console.error('Error creating disposal request:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la création de la demande';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-purple-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FaPlus />
              Nouvelle Demande de Disposition
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <FaTimes size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sélection d'équipement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaBox className="inline mr-1" />
                Équipement *
              </label>
              <div className="relative">
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.equipmentId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Rechercher un équipement..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FaSearch className="absolute right-3 top-3 text-gray-400" />
                
                {searchTerm && !formData.equipmentId && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                    {filteredEquipment.length > 0 ? (
                      filteredEquipment.map((item) => (
                        <div
                          key={item._id}
                          onClick={() => handleEquipmentSelect(item)}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-600">
                            {item.category} - {item.type} | État: {item.condition}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500">
                        Aucun équipement trouvé
                      </div>
                    )}
                  </div>
                )}
              </div>
              {errors.equipmentId && (
                <p className="text-red-500 text-sm mt-1">{errors.equipmentId}</p>
              )}
            </div>

            {/* Détails de la demande */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantité *
                </label>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.quantity ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.quantity && (
                  <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de demande *
                </label>
                <select
                  name="requestType"
                  value={formData.requestType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Temporary">Temporaire</option>
                  <option value="Permanent">Permanent</option>
                  <option value="Event">Événement</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priorité
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Low">Basse</option>
                  <option value="Normal">Normale</option>
                  <option value="High">Haute</option>
                  <option value="Urgent">Urgente</option>
                </select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaCalendarAlt className="inline mr-1" />
                  Date de début *
                </label>
                <input
                  type="date"
                  name="requestedStartDate"
                  value={formData.requestedStartDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.requestedStartDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.requestedStartDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.requestedStartDate}</p>
                )}
              </div>

              {formData.requestType !== 'Permanent' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de fin *
                  </label>
                  <input
                    type="date"
                    name="requestedEndDate"
                    value={formData.requestedEndDate}
                    onChange={handleInputChange}
                    min={formData.requestedStartDate || new Date().toISOString().split('T')[0]}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.requestedEndDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.requestedEndDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.requestedEndDate}</p>
                  )}
                </div>
              )}
            </div>

            {/* But de la demande */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                But de la demande *
              </label>
              <textarea
                name="purpose"
                rows="3"
                value={formData.purpose}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.purpose ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Expliquez pourquoi vous avez besoin de cet équipement..."
              />
              {errors.purpose && (
                <p className="text-red-500 text-sm mt-1">{errors.purpose}</p>
              )}
            </div>

            {/* Description additionnelle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description additionnelle
              </label>
              <textarea
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Informations supplémentaires (optionnel)..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Création...' : 'Créer la demande'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CreateDisposalRequestModal;