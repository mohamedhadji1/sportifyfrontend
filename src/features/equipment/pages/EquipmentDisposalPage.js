import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaPlus,
  FaFilter,
  FaSearch,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExclamationTriangle,
  FaUser,
  FaCalendarAlt,
  FaBox
} from 'react-icons/fa';
import { useAuth } from '../../../hooks/useAuth';
import axios from 'axios';
import toast from 'react-hot-toast';
import CreateDisposalRequestModal from './CreateDisposalRequestModal';
import ViewDisposalRequestModal from './ViewDisposalRequestModal';
import ReviewDisposalRequestModal from './ReviewDisposalRequestModal';

const EquipmentDisposalPage = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  // Filtres et recherche
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    requestType: '',
    search: ''
  });

  const isAdmin = user?.role === 'Admin' || user?.role === 'Super Admin';
  const isPlayerOrManager = user?.role === 'Player' || user?.role === 'Manager';

  // Charger les demandes
  const loadRequests = async () => {
    try {
      setLoading(true);
      const endpoint = isAdmin ? '/api/equipment/disposal/requests' : '/api/equipment/disposal/my-requests';
      
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.requestType) params.append('requestType', filters.requestType);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/service-equipement${endpoint}?${params}`, {
        headers: {
          'x-auth-token': localStorage.getItem('token')
        }
      });

      if (response.data.success) {
        setRequests(response.data.data);
      }
    } catch (error) {
      console.error('Error loading disposal requests:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [filters]);

  // Gérer les actions
  const handleCreateRequest = () => {
    setShowCreateModal(true);
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowViewModal(true);
  };

  const handleReviewRequest = (request) => {
    setSelectedRequest(request);
    setShowReviewModal(true);
  };

  const handleRequestCreated = () => {
    setShowCreateModal(false);
    loadRequests();
    toast.success('Demande créée avec succès');
  };

  const handleRequestReviewed = () => {
    setShowReviewModal(false);
    loadRequests();
    toast.success('Demande traitée avec succès');
  };

  // Fonction pour obtenir l'icône de statut
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

  // Fonction pour obtenir la couleur de priorité
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent':
        return 'text-red-600 bg-red-100';
      case 'High':
        return 'text-orange-600 bg-orange-100';
      case 'Normal':
        return 'text-blue-600 bg-blue-100';
      case 'Low':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdmin ? 'Gestion des Demandes de Disposition' : 'Mes Demandes de Disposition'}
          </h1>
          <p className="text-gray-600">
            {isAdmin ? 'Gérer toutes les demandes de disposition d\'équipement' : 'Vos demandes de disposition d\'équipement'}
          </p>
        </div>
        {isPlayerOrManager && (
          <button
            onClick={handleCreateRequest}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <FaPlus />
            Nouvelle Demande
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaSearch className="inline mr-1" /> Recherche
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Rechercher par équipement, utilisateur..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaFilter className="inline mr-1" /> Statut
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="">Tous les statuts</option>
              <option value="Pending">En attente</option>
              <option value="Approved">Approuvé</option>
              <option value="Rejected">Rejeté</option>
              <option value="Cancelled">Annulé</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            >
              <option value="">Toutes les priorités</option>
              <option value="Low">Basse</option>
              <option value="Normal">Normale</option>
              <option value="High">Haute</option>
              <option value="Urgent">Urgente</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={filters.requestType}
              onChange={(e) => setFilters(prev => ({ ...prev, requestType: e.target.value }))}
            >
              <option value="">Tous les types</option>
              <option value="Temporary">Temporaire</option>
              <option value="Permanent">Permanent</option>
              <option value="Event">Événement</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des demandes */}
      {requests.length === 0 ? (
        <div className="text-center py-12">
          <FaBox className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune demande trouvée</h3>
          <p className="mt-1 text-sm text-gray-500">
            {isPlayerOrManager && 'Commencez par créer une nouvelle demande de disposition.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <motion.div
              key={request._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(request.status)}
                    <h3 className="text-lg font-semibold text-gray-900">
                      {request.equipmentName}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                      {request.priority}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <FaUser className="text-sm" />
                      <span className="text-sm">{request.requesterName} ({request.requesterRole})</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <FaCalendarAlt className="text-sm" />
                      <span className="text-sm">
                        {new Date(request.requestedStartDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <FaBox className="text-sm" />
                      <span className="text-sm">Quantité: {request.quantity}</span>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-2 line-clamp-2">{request.purpose}</p>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      request.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {request.status === 'Pending' ? 'En attente' :
                       request.status === 'Approved' ? 'Approuvé' :
                       request.status === 'Rejected' ? 'Rejeté' : 'Annulé'}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {request.requestType}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewRequest(request)}
                    className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    title="Voir les détails"
                  >
                    <FaEye />
                  </button>
                  {isAdmin && request.status === 'Pending' && (
                    <button
                      onClick={() => handleReviewRequest(request)}
                      className="bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600 transition-colors"
                      title="Traiter la demande"
                    >
                      <FaCheckCircle />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateDisposalRequestModal
          onClose={() => setShowCreateModal(false)}
          onRequestCreated={handleRequestCreated}
        />
      )}

      {showViewModal && selectedRequest && (
        <ViewDisposalRequestModal
          request={selectedRequest}
          onClose={() => setShowViewModal(false)}
        />
      )}

      {showReviewModal && selectedRequest && (
        <ReviewDisposalRequestModal
          request={selectedRequest}
          onClose={() => setShowReviewModal(false)}
          onRequestReviewed={handleRequestReviewed}
        />
      )}
    </div>
  );
};

export default EquipmentDisposalPage;