import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Marketplace from './Marketplace';
import ShoppingCart from './ShoppingCart';
import StripeCheckout from './StripeCheckout';
import CreateProposal from './CreateProposal';

const EquipmentMarketplaceApp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cart, setCart] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [currentView, setCurrentView] = useState('marketplace');

  // Determine current view based on URL path
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/cart')) {
      setCurrentView('cart');
    } else if (path.includes('/checkout')) {
      setCurrentView('checkout');
    } else if (path.includes('/create-proposal')) {
      setCurrentView('create-proposal');
    } else {
      setCurrentView('marketplace');
    }
  }, [location.pathname]);

  // Fetch cart count on component mount
  useEffect(() => {
    fetchCartCount();
  }, []);

  const fetchCartCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:3009/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const count = data.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        setCartCount(count);
      }
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  const handleNavigation = (view) => {
    setCurrentView(view);
    
    // Update URL
    switch (view) {
      case 'marketplace':
        navigate('/marketplace');
        break;
      case 'cart':
        navigate('/marketplace/cart');
        break;
      case 'checkout':
        navigate('/marketplace/checkout');
        break;
      case 'create-proposal':
        navigate('/marketplace/create-proposal');
        break;
      default:
        navigate('/marketplace');
    }
  };

  const handleCheckout = (cartData) => {
    setCart(cartData);
    handleNavigation('checkout');
  };

  const handleOrderSuccess = (order) => {
    // Reset cart and navigate to marketplace
    setCart(null);
    setCartCount(0);
    handleNavigation('marketplace');
    
    // Show success message
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300 translate-x-full';
    notification.innerHTML = `
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
        <span>Order placed successfully!</span>
      </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.remove('translate-x-full'), 100);
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 5000);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'marketplace':
        return (
          <Marketplace 
            onCartUpdate={fetchCartCount}
          />
        );
      
      case 'cart':
        return (
          <ShoppingCart 
            onBack={() => handleNavigation('marketplace')}
            onCheckout={handleCheckout}
          />
        );
      
      case 'checkout':
        return (
          <StripeCheckout 
            onBack={() => handleNavigation('cart')}
            onSuccess={handleOrderSuccess}
          />
        );
      
      case 'create-proposal':
        return (
          <CreateProposal 
            onBack={() => handleNavigation('marketplace')}
            onSuccess={() => {
              handleNavigation('marketplace');
              // Show success notification
              const notification = document.createElement('div');
              notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300 translate-x-full';
              notification.textContent = 'Equipment proposal submitted successfully!';
              document.body.appendChild(notification);
              
              setTimeout(() => notification.classList.remove('translate-x-full'), 100);
              setTimeout(() => {
                notification.classList.add('translate-x-full');
                setTimeout(() => document.body.removeChild(notification), 300);
              }, 3000);
            }}
          />
        );
      
      default:
        return <Marketplace onCartUpdate={fetchCartCount} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderContent()}
    </div>
  );
};

export default EquipmentMarketplaceApp;