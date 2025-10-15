import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaTimes, FaEdit, FaTools, FaHistory, FaUser, FaMapMarkerAlt,
  FaCalendarAlt, FaBox, FaCheckCircle, FaExclamationTriangle,
  FaCog, FaPlus
} from 'react-icons/fa';
import { useAuth } from '../../../hooks/useAuth';
import axios from 'axios';
import toast from 'react-hot-toast';

const EquipmentDetailsModal = ({ equipment, onClose, onUpdate }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    type: 'Inspection',
    description: '',
    cost: ''
  });

  // Vérifier les permissions utilisateur
  const isResponsible = user?.role === 'responsible';
  const isManager = user?.role === 'manager';
  const canManageEquipment = isResponsible || isManager;

  const handleAddMaintenance = async (e) => {
    e.preventDefault();
    if (!maintenanceForm.description.trim()) {
      toast.error('Veuillez ajouter une description');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `https://sportify-equipement.onrender.com/api/equipment/${equipment._id}/maintenance`,
        maintenanceForm,
        {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success('Enregistrement de maintenance ajouté');
        setMaintenanceForm({ type: 'Inspection', description: '', cost: '' });
        onUpdate();
      }
    } catch (error) {
      console.error('Error adding maintenance:', error);
      toast.error('Erreur lors de l\'ajout de la maintenance');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'text-green-600 bg-green-100';
      case 'In Use': return 'text-blue-600 bg-blue-100';
      case 'Maintenance': return 'text-yellow-600 bg-yellow-100';
      case 'Out of Order': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConditionIcon = (condition) => {
    switch (condition) {
      case 'Excellent': return <FaCheckCircle className="text-green-500" />;
      case 'Good': return <FaCheckCircle className="text-blue-500" />;
      case 'Fair': return <FaExclamationTriangle className="text-yellow-500" />;
      case 'Poor': return <FaExclamationTriangle className="text-red-500" />;
      default: return <FaBox className="text-gray-500" />;
    }
  };

  const tabs = [
    { id: 'details', label: 'Détails', icon: FaBox },
    { id: 'maintenance', label: 'Maintenance', icon: FaTools },
    { id: 'history', label: 'Historique', icon: FaHistory }
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              {equipment?.images?.[0] ? (
                <img
                  src={`https://sportify-equipement.onrender.com/uploads/equipment/${equipment.images[0]}`}
                  alt={equipment.name}
                  className="w-16 h-16 object-cover rounded-lg border-2 border-white/20"
                />
              ) : (
                <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                  <FaBox className="text-2xl text-white" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold mb-1">{equipment?.name}</h2>
                <p className="text-blue-100">{equipment?.type?.category} - {equipment?.type?.typeName}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`px-3 py-1 text-sm rounded-full font-medium ${getStatusColor(equipment?.status)}`}>
                    {equipment?.status}
                  </span>
                  {getConditionIcon(equipment?.condition)}
                  <span className="text-sm text-blue-100">{equipment?.condition}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors duration-300"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 font-medium transition-colors duration-300 flex items-center justify-center space-x-2 ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <IconComponent />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nom de l'équipement</label>
                    <p className="text-lg font-semibold text-gray-800">{equipment?.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Type</label>
                    <p className="text-gray-800">{equipment?.type?.typeName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Catégorie</label>
                    <p className="text-gray-800">{equipment?.type?.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Numéro de série</label>
                    <p className="text-gray-800">{equipment?.serialNumber || 'Non défini'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      <FaMapMarkerAlt className="inline mr-1" />
                      Localisation
                    </label>
                    <p className="text-gray-800">{equipment?.location?.courtName}</p>
                    <p className="text-sm text-gray-600">{equipment?.location?.companyName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Condition</label>
                    <div className="flex items-center space-x-2">
                      {getConditionIcon(equipment?.condition)}
                      <span className="text-gray-800">{equipment?.condition}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      <FaCalendarAlt className="inline mr-1" />
                      Date d'acquisition
                    </label>
                    <p className="text-gray-800">
                      {equipment?.purchaseDate 
                        ? new Date(equipment.purchaseDate).toLocaleDateString('fr-FR')
                        : 'Non définie'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Assignment Info */}
              {equipment?.assignedTo?.userId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
                    <FaUser className="mr-2" />
                    Actuellement assigné
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-600 font-medium">Utilisateur:</span>
                      <p className="text-blue-800">{equipment.assignedTo.userName}</p>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">Date d'assignation:</span>
                      <p className="text-blue-800">
                        {new Date(equipment.assignedTo.assignedDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    {equipment.assignedTo.expectedReturnDate && (
                      <div>
                        <span className="text-blue-600 font-medium">Retour prévu:</span>
                        <p className="text-blue-800">
                          {new Date(equipment.assignedTo.expectedReturnDate).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {equipment?.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-800 bg-gray-50 p-3 rounded-lg mt-1">
                    {equipment.description}
                  </p>
                </div>
              )}

              {/* Specifications */}
              {equipment?.specifications && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Spécifications techniques</label>
                  <div className="bg-gray-50 p-3 rounded-lg mt-1 space-y-2">
                    {(() => {
                      let specs = equipment.specifications;
                      
                      // If specifications is a string, try to parse it
                      if (typeof specs === 'string') {
                        try {
                          specs = JSON.parse(specs);
                        } catch (e) {
                          return (
                            <div className="text-gray-600 italic">
                              Spécifications non disponibles
                            </div>
                          );
                        }
                      }
                      
                      // If it's still not an object or is empty, show message
                      if (!specs || typeof specs !== 'object' || Object.keys(specs).length === 0) {
                        return (
                          <div className="text-gray-600 italic">
                            Aucune spécification disponible
                          </div>
                        );
                      }
                      
                      // Render specifications
                      return Object.entries(specs).map(([key, value]) => {
                        // Handle different value types
                        let displayValue = '';
                        if (typeof value === 'object' && value !== null) {
                          if (value.unit && value.value !== undefined) {
                            // Handle unit objects like { value: 5, unit: 'kg' }
                            displayValue = `${value.value} ${value.unit}`;
                          } else if (value.unit) {
                            // Handle unit-only objects like { unit: 'kg' }
                            displayValue = value.unit;
                          } else {
                            // Handle other objects
                            displayValue = JSON.stringify(value, null, 2);
                          }
                        } else if (Array.isArray(value)) {
                          displayValue = value.join(', ');
                        } else {
                          displayValue = String(value || 'Non spécifié');
                        }
                        
                        return (
                          <div key={key} className="flex justify-between">
                            <span className="font-medium text-gray-700 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <span className="text-gray-800">{displayValue}</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="space-y-6">
              {/* Add Maintenance Form */}
              {canManageEquipment && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                    <FaPlus className="mr-2" />
                    Ajouter un enregistrement de maintenance
                  </h3>
                  <form onSubmit={handleAddMaintenance} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type de maintenance
                        </label>
                        <select
                          value={maintenanceForm.type}
                          onChange={(e) => setMaintenanceForm(prev => ({ ...prev, type: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Inspection">Inspection</option>
                          <option value="Réparation">Réparation</option>
                          <option value="Nettoyage">Nettoyage</option>
                          <option value="Calibrage">Calibrage</option>
                          <option value="Remplacement">Remplacement</option>
                          <option value="Autre">Autre</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Coût (optionnel)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={maintenanceForm.cost}
                          onChange={(e) => setMaintenanceForm(prev => ({ ...prev, cost: e.target.value }))}
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={maintenanceForm.description}
                        onChange={(e) => setMaintenanceForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Décrivez la maintenance effectuée..."
                        rows={3}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Ajout...' : 'Ajouter'}
                    </button>
                  </form>
                </div>
              )}

              {/* Maintenance History */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <FaHistory className="mr-2" />
                  Historique de maintenance
                </h3>
                {equipment?.maintenanceHistory?.length > 0 ? (
                  <div className="space-y-3">
                    {equipment.maintenanceHistory.map((record, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <FaTools className="text-blue-500" />
                            <span className="font-medium text-gray-800">{record.type}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(record.date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">{record.description}</p>
                        <div className="flex justify-between items-center text-sm text-gray-600">
                          <span>Effectué par: {record.performedBy}</span>
                          {record.cost && <span>Coût: {record.cost}€</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Aucun enregistrement de maintenance disponible
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <FaHistory className="mr-2" />
                Historique d'utilisation
              </h3>
              <p className="text-gray-500 text-center py-8">
                L'historique d'utilisation sera disponible prochainement
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EquipmentDetailsModal;