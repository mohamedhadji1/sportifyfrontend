import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaShoppingCart, FaTrash, FaPlus, FaMinus, 
  FaCreditCard, FaTimes, FaExclamationTriangle 
} from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Button } from '../../../shared/ui/components/Button';
import { Card } from '../../../shared/ui/components/Card';

const CartModal = ({ isOpen, onClose, onCheckout }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchCart();
    }
  }, [isOpen]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('https://sportify-equipement.onrender.com/api/cart', {
        headers: { 'x-auth-token': token }
      });
      setCart(response.data.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Erreur lors du chargement du panier');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      await removeItem(itemId);
      return;
    }

    try {
      setUpdating(prev => ({ ...prev, [itemId]: true }));
      const token = localStorage.getItem('token');
      
      const response = await axios.put(
        `https://sportify-equipement.onrender.com/api/cart/update/${itemId}`,
        { quantity: newQuantity },
        { headers: { 'x-auth-token': token } }
      );
      
      setCart(response.data.data);
      toast.success('Quantité mise à jour');
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const removeItem = async (itemId) => {
    try {
      setUpdating(prev => ({ ...prev, [itemId]: true }));
      const token = localStorage.getItem('token');
      
      const response = await axios.delete(
        `https://sportify-equipement.onrender.com/api/cart/remove/${itemId}`,
        { headers: { 'x-auth-token': token } }
      );
      
      setCart(response.data.data);
      toast.success('Article retiré du panier');
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const clearCart = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete('https://sportify-equipement.onrender.com/api/cart/clear', {
        headers: { 'x-auth-token': token }
      });
      
      setCart(response.data.data);
      toast.success('Panier vidé');
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleCheckout = () => {
    if (cart && cart.totalItems > 0) {
      onCheckout(cart);
    }
  };

  if (!isOpen) return null;

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
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-t-xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <FaShoppingCart className="mr-3 text-2xl" />
                <div>
                  <h2 className="text-2xl font-bold">Mon Panier</h2>
                  <p className="text-blue-100">
                    {cart?.totalItems || 0} article{(cart?.totalItems || 0) > 1 ? 's' : ''}
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
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : cart && cart.items && cart.items.length > 0 ? (
              <>
                {/* Cart Items */}
                <div className="space-y-4 mb-6">
                  <AnimatePresence>
                    {cart.items.map((item) => (
                      <motion.div
                        key={item._id}
                        initial={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-white font-semibold text-lg">
                              {item.equipmentTypeName}
                            </h3>
                            <p className="text-gray-400 text-sm mb-2">
                              Catégorie: {item.category}
                            </p>
                            {item.notes && (
                              <p className="text-gray-300 text-sm mb-2">
                                Note: {item.notes}
                              </p>
                            )}
                            <p className="text-blue-400 font-semibold">
                              {item.unitPrice.toFixed(2)} € x {item.quantity} = {item.totalPrice.toFixed(2)} €
                            </p>
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            {/* Quantity controls */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateQuantity(item._id, item.quantity - 1)}
                              disabled={updating[item._id] || item.quantity <= 1}
                              className="p-2"
                            >
                              <FaMinus className="text-xs" />
                            </Button>
                            
                            <span className="text-white font-semibold px-3 py-1 bg-gray-700 rounded">
                              {item.quantity}
                            </span>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateQuantity(item._id, item.quantity + 1)}
                              disabled={updating[item._id]}
                              className="p-2"
                            >
                              <FaPlus className="text-xs" />
                            </Button>

                            {/* Remove button */}
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => removeItem(item._id)}
                              disabled={updating[item._id]}
                              className="p-2 ml-2"
                            >
                              <FaTrash className="text-xs" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Total */}
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex justify-between items-center text-xl font-bold text-white mb-4">
                    <span>Total:</span>
                    <span className="text-green-400">{cart.totalAmount.toFixed(2)} €</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4">
                    <Button
                      variant="ghost"
                      onClick={clearCart}
                      disabled={cart.items.length === 0}
                      className="flex-1"
                    >
                      <FaTrash className="mr-2" />
                      Vider le panier
                    </Button>
                    
                    <Button
                      variant="primary"
                      onClick={handleCheckout}
                      disabled={cart.items.length === 0}
                      className="flex-1"
                    >
                      <FaCreditCard className="mr-2" />
                      Passer commande
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <FaShoppingCart className="mx-auto text-6xl text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                  Votre panier est vide
                </h3>
                <p className="text-gray-400 mb-6">
                  Ajoutez des équipements pour commencer vos achats
                </p>
                <Button variant="primary" onClick={onClose}>
                  Continuer les achats
                </Button>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default CartModal;