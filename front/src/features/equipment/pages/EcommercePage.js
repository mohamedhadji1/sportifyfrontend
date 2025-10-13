import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaShoppingCart,
  FaSearch,
  FaFilter,
  FaPlus,
  FaMinus,
  FaStar,
  FaHeart,
  FaEye,
  FaTags,
  FaBox
} from 'react-icons/fa';
import { useAuth } from '../../../hooks/useAuth';
import axios from 'axios';
import toast from 'react-hot-toast';
import ProductDetailsModal from '../components/ProductDetailsModal';
import CartSidebar from '../components/CartSidebar';

const EcommercePage = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [], totalAmount: 0, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingCart, setLoadingCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCartSidebar, setShowCartSidebar] = useState(false);

  // Filtres et recherche
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    priceRange: '',
    onSale: false,
    inStock: true
  });

  // États des favoris (simulation - vous pouvez l'intégrer avec votre système de favoris)
  const [favorites, setFavorites] = useState(new Set());

  // Charger les produits
  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.priceRange) {
        const [min, max] = filters.priceRange.split('-');
        if (min) params.append('minPrice', min);
        if (max && max !== 'plus') params.append('maxPrice', max);
      }
      if (filters.onSale) params.append('onSale', 'true');
      if (filters.inStock) params.append('inStock', 'true');

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/service-equipement/api/equipment/types/shop?${params}`,
        {
          headers: {
            'x-auth-token': localStorage.getItem('token')
          }
        }
      );

      if (response.data.success) {
        setProducts(response.data.data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  // Charger le panier
  const loadCart = async () => {
    try {
      setLoadingCart(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/service-equipement/api/cart`,
        {
          headers: {
            'x-auth-token': localStorage.getItem('token')
          }
        }
      );

      if (response.data.success) {
        setCart(response.data.data);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoadingCart(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCart();
  }, [filters]);

  // Ajouter au panier
  const handleAddToCart = async (product, quantity = 1) => {
    if (!user) {
      toast.error('Veuillez vous connecter pour ajouter des articles au panier');
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/service-equipement/api/cart/add`,
        {
          equipmentTypeId: product._id,
          quantity: quantity
        },
        {
          headers: {
            'x-auth-token': localStorage.getItem('token'),
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setCart(response.data.data);
        toast.success('Article ajouté au panier');
        
        // Montrer brièvement le sidebar du panier
        setShowCartSidebar(true);
        setTimeout(() => setShowCartSidebar(false), 2000);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de l\'ajout au panier';
      toast.error(errorMessage);
    }
  };

  // Ajouter/retirer des favoris
  const toggleFavorite = (productId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId);
      toast.success('Retiré des favoris');
    } else {
      newFavorites.add(productId);
      toast.success('Ajouté aux favoris');
    }
    setFavorites(newFavorites);
  };

  // Ouvrir les détails du produit
  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  // Fonction pour formater le prix
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD'
    }).format(price);
  };

  // Fonction pour obtenir le stock disponible
  const getAvailableStock = (product) => {
    if (!product.ecommerce?.stock) return 0;
    return product.ecommerce.stock.quantity - (product.ecommerce.stock.reserved || 0);
  };

  // Catégories disponibles
  const categories = [
    'Football', 'Basketball', 'Tennis', 'Padel', 'Volleyball', 
    'Swimming', 'Gym', 'Track & Field', 'Other'
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec panier */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Boutique d'Équipements</h1>
              <p className="text-gray-600">Découvrez notre sélection d'équipements sportifs</p>
            </div>
            
            <button
              onClick={() => setShowCartSidebar(true)}
              className="relative bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <FaShoppingCart />
              Panier
              {cart.totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cart.totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaSearch className="inline mr-1" /> Recherche
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Rechercher des produits..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaFilter className="inline mr-1" /> Catégorie
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="">Toutes les catégories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prix</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={filters.priceRange}
                onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
              >
                <option value="">Tous les prix</option>
                <option value="0-100">0 - 100 MAD</option>
                <option value="100-500">100 - 500 MAD</option>
                <option value="500-1000">500 - 1000 MAD</option>
                <option value="1000-plus">1000+ MAD</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.onSale}
                  onChange={(e) => setFilters(prev => ({ ...prev, onSale: e.target.checked }))}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">En promotion</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  onChange={(e) => setFilters(prev => ({ ...prev, inStock: e.target.checked }))}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">En stock</span>
              </label>
            </div>
          </div>
        </div>

        {/* Grille des produits */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <FaBox className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun produit trouvé</h3>
            <p className="mt-1 text-sm text-gray-500">
              Essayez de modifier vos filtres pour voir plus de produits.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const availableStock = getAvailableStock(product);
              const isInCart = cart.items.some(item => item.equipmentTypeId === product._id);
              const isFavorite = favorites.has(product._id);

              return (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
                >
                  {/* Image du produit */}
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={`${process.env.REACT_APP_API_URL}/service-equipement/uploads/equipment-types/${product.images[0].filename}`}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaBox className="h-16 w-16 text-gray-400" />
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2 left-2 space-y-1">
                      {product.isOnSale && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                          -{product.discountPercentage}%
                        </span>
                      )}
                      {availableStock === 0 && (
                        <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                          Épuisé
                        </span>
                      )}
                    </div>

                    {/* Actions rapides */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 space-y-2">
                      <button
                        onClick={() => toggleFavorite(product._id)}
                        className={`p-2 rounded-full shadow-md transition-colors ${
                          isFavorite ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:text-red-500'
                        }`}
                      >
                        <FaHeart size={16} />
                      </button>
                      <button
                        onClick={() => handleViewProduct(product)}
                        className="p-2 bg-white text-gray-600 rounded-full shadow-md hover:text-purple-600 transition-colors"
                      >
                        <FaEye size={16} />
                      </button>
                    </div>

                    {/* Action d'ajout rapide */}
                    {availableStock > 0 && (
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
                        >
                          <FaPlus size={12} />
                          Ajouter
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Informations du produit */}
                  <div className="p-4">
                    <div className="mb-2">
                      <span className="text-xs text-purple-600 font-medium uppercase tracking-wide">
                        {product.category}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>

                    {/* Prix */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg font-bold text-gray-900">
                        {formatPrice(product.effectivePrice)}
                      </span>
                      {product.isOnSale && (
                        <span className="text-sm text-gray-500 line-through">
                          {formatPrice(product.ecommerce.price)}
                        </span>
                      )}
                    </div>

                    {/* Stock */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-500">
                        Stock: {availableStock} disponible{availableStock > 1 ? 's' : ''}
                      </span>
                      {/* Note fictive */}
                      <div className="flex items-center gap-1">
                        <FaStar className="text-yellow-400" size={12} />
                        <span className="text-xs text-gray-600">4.5</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewProduct(product)}
                        className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        Voir détails
                      </button>
                      {availableStock > 0 ? (
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={isInCart}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isInCart
                              ? 'bg-green-100 text-green-700 cursor-not-allowed'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                        >
                          {isInCart ? 'Dans le panier' : 'Ajouter au panier'}
                        </button>
                      ) : (
                        <button
                          disabled
                          className="flex-1 bg-gray-300 text-gray-500 px-3 py-2 rounded-lg text-sm font-medium cursor-not-allowed"
                        >
                          Épuisé
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals et Sidebars */}
      {showProductModal && selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setShowProductModal(false)}
          onAddToCart={handleAddToCart}
          isInCart={cart.items.some(item => item.equipmentTypeId === selectedProduct._id)}
        />
      )}

      {showCartSidebar && (
        <CartSidebar
          cart={cart}
          onClose={() => setShowCartSidebar(false)}
          onUpdateCart={loadCart}
        />
      )}
    </div>
  );
};

export default EcommercePage;