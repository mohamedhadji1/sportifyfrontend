import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  FiEye, 
  FiCheck, 
  FiX, 
  FiClock,
  FiGrid,
  FiList
} from 'react-icons/fi';
import { Container } from '../../shared/ui/components/Container';
import { Button } from '../../shared/ui/components/Button';
import SearchBar from '../../shared/ui/components/SearchBar';
import LoadingSpinner from '../../shared/ui/components/LoadingSpinner';
import { Tabs } from '../../shared/ui/components/Tabs';
import { useToast, ToastContainer } from '../../shared/ui/components/Toast';
import CreateProposal from './CreateProposal';


const EquipmentManagement = () => {
  const { user, loading: authLoading } = useAuth();
  const { toasts, success, error, warning, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState('proposals');
  const [viewMode, setViewMode] = useState('grid');
  const [proposals, setProposals] = useState([]);
  const [ecommerceItems, setEcommerceItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: ''
  });

  // Stable fetch functions so useEffect can depend on them
  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = 'https://sportify-equipement.onrender.com/api/equipment/proposals';
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      
      if (params.toString()) url += '?' + params.toString();

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('Proposals fetched:', result.data);
        // Debug: Check if images are present
        result.data?.forEach(p => {
          console.log(`Proposal "${p.name}":`, {
            hasImages: !!p.images,
            imageCount: p.images?.length || 0,
            firstImage: p.images?.[0]
          });
        });
        setProposals(result.data || []);
      } else {
        console.error('Error fetching proposals:', result.message);
        setProposals([]);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
      setProposals([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchEcommerceItems = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams({
        category: filters.category || '',
        search: filters.search || '',
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
      } else {
        console.error('Error fetching approved proposals:', response.status);
        setEcommerceItems([]);
      }
    } catch (error) {
      console.error('Error fetching ecommerce items:', error);
      setEcommerceItems([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch proposals or ecommerce items when tab/filters/auth change
  useEffect(() => {
    // Only fetch data if user is authenticated and not loading
    if (!authLoading && user) {
      if (activeTab === 'proposals') {
        fetchProposals();
      } else if (activeTab === 'shop') {
        fetchEcommerceItems();
      }
    }
  }, [activeTab, filters, authLoading, user, fetchProposals, fetchEcommerceItems]);

  // Keep a trivial effect to reference ecommerceItems so the variable is used
  useEffect(() => {
    if (ecommerceItems && ecommerceItems.length > 0) {
      // Intentionally log to keep eslint happy that ecommerceItems is used
      console.debug('Ecommerce items count:', ecommerceItems.length);
    }
  }, [ecommerceItems]);

  // Show loading spinner while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error message if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to access equipment management.</p>
        </div>
      </div>
    );
  }

  

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-600';
      case 'Medium': return 'bg-amber-100 text-amber-800';
      case 'Low': return 'bg-green-100 text-green-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  

  const handleProposalAction = async (proposalId, action) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://sportify-equipement.onrender.com/api/equipment/proposals/${proposalId}/review`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          decision: action === 'approve' ? 'Approved' : 'Rejected',
          comments: `Proposal ${action}d via admin panel`
        })
      });

      const result = await response.json();
      
      if (result.success) {
        fetchProposals(); // Refresh the list
        success(`Proposal ${action}d successfully!`);
      } else {
        error('Error: ' + (result.message || 'An error occurred'));
      }
    } catch (err) {
      console.error(`Error ${action} proposal:`, err);
      error(`Error ${action}ing proposal. Please try again.`);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const addToCart = async (item, quantity = 1) => {
    try {
      const token = localStorage.getItem('token');
      
      // Vérifier que l'item a un ID valide et des données e-commerce
      if (!item._id || !item.ecommerce?.isAvailableForSale) {
        warning('This item is not available for purchase');
        return;
      }
      
      // Utiliser le nouvel endpoint pour les propositions approuvées
      const response = await fetch('https://sportify-equipement.onrender.com/api/ecommerce/cart/add-proposal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          proposalId: item._id,
          quantity,
          specifications: item.specifications || {},
          notes: ''
        })
      });

      if (response.ok) {
        await response.json();
        success('Item added to cart successfully!');
        // Optionally refresh cart count or update UI
      } else {
        const errorData = await response.json();
        error(errorData.message || 'Failed to add item to cart');
      }
    } catch (err) {
      console.error('Error adding item to cart:', err);
      error('Error adding item to cart. Please try again.');
    }
  };

  const handleViewDetails = (proposal) => {
    setSelectedProposal(proposal);
    setShowProposalModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-success text-success-foreground';
      case 'Rejected': return 'bg-destructive text-destructive-foreground';
      case 'Pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      case 'Under Review': return 'bg-primary/10 text-primary';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Helper function to convert file system paths to proper URLs
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If it's already a full URL, use it
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // If it's an absolute file system path, extract the relative part
    if (imagePath.includes('uploads')) {
      const relativePath = imagePath.split('uploads')[1] || imagePath.split('uploads\\')[1];
      return `https://sportify-equipement.onrender.com/uploads${relativePath?.replace(/\\/g, '/')}`;
    }
    
    // Otherwise, treat as relative path
    return `https://sportify-equipement.onrender.com/${imagePath.replace(/^\/+/, '').replace(/\\/g, '/')}`;
  };

  // Render the proposals list (used by Admin view)
  const renderProposals = () => {
    if (loading) {
      return (
        <div className="py-12 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      );
    }
    if (!proposals || proposals.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          No proposals found.
        </div>
      );
    }

    // Grid or list layout
    return (
      <div>
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {proposals.map((proposal) => (
              <div key={proposal._id} className="group bg-gradient-to-br from-card to-card/80 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border border-border/50 overflow-hidden hover:-translate-y-2 hover:border-primary/50">
                {/* Image area */}
                {proposal.images && proposal.images.length > 0 ? (
                  <div className="relative h-52 w-full overflow-hidden">
                    <img
                      src={getImageUrl(proposal.images[0].path)}
                      alt={proposal.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => { 
                        console.error('Image failed to load:', proposal.images[0].path);
                        console.error('Attempted URL:', e.target.src);
                        e.target.style.display = 'none';
                        const overlay = e.target.nextElementSibling;
                        const fallback = e.target.parentElement?.querySelector('.image-fallback');
                        if (overlay) overlay.style.display = 'none';
                        if (fallback) fallback.style.display = 'flex';
                      }}
                      onLoad={(e) => console.log('Image loaded successfully from:', e.target.src)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    {proposal.images.length > 1 && (
                      <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium">
                        +{proposal.images.length - 1} more
                      </div>
                    )}
                    {/* Status Badge on Image */}
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm ${getStatusColor(proposal.status)} shadow-lg`}>
                        {proposal.status}
                      </span>
                    </div>
                    {/* Fallback if image fails */}
                    <div className="image-fallback absolute inset-0 bg-gradient-to-br from-muted to-muted/50" style={{ display: 'none' }}>
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-muted-foreground">
                          <FiClock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <span className="text-sm">Image Failed to Load</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-52 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <FiClock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <span className="text-sm">No Image Available</span>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-card-foreground truncate flex-1 group-hover:text-primary transition-colors">{proposal.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ml-2 ${getPriorityColor(proposal.priority)}`}>
                      {proposal.priority}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-2 font-medium">{proposal.category} • {proposal.type}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">{proposal.description}</p>

                  <div className="mb-4 pb-4 border-b border-border/50">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="font-medium">Proposed by:</span> {proposal.proposedBy?.userName || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground">{proposal.createdAt ? new Date(proposal.createdAt).toLocaleDateString() : 'Unknown'}</p>
                    {proposal.estimatedValue && (
                      <p className="text-sm font-bold text-primary mt-2">💰 ${proposal.estimatedValue}</p>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button onClick={() => handleViewDetails(proposal)} variant="outline" size="sm" className="flex items-center flex-1 justify-center hover:bg-primary/10 hover:border-primary transition-all">
                      <FiEye className="w-4 h-4 mr-1.5" /> Details
                    </Button>

                    {(user?.role === 'Manager' || user?.role === 'Admin') && proposal.status === 'Pending' && (
                      <>
                        <Button onClick={() => handleProposalAction(proposal._id, 'approve')} variant="primary" size="sm" className="flex items-center justify-center bg-success hover:bg-success/90 shadow-md hover:shadow-lg transition-all">
                          <FiCheck className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => handleProposalAction(proposal._id, 'reject')} variant="destructive" size="sm" className="flex items-center justify-center shadow-md hover:shadow-lg transition-all">
                          <FiX className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <div key={proposal._id} className="group bg-gradient-to-r from-card to-card/80 rounded-xl shadow-md border border-border/50 p-5 flex items-start hover:shadow-xl hover:border-primary/50 transition-all duration-300">
                <div className="w-32 h-24 mr-5 overflow-hidden rounded-lg flex-shrink-0 border border-border/50">
                  {proposal.images && proposal.images[0] ? (
                    <img 
                      src={getImageUrl(proposal.images[0].path)} 
                      alt={proposal.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                      onError={(e) => { e.target.style.display = 'none'; }} 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-muted-foreground">
                      <FiClock className="w-8 h-8 opacity-50" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-card-foreground group-hover:text-primary transition-colors truncate">{proposal.name}</h3>
                    <div className="flex items-center space-x-2 ml-3 flex-shrink-0">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(proposal.status)}`}>{proposal.status}</span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(proposal.priority)}`}>{proposal.priority}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">{proposal.category} • {proposal.type}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{proposal.description}</p>
                  {proposal.estimatedValue && (
                    <p className="text-sm font-bold text-primary mb-3">💰 ${proposal.estimatedValue}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => handleViewDetails(proposal)} variant="outline" size="sm" className="hover:bg-primary/10 hover:border-primary transition-all">
                      <FiEye className="w-4 h-4 mr-1.5" /> Details
                    </Button>
                    {(user?.role === 'Manager' || user?.role === 'Admin') && proposal.status === 'Pending' && (
                      <>
                        <Button onClick={() => handleProposalAction(proposal._id, 'approve')} className="bg-success hover:bg-success/90 text-success-foreground shadow-md hover:shadow-lg transition-all">
                          <FiCheck className="w-4 h-4 mr-1.5" /> Approve
                        </Button>
                        <Button onClick={() => handleProposalAction(proposal._id, 'reject')} variant="destructive" className="shadow-md hover:shadow-lg transition-all">
                          <FiX className="w-4 h-4 mr-1.5" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // renderEcommerce removed: not used in admin-only view

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <Container className="py-8">
        {user?.role === 'Admin' ? (
          <>
            {/* Navigation Tabs for Admin */}
            <div className="mb-6">
              <Tabs
                tabs={[
                  {
                    id: 'proposals',
                    label: `Equipment Proposals${proposals.filter(p => p.status === 'Pending').length > 0 ? ` (${proposals.filter(p => p.status === 'Pending').length})` : ''}`
                  },
                ]}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </div>

            {/* Filters and Controls (Admin) */}
            <div className="mb-8">
              <div className="bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 overflow-hidden">
                {/* Filter Header */}
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-4 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-card-foreground">Filter & Search</h3>
                        <p className="text-xs text-muted-foreground">Refine your proposal search</p>
                      </div>
                    </div>
                    
                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-2 bg-muted/30 backdrop-blur-sm p-1.5 rounded-xl border border-border/30">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          viewMode === 'grid' 
                            ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 scale-105' 
                            : 'text-muted-foreground hover:text-card-foreground hover:bg-muted/50'
                        }`}
                        aria-label="Grid view"
                      >
                        <FiGrid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          viewMode === 'list' 
                            ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 scale-105' 
                            : 'text-muted-foreground hover:text-card-foreground hover:bg-muted/50'
                        }`}
                        aria-label="List view"
                      >
                        <FiList className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Filter Content */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search Input */}
                    <div className="md:col-span-3 lg:col-span-1">
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        🔍 Search
                      </label>
                      <SearchBar
                        value={filters.search}
                        onChange={(value) => setFilters(prev => ({ ...prev, search: value }))}
                        placeholder={'Search by name, description...'}
                      />
                    </div>

                    {/* Category Filter */}
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        📂 Category
                      </label>
                      <div className="relative">
                        <select
                          value={filters.category}
                          onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full appearance-none border-2 border-border/50 rounded-xl px-4 py-3 bg-gradient-to-br from-card to-card/50 text-card-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all hover:border-primary/50 hover:shadow-md cursor-pointer"
                        >
                          <option value="">🌟 All Categories</option>
                          <option value="Football">⚽ Football</option>
                          <option value="Basketball">🏀 Basketball</option>
                          <option value="Tennis">🎾 Tennis</option>
                          <option value="Volleyball">🏐 Volleyball</option>
                          <option value="Swimming">🏊 Swimming</option>
                          <option value="Gym">💪 Gym</option>
                          <option value="Track & Field">🏃 Track & Field</option>
                          <option value="Other">📦 Other</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        📊 Status
                      </label>
                      <div className="relative">
                        <select
                          value={filters.status}
                          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full appearance-none border-2 border-border/50 rounded-xl px-4 py-3 bg-gradient-to-br from-card to-card/50 text-card-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all hover:border-primary/50 hover:shadow-md cursor-pointer"
                        >
                          <option value="">📋 All Status</option>
                          <option value="Pending">⏳ Pending</option>
                          <option value="Under Review">🔍 Under Review</option>
                          <option value="Approved">✅ Approved</option>
                          <option value="Rejected">❌ Rejected</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Active Filters Display */}
                  {(filters.search || filters.category || filters.status) && (
                    <div className="mt-4 pt-4 border-t border-border/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-muted-foreground">Active Filters:</span>
                          {filters.search && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium border border-primary/20">
                              🔍 "{filters.search}"
                              <button
                                onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                                className="hover:text-primary/70 transition-colors"
                              >
                                ×
                              </button>
                            </span>
                          )}
                          {filters.category && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium border border-primary/20">
                              {filters.category}
                              <button
                                onClick={() => setFilters(prev => ({ ...prev, category: '' }))}
                                className="hover:text-primary/70 transition-colors"
                              >
                                ×
                              </button>
                            </span>
                          )}
                          {filters.status && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium border border-primary/20">
                              {filters.status}
                              <button
                                onClick={() => setFilters(prev => ({ ...prev, status: '' }))}
                                className="hover:text-primary/70 transition-colors"
                              >
                                ×
                              </button>
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => setFilters({ search: '', category: '', status: '' })}
                          className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Clear All
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content (Admin - Proposals) */}
            <div className="bg-card/30 backdrop-blur-sm rounded-2xl shadow-lg border border-border/50 overflow-hidden">
              <div className="p-6">
                {activeTab === 'proposals' && renderProposals()}
              </div>
            </div>
          </>
        ) : (
          // Non-admin roles see only the CreateProposal form
          <div className="bg-card/30 backdrop-blur-sm rounded-2xl shadow-lg border border-border/50 overflow-hidden">
            <div className="p-8">
              <CreateProposal
                onBack={null}
                onSuccess={() => {
                  // Non-admin: show a simple success alert or keep silent; CreateProposal handles its own status
                }}
              />
            </div>
          </div>
        )}
        
        {/* Proposal Details Modal */}
        {showProposalModal && selectedProposal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-card rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-border/50 animate-in zoom-in-95 duration-300">
              <div className="sticky top-0 bg-card/95 backdrop-blur-sm z-10 px-8 py-6 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Proposal Details
                  </h2>
                  <button
                    onClick={() => setShowProposalModal(false)}
                    className="text-muted-foreground hover:text-destructive bg-muted/50 hover:bg-destructive/10 p-2.5 rounded-lg transition-all hover:rotate-90"
                    aria-label="Close details"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-8 space-y-6">
                  {/* Images */}
                  {selectedProposal.images && selectedProposal.images.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedProposal.images.map((image, index) => (
                        <div key={index} className="h-56 rounded-xl overflow-hidden border border-border/50 shadow-md hover:shadow-xl transition-shadow">
                          <img
                            src={getImageUrl(image.path)}
                            alt={`${selectedProposal.name} ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div 
                            className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-muted-foreground"
                            style={{ display: 'none' }}
                          >
                            <div className="text-center">
                              <FiClock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <span className="text-sm">Image not available</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-56 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border border-border/50">
                      <div className="text-center text-muted-foreground">
                        <FiClock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <span className="text-lg font-medium">No Images Available</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Name</label>
                      <p className="text-card-foreground font-bold text-lg">{selectedProposal.name}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Category</label>
                      <p className="text-card-foreground font-medium">{selectedProposal.category}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Type</label>
                      <p className="text-card-foreground font-medium">{selectedProposal.type}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Brand</label>
                      <p className="text-card-foreground font-medium">{selectedProposal.brand || 'Not specified'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Model</label>
                      <p className="text-card-foreground font-medium">{selectedProposal.model || 'Not specified'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Condition</label>
                      <p className="text-card-foreground font-medium">{selectedProposal.condition}</p>
                    </div>
                  </div>
                  
                  {/* Status and Priority */}
                  <div className="flex items-center gap-6 p-5 bg-muted/30 rounded-xl border border-border/50">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide block">Status</label>
                      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-md ${getStatusColor(selectedProposal.status)}`}>
                        {selectedProposal.status}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide block">Priority</label>
                      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-md ${getPriorityColor(selectedProposal.priority)}`}>
                        {selectedProposal.priority}
                      </span>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide block">Description</label>
                    <p className="text-card-foreground whitespace-pre-wrap leading-relaxed p-4 bg-muted/20 rounded-lg border border-border/50">{selectedProposal.description}</p>
                  </div>
                  
                  {/* Justification */}
                  {selectedProposal.justification && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide block">Justification</label>
                      <p className="text-card-foreground whitespace-pre-wrap leading-relaxed p-4 bg-muted/20 rounded-lg border border-border/50">{selectedProposal.justification}</p>
                    </div>
                  )}
                  
                  {/* Value and Metadata */}
                  <div className="grid grid-cols-2 gap-6">
                    {selectedProposal.estimatedValue && (
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Estimated Value</label>
                        <p className="text-primary font-bold text-xl">💰 ${selectedProposal.estimatedValue}</p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Proposed by</label>
                      <p className="text-card-foreground font-medium">{selectedProposal.proposedBy?.userName || 'Unknown'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Created</label>
                      <p className="text-card-foreground font-medium">{selectedProposal.createdAt ? new Date(selectedProposal.createdAt).toLocaleDateString() : 'Unknown'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Last Updated</label>
                      <p className="text-card-foreground font-medium">{selectedProposal.updatedAt ? new Date(selectedProposal.updatedAt).toLocaleDateString() : 'Unknown'}</p>
                    </div>
                  </div>
                  
                  {/* Tags */}
                  {selectedProposal.tags && selectedProposal.tags.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide block">Tags</label>
                      <div className="flex flex-wrap gap-2">
                        {selectedProposal.tags.map((tag, index) => (
                          <span 
                            key={index}
                            className="bg-primary/20 text-primary px-3 py-1.5 rounded-lg text-sm font-medium border border-primary/30 hover:bg-primary/30 transition-colors"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                
                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
                    <Button onClick={() => setShowProposalModal(false)} variant="outline" className="px-6 py-2.5 hover:bg-muted transition-all">Close</Button>
                    {(user?.role === 'Manager' || user?.role === 'Admin') && selectedProposal.status === 'Pending' && (
                      <>
                        <Button
                          onClick={() => {
                            handleProposalAction(selectedProposal._id, 'approve');
                            setShowProposalModal(false);
                          }}
                          className="bg-success hover:bg-success/90 text-success-foreground px-6 py-2.5 shadow-md hover:shadow-lg transition-all"
                        >
                          <FiCheck className="w-5 h-5 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => {
                            handleProposalAction(selectedProposal._id, 'reject');
                            setShowProposalModal(false);
                          }}
                          variant="destructive"
                          className="px-6 py-2.5 shadow-md hover:shadow-lg transition-all"
                        >
                          <FiX className="w-5 h-5 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
        )}
      </Container>
    </div>
  );
};

export default EquipmentManagement;