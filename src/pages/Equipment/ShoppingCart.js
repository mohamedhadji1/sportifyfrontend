import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { 
  FiShoppingCart, 
  FiPlus, 
  FiMinus, 
  FiTrash2, 
  FiCreditCard,
  FiArrowLeft,
  FiPackage,
  FiAlertCircle,
  FiCheckCircle
} from 'react-icons/fi';
import { useToast } from '../../shared/ui/components/Toast';
import Navbar from '../../core/layout/Navbar';

// Check if Stripe should be enabled (disable for development or restricted networks)
const STRIPE_ENABLED = process.env.REACT_APP_STRIPE_ENABLED === 'true' && process.env.NODE_ENV === 'production';

// Lazy load Stripe only when needed and enabled
let stripePromise = null;
const getStripe = async () => {
  if (!STRIPE_ENABLED) {
    return null;
  }
  
  if (!stripePromise) {
    try {
      const { loadStripe } = await import('@stripe/stripe-js');
      stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_51QaWKxLJ9KUJCFEbXVZVZVZVZ');
    } catch (error) {
      console.warn('Stripe could not be loaded:', error);
      return null;
    }
  }
  return stripePromise;
};

const ShoppingCart = ({ onBack, onCheckout }) => {
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState('cart'); // cart, checkout, payment
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    country: 'Tunisia',
    phone: ''
  });
  const [paymentClientSecret, setPaymentClientSecret] = useState('');

  useEffect(() => {
    // Only fetch cart if user is authenticated and not loading
    if (!authLoading && user) {
      fetchCart();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user]);

  // Show loading spinner while auth is being checked
  if (authLoading) {
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
            <p className="text-white/60 mt-6">Loading your cart...</p>
          </div>
        </div>
      </>
    );
  }

  // Show error message if user is not authenticated
  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm max-w-md">
            <FiAlertCircle className="mx-auto h-16 w-16 text-red-400 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
            <p className="text-white/70">Please log in to view your shopping cart.</p>
          </div>
        </div>
      </>
    );
  }

  const fetchCart = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5009/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCart(data.data || null);
      } else {
        console.error('Failed to fetch cart:', response.status, response.statusText);
        setCart(null);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5009/api/cart/update/${itemId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: newQuantity })
      });

      if (response.ok) {
        fetchCart(); // Refresh cart
      } else {
        const error = await response.json().catch(() => ({}));
        addToast({ title: 'Error updating quantity', description: error.message || 'Error updating quantity', tone: 'error' })
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const removeItem = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5009/api/cart/remove/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchCart(); // Refresh cart
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const clearCart = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5009/api/cart/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchCart(); // Refresh cart
        addToast({ title: 'Cart cleared', tone: 'success' })
      } else {
        const err = await response.json().catch(() => ({}))
        addToast({ title: 'Failed to clear cart', description: err.message || 'Failed to clear cart', tone: 'error' })
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      addToast({ title: 'Error', description: 'Error clearing cart', tone: 'error' })
    }
  };

  const proceedToCheckout = async () => {
    try {
      setProcessing(true);
      
      // Validate shipping address if in checkout step
      if (step === 'checkout') {
        if (!shippingAddress.street || !shippingAddress.city) {
          addToast({ title: 'Missing address', description: 'Please fill in all shipping address fields', tone: 'error' })
          setProcessing(false);
          return;
        }
      }

      // Use the cart checkout endpoint
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5009/api/cart/checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shippingAddress,
          currency: 'EUR'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.clientSecret) {
          setPaymentClientSecret(data.data.clientSecret);
          setStep('payment');
          
          // If onCheckout callback exists, call it
          if (onCheckout) {
            onCheckout(data.data);
          }
        } else {
          throw new Error(data.message || 'Failed to create checkout session');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Checkout failed');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      addToast({ title: 'Checkout failed', description: error.message || 'Checkout failed. Please try again.', tone: 'error' })
    } finally {
      setProcessing(false);
    }
  };

  // simulatePayment removed — PaymentSection uses onSuccess or backend confirm

  const renderCartItems = () => {
    if (!cart || cart.isEmpty) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 rounded-full mb-6">
            <FiShoppingCart className="h-12 w-12 text-white/40" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Your cart is empty</h3>
          <p className="text-white/60">Start shopping to add items to your cart.</p>
        </motion.div>
      );
    }

    return (
      <div className="space-y-4">
        {cart.items.map((item, index) => (
          <motion.div
            key={item._id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center space-x-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all backdrop-blur-sm"
          >
            {/* Item Image */}
            <div className="flex-shrink-0 w-20 h-20 bg-white/10 rounded-xl overflow-hidden">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.productName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.log('Image load error for cart item:', item.productName);
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center"><svg class="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg></div>`;
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FiPackage className="w-8 h-8 text-white/40" />
                </div>
              )}
            </div>

            {/* Item Details */}
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-white truncate">{item.productName}</h4>
              <p className="text-sm text-white/60">{item.category}</p>
              <p className="text-base font-semibold text-blue-400 mt-1">${item.unitPrice}</p>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center space-x-2 bg-white/10 rounded-lg p-1">
              <button
                onClick={() => updateQuantity(item._id, item.quantity - 1)}
                disabled={item.quantity <= 1}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <FiMinus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center text-sm font-bold text-white">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item._id, item.quantity + 1)}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <FiPlus className="w-4 h-4" />
              </button>
            </div>

            {/* Total Price */}
            <div className="text-lg font-bold text-white w-24 text-right">
              ${item.totalPrice.toFixed(2)}
            </div>

            {/* Remove Button */}
            <button
              onClick={() => removeItem(item._id)}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
            >
              <FiTrash2 className="w-5 h-5" />
            </button>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderCheckoutForm = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <FiPackage className="w-6 h-6 mr-2 text-blue-400" />
          Shipping Address
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Street Address</label>
            <input
              type="text"
              value={shippingAddress.street}
              onChange={(e) => setShippingAddress(prev => ({ ...prev, street: e.target.value }))}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
              placeholder="Enter your street address"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">City</label>
              <input
                type="text"
                value={shippingAddress.city}
                onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                placeholder="City"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Postal Code</label>
              <input
                type="text"
                value={shippingAddress.postalCode}
                onChange={(e) => setShippingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                placeholder="Postal Code"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Country</label>
            <select
              value={shippingAddress.country}
              onChange={(e) => setShippingAddress(prev => ({ ...prev, country: e.target.value }))}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm cursor-pointer transition-all appearance-none"
            >
              <option value="Tunisia" className="bg-gray-900">Tunisia</option>
              <option value="Morocco" className="bg-gray-900">Morocco</option>
              <option value="Algeria" className="bg-gray-900">Algeria</option>
              <option value="Other" className="bg-gray-900">Other</option>
            </select>
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex justify-center items-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-400 rounded-full animate-spin" 
                 style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-blue-900/50 to-purple-900/50 py-16">
          <div className="absolute inset-0 bg-black/30"></div>
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
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Shopping Cart</h1>
                  <p className="text-lg text-white/80">
                    {cart && !cart.isEmpty ? (
                      <span className="flex items-center">
                        <FiShoppingCart className="w-5 h-5 mr-2" />
                        {cart.totalItems} item(s) • ${cart.totalAmount.toFixed(2)}
                      </span>
                    ) : (
                      'Your cart is empty'
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <FiPackage className="w-6 h-6 mr-2 text-blue-400" />
                    {step === 'cart' ? 'Cart Items' : step === 'checkout' ? 'Shipping Information' : 'Payment'}
                  </h2>
                  {cart && !cart.isEmpty && step === 'cart' && (
                    <button
                      onClick={clearCart}
                      className="text-sm text-red-400 hover:text-red-300 px-4 py-2 rounded-lg hover:bg-red-500/10 transition-all"
                    >
                      Clear Cart
                    </button>
                  )}
                </div>

                {step === 'cart' && renderCartItems()}
                {step === 'checkout' && renderCheckoutForm()}
                {step === 'payment' && (
                  <PaymentSection 
                    clientSecret={paymentClientSecret}
                    onSuccess={() => {
                      addToast({ title: 'Payment successful!', tone: 'success' })
                      fetchCart();
                      setStep('cart');
                    }}
                  />
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6 backdrop-blur-sm sticky top-24"
              >
                <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>
                
                {cart && !cart.isEmpty ? (
                  <div className="space-y-4">
                    <div className="space-y-3 pb-4 border-b border-white/10">
                      <div className="flex justify-between text-base">
                        <span className="text-white/70">Items ({cart.totalItems})</span>
                        <span className="text-white font-semibold">${cart.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-base">
                        <span className="text-white/70">Shipping</span>
                        <span className="text-green-400 font-semibold">Free</span>
                      </div>
                    </div>
                    <div className="pt-2 flex justify-between text-xl font-bold">
                      <span className="text-white">Total</span>
                      <span className="text-blue-400">${cart.totalAmount.toFixed(2)}</span>
                    </div>

                    <div className="pt-6 space-y-3">
                      {step === 'cart' && (
                        <button
                          onClick={() => setStep('checkout')}
                          disabled={cart.isEmpty}
                          className="w-full flex items-center justify-center px-6 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
                        >
                          <FiCreditCard className="w-5 h-5 mr-2" />
                          Proceed to Checkout
                        </button>
                      )}
                      
                      {step === 'checkout' && (
                        <>
                          <button
                            onClick={proceedToCheckout}
                            disabled={processing || !shippingAddress.street || !shippingAddress.city || !shippingAddress.postalCode}
                            className="w-full flex items-center justify-center px-6 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
                          >
                            {processing ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <FiCreditCard className="w-5 h-5 mr-2" />
                                Continue to Payment
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setStep('cart')}
                            className="w-full px-6 py-4 rounded-xl text-base font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
                          >
                            Back to Cart
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FiShoppingCart className="mx-auto h-16 w-16 text-white/20 mb-4" />
                    <p className="text-white/60">Your cart is empty</p>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Payment Section Component - Only loads Stripe when needed and enabled
const PaymentSection = ({ clientSecret, onSuccess }) => {
  const [stripe, setStripe] = useState(null);
  const [stripeError, setStripeError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializePayment = async () => {
      if (!STRIPE_ENABLED) {
        setLoading(false);
        return;
      }

      try {
        const stripeInstance = await getStripe();
        setStripe(stripeInstance);
      } catch (error) {
        console.error('Failed to load Stripe:', error);
        setStripeError('Failed to load payment system. Please check your network connection.');
      } finally {
        setLoading(false);
      }
    };

    initializePayment();
  }, []);

  // Show development payment form when Stripe is disabled
  if (!STRIPE_ENABLED) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 backdrop-blur-sm"
      >
        <div className="flex items-start">
          <FiAlertCircle className="text-yellow-400 mt-1 mr-3 flex-shrink-0 w-6 h-6" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-yellow-400 mb-2">Development Mode</h3>
            <p className="text-yellow-200/80 mb-6 text-sm">
              Payment processing is disabled in development mode. In production, this would integrate with Stripe for secure payments.
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Card Number</label>
                  <input 
                    type="text" 
                    placeholder="4242 4242 4242 4242" 
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white/50"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Expiry</label>
                  <input 
                    type="text" 
                    placeholder="MM/YY" 
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white/50"
                    disabled
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  alert('Demo payment completed successfully!');
                  onSuccess();
                }}
                className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-4 px-4 rounded-xl hover:from-green-500 hover:to-green-400 transition-all font-bold transform hover:scale-105 flex items-center justify-center"
              >
                <FiCheckCircle className="w-5 h-5 mr-2" />
                Complete Demo Payment
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="relative mx-auto w-16 h-16 mb-4">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-400 rounded-full animate-spin" 
               style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        <p className="text-white/60">Loading secure payment form...</p>
      </div>
    );
  }

  if (stripeError || !stripe) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8 bg-red-500/10 border border-red-500/30 rounded-xl p-6"
      >
        <FiAlertCircle className="mx-auto w-12 h-12 text-red-400 mb-4" />
        <div className="text-red-300 mb-4 font-semibold">
          {stripeError || 'Payment system unavailable'}
        </div>
        <div className="text-sm text-white/60 mb-6">
          <p className="mb-2">You can still complete your order using alternative payment methods.</p>
          <p>Contact support if this issue persists.</p>
        </div>
        <button
          onClick={() => {
            alert('Order submitted for manual processing!');
            onSuccess();
          }}
          className="bg-gradient-to-r from-gray-600 to-gray-500 text-white py-3 px-6 rounded-xl hover:from-gray-500 hover:to-gray-400 font-bold transition-all transform hover:scale-105"
        >
          Submit Order for Manual Processing
        </button>
      </motion.div>
    );
  }

  // Load Stripe Elements dynamically
  const StripePaymentForm = React.lazy(async () => {
    const { Elements, useStripe, useElements, CardElement } = await import('@stripe/react-stripe-js');
    
    const PaymentForm = ({ clientSecret, onSuccess }) => {
      const stripe = useStripe();
      const elements = useElements();
      const [processing, setProcessing] = useState(false);
      const [error, setError] = useState('');

      const handleSubmit = async (event) => {
        event.preventDefault();
        if (!stripe || !elements) return;

        setProcessing(true);
        setError('');

        const cardElement = elements.getElement(CardElement);

        try {
          const { error } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
              card: cardElement,
            }
          });

          if (error) {
            setError(error.message);
          } else {
            onSuccess();
          }
        } catch (err) {
          console.error('Payment error:', err);
          setError('An error occurred during payment processing.');
        } finally {
          setProcessing(false);
        }
      };

      return (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl"
            >
              {error}
            </motion.div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-white/80 mb-3">
              Card Details
            </label>
            <div className="bg-white/10 border border-white/20 rounded-xl p-4 backdrop-blur-sm">
              <CardElement 
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#ffffff',
                      '::placeholder': {
                        color: 'rgba(255, 255, 255, 0.5)',
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!stripe || processing}
            className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-4 px-4 rounded-xl hover:from-green-500 hover:to-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold transform hover:scale-105 flex items-center justify-center"
          >
            {processing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <FiCheckCircle className="w-5 h-5 mr-2" />
                Pay Now
              </>
            )}
          </button>
        </form>
      );
    };

    return {
      default: ({ clientSecret, onSuccess }) => (
        <Elements stripe={stripe}>
          <PaymentForm clientSecret={clientSecret} onSuccess={onSuccess} />
        </Elements>
      )
    };
  });

  return (
    <React.Suspense fallback={
      <div className="text-center py-8">
        <div className="relative mx-auto w-16 h-16 mb-4">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
        <p className="text-white/60">Loading payment form...</p>
      </div>
    }>
      <StripePaymentForm clientSecret={clientSecret} onSuccess={onSuccess} />
    </React.Suspense>
  );
};

export default ShoppingCart;