import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaTimes, FaUpload, FaBox,
  FaCog, FaCalendarAlt, FaFileAlt, FaSave
} from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Button } from '../../../shared/ui/components/Button';
import { Card } from '../../../shared/ui/components/Card';
import { TextInput } from '../../../shared/ui/components/TextInput';
import { Select } from '../../../shared/ui/components/Select';

const EquipmentModal = ({ equipment, editMode, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [courts, setCourts] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    typeId: '',
    serialNumber: '',
    description: '',
    courtId: '',
    condition: 'Good',
    status: 'Available',
    purchaseDate: '',
    purchasePrice: '',
    specifications: {},
    images: []
  });

  useEffect(() => {
    fetchCourts();
    fetchEquipmentTypes();
    
    if (editMode && equipment) {
      setFormData({
        name: equipment.name || '',
        typeId: equipment.type?.typeId || '',
        serialNumber: equipment.serialNumber || '',
        description: equipment.description || '',
        courtId: equipment.location?.courtId || '',
        condition: equipment.condition || 'Good',
        status: equipment.status || 'Available',
        purchaseDate: equipment.purchaseDate ? 
          new Date(equipment.purchaseDate).toISOString().split('T')[0] : '',
        purchasePrice: equipment.purchasePrice || '',
        specifications: equipment.specifications || {},
        images: []
      });
      
      if (equipment.images && equipment.images.length > 0) {
        setPreviewImages(equipment.images.map(img => 
          `https://sportify-equipement.onrender.com/uploads/equipment/${img.filename || img}`
        ));
      }
    }
  }, [editMode, equipment]);

  const fetchCourts = async () => {
    try {
      console.log('🏟️ Fetching courts...');
      const token = localStorage.getItem('token');
      const response = await axios.get('https://sportify-courts.onrender.com/api/courts', {
        headers: { 'x-auth-token': token }
      });
      console.log('✅ Courts response:', response.data);
      
      // L'API court retourne directement un array ou un objet avec courts ?
      const courtsData = Array.isArray(response.data) ? response.data : (response.data.courts || []);
      console.log('📋 Courts array:', courtsData);
      setCourts(courtsData);
    } catch (error) {
      console.error('❌ Error fetching courts:', error);
    }
  };

  const fetchEquipmentTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔧 Fetching equipment types...');
      const response = await axios.get('https://sportify-equipement.onrender.com/api/equipment/types', {
        headers: { 'x-auth-token': token }
      });
      console.log('✅ Equipment types response:', response.data);
      setEquipmentTypes(response.data.data || []);
    } catch (error) {
      console.error('❌ Error fetching equipment types:', error);
      toast.error('Erreur lors du chargement des types d\'équipement');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      toast.error('Maximum 5 images autorisées');
      return;
    }

    setFormData(prev => ({
      ...prev,
      images: files
    }));

    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewImages(previews);
  };

  const removeImage = (index) => {
    const newImages = [...formData.images];
    const newPreviews = [...previewImages];
    
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setFormData(prev => ({ ...prev, images: newImages }));
    setPreviewImages(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🚀 FORM SUBMIT CALLED!');
    console.log('🔍 Form data:', formData);
    
    if (!formData.name.trim()) {
      toast.error('Le nom de l\'équipement est requis');
      return;
    }
    
    if (!formData.typeId) {
      toast.error('Veuillez sélectionner un type d\'équipement');
      return;
    }
    
    if (!formData.courtId) {
      toast.error('Veuillez sélectionner un terrain');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Trouver le type d'équipement sélectionné pour récupérer ses infos
      const selectedEquipmentType = equipmentTypes.find(et => et._id === formData.typeId);
      if (!selectedEquipmentType) {
        toast.error('Type d\'équipement invalide');
        setLoading(false);
        return;
      }
      
      // Add basic fields avec les bonnes données
      Object.keys(formData).forEach(key => {
        if (key === 'images') {
          formData.images.forEach(file => {
            formDataToSend.append('images', file);
          });
        } else if (key === 'typeId') {
          // Envoyer les informations du type au lieu de l'ID
          formDataToSend.append('type', selectedEquipmentType.name);
          formDataToSend.append('category', selectedEquipmentType.category);
          formDataToSend.append('typeId', selectedEquipmentType._id); // Garder l'ID pour référence
        } else if (key === 'specifications') {
          formDataToSend.append('specifications', JSON.stringify(formData.specifications));
        } else if (formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });

      const url = editMode 
        ? `https://sportify-equipement.onrender.com/api/equipment/${equipment._id}`
        : 'https://sportify-equipement.onrender.com/api/equipment';
      
      const method = editMode ? 'put' : 'post';
      const token = localStorage.getItem('token');
      
      console.log('🔧 EQUIPMENT FORM DEBUG:');
      console.log('   Selected equipment type:', selectedEquipmentType);
      console.log('   URL:', url);
      console.log('   Method:', method);
      console.log('   Token:', token ? token.substring(0, 20) + '...' : 'null');
      console.log('   FormData keys:', Array.from(formDataToSend.keys()));
      console.log('   FormData values:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`     ${key}:`, value);
      }
      
      const response = await axios[method](url, formDataToSend, {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('   ✅ Response:', response.data);

      if (response.data.success) {
        toast.success(editMode ? 'Équipement modifié avec succès' : 'Équipement créé avec succès');
        onSuccess();
      }
    } catch (error) {
      console.error('❌ Error saving equipment:', error);
      console.error('   Status:', error.response?.status);
      console.error('   Data:', error.response?.data);
      console.error('   Full error message:', error.response?.data?.error);
      console.error('   Validation details:', error.response?.data?.details);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          'Erreur lors de la sauvegarde';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'Available', label: 'Disponible' },
    { value: 'In Use', label: 'En utilisation' },
    { value: 'Maintenance', label: 'En maintenance' },
    { value: 'Out of Order', label: 'Hors service' },
    { value: 'Reserved', label: 'Réservé' }
  ];

  const conditionOptions = [
    { value: 'Excellent', label: 'Excellent' },
    { value: 'Good', label: 'Bon' },
    { value: 'Fair', label: 'Passable' },
    { value: 'Poor', label: 'Mauvais' },
    { value: 'Out of Service', label: 'Hors service' }
  ];

  const courtOptions = [
    { value: '', label: 'Sélectionnez un terrain' },
    ...courts.filter(court => court && court._id && court.name).map((court) => ({
      value: court._id,
      label: String(court.name)
    }))
  ];

  const equipmentTypeOptions = [
    { value: '', label: 'Sélectionnez un type' },
    ...equipmentTypes.filter(type => type && type._id && type.name && type.category).map((type) => ({
      value: type._id,
      label: `${String(type.name)} - ${String(type.category)}`
    }))
  ];

  // Debug logs pour voir les états
  console.log('🔍 Modal Debug:');
  console.log('   Courts array:', courts);
  console.log('   Equipment types array:', equipmentTypes);
  console.log('   Court options:', courtOptions);
  console.log('   Equipment type options:', equipmentTypeOptions);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <Card variant="glass" className="relative">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-t-xl">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">
                  {editMode ? 'Modifier l\'Équipement' : 'Nouvel Équipement'}
                </h2>
                <p className="text-blue-100">
                  {editMode ? 'Modifiez les informations de l\'équipement' : 'Ajoutez un nouvel équipement à votre inventaire'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/10"
              >
                <FaTimes />
              </Button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <FaBox className="mr-2 text-blue-400" />
                Informations de base
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput
                  label="Nom de l'équipement *"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Ballon de football professionnel"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Type d'équipement *
                  </label>
                  <Select
                    options={equipmentTypeOptions}
                    value={formData.typeId}
                    onChange={(e) => handleInputChange({ target: { name: 'typeId', value: e.target.value } })}
                    required
                  />
                </div>

                <TextInput
                  label="Numéro de série"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleInputChange}
                  placeholder="Ex: SN123456789"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Terrain *
                  </label>
                  <Select
                    options={courtOptions}
                    value={formData.courtId}
                    onChange={(e) => handleInputChange({ target: { name: 'courtId', value: e.target.value } })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <FaFileAlt className="inline mr-1" />
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Description détaillée de l'équipement..."
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Status and Condition */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <FaCog className="mr-2 text-purple-400" />
                État et condition
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Statut
                  </label>
                  <Select
                    options={statusOptions}
                    value={formData.status}
                    onChange={(e) => handleInputChange({ target: { name: 'status', value: e.target.value } })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Condition
                  </label>
                  <Select
                    options={conditionOptions}
                    value={formData.condition}
                    onChange={(e) => handleInputChange({ target: { name: 'condition', value: e.target.value } })}
                  />
                </div>
              </div>
            </div>

            {/* Purchase Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <FaCalendarAlt className="mr-2 text-green-400" />
                Informations d'achat
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput
                  label="Date d'achat"
                  name="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={handleInputChange}
                />

                <TextInput
                  label="Prix d'achat (€)"
                  name="purchasePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Images */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <FaUpload className="mr-2 text-yellow-400" />
                Images (optionnel)
              </h3>
              
              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                  max={5}
                />
                
                <label
                  htmlFor="image-upload"
                  className="flex items-center justify-center w-full p-6 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-500/10 transition-colors"
                >
                  <div className="text-center">
                    <FaUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-300">Cliquez pour sélectionner des images</p>
                    <p className="text-sm text-gray-400">Maximum 5 images</p>
                  </div>
                </label>

                {/* Preview Images */}
                {previewImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {previewImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-600"
                        />
                        <Button
                          variant="danger"
                          size="xs"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2"
                        >
                          <FaTimes />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={loading}
              >
                Annuler
              </Button>
              
              <Button
                type="submit"
                loading={loading}
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sauvegarde...
                  </div>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    {editMode ? 'Modifier' : 'Créer'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default EquipmentModal;