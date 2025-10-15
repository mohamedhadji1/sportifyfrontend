import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { 
  FiCreditCard, 
  FiLock, 
  FiCheck,
  FiAlert,
  FiArrowLeft,
  FiShoppingCart
} from 'react-icons/fi';

// Initialize Stripe
const stripePromise = loadStripe('pk_test_51QaWKxLJ9KUJCFEbKQfQ6sGlP7bCZyY3kKBLe6n7oVN2JQjPLM5zHbq1xDJ3ZN8HtF7Ky3GkZ4rS9WqV1Oc2Kl2rR00K7dCzJvB');

const CheckoutForm = ({ cart, onPaymentSuccess, onBack }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [succeeded, setSucceeded] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');

  useEffect(() => {
    // Create payment intent when component mounts
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://sportify-equipement.onrender.com/api/cart/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shippingAddress: {
            street: '123 Default Street',
            city: 'Tunis',
            postalCode: '1000',
            country: 'Tunisia'
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        setClientSecret(result.data.clientSecret);
        setPaymentIntentId(result.data.paymentIntentId);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error creating payment intent');
      }
    } catch (err) {
      console.error('Error creating payment intent:', err);
      setError('Error setting up payment');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: user.name || user.username || 'Customer',
          email: user.email || 'customer@example.com',
        },
      }
    });

    if (error) {
      console.error('Payment failed:', error);
      setError(error.message);
      setProcessing(false);
    } else {
      console.log('Payment succeeded:', paymentIntent);
      setSucceeded(true);
      setProcessing(false);
      
      // Confirm payment on backend
      await confirmPayment(paymentIntent.id);
    }
  };

  const confirmPayment = async (paymentIntentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://sportify-equipement.onrender.com/api/cart/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ paymentIntentId })
      });

      if (response.ok) {
        const result = await response.json();
        onPaymentSuccess(result.data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error confirming payment');
      }
    } catch (err) {
      console.error('Error confirming payment:', err);
      setError('Error confirming payment');
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  if (succeeded) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiCheck className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-green-800 mb-2">Payment Successful!</h2>
        <p className="text-gray-600 mb-6">Your order has been processed successfully.</p>
        <button
          onClick={() => window.location.href = '/equipment/shop'}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {error && (
        <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
          <FiAlert className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          <FiArrowLeft className="w-4 h-4 mr-2 inline" />
          Back to Cart
        </button>
        
        <button
          type="submit"
          disabled={!stripe || processing || !clientSecret}
          className="flex-1 flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
              Processing...
            </>
          ) : (
            <>
              <FiLock className="w-4 h-4 mr-2" />
              Pay {cart?.finalAmount?.toFixed(2) || cart?.totalAmount?.toFixed(2)} €
            </>
          )}
        </button>
      </div>

      <div className="text-center text-sm text-gray-500">
        <FiLock className="w-4 h-4 inline mr-1" />
        Your payment information is secure and encrypted
      </div>
    </form>
  );
};

const Payment = ({ onBack }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentStep, setPaymentStep] = useState('review'); // 'review', 'payment', 'success'
  const [orderResult, setOrderResult] = useState(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://sportify-equipement.onrender.com/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setCart(result.data);
      } else {
        console.error('Error fetching cart');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (result) => {
    setOrderResult(result);
    setPaymentStep('success');
    setCart(null); // Clear cart since payment succeeded
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Please Log In</h2>
          <p className="text-muted-foreground">You need to be logged in to make a payment.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <FiShoppingCart className="w-24 h-24 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-gray-600 mb-4">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add some items to your cart before checkout.</p>
          <button 
            onClick={() => window.location.href = '/equipment/shop'}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80"
          >
            Browse Equipment
          </button>
        </div>
      </div>
    );
  }

  if (paymentStep === 'success') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-card border border-border rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheck className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-green-800 mb-4">Payment Successful!</h1>
          <p className="text-lg text-gray-600 mb-2">Thank you for your purchase!</p>
          {orderResult && orderResult.orderNumber && (
            <p className="text-sm text-gray-500 mb-6">
              Order Number: <span className="font-mono font-medium">{orderResult.orderNumber}</span>
            </p>
          )}
          <div className="space-y-4">
            <button
              onClick={() => window.location.href = '/equipment/orders'}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80"
            >
              View My Orders
            </button>
            <button
              onClick={() => window.location.href = '/equipment/shop'}
              className="w-full px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Checkout</h1>
        <p className="text-muted-foreground">Review your order and complete payment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-6">Order Summary</h2>
          
          <div className="space-y-4 mb-6">
            {cart.items.map((item) => (
              <div key={item._id} className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  {item.image ? (
                    <img src={item.image} alt={item.productName} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <FiShoppingCart className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-card-foreground">{item.productName}</h3>
                  <p className="text-sm text-muted-foreground">{item.category}</p>
                  <p className="text-sm font-medium">
                    {item.quantity} × {item.unitPrice.toFixed(2)} € = {item.totalPrice.toFixed(2)} €
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{cart.totalAmount.toFixed(2)} €</span>
            </div>
            {cart.discount && cart.discount.amount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({cart.discount.code})</span>
                <span>-{cart.discount.amount.toFixed(2)} €</span>
              </div>
            )}
            {cart.discount && cart.discount.percentage > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({cart.discount.code})</span>
                <span>-{(cart.totalAmount * cart.discount.percentage / 100).toFixed(2)} €</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium">Free</span>
            </div>
            <div className="border-t border-border pt-2">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{(cart.finalAmount || cart.totalAmount).toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-6 flex items-center">
            <FiCreditCard className="w-6 h-6 mr-2" />
            Payment Details
          </h2>
          
          <Elements stripe={stripePromise}>
            <CheckoutForm 
              cart={cart} 
              onPaymentSuccess={handlePaymentSuccess}
              onBack={onBack}
            />
          </Elements>
        </div>
      </div>
    </div>
  );
};

export default Payment;