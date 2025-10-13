import React from 'react';
import { motion } from 'framer-motion';
import {
  FaTimes,
  FaUser,
  FaBox,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle
} from 'react-icons/fa';

const ViewDisposalRequestModal = ({ request, onClose }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <FaClock className="text-yellow-500" />;
      case 'Approved':
        return <FaCheckCircle className="text-green-500" />;
      case 'Rejected':
        return <FaTimesCircle className="text-red-500" />;
      case 'Cancelled':
        return <FaTimesCircle className="text-gray-500" />;
      default:
        return <FaClock className="text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Normal':
        return 'bg-blue-100 text-blue-800';
      case 'Low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
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
        <div className="bg-purple-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FaInfoCircle />
              Détails de la demande
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
          {/* Statut et Priorité */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              {getStatusIcon(request.status)}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                {request.status === 'Pending' ? 'En attente' :
                 request.status === 'Approved' ? 'Approuvé' :
                 request.status === 'Rejected' ? 'Rejeté' : 'Annulé'}
              </span>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(request.priority)}`}>
              Priorité: {request.priority}
            </span>
          </div>

          {/* Informations principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Informations de base
              </h3>
              
              <div className="flex items-start gap-3">
                <FaBox className="text-purple-500 mt-1" />
                <div>
                  <div className="font-medium text-gray-900">Équipement</div>
                  <div className="text-gray-600">{request.equipmentName}</div>
                  {request.equipmentId?.category && (
                    <div className="text-sm text-gray-500">
                      Catégorie: {request.equipmentId.category}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FaUser className="text-purple-500 mt-1" />
                <div>
                  <div className="font-medium text-gray-900">Demandeur</div>
                  <div className="text-gray-600">{request.requesterName}</div>
                  <div className="text-sm text-gray-500">Rôle: {request.requesterRole}</div>
                  {request.teamName && (
                    <div className="text-sm text-gray-500">Équipe: {request.teamName}</div>
                  )}
                </div>
              </div>

              <div>
                <div className="font-medium text-gray-900">Quantité demandée</div>
                <div className="text-gray-600">{request.quantity}</div>
              </div>

              <div>
                <div className="font-medium text-gray-900">Type de demande</div>
                <div className="text-gray-600">
                  {request.requestType === 'Temporary' ? 'Temporaire' :
                   request.requestType === 'Permanent' ? 'Permanent' : 'Événement'}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Dates
              </h3>
              
              <div className="flex items-start gap-3">
                <FaCalendarAlt className="text-purple-500 mt-1" />
                <div>
                  <div className="font-medium text-gray-900">Date de début</div>
                  <div className="text-gray-600">{formatDate(request.requestedStartDate)}</div>
                </div>
              </div>

              {request.requestedEndDate && (
                <div className="flex items-start gap-3">
                  <FaCalendarAlt className="text-purple-500 mt-1" />
                  <div>
                    <div className="font-medium text-gray-900">Date de fin</div>
                    <div className="text-gray-600">{formatDate(request.requestedEndDate)}</div>
                  </div>
                </div>
              )}

              <div>
                <div className="font-medium text-gray-900">Demande créée le</div>
                <div className="text-gray-600">{formatDate(request.createdAt)}</div>
              </div>
            </div>
          </div>

          {/* But de la demande */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-3">
              But de la demande
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">{request.purpose}</p>
            </div>
          </div>

          {/* Description additionnelle */}
          {request.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-3">
                Description additionnelle
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">{request.description}</p>
              </div>
            </div>
          )}

          {/* Réponse de l'administrateur */}
          {request.adminResponse && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-3">
                Réponse de l'administrateur
              </h3>
              <div className={`p-4 rounded-lg ${
                request.status === 'Approved' ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className="flex items-start gap-3 mb-3">
                  <FaUser className={`mt-1 ${
                    request.status === 'Approved' ? 'text-green-500' : 'text-red-500'
                  }`} />
                  <div>
                    <div className="font-medium text-gray-900">
                      {request.adminResponse.adminName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(request.adminResponse.responseDate)}
                    </div>
                  </div>
                </div>
                
                {request.adminResponse.approvedQuantity && (
                  <div className="mb-2">
                    <span className="font-medium">Quantité approuvée: </span>
                    <span className="text-green-700">{request.adminResponse.approvedQuantity}</span>
                  </div>
                )}
                
                {request.adminResponse.responseMessage && (
                  <p className="text-gray-700">{request.adminResponse.responseMessage}</p>
                )}
              </div>
            </div>
          )}

          {/* Utilisation réelle */}
          {request.actualUsage && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-3">
                Utilisation réelle
              </h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {request.actualUsage.startDate && (
                    <div>
                      <div className="font-medium text-gray-900">Date de début réelle</div>
                      <div className="text-gray-600">{formatDate(request.actualUsage.startDate)}</div>
                    </div>
                  )}
                  
                  {request.actualUsage.returnDate && (
                    <div>
                      <div className="font-medium text-gray-900">Date de retour</div>
                      <div className="text-gray-600">{formatDate(request.actualUsage.returnDate)}</div>
                    </div>
                  )}
                  
                  {request.actualUsage.condition && (
                    <div>
                      <div className="font-medium text-gray-900">État au retour</div>
                      <div className="text-gray-600">{request.actualUsage.condition}</div>
                    </div>
                  )}
                </div>
                
                {request.actualUsage.notes && (
                  <div className="mt-3">
                    <div className="font-medium text-gray-900">Notes</div>
                    <p className="text-gray-700">{request.actualUsage.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ViewDisposalRequestModal;