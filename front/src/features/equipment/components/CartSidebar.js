import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaTimes,
  FaShoppingCart,
  FaMinus,
  FaPlus,
  FaTrash,
  FaCreditCard,
  FaShippingFast,
  FaLock
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import axios from 'axios';
import toast from 'react-hot-toast';

const CartSidebar = ({ cart, onClose, onUpdateCart }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [updatingItems, setUpdatingItems] = useState(new Set());

  // Mettre à jour la quantité d'un article
  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      setUpdatingItems(prev => new Set([...prev, itemId]));
      
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/service-equipement/api/cart/update/${itemId}`,
        { quantity: newQuantity },
        {
          headers: {
            'x-auth-token': localStorage.getItem('token'),
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        onUpdateCart();
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la mise à jour';
      toast.error(errorMessage);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Supprimer un article du panier
  const handleRemoveItem = async (itemId) => {
    try {
      setUpdatingItems(prev => new Set([...prev, itemId]));
      
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/service-equipement/api/cart/remove/${itemId}`,
        {
          headers: {
            'x-auth-token': localStorage.getItem('token')
          }
        }
      );

      if (response.data.success) {
        onUpdateCart();
        toast.success('Article retiré du panier');
      }
    } catch (error) {
      console.error('Error removing cart item:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la suppression';
      toast.error(errorMessage);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Vider le panier
  const handleClearCart = async () => {
    if (!confirm('Êtes-vous sûr de vouloir vider votre panier ?')) return;

    try {
      setLoading(true);
      
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/service-equipement/api/cart/clear`,
        {
          headers: {
            'x-auth-token': localStorage.getItem('token')
          }
        }
      );

      if (response.data.success) {
        onUpdateCart();
        toast.success('Panier vidé');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Erreur lors du vidage du panier');
    } finally {
      setLoading(false);
    }
  };

  // Procéder au checkout
  const handleCheckout = () => {
    onClose();
    navigate('/equipment/checkout');
  };

  // Formater le prix
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD'
    }).format(price);
  };

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Sidebar */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.3 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-purple-600 text-white">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FaShoppingCart />
            Mon Panier ({cart.totalItems})
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <FaShoppingCart className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Votre panier est vide
              </h3>
              <p className="text-gray-500 mb-4">
                Découvrez nos produits et ajoutez-en à votre panier
              </p>
              <button
                onClick={onClose}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Continuer mes achats
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {cart.items.map((item) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  {/* Image */}
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.equipmentTypeId?.images?.[0] ? (
                      <img
                        src={`${process.env.REACT_APP_API_URL}/service-equipement/uploads/equipment-types/${item.equipmentTypeId.images[0].filename}`}
                        alt={item.equipmentTypeName}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <FaShoppingCart className="text-gray-400" />
                    )}
                  </div>

                  {/* Informations */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {item.equipmentTypeName}
                    </h4>
                    <p className="text-sm text-gray-500">{item.category}</p>
                    
                    {/* Prix */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-semibold text-purple-600">
                        {formatPrice(item.unitPrice)}
                      </span>
                      {item.isOnSale && (
                        <span className="text-xs text-gray-500 line-through">
                          {formatPrice(item.originalPrice)}
                        </span>
                      )}
                    </div>

                    {/* Contrôles de quantité */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || updatingItems.has(item._id)}
                          className="p-1 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <FaMinus size={12} />
                        </button>
                        
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        
                        <button
                          onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                          disabled={updatingItems.has(item._id)}
                          className="p-1 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <FaPlus size={12} />
                        </button>
                      </div>

                      {/* Bouton supprimer */}
                      <button
                        onClick={() => handleRemoveItem(item._id)}
                        disabled={updatingItems.has(item._id)}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Supprimer"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>

                    {/* Total pour cet article */}
                    <div className="text-right mt-1">
                      <span className="text-sm font-medium text-gray-900">
                        Total: {formatPrice(item.totalPrice)}
                      </span>
                    </div>

                    {/* Indicateur de chargement */}
                    {updatingItems.has(item._id) && (
                      <div className="mt-1">
                        <div className="animate-pulse bg-gray-200 h-1 rounded"></div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Bouton vider le panier */}
              <button
                onClick={handleClearCart}
                disabled={loading}
                className="w-full text-red-600 hover:text-red-800 text-sm font-medium py-2 disabled:opacity-50 transition-colors"
              >
                <FaTrash className="inline mr-1" />
                Vider le panier
              </button>
            </div>
          )}
        </div>

        {/* Footer avec total et checkout */}
        {cart.items.length > 0 && (
          <div className="border-t bg-gray-50 p-4 space-y-4">
            {/* Résumé */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Sous-total ({cart.totalItems} articles)</span>
                <span>{formatPrice(cart.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Frais de livraison</span>
                <span>À calculer</span>
              </div>
              <hr />
              <div className="flex justify-between font-semibold">
                <span>Total estimé</span>
                <span className="text-purple-600">{formatPrice(cart.totalAmount)}</span>
              </div>
            </div>

            {/* Informations de sécurité */}
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <FaLock />
              <span>Paiement sécurisé avec Stripe</span>
            </div>

            {/* Boutons d'action */}
            <div className="space-y-2">
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FaCreditCard />
                Procéder au paiement
              </button>
              
              <button
                onClick={onClose}
                className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Continuer mes achats
              </button>
            </div>

            {/* Avantages */}
            <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <FaShippingFast />
                <span>Livraison rapide</span>
              </div>
              <div className="flex items-center gap-1">
                <FaLock />
                <span>Paiement sécurisé</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default CartSidebar;