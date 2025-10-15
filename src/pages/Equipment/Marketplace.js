"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "../../hooks/useAuth"
import { Card } from "../../shared/ui/components/Card"
import { Button } from "../../shared/ui/components/Button"
import { safeAsync, safeFetch } from "../../utils/errorHandler"
import {
  FiSearch,
  FiFilter,
  FiShoppingCart,
  FiEye,
  FiHeart,
  FiStar,
  FiGrid,
  FiList,
  FiChevronDown,
  FiX,
  FiPackage,
  FiTrendingUp,
  FiTag,
} from "react-icons/fi"
import Navbar from "../../core/layout/Navbar"
import "./Marketplace.css"

const Marketplace = ({ onCartUpdate }) => {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [cartCount, setCartCount] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    minPrice: "",
    maxPrice: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  })
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    limit: 12,
  })
  const [viewMode, setViewMode] = useState("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [wishlist, setWishlist] = useState(new Set())

  useEffect(() => {
    fetchProducts()
    fetchCartCount()
  }, [filters, pagination.currentPage]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProducts = safeAsync(async () => {
    setLoading(true)
    const queryParams = new URLSearchParams({
      ...filters,
      page: pagination.currentPage,
      limit: pagination.limit,
    })

    const result = await safeFetch(`https://sportify-equipement.onrender.com/api/marketplace?${queryParams}`)

    if (result.success && result.data && result.data.success && result.data.data) {
      setProducts(result.data.data.products || [])
      setPagination(result.data.data.pagination || pagination)
      setCategories(result.data.data.filters?.categories || [])
    } else {
      console.error("Invalid products response:", result)
      setProducts([])
    }

    setLoading(false)
  }, "Marketplace fetchProducts")

  const fetchCartCount = safeAsync(async () => {
    if (!user) return

    const result = await safeFetch("https://sportify-equipement.onrender.com/api/cart/count", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })

    if (result.success && result.data && result.data.success && result.data.data) {
      setCartCount(result.data.data.count || 0)
    } else {
      setCartCount(0)
    }
  }, "Marketplace fetchCartCount")

  const addToCart = async (productId, quantity = 1) => {
    if (!user) {
      showNotification("Please login to add items to cart", "error")
      return
    }

    console.log("Adding to cart:", { productId, quantity, source: "marketplace" })

    try {
      const response = await fetch("https://sportify-equipement.onrender.com/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          productId,
          quantity,
          source: "marketplace",
        }),
      })

      console.log("Add to cart response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Add to cart error response:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log("Add to cart response data:", data)

      if (data && data.success) {
        const newCartCount = data.data?.totalItems || data.data?.items?.length || 0
        setCartCount(newCartCount)
        console.log("Updated cart count:", newCartCount)

        if (onCartUpdate) {
          onCartUpdate()
        }

        showNotification("Item added to cart!", "success")
      } else {
        console.error("Cart add error:", data)
        showNotification(data?.message || "Error adding item to cart", "error")
      }
    } catch (error) {
      console.error("Error adding to cart:", error)
      showNotification("Error adding item to cart: " + error.message, "error")
    }
  }

  const showNotification = (message, type = "success") => {
    const notification = document.createElement("div")
    const bgColor = type === "success" ? "bg-emerald-500" : "bg-rose-500"
    notification.className = `fixed top-6 right-6 ${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl z-50 transform transition-all duration-300 translate-x-full flex items-center space-x-3 max-w-md`

    const icon =
      type === "success"
        ? '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>'
        : '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 001.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>'

    notification.innerHTML = `${icon}<span class="font-medium">${message}</span>`
    document.body.appendChild(notification)

    setTimeout(() => notification.classList.remove("translate-x-full"), 100)
    setTimeout(() => {
      notification.classList.add("translate-x-full")
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 300)
    }, 3000)
  }

  const showProductDetails = async (productId) => {
    try {
      const response = await fetch(`https://sportify-equipement.onrender.com/api/marketplace/product/${productId}`)
      const data = await response.json()
      if (data && data.success && data.data && data.data.product) {
        setSelectedProduct(data.data.product)
        setShowProductModal(true)
      } else {
        console.error("Invalid product details response:", data)
        showNotification("Error loading product details", "error")
      }
    } catch (error) {
      console.error("Error fetching product details:", error)
      showNotification("Error loading product details", "error")
    }
  }

  const closeProductModal = () => {
    setShowProductModal(false)
    setSelectedProduct(null)
  }

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPagination((prev) => ({ ...prev, currentPage: 1 }))
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "all",
      minPrice: "",
      maxPrice: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    })
    setPagination((prev) => ({ ...prev, currentPage: 1 }))
  }

  const toggleWishlist = (productId) => {
    setWishlist((prev) => {
      const newWishlist = new Set(prev)
      if (newWishlist.has(productId)) {
        newWishlist.delete(productId)
        showNotification("Removed from wishlist", "success")
      } else {
        newWishlist.add(productId)
        showNotification("Added to wishlist", "success")
      }
      return newWishlist
    })
  }

  const formatPrice = (price) => {
    if (typeof price !== "number" || isNaN(price)) {
      return "0.00 €"
    }
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(price)
  }

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null

    if (typeof imagePath === "object" && imagePath.filename) {
      return `https://sportify-equipement.onrender.com/uploads/proposals/${imagePath.filename}`
    }

    if (typeof imagePath === "string") {
      if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        return imagePath
      }

      if (imagePath.startsWith("/uploads/") || imagePath.startsWith("uploads/")) {
        const cleanPath = imagePath.startsWith("/") ? imagePath : "/" + imagePath
        return `https://sportify-equipement.onrender.com${cleanPath}`
      }

      if (imagePath.includes("\\") || imagePath.includes("/")) {
        const fileName = imagePath.split(/[\\/]/).pop()
        return `https://sportify-equipement.onrender.com/uploads/proposals/${fileName}`
      }

      return `https://sportify-equipement.onrender.com/uploads/proposals/${imagePath}`
    }

    return null
  }

  const safeProduct = (product) => ({
    _id: product?._id || "",
    name: product?.name || "Unknown Product",
    description: product?.description || "No description available",
    price: product?.price || 0,
    category: product?.category || "Uncategorized",
    brand: product?.brand || "",
    model: product?.model || "",
    stock: product?.stock || 0,
    image: getImageUrl(product?.image || (product?.images && product.images.length > 0 ? product.images[0] : null)),
  })

  const ProductCard = ({ product: rawProduct }) => {
    const product = safeProduct(rawProduct)
    const isWishlisted = wishlist.has(product._id)

    const categoryColors = {
      'football': 'from-green-500 to-emerald-600',
      'basketball': 'from-orange-500 to-red-600',
      'tennis': 'from-purple-500 to-indigo-600',
      'paddle': 'from-blue-500 to-cyan-600',
      'default': 'from-gray-500 to-gray-600'
    }

    const getCategoryColor = (category) => {
      return categoryColors[category?.toLowerCase()] || categoryColors['default']
    }

    return (
      <div
        onClick={() => showProductDetails(product._id)}
        className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group cursor-pointer transform hover:scale-105 h-full flex flex-col"
      >
        {/* Product Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={
              product.image ||
              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0xMjUgNzVMMTUwIDEwMEwxNzUgNzVMMTc1IDEyNUwxMjUgMTI1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K"
            }
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src =
                "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0xMjUgNzVMMTUwIDEwMEwxNzUgNzVMMTc1IDEyNUwxMjUgMTI1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K"
            }}
          />
          
          {/* Category Badge */}
          <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-white text-sm font-medium bg-gradient-to-r ${getCategoryColor(product.category)}`}>
            {product.category}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleWishlist(product._id)
            }}
            className="absolute top-4 right-4 p-2.5 bg-white/95 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-200 shadow-lg hover:scale-110 transform"
          >
            <FiHeart
              className={`w-4 h-4 transition-colors ${isWishlisted ? "fill-rose-500 text-rose-500" : "text-gray-600"}`}
            />
          </button>

          {/* Stock Badge */}
          {product.stock < 5 && product.stock > 0 && (
            <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-semibold rounded-full shadow-lg flex items-center space-x-1">
              <FiTrendingUp className="w-3 h-3" />
              <span>Only {product.stock} left</span>
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-rose-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-2xl">
                Out of Stock
              </div>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
            {product.name}
          </h3>

          {product.brand && (
            <p className="text-sm text-white/60 font-medium mb-2">{product.brand}</p>
          )}

          <p className="text-sm text-white/70 mb-4 line-clamp-2 flex-1">{product.description}</p>

          {/* Rating */}
          <div className="flex items-center mb-4">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <FiStar
                  key={star}
                  className={`w-4 h-4 ${
                    star <= 4 ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-600 text-gray-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-white/70 text-sm ml-2">4.5 (24)</span>
          </div>

          {/* Price */}
          <div className="text-2xl font-bold text-blue-400 mb-4">
            {formatPrice(product.price)}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation()
                showProductDetails(product._id)
              }}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-xl hover:from-blue-500 hover:to-blue-400 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              View Details
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation()
                addToCart(product._id)
              }}
              disabled={product.stock === 0}
              className="px-4 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-medium rounded-xl hover:from-green-500 hover:to-green-400 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <FiShoppingCart className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const ProductListItem = ({ product: rawProduct }) => {
    const product = safeProduct(rawProduct)
    const isWishlisted = wishlist.has(product._id)

    return (
      <Card variant="default" className="group hover:shadow-xl transition-all duration-300 border-0">
        <div className="flex flex-col sm:flex-row">
          <div className="relative w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200">
              <img
                src={product.image || "/api/placeholder/200/200"}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  console.log("Image load error for product:", product.name)
                  e.target.src =
                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik04MyA2N0wxMDAgODNMMTE3IDY3TDExNyAxMzNMODMgMTMzWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K"
                }}
              />
            </div>
            {product.stock === 0 && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                <span className="bg-rose-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-xl">
                  Out of Stock
                </span>
              </div>
            )}
            {product.stock < 5 && product.stock > 0 && (
              <div className="absolute top-3 left-3 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-semibold rounded-full shadow-lg">
                Only {product.stock} left
              </div>
            )}
          </div>

          <div className="flex-1 p-6 flex flex-col sm:flex-row justify-between">
            <div className="flex-1 mb-4 sm:mb-0">
              <div className="mb-3">
                <span className="inline-flex items-center text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full">
                  <FiTag className="w-3 h-3 mr-1.5" />
                  {product.category}
                </span>
              </div>

              <h3 className="font-bold text-xl text-card-foreground mb-2 group-hover:text-primary transition-colors">
                {product.name}
              </h3>

              {product.brand && <p className="text-sm text-muted-foreground font-medium mb-3">{product.brand}</p>}

              <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed max-w-2xl">
                {product.description}
              </p>

              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-1 bg-amber-50 px-3 py-1.5 rounded-lg">
                  <FiStar className="w-4 h-4 text-amber-500 fill-current" />
                  <span className="font-semibold text-amber-700">4.5</span>
                  <span className="text-amber-600">(24 reviews)</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <FiPackage className="w-4 h-4" />
                  <span className="font-medium">
                    Stock:{" "}
                    <span className={product.stock > 10 ? "text-emerald-600" : "text-orange-600"}>{product.stock}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-row sm:flex-col justify-between sm:justify-between items-center sm:items-end space-x-4 sm:space-x-0 sm:space-y-4 sm:ml-6">
              <span className="text-3xl font-bold text-primary bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent whitespace-nowrap">
                {formatPrice(product.price)}
              </span>

              <div className="flex space-x-2">
                <button
                  onClick={() => toggleWishlist(product._id)}
                  className="p-3 border-2 border-gray-200 rounded-xl hover:border-rose-300 hover:bg-rose-50 transition-all"
                >
                  <FiHeart
                    className={`w-5 h-5 transition-colors ${isWishlisted ? "fill-rose-500 text-rose-500" : "text-gray-600"}`}
                  />
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  className="px-4 hover:bg-gray-50 transition-colors border-2 bg-transparent"
                  onClick={() => showProductDetails(product._id)}
                >
                  <FiEye className="w-5 h-5" />
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="px-6 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg hover:shadow-xl transition-all"
                  onClick={() => addToCart(product._id)}
                  disabled={product.stock === 0}
                >
                  <FiShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-400 rounded-full animate-spin" 
                   style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <h2 className="text-2xl font-bold text-white mt-6">Loading Products...</h2>
            <p className="text-white/60 mt-2">Please wait while we fetch amazing products</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Hero Section with Gradient */}
        <div className="relative bg-gradient-to-r from-blue-900/50 to-purple-900/50 py-20">
          <div className="absolute inset-0 bg-black/30"></div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Equipment Marketplace
              </h1>
              <p className="text-xl text-white/80 max-w-2xl mx-auto mb-4">
                Find the perfect equipment for your game. Premium quality sports gear at your fingertips.
              </p>
              <div className="flex items-center justify-center space-x-3">
                <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <FiPackage className="w-5 h-5 text-white mr-2" />
                  <span className="font-bold text-white">{pagination.totalProducts}</span>
                  <span className="ml-1.5 text-white/90">Products</span>
                </div>
                {user && (
                  <button
                    onClick={() => window.location.href = '/marketplace/cart'}
                    className="relative group bg-white/20 backdrop-blur-md hover:bg-white/30 p-3 rounded-xl transition-all duration-300 hover:scale-110"
                  >
                    <FiShoppingCart className="w-5 h-5 text-white" />
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-pulse">
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 space-y-4"
          >
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center space-y-3 lg:space-y-0 lg:space-x-4">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for products, brands, categories..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="appearance-none bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-all flex items-center"
                >
                  <FiFilter className="w-5 h-5 mr-2" />
                  <span className="font-semibold">Filters</span>
                  <FiChevronDown
                    className={`w-4 h-4 ml-2 transition-transform duration-300 ${showFilters ? "rotate-180" : ""}`}
                  />
                </button>

                {/* View Mode Toggle */}
                <div className="flex items-center space-x-2 bg-white/10 rounded-xl p-1 border border-white/20">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-3 rounded-lg transition-all ${
                      viewMode === "grid"
                        ? "bg-blue-500 text-white"
                        : "text-white/60 hover:bg-white/10"
                    }`}
                  >
                    <FiGrid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-3 rounded-lg transition-all ${
                      viewMode === "list"
                        ? "bg-blue-500 text-white"
                        : "text-white/60 hover:bg-white/10"
                    }`}
                  >
                    <FiList className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Results Count */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <p className="text-white/70">
              {products.length} product{products.length !== 1 ? 's' : ''} found
            </p>
          </motion.div>

          {/* Filters Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="flex items-center text-sm font-bold text-white mb-3">
                    <FiTag className="w-4 h-4 mr-2 text-blue-400" />
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange("category", e.target.value)}
                    className="appearance-none w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm cursor-pointer"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category} className="bg-gray-900 text-white">
                        {category === "all" ? "All Categories" : category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-3">Min Price (€)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-3">Max Price (€)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="10000"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-3">Sort By</label>
                  <select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split("-")
                      handleFilterChange("sortBy", sortBy)
                      handleFilterChange("sortOrder", sortOrder)
                    }}
                    className="appearance-none w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm cursor-pointer"
                  >
                    <option value="createdAt-desc" className="bg-gray-900 text-white">Newest First</option>
                    <option value="createdAt-asc" className="bg-gray-900 text-white">Oldest First</option>
                    <option value="price-asc" className="bg-gray-900 text-white">Price: Low to High</option>
                    <option value="price-desc" className="bg-gray-900 text-white">Price: High to Low</option>
                    <option value="name-asc" className="bg-gray-900 text-white">Name: A to Z</option>
                    <option value="name-desc" className="bg-gray-900 text-white">Name: Z to A</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-6 py-2.5 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl hover:bg-red-500/30 transition-all font-semibold"
                >
                  <FiX className="w-4 h-4 inline-block mr-2" />
                  Clear All Filters
                </button>
              </div>
            </motion.div>
          )}

          {/* Products Grid/List */}
          <AnimatePresence mode="wait">
            {products.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-20"
              >
                <FiPackage size={64} className="mx-auto text-white/40 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Products Found</h3>
                <p className="text-white/60">
                  {filters.search || filters.category !== 'all'
                    ? 'Try adjusting your search criteria'
                    : 'No products are available at the moment'}
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product, index) => (
                      <motion.div
                        key={product._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-5">
                    {products.map((product, index) => (
                      <motion.div
                        key={product._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <ProductListItem product={product} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mt-12 pt-8 border-t-2 border-white/10">
              <button
                disabled={pagination.currentPage <= 1}
                onClick={() => setPagination((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                className="px-6 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all font-semibold"
              >
                Previous
              </button>

              <div className="flex items-center space-x-2">
                {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                  let page
                  if (pagination.totalPages <= 7) {
                    page = i + 1
                  } else if (pagination.currentPage <= 4) {
                    page = i + 1
                  } else if (pagination.currentPage >= pagination.totalPages - 3) {
                    page = pagination.totalPages - 6 + i
                  } else {
                    page = pagination.currentPage - 3 + i
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => setPagination((prev) => ({ ...prev, currentPage: page }))}
                      className={`min-w-[44px] px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${
                        page === pagination.currentPage
                          ? "bg-blue-500 text-white shadow-lg scale-110"
                          : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
              </div>

              <button
                disabled={pagination.currentPage >= pagination.totalPages}
                onClick={() => setPagination((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                className="px-6 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all font-semibold"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Product Modal */}
        {showProductModal && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={closeProductModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-white/10"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-sm border-b border-white/10 z-10 flex justify-between items-center px-6 py-4">
                <div className="flex-1 pr-4">
                  <h2 className="text-2xl font-bold text-white">
                    {selectedProduct.name}
                  </h2>
                  {selectedProduct.brand && (
                    <p className="text-sm text-white/60 mt-1">{selectedProduct.brand}</p>
                  )}
                </div>
                <button
                  onClick={closeProductModal}
                  className="flex-shrink-0 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-80px)] custom-scrollbar">
                <div className="p-6">
                  <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left Column - Image */}
                    <div className="space-y-4">
                      <div className="relative">
                        <div className="aspect-square overflow-hidden rounded-xl bg-gray-800 border border-white/10">
                          <img
                            src={selectedProduct.image || "/api/placeholder/500/500"}
                            alt={selectedProduct.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIiBmaWxsPSIjMWYyOTM3Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwTDI1MCAyMDBMMzAwIDE1MEwzMDAgMzUwTDIwMCAzNTBaIiBmaWxsPSIjNEM1NTZBIi8+Cjwvc3ZnPgo="
                            }}
                          />
                          {selectedProduct.stock === 0 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <div className="bg-red-500 text-white px-6 py-2 rounded-lg font-semibold text-sm">
                                Out of Stock
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Category Badge */}
                      <div className="flex items-center justify-center">
                        <span className="inline-flex items-center bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium border border-white/20">
                          <FiTag className="w-4 h-4 mr-2" />
                          {selectedProduct.category}
                        </span>
                      </div>
                    </div>

                    {/* Right Column - Details */}
                    <div className="space-y-5">
                      {/* Description */}
                      <div className="border border-white/10 bg-white/5 rounded-xl p-5">
                        <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-2">
                          Description
                        </h3>
                        <p className="text-white/80 leading-relaxed text-sm">
                          {selectedProduct.description}
                        </p>
                      </div>

                      {/* Brand and Model */}
                      {(selectedProduct.brand || selectedProduct.model) && (
                        <div className="grid grid-cols-2 gap-4">
                          {selectedProduct.brand && (
                            <div className="border border-white/10 bg-white/5 rounded-xl p-4">
                              <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-1">
                                Brand
                              </h3>
                              <p className="text-white font-semibold">{selectedProduct.brand}</p>
                            </div>
                          )}

                          {selectedProduct.model && (
                            <div className="border border-white/10 bg-white/5 rounded-xl p-4">
                              <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-1">
                                Model
                              </h3>
                              <p className="text-white font-semibold">{selectedProduct.model}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Price */}
                      <div className="border border-white/10 bg-white/5 rounded-xl p-5">
                        <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-2">
                          Price
                        </h3>
                        <p className="text-4xl font-bold text-white">
                          {formatPrice(selectedProduct.price)}
                        </p>
                      </div>

                      {/* Stock Status */}
                      <div className="border border-white/10 bg-white/5 rounded-xl p-5">
                        <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-3">
                          Availability
                        </h3>
                        <div className="flex items-center space-x-3">
                          <FiPackage
                            className={`w-5 h-5 ${
                              selectedProduct.stock > 0 ? "text-green-500" : "text-red-500"
                            }`}
                          />
                          <div>
                            <p
                              className={`font-semibold ${
                                selectedProduct.stock > 0
                                  ? "text-green-500"
                                  : "text-red-500"
                              }`}
                            >
                              {selectedProduct.stock > 0 ? `${selectedProduct.stock} in stock` : "Out of stock"}
                            </p>
                            {selectedProduct.stock > 0 && selectedProduct.stock < 5 && (
                              <p className="text-xs text-white/60 mt-0.5">Only a few left</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-2">
                        <Button
                          variant="primary"
                          className="flex-1 py-3 text-base font-semibold bg-white text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-0"
                          onClick={() => {
                            addToCart(selectedProduct._id)
                            closeProductModal()
                          }}
                          disabled={selectedProduct.stock === 0}
                        >
                          <FiShoppingCart className="w-5 h-5 mr-2" />
                          {selectedProduct.stock === 0 ? "Out of Stock" : "Add to Cart"}
                        </Button>
                        <button
                          onClick={() => toggleWishlist(selectedProduct._id)}
                          className="p-3 border border-white/20 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                        >
                          <FiHeart
                            className={`w-6 h-6 transition-colors ${
                              wishlist.has(selectedProduct._id)
                                ? "fill-red-500 text-red-500"
                                : "text-white/70"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </>
  )
}

export default Marketplace
