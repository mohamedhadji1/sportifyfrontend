import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaShoppingBag, FaEye, FaCreditCard, FaSpinner,
  FaCheck, FaTimes, FaExclamationTriangle, FaClock
} from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Button } from '../../shared/ui/components/Button';
import { Card } from '../../shared/ui/components/Card';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      
      const response = await axios.get(
        `http://localhost:5009/api/orders?${params}`,
        {
          headers: { 'x-auth-token': token }
        }
      );
      setOrders(response.data.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_approval': return 'text-yellow-400 bg-yellow-400/10';
      case 'approved': return 'text-green-400 bg-green-400/10';
      case 'rejected': return 'text-red-400 bg-red-400/10';
      case 'payment_pending': return 'text-blue-400 bg-blue-400/10';
      case 'paid': return 'text-green-400 bg-green-400/10';
      case 'completed': return 'text-green-500 bg-green-500/10';
      case 'cancelled': return 'text-gray-400 bg-gray-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending_approval': return <FaClock />;
      case 'approved': case 'paid': case 'completed': return <FaCheck />;
      case 'rejected': case 'cancelled': return <FaTimes />;
      case 'payment_pending': return <FaCreditCard />;
      default: return <FaSpinner className="animate-spin" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending_approval': return 'En attente d\'approbation';
      case 'approved': return 'Approuvé';
      case 'rejected': return 'Rejeté';
      case 'payment_pending': return 'En attente de paiement';
      case 'paid': return 'Payé';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  const handlePayOrder = async (order) => {
    try {
      const token = localStorage.getItem('token');
      
      // Créer le payment intent
      const response = await axios.post(
        'http://localhost:5009/api/payments/create-payment-intent',
        { orderId: order._id },
        {
          headers: { 'x-auth-token': token }
        }
      );

      if (response.data.success) {
        // Rediriger vers la page de paiement ou ouvrir Stripe
        // Pour l'instant, simulons un paiement réussi
        toast.success('Redirection vers le paiement...');
        // TODO: Intégrer Stripe Elements ici
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Erreur lors de la création du paiement');
    }
  };

  const filterOptions = [
    { value: 'all', label: 'Toutes' },
    { value: 'pending_approval', label: 'En attente' },
    { value: 'approved', label: 'Approuvées' },
    { value: 'payment_pending', label: 'À payer' },
    { value: 'completed', label: 'Terminées' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-900/20 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4"
          >
            <FaShoppingBag className="text-2xl text-white" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-white mb-2"
          >
            Mes Commandes
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400"
          >
            Suivez l'état de vos commandes d'équipements
          </motion.p>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-2 mb-6 justify-center"
        >
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              variant={filter === option.value ? 'primary' : 'ghost'}
              onClick={() => setFilter(option.value)}
              size="sm"
            >
              {option.label}
            </Button>
          ))}
        </motion.div>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : orders.length > 0 ? (
          <div className="grid gap-6">
            {orders.map((order, index) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card variant="glass" className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        Commande #{order.orderNumber}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{getStatusText(order.status)}</span>
                      </span>
                      
                      <span className="text-2xl font-bold text-green-400">
                        {order.totalAmount.toFixed(2)} €
                      </span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="text-white font-medium mb-2">Articles</h4>
                      <div className="space-y-1">
                        {order.items.slice(0, 3).map((item) => (
                          <div key={item._id} className="text-gray-300 text-sm flex justify-between">
                            <span>{item.equipmentTypeName} x{item.quantity}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(item.status)}`}>
                              {getStatusText(item.status)}
                            </span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-gray-400 text-xs">
                            +{order.items.length - 3} autres articles
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-white font-medium mb-2">Livraison</h4>
                      <div className="text-gray-300 text-sm">
                        <p>{order.delivery?.address?.street}</p>
                        <p>
                          {order.delivery?.address?.postalCode} {order.delivery?.address?.city}
                        </p>
                      </div>
                    </div>
                  </div>

                  {order.managerApproval?.approvalNotes && (
                    <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
                      <h4 className="text-white font-medium text-sm mb-1">
                        Note du manager:
                      </h4>
                      <p className="text-gray-300 text-sm">
                        {order.managerApproval.approvalNotes}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <FaEye className="mr-2" />
                      Voir détails
                    </Button>
                    
                    {order.status === 'payment_pending' && (
                      <Button
                        variant="primary"
                        onClick={() => handlePayOrder(order)}
                      >
                        <FaCreditCard className="mr-2" />
                        Payer maintenant
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <FaShoppingBag className="mx-auto text-6xl text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              Aucune commande trouvée
            </h3>
            <p className="text-gray-400">
              Vous n'avez pas encore passé de commande.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;