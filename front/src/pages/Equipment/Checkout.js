import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../shared/ui/components/Card';
import { Button } from '../../shared/ui/components/Button';
import LoadingSpinner from '../../shared/ui/components/LoadingSpinner';
import { 
  FiCreditCard, 
  FiLock, 
  FiShield, 
  FiTruck, 
  FiArrowLeft,
  FiCheck,
  FiAlertCircle
} from 'react-icons/fi';

// Dynamic Stripe imports
const loadStripe = async () => {
  try {
    const { loadStripe } = await import('@stripe/stripe-js');
    return loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx');
  } catch (error) {
    console.error('Failed to load Stripe:', error);
    return null;
  }
};

const loadStripeElements = async () => {
  try {
    const modules = await import('@stripe/react-stripe-js');
    return modules;
  } catch (error) {
    console.error('Failed to load Stripe Elements:', error);
    return null;
  }
};

const Checkout = ({ onBack, cart, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [stripe, setStripe] = useState(null);
  const [stripeElements, setStripeElements] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [cartData, setCartData] = useState(null);
  
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    postalCode: '',
    country: 'Tunisia',
    phone: ''
  });
  
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingAddress, setBillingAddress] = useState({
    street: '',
    city: '',
    postalCode: '',
    country: 'Tunisia'
  });

  useEffect(() => {
    initializePayment();
  }, []);

  const initializePayment = async () => {
    try {
      setLoading(true);

      // Load Stripe
      const stripeInstance = await loadStripe();
      if (!stripeInstance) {
        throw new Error('Failed to load Stripe');
      }
      setStripe(stripeInstance);

      // Load Stripe Elements
      const elementsModule = await loadStripeElements();
      if (!elementsModule) {
        throw new Error('Failed to load Stripe Elements');
      }
      setStripeElements(elementsModule);

      // Create checkout session
      const response = await fetch('http://localhost:5009/api/cart/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          shippingAddress,
          currency: 'eur'
        })
      });

      const data = await response.json();
      if (data.success) {
        setClientSecret(data.data.clientSecret);
        setCartData(data.data.cart);
      } else {
        throw new Error(data.message || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error initializing payment:', error);
      setPaymentError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPayment = async (event) => {
    event.preventDefault();

    if (!stripe || !stripeElements || !clientSecret) {
      return;
    }

    // Validate shipping address
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.phone) {
      setPaymentError('Please fill in all shipping address fields');
      return;
    }

    setProcessing(true);
    setPaymentError('');

    try {
      // For now, simulate payment success for testing
      // In production, you would use Stripe Elements here
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful payment
      const mockPaymentIntentId = `pi_${Date.now()}_test`;
      
      // Confirm payment on backend
      const confirmResponse = await fetch('http://localhost:5009/api/cart/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          paymentIntentId: mockPaymentIntentId
        })
      });

      const confirmData = await confirmResponse.json();
      if (confirmData.success) {
        setPaymentSuccess(true);
        if (onSuccess) {
          onSuccess(confirmData.data.order);
        }
      } else {
        setPaymentError(confirmData.message || 'Payment confirmation failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError(error.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 text-center">
          <div className="text-green-500 text-6xl mb-4">
            <FiCheck className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-card-foreground mb-4">Payment Successful!</h2>
          <p className="text-muted-foreground mb-6">
            Your order has been confirmed and will be processed shortly. You'll receive a confirmation email soon.
          </p>
          <div className="space-y-3">
            <Button 
              variant="primary" 
              className="w-full"
              onClick={() => window.location.href = '/orders'}
            >
              View My Orders
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.href = '/marketplace'}
            >
              Continue Shopping
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center text-muted-foreground hover:text-card-foreground transition-colors"
                >
                  <FiArrowLeft className="w-5 h-5 mr-2" />
                  Back to Cart
                </button>
              )}
              <div>
                <h1 className="text-3xl font-bold text-card-foreground flex items-center">
                  <FiCreditCard className="w-8 h-8 mr-3" />
                  Secure Checkout
                </h1>
                <div className="flex items-center mt-2 text-sm text-muted-foreground">
                  <FiShield className="w-4 h-4 mr-1" />
                  Protected by 256-bit SSL encryption
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-6">
            {/* Shipping Address */}
            <Card>
              <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center">
                <FiTruck className="w-5 h-5 mr-2" />
                Shipping Address
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, street: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    style={{ backgroundColor: '#ffffff', color: '#000000' }}
                    placeholder="123 Main Street"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      style={{ backgroundColor: '#ffffff', color: '#000000' }}
                      placeholder="Tunis"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.postalCode}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      style={{ backgroundColor: '#ffffff', color: '#000000' }}
                      placeholder="1000"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    Country *
                  </label>
                  <select
                    value={shippingAddress.country}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    style={{ backgroundColor: '#ffffff', color: '#000000' }}
                  >
                    <option value="Tunisia" style={{ backgroundColor: '#ffffff', color: '#000000' }}>Tunisia</option>
                    <option value="Morocco" style={{ backgroundColor: '#ffffff', color: '#000000' }}>Morocco</option>
                    <option value="Algeria" style={{ backgroundColor: '#ffffff', color: '#000000' }}>Algeria</option>
                    <option value="Libya" style={{ backgroundColor: '#ffffff', color: '#000000' }}>Libya</option>
                    <option value="Egypt" style={{ backgroundColor: '#ffffff', color: '#000000' }}>Egypt</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={shippingAddress.phone}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    style={{ backgroundColor: '#ffffff', color: '#000000' }}
                    placeholder="+216 12 345 678"
                    required
                  />
                </div>
              </div>
            </Card>

            {/* Billing Address */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-card-foreground">Billing Address</h3>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="billingSame"
                    checked={billingSameAsShipping}
                    onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="billingSame" className="ml-2 text-sm text-muted-foreground">
                    Same as shipping address
                  </label>
                </div>
              </div>
              
              {!billingSameAsShipping && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      value={billingAddress.street}
                      onChange={(e) => setBillingAddress(prev => ({ ...prev, street: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      style={{ backgroundColor: '#ffffff', color: '#000000' }}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-card-foreground mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        value={billingAddress.city}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        style={{ backgroundColor: '#ffffff', color: '#000000' }}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-card-foreground mb-1">
                        Postal Code *
                      </label>
                      <input
                        type="text"
                        value={billingAddress.postalCode}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        style={{ backgroundColor: '#ffffff', color: '#000000' }}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">
                      Country *
                    </label>
                    <select
                      value={billingAddress.country}
                      onChange={(e) => setBillingAddress(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      style={{ backgroundColor: '#ffffff', color: '#000000' }}
                    >
                      <option value="Tunisia" style={{ backgroundColor: '#ffffff', color: '#000000' }}>Tunisia</option>
                      <option value="Morocco" style={{ backgroundColor: '#ffffff', color: '#000000' }}>Morocco</option>
                      <option value="Algeria" style={{ backgroundColor: '#ffffff', color: '#000000' }}>Algeria</option>
                      <option value="Libya" style={{ backgroundColor: '#ffffff', color: '#000000' }}>Libya</option>
                      <option value="Egypt" style={{ backgroundColor: '#ffffff', color: '#000000' }}>Egypt</option>
                    </select>
                  </div>
                </div>
              )}
            </Card>

            {/* Payment Method */}
            <Card>
              <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center">
                <FiLock className="w-5 h-5 mr-2" />
                Payment Information
              </h3>
              
              {paymentError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                  <FiAlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-red-700">
                    <p className="font-medium">Payment Error</p>
                    <p className="text-sm mt-1">{paymentError}</p>
                  </div>
                </div>
              )}

              {stripe && stripeElements && clientSecret ? (
                <StripePaymentForm 
                  stripe={stripe}
                  elements={stripeElements}
                  clientSecret={clientSecret}
                  processing={processing}
                  onSubmit={handleSubmitPayment}
                />
              ) : (
                <div className="text-center py-8">
                  <LoadingSpinner />
                  <p className="mt-2 text-muted-foreground">Loading secure payment form...</p>
                </div>
              )}
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card className="sticky top-4">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Order Summary</h3>
              
              {cart && cart.items ? (
                <div className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {cart.items.map((item, index) => (
                      <div key={item._id || index} className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={item.image ? `http://localhost:5009/${item.image}` : '/api/placeholder/100/100'}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = '/api/placeholder/100/100';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-card-foreground truncate">
                            {item.productName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <div className="text-sm font-medium text-card-foreground">
                          {formatPrice(item.totalPrice)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-card-foreground">{formatPrice(cart.totalAmount)}</span>
                    </div>
                    
                    {cart.discount && (cart.discount.percentage > 0 || cart.discount.amount > 0) && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount ({cart.discount.code})</span>
                        <span>-{formatPrice(cart.totalAmount - cart.finalAmount)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-green-600">Free</span>
                    </div>
                    
                    <div className="flex justify-between text-lg font-semibold pt-2 border-t border-border">
                      <span className="text-card-foreground">Total</span>
                      <span className="text-primary">{formatPrice(cart.finalAmount)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No items in cart</p>
              )}

              {/* Security Info */}
              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                  <FiShield className="w-4 h-4 text-green-500" />
                  <span>Secure 256-bit SSL encryption</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-muted-foreground mt-2">
                  <FiTruck className="w-4 h-4 text-blue-500" />
                  <span>Free delivery on all orders</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stripe Payment Form Component
const StripePaymentForm = ({ stripe, elements, clientSecret, processing, onSubmit }) => {
  const [cardElement, setCardElement] = useState(null);
  const [cardError, setCardError] = useState('');

  useEffect(() => {
    if (stripe && elements) {
      const { Elements, CardElement } = elements;
      // In a real implementation, this would be handled differently
      // For now, we'll simulate the card element
    }
  }, [stripe, elements]);

  const handleCardChange = (event) => {
    setCardError(event.error ? event.error.message : '');
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-card-foreground mb-2">
          Card Information
        </label>
        
        {/* Development Mode Card Form */}
        <div className="border border-gray-300 rounded-lg p-4 space-y-4" style={{ backgroundColor: '#ffffff' }}>
          <div>
            <input
              type="text"
              placeholder="1234 1234 1234 1234"
              className="w-full border-0 focus:outline-none bg-white text-black"
              style={{ backgroundColor: '#ffffff', color: '#000000' }}
              disabled={processing}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="MM / YY"
              className="w-full border-0 focus:outline-none bg-white text-black"
              style={{ backgroundColor: '#ffffff', color: '#000000' }}
              disabled={processing}
            />
            <input
              type="text"
              placeholder="CVC"
              className="w-full border-0 focus:outline-none bg-white text-black"
              style={{ backgroundColor: '#ffffff', color: '#000000' }}
              disabled={processing}
            />
          </div>
        </div>
        
        {cardError && (
          <p className="text-red-500 text-sm mt-2">{cardError}</p>
        )}
      </div>

      <Button 
        type="submit"
        variant="primary"
        className="w-full"
        disabled={processing}
      >
        {processing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Processing Payment...
          </>
        ) : (
          <>
            <FiLock className="w-4 h-4 mr-2" />
            Complete Order
          </>
        )}
      </Button>
      
      <p className="text-xs text-muted-foreground text-center">
        By placing this order you agree to our Terms of Service and Privacy Policy
      </p>
    </form>
  );
};

export default Checkout;