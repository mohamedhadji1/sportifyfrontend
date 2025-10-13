import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  FiShoppingCart, 
  FiPlus, 
  FiMinus, 
  FiTrash2, 
  FiCreditCard,
  FiPackage,
  FiAlert,
  FiCheckCircle
} from 'react-icons/fi';

const CartPage = () => {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    postalCode: '',
    country: 'Tunisia'
  });

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5009/api/ecommerce/cart', {
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

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5009/api/ecommerce/cart/update/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: newQuantity })
      });

      if (response.ok) {
        fetchCart(); // Refresh cart
      } else {
        const error = await response.json();
        alert(error.message || 'Error updating quantity');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating quantity');
    } finally {
      setUpdating(false);
    }
  };

  const removeItem = async (itemId) => {
    if (!window.confirm('Remove this item from your cart?')) return;

    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5009/api/ecommerce/cart/remove/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchCart(); // Refresh cart
      } else {
        const error = await response.json();
        alert(error.message || 'Error removing item');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error removing item');
    } finally {
      setUpdating(false);
    }
  };

  const clearCart = async () => {
    if (!window.confirm('Clear all items from your cart?')) return;

    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5009/api/ecommerce/cart/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchCart(); // Refresh cart
      } else {
        const error = await response.json();
        alert(error.message || 'Error clearing cart');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error clearing cart');
    } finally {
      setUpdating(false);
    }
  };

  const handleCheckout = async () => {
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.postalCode) {
      alert('Please fill in all shipping address fields');
      return;
    }

    setCheckingOut(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5009/api/ecommerce/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shippingAddress,
          notes: 'Equipment order from web shop'
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Order created successfully! Order Number: ${result.data.orderNumber}`);
        fetchCart(); // Refresh cart (should be empty now)
        setShippingAddress({
          street: '',
          city: '',
          postalCode: '',
          country: 'Tunisia'
        });
      } else {
        const error = await response.json();
        alert(error.message || 'Error processing checkout');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error processing checkout');
    } finally {
      setCheckingOut(false);
    }
  };

  const calculateTotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => total + item.totalPrice, 0);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Please Log In</h2>
          <p className="text-muted-foreground">You need to be logged in to view your cart.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <FiShoppingCart className="w-8 h-8 text-primary mr-3" />
        <h1 className="text-3xl font-bold text-foreground">Shopping Cart</h1>
      </div>

      {!cart || !cart.items || cart.items.length === 0 ? (
        <div className="text-center py-16">
          <FiPackage className="w-24 h-24 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-gray-600 mb-4">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add some equipment to your cart to get started!</p>
          <button 
            onClick={() => window.location.href = '/equipment/shop'}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80"
          >
            Browse Equipment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg shadow-sm">
              <div className="p-6 border-b border-border">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-card-foreground">
                    Items ({cart.items.length})
                  </h2>
                  <button
                    onClick={clearCart}
                    disabled={updating}
                    className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="divide-y divide-border">
                {cart.items.map((item) => (
                  <div key={item._id} className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        {item.equipmentTypeId?.ecommerce?.images?.[0] ? (
                          <img
                            src={`http://localhost:5009/uploads/equipment-types/${item.equipmentTypeId.ecommerce.images[0].filename}`}
                            alt={item.equipmentTypeName}
                            className="w-20 h-20 object-cover rounded-lg border"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-200 rounded-lg border flex items-center justify-center">
                            <FiPackage className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-card-foreground">
                          {item.equipmentTypeName}
                        </h3>
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                        
                        {item.specifications && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Specs: {item.specifications}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-4">
                          {/* Quantity Controls */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity - 1)}
                              disabled={updating || item.quantity <= 1}
                              className="p-1 border border-border rounded hover:bg-secondary disabled:opacity-50"
                            >
                              <FiMinus className="w-4 h-4" />
                            </button>
                            <span className="px-3 py-1 border border-border rounded bg-card">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity + 1)}
                              disabled={updating}
                              className="p-1 border border-border rounded hover:bg-secondary disabled:opacity-50"
                            >
                              <FiPlus className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Price and Remove */}
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                ${item.unitPrice.toFixed(2)} each
                              </p>
                              <p className="font-semibold text-card-foreground">
                                ${item.totalPrice.toFixed(2)}
                              </p>
                            </div>
                            <button
                              onClick={() => removeItem(item._id)}
                              disabled={updating}
                              className="p-2 text-red-600 hover:text-red-800 disabled:opacity-50"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary & Checkout */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg shadow-sm sticky top-4">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-card-foreground mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${calculateTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">Free</span>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-card-foreground">Total</span>
                      <span className="text-lg font-semibold text-card-foreground">
                        ${calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="mb-6">
                  <h3 className="font-medium text-card-foreground mb-3">Shipping Address</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Street Address"
                      value={shippingAddress.street}
                      onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                      className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="City"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                        className="border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Postal Code"
                        value={shippingAddress.postalCode}
                        onChange={(e) => setShippingAddress({...shippingAddress, postalCode: e.target.value})}
                        className="border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={checkingOut || cart.items.length === 0}
                  className="w-full flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkingOut ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2" />
                  ) : (
                    <FiCreditCard className="w-5 h-5 mr-2" />
                  )}
                  {checkingOut ? 'Processing...' : 'Proceed to Checkout'}
                </button>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex">
                    <FiCheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Secure Checkout</p>
                      <p>Your order will be processed securely.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;