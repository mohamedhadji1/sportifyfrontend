import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaShoppingCart, FaTimes, FaMapMarkerAlt, 
  FaFileAlt, FaCheck, FaSpinner 
} from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Button } from '../../../shared/ui/components/Button';
import { Card } from '../../../shared/ui/components/Card';
import { TextInput } from '../../../shared/ui/components/TextInput';

const CheckoutModal = ({ isOpen, onClose, cart, onOrderCreated }) => {
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState({
    deliveryAddress: {
      street: '',
      city: '',
      postalCode: '',
      country: 'Tunisia'
    },
    notes: ''
  });

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setOrderData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setOrderData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!orderData.deliveryAddress.street.trim()) {
      toast.error('Adresse de livraison requise');
      return;
    }
    
    if (!orderData.deliveryAddress.city.trim()) {
      toast.error('Ville requise');
      return;
    }
    
    if (!orderData.deliveryAddress.postalCode.trim()) {
      toast.error('Code postal requis');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        'https://sportify-equipement.onrender.com/api/orders/create',
        orderData,
        {
          headers: { 'x-auth-token': token }
        }
      );

      if (response.data.success) {
        toast.success('Commande créée avec succès ! En attente d\'approbation du manager.');
        onOrderCreated(response.data.data);
        onClose();
        
        // Reset form
        setOrderData({
          deliveryAddress: {
            street: '',
            city: '',
            postalCode: '',
            country: 'Tunisia'
          },
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error creating order:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la création de la commande';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !cart) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <Card variant="glass" className="relative">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-4 rounded-t-xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <FaShoppingCart className="mr-3 text-2xl" />
                <div>
                  <h2 className="text-2xl font-bold">Passer Commande</h2>
                  <p className="text-green-100">
                    Finaliser votre achat d'équipements
                  </p>
                </div>
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

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Order Summary */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FaCheck className="mr-2 text-green-400" />
                Résumé de la commande
              </h3>
              
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 space-y-3">
                {cart.items.map((item) => (
                  <div key={item._id} className="flex justify-between items-center">
                    <div>
                      <span className="text-white font-medium">{item.equipmentTypeName}</span>
                      <span className="text-gray-400 text-sm ml-2">x{item.quantity}</span>
                    </div>
                    <span className="text-blue-400 font-semibold">
                      {item.totalPrice.toFixed(2)} €
                    </span>
                  </div>
                ))}
                
                <div className="border-t border-gray-600 pt-3 flex justify-between items-center">
                  <span className="text-white font-bold text-lg">Total:</span>
                  <span className="text-green-400 font-bold text-xl">
                    {cart.totalAmount.toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FaMapMarkerAlt className="mr-2 text-blue-400" />
                Adresse de livraison
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <TextInput
                    label="Adresse *"
                    value={orderData.deliveryAddress.street}
                    onChange={(e) => handleInputChange('deliveryAddress.street', e.target.value)}
                    placeholder="123 Rue de la Paix"
                    required
                  />
                </div>
                
                <TextInput
                  label="Ville *"
                  value={orderData.deliveryAddress.city}
                  onChange={(e) => handleInputChange('deliveryAddress.city', e.target.value)}
                  placeholder="Paris"
                  required
                />
                
                <TextInput
                  label="Code postal *"
                  value={orderData.deliveryAddress.postalCode}
                  onChange={(e) => handleInputChange('deliveryAddress.postalCode', e.target.value)}
                  placeholder="75001"
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FaFileAlt className="mr-2 text-yellow-400" />
                Notes (optionnel)
              </h3>
              
              <textarea
                value={orderData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
                placeholder="Instructions de livraison, préférences, etc."
                className="w-full px-4 py-2 bg-input border border-border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Information Note */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-400">
                    Approbation requise
                  </h4>
                  <p className="mt-1 text-sm text-yellow-300">
                    Votre commande sera soumise au manager de votre terrain pour approbation avant le paiement.
                    Vous recevrez une notification une fois la décision prise.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
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
                className="min-w-[160px]"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Création...
                  </>
                ) : (
                  <>
                    <FaCheck className="mr-2" />
                    Créer la commande
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

export default CheckoutModal;