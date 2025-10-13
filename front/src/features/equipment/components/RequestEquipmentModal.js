import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaCalendarAlt, FaUsers, FaFileAlt, FaPaperPlane } from 'react-icons/fa';
import { useAuth } from '../../../hooks/useAuth';
import axios from 'axios';
import toast from 'react-hot-toast';

const RequestEquipmentModal = ({ equipment, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userTeams, setUserTeams] = useState([]);
  const [formData, setFormData] = useState({
    requestType: 'borrow',
    teamId: '',
    priority: 'medium',
    requestedStartDate: '',
    requestedEndDate: '',
    purpose: '',
    description: ''
  });

  useEffect(() => {
    fetchUserTeams();
    
    // Set default dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    setFormData(prev => ({
      ...prev,
      requestedStartDate: today.toISOString().split('T')[0],
      requestedEndDate: nextWeek.toISOString().split('T')[0]
    }));
  }, []);

  const fetchUserTeams = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:5004/api/teams/user-teams',
        {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setUserTeams(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching user teams:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.purpose.trim()) {
      toast.error('Veuillez préciser l\'objectif de votre demande');
      return;
    }

    if (formData.requestType !== 'report_issue' && !formData.requestedStartDate) {
      toast.error('Veuillez sélectionner une date de début');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const requestData = {
        equipmentId: equipment._id,
        ...formData,
        ...(formData.teamId && { teamId: formData.teamId })
      };

      const response = await axios.post(
        'http://localhost:5009/api/equipment/requests',
        requestData,
        {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success('Votre demande a été envoyée avec succès');
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating equipment request:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi de la demande');
    } finally {
      setLoading(false);
    }
  };

  const requestTypeOptions = [
    { value: 'borrow', label: 'Emprunter', description: 'Utiliser l\'équipement temporairement' },
    { value: 'reserve', label: 'Réserver', description: 'Réserver pour utilisation future' },
    { value: 'maintain', label: 'Maintenance', description: 'Signaler un besoin de maintenance' },
    { value: 'report_issue', label: 'Signaler un problème', description: 'Rapporter un dysfonctionnement' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Faible', color: 'text-green-600' },
    { value: 'medium', label: 'Moyenne', color: 'text-yellow-600' },
    { value: 'high', label: 'Élevée', color: 'text-red-600' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                Demande d'Équipement
              </h2>
              <p className="text-gray-600">
                {equipment?.name} - {equipment?.type?.category}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-300"
            >
              <FaTimes className="text-xl text-gray-500" />
            </button>
          </div>
        </div>

        {/* Equipment Info */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {equipment?.images?.[0] ? (
              <img
                src={`http://localhost:5009/uploads/equipment/${equipment.images[0]}`}
                alt={equipment.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                <FaFileAlt className="text-gray-400 text-2xl" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-800">{equipment?.name}</h3>
              <p className="text-sm text-gray-600">{equipment?.location?.courtName}</p>
              <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                equipment?.status === 'Available' 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-yellow-100 text-yellow-600'
              }`}>
                {equipment?.status}
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Request Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Type de demande *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {requestTypeOptions.map((option) => (
                <label
                  key={option.value}
                  className={`relative flex cursor-pointer rounded-lg border p-4 hover:bg-gray-50 ${
                    formData.requestType === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="requestType"
                    value={option.value}
                    checked={formData.requestType === option.value}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{option.label}</p>
                        <p className="text-gray-500 text-xs">{option.description}</p>
                      </div>
                    </div>
                  </div>
                  {formData.requestType === option.value && (
                    <div className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full"></div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Team Selection */}
          {userTeams.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaUsers className="inline mr-2" />
                Équipe (optionnel)
              </label>
              <select
                name="teamId"
                value={formData.teamId}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Demande personnelle</option>
                {userTeams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Sélectionnez une équipe si cette demande est pour votre équipe
              </p>
            </div>
          )}

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priorité
            </label>
            <div className="flex space-x-4">
              {priorityOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center cursor-pointer px-4 py-2 rounded-lg border ${
                    formData.priority === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={option.value}
                    checked={formData.priority === option.value}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <span className={`font-medium ${option.color}`}>
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Dates */}
          {formData.requestType !== 'report_issue' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaCalendarAlt className="inline mr-2" />
                  Date de début *
                </label>
                <input
                  type="date"
                  name="requestedStartDate"
                  value={formData.requestedStartDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaCalendarAlt className="inline mr-2" />
                  Date de fin
                </label>
                <input
                  type="date"
                  name="requestedEndDate"
                  value={formData.requestedEndDate}
                  onChange={handleInputChange}
                  min={formData.requestedStartDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Objectif de la demande *
            </label>
            <input
              type="text"
              name="purpose"
              value={formData.purpose}
              onChange={handleInputChange}
              placeholder="Ex: Entraînement équipe, compétition, maintenance préventive..."
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description détaillée
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              placeholder="Ajoutez des détails supplémentaires sur votre demande..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-300"
            >
              Annuler
            </button>
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Envoi...</span>
                </>
              ) : (
                <>
                  <FaPaperPlane />
                  <span>Envoyer la demande</span>
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default RequestEquipmentModal;