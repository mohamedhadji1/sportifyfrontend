
import React, { useState, useEffect } from 'react';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Shield,
  CheckCircle,
  AlertCircle,
  X,
  Lock,
  Clock,
  MapPin,
  Users
} from 'lucide-react';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_51SAeyDCdez1uExMaKixZi6sycuFlQQ7gFXrquUq9fdu1HojrpS1uNrXbq1oehIefNSY63ZmDPr0fJ6NltHTeqmkR00jNTpHKZu');

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#ffffff',
      fontFamily: '"Inter", sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#9CA3AF',
      },
      iconColor: '#ffffff',
    },
    invalid: {
      color: '#EF4444',
      iconColor: '#EF4444',
    },
  },
  hidePostalCode: true,
};

// Payment form component
const PaymentForm = ({ 
  bookingDetails, 
  onPaymentSuccess, 
  onPaymentError, 
  onClose, 
  loading: parentLoading 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');

  useEffect(() => {
    // Create payment intent when component mounts
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('💳 Creating payment intent with bookingDetails:', bookingDetails);
      console.log('💳 Booking ID:', bookingDetails?._id);
      console.log('💳 Total Price:', bookingDetails?.totalPrice);

      if (!bookingDetails?._id || !bookingDetails?.totalPrice) {
        throw new Error('Missing booking ID or total price');
      }

      const token = localStorage.getItem('token');
      const paymentData = {
        bookingId: bookingDetails._id,
        amount: bookingDetails.totalPrice,
        currency: 'eur'
      };
      
      console.log('💳 Payment data being sent:', paymentData);

      const response = await fetch('http://localhost:5005/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();
      console.log('💳 Payment intent response:', data);

      if (data.success) {
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
        console.log('✅ Payment intent created successfully');
      } else {
        console.error('❌ Payment intent creation failed:', data);
        throw new Error(data.message || 'Failed to create payment intent');
      }
    } catch (err) {
      console.error('Payment intent creation error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);
    setError(null);

    const card = elements.getElement(CardElement);

    // Confirm payment with Stripe
    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: card,
          billing_details: {
            name: bookingDetails.userDetails?.name || 'Customer',
            email: bookingDetails.userDetails?.email || '',
          },
        },
      }
    );

    if (stripeError) {
      setError(stripeError.message);
      setLoading(false);
      return;
    }

    if (paymentIntent.status === 'succeeded') {
      // Confirm payment on backend
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5005/api/payments/confirm-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            bookingId: bookingDetails._id
          })
        });

        const confirmData = await response.json();

        if (confirmData.success) {
          setSuccess(true);
          setTimeout(() => {
            onPaymentSuccess({
              ...bookingDetails,
              paymentStatus: 'paid',
              paidAt: new Date()
            });
          }, 2000);
        } else {
          throw new Error(confirmData.message || 'Failed to confirm payment');
        }
      } catch (err) {
        setError(err.message);
      }
    }

    setLoading(false);
  };

  if (success) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="text-center py-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle size={40} className="text-white" />
        </motion.div>
        <h3 className="text-2xl font-bold text-white mb-2">Payment Successful!</h3>
        <p className="text-white/70">Your booking has been confirmed and paid.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <CreditCard size={24} className="text-white" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Complete Payment</h3>
        <p className="text-white/70">Secure payment powered by Stripe</p>
      </div>

      {/* Booking Summary */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h4 className="text-lg font-semibold text-white mb-4">Booking Summary</h4>
        <div className="space-y-3">
          <div className="flex items-center text-white/80">
            <MapPin size={16} className="mr-3 text-blue-400" />
            <span>{bookingDetails.courtDetails?.name}</span>
          </div>
          <div className="flex items-center text-white/80">
            <Clock size={16} className="mr-3 text-green-400" />
            <span>
              {new Date(bookingDetails.date).toLocaleDateString()} at {bookingDetails.startTime}
            </span>
          </div>
          <div className="flex items-center text-white/80">
            <Users size={16} className="mr-3 text-purple-400" />
            <span>{bookingDetails.teamSize} players</span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <span className="text-white font-semibold">Total Amount:</span>
            <span className="text-2xl font-bold text-green-400">
              {bookingDetails.totalPrice} DT
            </span>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <label className="block text-white font-medium mb-4">
            <div className="flex items-center">
              <CreditCard size={20} className="mr-2" />
              Card Information
            </div>
          </label>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center text-red-400"
          >
            <AlertCircle size={20} className="mr-3 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Security Info */}
        <div className="flex items-center justify-center text-white/60 text-sm">
          <Lock size={16} className="mr-2" />
          <span>Your payment information is secure and encrypted</span>
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={!stripe || loading || parentLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Processing Payment...</span>
            </>
          ) : (
            <>
              <Shield size={20} />
              <span>Pay {bookingDetails.totalPrice} DT</span>
            </>
          )}
        </motion.button>
      </form>
    </div>
  );
};

// Main payment modal component
const StripePaymentModal = ({ 
  isOpen, 
  onClose, 
  bookingDetails, 
  onPaymentSuccess 
}) => {
  const [error, setError] = useState(null);

  const handlePaymentSuccess = (updatedBooking) => {
    onPaymentSuccess(updatedBooking);
    onClose();
  };

  const handlePaymentError = (error) => {
    setError(error);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-white/10 backdrop-blur-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">Secure Payment</h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={20} className="text-white" />
            </motion.button>
          </div>

          {/* Content */}
          <div className="p-6">
            <Elements stripe={stripePromise}>
              <PaymentForm
                bookingDetails={bookingDetails}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
                onClose={onClose}
                loading={false}
              />
            </Elements>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StripePaymentModal;