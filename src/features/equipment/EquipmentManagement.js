import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { 
  FiEye, 
  FiShoppingCart, 
  FiCheck, 
  FiX,
  FiPackage
} from 'react-icons/fi';
import { Search, ChevronDown } from 'lucide-react';
import { Container } from '../../shared/ui/components/Container';
import CreateProposal from './CreateProposal';
import ShoppingCart from './ShoppingCart';
import { ToastContainer, useToast } from '../../shared/ui/components/Toast';

const EquipmentManagement = () => {
  const { user, loading: authLoading } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState('proposals');
  
  const [proposals, setProposals] = useState([]);
  const [ecommerceItems, setEcommerceItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: ''
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Only fetch data if user is authenticated and not loading
    if (!authLoading && user) {
      if (activeTab === 'proposals') {
        fetchProposals();
      } else if (activeTab === 'shop') {
        fetchEcommerceItems();
      }
    }
  }, [activeTab, filters, authLoading, user]);

  // Show loading spinner while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Container className="py-20">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-cyan-400 rounded-full animate-spin" 
                   style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <h2 className="text-2xl font-bold text-white mt-6">Loading Equipment...</h2>
            <p className="text-white/60 mt-2">Please wait while we fetch the latest equipment</p>
          </div>
        </Container>
        {/* Toasts */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  // Show error message if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Container className="py-20">
          <div className="text-center py-20">
            <div className="text-red-400 mb-4">
              <FiPackage size={64} className="mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
            <p className="text-white/60 mb-6">Please log in to access the equipment management system.</p>
          </div>
        </Container>
      </div>
    );
  }

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        ...filters,
        page: 1,
        limit: 20
      }).toString();

      const response = await fetch(`https://sportify-equipement.onrender.com/api/proposals?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

  if (response.ok) {
  const data = await response.json();
  // Log server response shape to help debug missing proposer data
  console.debug('fetchProposals response:', data);

        // Normalize proposals so UI has a consistent proposer display name
        const rawProposals = data.data.proposals || [];
        const normalizedProposals = rawProposals.map((p) => {
          const proposer = p.proposedBy;
          const rawName = proposer
            ? (proposer.userName || proposer.username || proposer.name || (typeof proposer === 'string' ? proposer : null))
            : null;
          const shortId = proposer?.userId ? String(proposer.userId).slice(0, 8) : null;
          const displayName = rawName && rawName !== 'Unknown User' ? rawName : (shortId ? `User ${shortId}` : 'Unknown User');

          return {
            ...p,
            normalizedProposer: {
              displayName,
              userId: proposer?.userId || null,
            },
          };
        });

        // If we have proposer userIds, fetch their full names from auth service in bulk
        const userIds = Array.from(new Set(normalizedProposals.map(p => p.normalizedProposer?.userId).filter(Boolean)));
        if (userIds.length > 0) {
          try {
            const usersRes = await fetch('https://sportifyauth.onrender.com/api/auth/users/bulk', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userIds })
            });

            if (usersRes.ok) {
              const usersData = await usersRes.json();
              const users = usersData.users || [];
              const userMap = {};
              users.forEach(u => { userMap[String(u._id)] = u.fullName || u.firstName || u.email || String(u._id); });

              const withNames = normalizedProposals.map(p => {
                const uid = p.normalizedProposer?.userId;
                if (uid && userMap[uid]) {
                  return { ...p, normalizedProposer: { ...p.normalizedProposer, displayName: userMap[uid] } };
                }
                return p;
              });

              setProposals(withNames);
            } else {
              // If bulk fetch failed, fall back to normalized proposals
        setProposals(normalizedProposals);
            }
          } catch (err) {
            console.error('Error fetching proposer names:', err);
            setProposals(normalizedProposals);
          }
        } else {
          setProposals(normalizedProposals);
        }
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEcommerceItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        category: filters.category,
        search: filters.search,
        page: 1,
        limit: 20
      }).toString();

      const response = await fetch(`https://sportify-equipement.onrender.com/api/ecommerce/approved-proposals?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Combined items for shop:', data.data.equipment);
        setEcommerceItems(data.data.equipment || []);
      }
    } catch (error) {
      console.error('Error fetching ecommerce items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProposalAction = async (proposalId, decision, comments = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://sportify-equipement.onrender.com/api/proposals/${proposalId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ decision, comments })
      });

      if (response.ok) {
        fetchProposals(); // Refresh list
        addToast(`Proposal ${decision} successfully`, 'success');
      } else {
        const error = await response.json();
        addToast(error.message || 'Error processing request', 'error');
      }
    } catch (error) {
      console.error('Error processing proposal:', error);
      addToast('Error processing proposal', 'error');
    }
  };

  const addToCart = async (equipmentId, quantity = 1) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://sportify-equipement.onrender.com/api/ecommerce/cart/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          proposalId: equipmentId, // Using proposalId since we're working with approved proposals
          quantity
        })
      });

      if (response.ok) {
        addToast('Item added to cart successfully!', 'success');
      } else {
        const error = await response.json();
        addToast(error.message || 'Error adding to cart', 'error');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      addToast('Error adding to cart', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'from-green-400 to-green-600';
      case 'Rejected': return 'from-red-400 to-red-600';
      case 'Pending': return 'from-yellow-400 to-orange-500';
      case 'Under Review': return 'from-blue-400 to-blue-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return 'from-red-400 to-red-600';
      case 'High': return 'from-orange-400 to-orange-600';
      case 'Medium': return 'from-yellow-400 to-yellow-600';
      case 'Low': return 'from-green-400 to-green-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  // Helper to build a public URL for an uploaded image (reuse across this file)
  const getImageUrl = (image) => {
    if (!image) return ''
    if (typeof image === 'string') {
      if (image.startsWith('http')) return image
      const filename = image.split('\\').pop().split('/').pop()
      return `https://sportify-equipement.onrender.com/uploads/proposals/${filename}`
    }
    if (image.filename) return `https://sportify-equipement.onrender.com/uploads/proposals/${image.filename}`
    if (image.path) {
      if (image.path.startsWith('http')) return image.path
      const filename = image.path.split('\\').pop().split('/').pop()
      return `https://sportify-equipement.onrender.com/uploads/proposals/${filename}`
    }
    return ''
  }

  const renderProposals = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="relative">
            <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-8 h-8 border-4 border-transparent border-r-cyan-400 rounded-full animate-spin" 
                 style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
        </div>
      );
    }

    if (proposals.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <FiPackage size={64} className="mx-auto text-white/40 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Proposals Found</h3>
          <p className="text-white/60">
            {user?.role === 'Player' || user?.role === 'Manager' 
              ? 'Start by creating your first equipment proposal.' 
              : 'No proposals to review at this time.'}
          </p>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {proposals.map((proposal, index) => (
          <motion.div
            key={proposal._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group cursor-pointer transform hover:scale-105"
          >
            {/* Images */}
              {proposal.images && proposal.images.length > 0 && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={getImageUrl(proposal.images[0] || proposal.images[0].path)}
                    alt={proposal.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                {proposal.images.length > 1 && (
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    +{proposal.images.length - 1} more
                  </div>
                )}
              </div>
            )}

            <div className="p-6">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{proposal.name}</h3>
                <div className="flex space-x-2 ml-2">
                  <span className={`px-3 py-1 rounded-full text-white text-sm font-medium bg-gradient-to-r ${getStatusColor(proposal.status)}`}>
                    {proposal.status}
                  </span>
                  {proposal.priority && (
                    <span className={`px-3 py-1 rounded-full text-white text-sm font-medium bg-gradient-to-r ${getPriorityColor(proposal.priority)}`}>
                      {proposal.priority}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-blue-300 mb-2 text-sm">{proposal.category} • {proposal.type}</p>
              <p className="text-white/70 text-sm line-clamp-2 mb-4">{proposal.description}</p>

              <div className="mb-4 text-white/60 text-xs">
                <p>Proposed by: {proposal.normalizedProposer?.displayName || 'Unknown User'}</p>
                <p>{new Date(proposal.createdAt).toLocaleDateString()}</p>
                {proposal.estimatedValue && (
                  <p className="text-white font-medium mt-1">
                    Estimated Value: ${proposal.estimatedValue}
                  </p>
                )}
              </div>

              {/* Actions based on user role */}
              <div className="flex gap-2">
                <button
                  onClick={() => {/* Open details modal */}}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-xl hover:from-blue-500 hover:to-blue-400 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/50 flex items-center justify-center"
                >
                  <FiEye className="w-4 h-4 mr-1" />
                  Details
                </button>

                {/* Manager/Admin approval buttons */}
                {(user?.role === 'Manager' || user?.role === 'Admin') && proposal.status === 'Pending' && (
                  <>
                    <button
                      onClick={() => handleProposalAction(proposal._id, 'approved')}
                      className="px-4 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-medium rounded-xl hover:from-green-500 hover:to-green-400 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                    >
                      <FiCheck className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleProposalAction(proposal._id, 'rejected')}
                      className="px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-medium rounded-xl hover:from-red-500 hover:to-red-400 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  };

  const renderEcommerce = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="relative">
            <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-8 h-8 border-4 border-transparent border-r-cyan-400 rounded-full animate-spin" 
                 style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
        </div>
      );
    }

    if (ecommerceItems.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <FiShoppingCart size={64} className="mx-auto text-white/40 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Equipment Available</h3>
          <p className="text-white/60">Check back later for new equipment.</p>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
      >
        {ecommerceItems.map((item, index) => (
          <motion.div
            key={item._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group cursor-pointer transform hover:scale-105"
          >
            {/* Product image */}
            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
              {item.images && item.images.length > 0 ? (
                  <img
                    src={getImageUrl(item.images[0] || item.images[0].path)}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                />
              ) : null}
              <div className={`${item.images && item.images.length > 0 ? 'hidden' : 'flex'} w-full h-full items-center justify-center flex-col text-white/40`}>
                <FiPackage size={48} className="mb-2" />
                <span className="text-sm font-medium">{item.category}</span>
              </div>
              {item.availableStock <= 5 && (
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-white text-sm font-medium bg-gradient-to-r from-red-500 to-red-600">
                  Only {item.availableStock} left
                </div>
              )}
            </div>

            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{item.name}</h3>
              <p className="text-blue-300 mb-2 text-sm">{item.category}</p>
              <p className="text-white/70 text-sm line-clamp-2 mb-4">{item.description}</p>

              <div className="flex items-center justify-between text-white/60 text-sm mb-4">
                <div>
                  <span className="text-2xl font-bold text-white">${item.ecommerce?.price}</span>
                  {item.ecommerce?.originalPrice && item.ecommerce.originalPrice > item.ecommerce.price && (
                    <span className="text-sm text-white/50 line-through ml-2">
                      ${item.ecommerce.originalPrice}
                    </span>
                  )}
                </div>
                <span>Stock: {item.availableStock}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => addToCart(item._id)}
                  disabled={item.availableStock === 0}
                  className={`flex-1 py-3 font-medium rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 flex items-center justify-center ${
                    item.availableStock === 0
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 focus:ring-blue-500/50'
                  }`}
                >
                  <FiShoppingCart className="w-4 h-4 mr-2" />
                  {item.availableStock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
                
                <button
                  onClick={() => {/* Open product details */}}
                  className="px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-500 text-white font-medium rounded-xl hover:from-gray-500 hover:to-gray-400 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500/50"
                >
                  <FiEye className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  };

  // Get unique categories for filters
  const categories = ['Football', 'Basketball', 'Tennis', 'Volleyball', 'Swimming', 'Gym', 'Track & Field', 'Other'];
  const statuses = ['Pending', 'Under Review', 'Approved', 'Rejected'];

  // Filter data based on active tab
  const filteredData = activeTab === 'proposals' 
    ? proposals.filter(item => {
        const matchesSearch = item.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
                             item.description?.toLowerCase().includes(filters.search.toLowerCase());
        const matchesCategory = !filters.category || item.category === filters.category;
        const matchesStatus = !filters.status || item.status === filters.status;
        return matchesSearch && matchesCategory && matchesStatus;
      })
    : ecommerceItems.filter(item => {
        const matchesSearch = item.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
                             item.description?.toLowerCase().includes(filters.search.toLowerCase());
        const matchesCategory = !filters.category || item.category === filters.category;
        return matchesSearch && matchesCategory;
      });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary/50 to-primary/30 py-20">
        <div className="absolute inset-0 bg-background/30"></div>
        <Container className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {user?.role === 'Manager' && 'Review proposals and manage equipment purchases'}  
              {user?.role === 'Admin' && 'Full equipment management and oversight'}
            </p>
          </motion.div>
        </Container>
      </div>

      <Container className="py-12">
        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex border-b border-border">
            {[
              { id: 'proposals', label: 'Equipment Proposals' },
              { id: 'shop', label: 'Equipment Shop' },
              { id: 'cart', label: 'Cart' },
              ...(user?.role === 'Player' || user?.role === 'Manager' ? [{ id: 'create', label: 'Create Proposal' }] : [])
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
                {tab.id === 'proposals' && proposals.filter(p => p.status === 'Pending').length > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-destructive text-destructive-foreground">
                    {proposals.filter(p => p.status === 'Pending').length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:gap-6"
        >
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40" size={20} />
            <input
              type="text"
              placeholder={activeTab === 'proposals' ? 'Search proposals...' : 'Search equipment...'}
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            {/* Category Filter */}
            <div className="relative">
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="appearance-none bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm cursor-pointer"
              >
                <option value="" className="bg-gray-900 text-white">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category} className="bg-gray-900 text-white">
                    {category}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 pointer-events-none" size={16} />
            </div>

            {/* Status Filter (for proposals only) */}
            {activeTab === 'proposals' && (
              <div className="relative">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="appearance-none bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm cursor-pointer"
                >
                  <option value="" className="bg-gray-900 text-white">All Status</option>
                  {statuses.map(status => (
                    <option key={status} value={status} className="bg-gray-900 text-white">
                      {status}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 pointer-events-none" size={16} />
              </div>
            )}
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
            {filteredData.length} {activeTab === 'proposals' ? 'proposal' : 'item'}{filteredData.length !== 1 ? 's' : ''} found
          </p>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'proposals' && renderProposals()}
          {activeTab === 'shop' && renderEcommerce()}
          {activeTab === 'create' && (
            <CreateProposal 
              onBack={() => setActiveTab('proposals')}
              onSuccess={() => {
                setActiveTab('proposals');
                fetchProposals();
              }}
            />
          )}
          {activeTab === 'cart' && (
            <ShoppingCart 
              onBack={() => setActiveTab('shop')}
            />
          )}
        </AnimatePresence>
      </Container>
    </div>
  );
};

export default EquipmentManagement;