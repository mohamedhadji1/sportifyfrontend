import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../../hooks/useAuth';
import { 
  FiCreditCard, 
  FiLock, 
  FiShield, 
  FiArrowLeft,
  FiCheck,
  FiAlertCircle,
  FiPackage,
  FiTrendingUp,
  FiCheckCircle
} from 'react-icons/fi';
import Navbar from '../../core/layout/Navbar';

// Initialiser Stripe avec votre clé publique
const stripePromise = loadStripe('pk_test_51SBphvPO3VeDxB1OQI0k5zyX9TsN5xZCSukEajLoIX3Fdgk4T40Olfbpzg604lKHPON1yZXa2GtCMcGhhhVutscI00lS3YZOpk');

// Composant de formulaire de paiement
const CheckoutForm = ({ onBack, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [cart, setCart] = useState(null);
  const [orderNumber, setOrderNumber] = useState('');
  
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: 'Tunis',
    postalCode: '',
    country: 'Tunisia',
    phone: ''
  });

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://sportify-equipement.onrender.com/api/cart', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success && data.data.items && data.data.items.length > 0) {
        setCart(data.data);
      } else {
        setPaymentError('Your cart is empty. Please add items before checkout.');
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setPaymentError('Error loading cart data');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!stripe || !elements) {
      setPaymentError('Stripe not loaded');
      return;
    }

    if (!cart || cart.items.length === 0) {
      setPaymentError('Cart is empty');
      return;
    }

    // Validate shipping address
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.postalCode) {
      setPaymentError('Please fill in all shipping address fields');
      return;
    }

    setProcessing(true);
    setPaymentError('');

    try {
      // Step 1: Create checkout session
      const checkoutResponse = await fetch('https://sportify-equipement.onrender.com/api/cart/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          shippingAddress,
          currency: 'TND'
        })
      });

      const checkoutData = await checkoutResponse.json();
      
      if (!checkoutData.success) {
        throw new Error(checkoutData.message || 'Failed to create checkout session');
      }

      // Step 2: Get CardElement
      const cardElement = elements.getElement(CardElement);

      // Step 3: Create Payment Method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: user?.username || 'Customer',
          address: {
            line1: shippingAddress.street,
            city: shippingAddress.city,
            postal_code: shippingAddress.postalCode,
            country: 'TN', // Code pays pour la Tunisie
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // Step 4: Confirm Payment Intent
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        checkoutData.data.clientSecret,
        {
          payment_method: paymentMethod.id
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      // Step 5: Confirm payment with backend
      const confirmResponse = await fetch('https://sportify-equipement.onrender.com/api/cart/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          paymentIntentId: paymentIntent.id
        })
      });

      const confirmData = await confirmResponse.json();
      
      if (confirmData.success) {
        setPaymentSuccess(true);
        setOrderNumber(confirmData.data.orderNumber);
        if (onSuccess) {
          onSuccess(confirmData.data.order);
        }
      } else {
        throw new Error(confirmData.message || 'Payment confirmation failed');
      }

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError(error.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (price) => {
    return `${parseFloat(price).toFixed(3)} TND`;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-400 rounded-full animate-spin" 
                   style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <p className="text-white/60 mt-6">Loading secure checkout...</p>
          </div>
        </div>
      </>
    );
  }

  if (paymentSuccess) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm p-8 text-center">
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg"
              >
                <FiCheck className="w-10 h-10 text-white" />
              </motion.div>
              
              <h2 className="text-3xl font-bold text-white mb-3">
                Payment Successful!
              </h2>
              
              <p className="text-white/70 mb-6 text-lg">
                Your order has been confirmed and will be processed shortly.
              </p>
              
              {orderNumber && (
                <div className="bg-white/10 border border-white/20 p-4 rounded-xl mb-6">
                  <p className="text-sm text-white/60 mb-1">Order Number</p>
                  <p className="font-mono font-bold text-xl text-blue-400">{orderNumber}</p>
                </div>
              )}

              {/* Security badges */}
              <div className="flex items-center justify-center space-x-4 mb-6 text-white/60 text-sm">
                <div className="flex items-center">
                  <FiShield className="w-4 h-4 mr-1" />
                  <span>Secure</span>
                </div>
                <div className="flex items-center">
                  <FiLock className="w-4 h-4 mr-1" />
                  <span>Encrypted</span>
                </div>
                <div className="flex items-center">
                  <FiCheckCircle className="w-4 h-4 mr-1" />
                  <span>Verified</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => window.location.href = '/marketplace'}
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-xl hover:from-blue-500 hover:to-blue-400 transition-all duration-200 transform hover:scale-105"
                >
                  Continue Shopping
                </button>
                <button
                  onClick={onBack}
                  className="w-full py-4 px-6 bg-white/10 border border-white/20 text-white font-bold rounded-xl hover:bg-white/20 transition-all"
                >
                  Back to Marketplace
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Hero Section with Security Indicators */}
        <div className="relative bg-gradient-to-r from-blue-900/50 to-purple-900/50 py-16">
          <div className="absolute inset-0 bg-black/30"></div>
          
          {/* Animated security badge */}
          <div className="absolute top-8 right-8 hidden lg:block">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 bg-green-500/20 border border-green-500/30 rounded-full px-4 py-2 backdrop-blur-sm"
            >
              <FiShield className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-semibold text-sm">SSL Secured</span>
            </motion.div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-6">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="flex items-center text-white/80 hover:text-white transition-all hover:scale-105 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm"
                  >
                    <FiArrowLeft className="w-5 h-5 mr-2" />
                    Back
                  </button>
                )}
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 flex items-center">
                    <FiLock className="w-10 h-10 mr-3 text-green-400" />
                    Secure Checkout
                  </h1>
                  <p className="text-lg text-white/80 flex items-center">
                    <FiShield className="w-4 h-4 mr-2" />
                    256-bit SSL encryption • PCI DSS compliant
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8 flex flex-wrap gap-4"
            >
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                <FiLock className="w-5 h-5 text-blue-400 mr-2" />
                <span className="text-white text-sm font-medium">Secure Payment</span>
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                <FiShield className="w-5 h-5 text-green-400 mr-2" />
                <span className="text-white text-sm font-medium">Data Protection</span>
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                <FiCheckCircle className="w-5 h-5 text-purple-400 mr-2" />
                <span className="text-white text-sm font-medium">Verified by Stripe</span>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Shipping Information */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm p-6"
            >
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <FiPackage className="w-6 h-6 mr-2 text-blue-400" />
                Shipping Address
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                    placeholder="Enter your street address"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                      placeholder="City"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.postalCode}
                      onChange={(e) => setShippingAddress({...shippingAddress, postalCode: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                      placeholder="Postal Code"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Country
                  </label>
                  <select
                    value={shippingAddress.country}
                    onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm cursor-pointer transition-all appearance-none"
                  >
                    <option value="Tunisia" className="bg-gray-900">Tunisia</option>
                    <option value="Morocco" className="bg-gray-900">Morocco</option>
                    <option value="Algeria" className="bg-gray-900">Algeria</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={shippingAddress.phone}
                    onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                    placeholder="+216 XX XXX XXX"
                  />
                </div>
              </div>
            </motion.div>

            {/* Payment Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm p-6"
            >
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <FiCreditCard className="w-6 h-6 mr-2 text-green-400" />
                Payment Information
              </h2>
              
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6 backdrop-blur-sm">
                <div className="flex items-center text-green-400">
                  <FiShield className="w-5 h-5 mr-2" />
                  <span className="text-sm">
                    Secure payment via Stripe. All data is encrypted.
                  </span>
                </div>
              </div>

              {/* Formulaire de carte bancaire Stripe */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Informations de carte bancaire
                </label>
                <div className="bg-white/10 border border-white/20 rounded-xl p-4 backdrop-blur-sm">
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#ffffff',
                          '::placeholder': {
                            color: 'rgba(255, 255, 255, 0.4)',
                          },
                          backgroundColor: 'transparent',
                        },
                        invalid: {
                          color: '#ef4444',
                        },
                      },
                      hidePostalCode: false,
                    }}
                  />
                </div>
                <p className="text-xs text-white/60 mt-2">
                  Votre paiement sera traité en Dinar Tunisien (TND)
                </p>
              </div>

              {paymentError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 backdrop-blur-sm"
                >
                  <div className="flex items-center text-red-400">
                    <FiAlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span className="text-sm">{paymentError}</span>
                  </div>
                </motion.div>
              )}

              <motion.button
                onClick={handlePayment}
                disabled={processing || !cart || cart.items.length === 0 || !stripe}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-semibold flex items-center justify-center hover:from-green-500 hover:to-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Traitement du paiement...
                  </>
                ) : (
                  <>
                    <FiLock className="w-5 h-5 mr-2" />
                    Payer {cart && formatPrice(cart.finalAmount || cart.totalAmount)}
                  </>
                )}
              </motion.button>
            </motion.div>
          </div>

          {/* Order Summary */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm p-6 sticky top-24"
            >
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <FiTrendingUp className="w-6 h-6 mr-2 text-purple-400" />
                Order Summary
              </h2>
              
              {cart && cart.items && cart.items.length > 0 ? (
                <div className="space-y-4">
                  {cart.items.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="flex justify-between items-center py-3 border-b border-white/10 last:border-b-0"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{item.productName}</h3>
                        <p className="text-sm text-white/60">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-blue-400">
                          {formatPrice(item.totalPrice)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  
                  <div className="pt-4 border-t border-white/20">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-white">Total</span>
                      <span className="text-xl font-bold text-green-400">
                        {formatPrice(cart.finalAmount || cart.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Security Badges */}
                  <div className="pt-4 mt-4 border-t border-white/10 space-y-2">
                    <div className="flex items-center text-xs text-white/60">
                      <FiShield className="w-4 h-4 mr-2 text-green-400" />
                      <span>Secure 256-bit SSL encryption</span>
                    </div>
                    <div className="flex items-center text-xs text-white/60">
                      <FiCheckCircle className="w-4 h-4 mr-2 text-blue-400" />
                      <span>PCI DSS compliant</span>
                    </div>
                    <div className="flex items-center text-xs text-white/60">
                      <FiLock className="w-4 h-4 mr-2 text-purple-400" />
                      <span>Money-back guarantee</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-white/60">No items in cart</p>
              )}
            </motion.div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

// Composant principal qui englobe le formulaire avec Stripe Elements
const StripeCheckout = ({ onBack, onSuccess }) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm onBack={onBack} onSuccess={onSuccess} />
    </Elements>
  );
};

export default StripeCheckout;