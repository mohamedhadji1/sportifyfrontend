import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaTimes,
  FaCheckCircle,
  FaTimesCircle,
  FaUser,
  FaBox,
  FaExclamationTriangle
} from 'react-icons/fa';
import { useAuth } from '../../../hooks/useAuth';
import axios from 'axios';
import toast from 'react-hot-toast';

const ReviewDisposalRequestModal = ({ request, onClose, onRequestReviewed }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [reviewData, setReviewData] = useState({
    status: 'Approved',
    responseMessage: '',
    approvedQuantity: request.quantity
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReviewData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur pour ce champ
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!reviewData.responseMessage.trim()) {
      newErrors.responseMessage = 'Un message de réponse est requis';
    }

    if (reviewData.status === 'Approved') {
      if (!reviewData.approvedQuantity || reviewData.approvedQuantity <= 0) {
        newErrors.approvedQuantity = 'La quantité approuvée doit être supérieure à 0';
      }
      if (reviewData.approvedQuantity > request.quantity) {
        newErrors.approvedQuantity = 'La quantité approuvée ne peut pas dépasser la quantité demandée';
      }
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
      
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/service-equipement/api/equipment/disposal/${request._id}/review`,
        reviewData,
        {
          headers: {
            'x-auth-token': localStorage.getItem('token'),
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        onRequestReviewed();
      }
    } catch (error) {
      console.error('Error reviewing disposal request:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors du traitement de la demande';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
        <div className={`text-white px-6 py-4 ${
          reviewData.status === 'Approved' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              {reviewData.status === 'Approved' ? (
                <FaCheckCircle />
              ) : (
                <FaTimesCircle />
              )}
              Traiter la demande de disposition
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
          {/* Résumé de la demande */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Résumé de la demande</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <FaUser className="text-purple-500 mt-1" />
                <div>
                  <div className="font-medium text-gray-900">Demandeur</div>
                  <div className="text-gray-600">{request.requesterName}</div>
                  <div className="text-sm text-gray-500">Rôle: {request.requesterRole}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <FaBox className="text-purple-500 mt-1" />
                <div>
                  <div className="font-medium text-gray-900">Équipement</div>
                  <div className="text-gray-600">{request.equipmentName}</div>
                  <div className="text-sm text-gray-500">Quantité: {request.quantity}</div>
                </div>
              </div>
            </div>
            
            <div className="mt-3">
              <div className="font-medium text-gray-900">But de la demande</div>
              <p className="text-gray-700 mt-1">{request.purpose}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <div className="font-medium text-gray-900">Date de début</div>
                <div className="text-gray-600">{formatDate(request.requestedStartDate)}</div>
              </div>
              {request.requestedEndDate && (
                <div>
                  <div className="font-medium text-gray-900">Date de fin</div>
                  <div className="text-gray-600">{formatDate(request.requestedEndDate)}</div>
                </div>
              )}
            </div>
          </div>

          {/* Formulaire de traitement */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Décision */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Décision *
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="Approved"
                    checked={reviewData.status === 'Approved'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <span className="ml-2 flex items-center gap-2 text-green-700">
                    <FaCheckCircle />
                    Approuver la demande
                  </span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="Rejected"
                    checked={reviewData.status === 'Rejected'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                  />
                  <span className="ml-2 flex items-center gap-2 text-red-700">
                    <FaTimesCircle />
                    Rejeter la demande
                  </span>
                </label>
              </div>
            </div>

            {/* Quantité approuvée (si approuvé) */}
            {reviewData.status === 'Approved' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantité approuvée *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="approvedQuantity"
                    min="1"
                    max={request.quantity}
                    value={reviewData.approvedQuantity}
                    onChange={handleInputChange}
                    className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.approvedQuantity ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <span className="text-gray-500">/ {request.quantity} demandé(s)</span>
                </div>
                {errors.approvedQuantity && (
                  <p className="text-red-500 text-sm mt-1">{errors.approvedQuantity}</p>
                )}
                
                {reviewData.approvedQuantity < request.quantity && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-start gap-2">
                      <FaExclamationTriangle className="text-yellow-500 mt-0.5" />
                      <div className="text-sm text-yellow-700">
                        <strong>Attention:</strong> Vous approuvez une quantité inférieure à celle demandée.
                        Veuillez expliquer la raison dans le message de réponse.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Message de réponse */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message de réponse *
              </label>
              <textarea
                name="responseMessage"
                rows="4"
                value={reviewData.responseMessage}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  reviewData.status === 'Approved' ? 'focus:ring-green-500' : 'focus:ring-red-500'
                } ${errors.responseMessage ? 'border-red-500' : 'border-gray-300'}`}
                placeholder={
                  reviewData.status === 'Approved'
                    ? "Expliquez les conditions d'approbation, les instructions pour récupérer l'équipement, etc."
                    : "Expliquez les raisons du rejet et les alternatives possibles..."
                }
              />
              {errors.responseMessage && (
                <p className="text-red-500 text-sm mt-1">{errors.responseMessage}</p>
              )}
            </div>

            {/* Information sur les conséquences */}
            <div className={`p-4 rounded-lg ${
              reviewData.status === 'Approved' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className={`mt-1 ${
                  reviewData.status === 'Approved' ? 'text-green-500' : 'text-red-500'
                }`} />
                <div className={`text-sm ${
                  reviewData.status === 'Approved' ? 'text-green-700' : 'text-red-700'
                }`}>
                  <strong>Conséquences de cette action:</strong>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    {reviewData.status === 'Approved' ? (
                      <>
                        <li>L'équipement sera marqué comme "En cours d'utilisation"</li>
                        <li>L'utilisateur sera notifié de l'approbation</li>
                        <li>Le demandeur pourra récupérer l'équipement</li>
                      </>
                    ) : (
                      <>
                        <li>La demande sera marquée comme rejetée</li>
                        <li>L'utilisateur sera notifié du rejet avec vos raisons</li>
                        <li>L'équipement restera disponible pour d'autres demandes</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
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
                className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                  reviewData.status === 'Approved'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {loading ? 'Traitement...' : (
                  reviewData.status === 'Approved' ? 'Approuver' : 'Rejeter'
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReviewDisposalRequestModal;