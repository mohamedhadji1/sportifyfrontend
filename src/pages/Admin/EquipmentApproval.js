import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../shared/ui/components/Card';
import { Button } from '../../shared/ui/components/Button';
import LoadingSpinner from '../../shared/ui/components/LoadingSpinner';
import { 
  FiCheck, 
  FiX, 
  FiEye, 
  FiFilter, 
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiSettings,
  FiDollarSign,
  FiPackage,
  FiUser,
  FiCalendar,
  FiFileText
} from 'react-icons/fi';

const EquipmentApproval = () => {
  const { user } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposals, setSelectedProposals] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('approve');
  const [bulkComments, setBulkComments] = useState('');
  const [processing, setProcessing] = useState(false);

  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProposals: 0,
    limit: 10
  });

  const [statistics, setStatistics] = useState([]);

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'manager')) {
      fetchProposals();
    }
  }, [filters, pagination.currentPage, user]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        ...filters,
        page: pagination.currentPage,
        limit: pagination.limit
      });

      const response = await fetch(`https://sportify-equipement.onrender.com/api/admin/equipment-proposals?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setProposals(data.data.proposals || []);
          setPagination(data.data.pagination || pagination);
          setStatistics(data.data.statistics || []);
        }
      } else {
        console.error('Failed to fetch proposals:', response.status);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (proposalId, comments = '', price = '', stock = '1') => {
    try {
      setProcessing(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`https://sportify-equipement.onrender.com/api/admin/approve-equipment/${proposalId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comments,
          setForSale: true,
          price: parseFloat(price) || 50,
          stock: parseInt(stock) || 1
        })
      });

      const data = await response.json();
      
      if (data.success) {
        showNotification('Equipment approved successfully!', 'success');
        fetchProposals(); // Refresh the list
      } else {
        showNotification(data.message || 'Error approving equipment', 'error');
      }
    } catch (error) {
      console.error('Error approving equipment:', error);
      showNotification('Error approving equipment', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (proposalId, comments) => {
    if (!comments || comments.trim().length === 0) {
      showNotification('Rejection reason is required', 'error');
      return;
    }

    try {
      setProcessing(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`https://sportify-equipement.onrender.com/api/admin/reject-equipment/${proposalId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comments })
      });

      const data = await response.json();
      
      if (data.success) {
        showNotification('Equipment rejected', 'success');
        fetchProposals(); // Refresh the list
      } else {
        showNotification(data.message || 'Error rejecting equipment', 'error');
      }
    } catch (error) {
      console.error('Error rejecting equipment:', error);
      showNotification('Error rejecting equipment', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkAction = async () => {
    if (selectedProposals.length === 0) {
      showNotification('Please select proposals to review', 'error');
      return;
    }

    if (bulkAction === 'reject' && (!bulkComments || bulkComments.trim().length === 0)) {
      showNotification('Comments are required for bulk rejection', 'error');
      return;
    }

    try {
      setProcessing(true);
      const token = localStorage.getItem('token');

      const response = await fetch('https://sportify-equipement.onrender.com/api/admin/bulk-review-equipment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          proposals: selectedProposals,
          action: bulkAction,
          comments: bulkComments,
          defaultPrice: 50,
          defaultStock: 1
        })
      });

      const data = await response.json();
      
      if (data.success) {
        showNotification(data.message, 'success');
        setSelectedProposals([]);
        setShowBulkModal(false);
        setBulkComments('');
        fetchProposals(); // Refresh the list
      } else {
        showNotification(data.message || 'Error in bulk action', 'error');
      }
    } catch (error) {
      console.error('Error in bulk action:', error);
      showNotification('Error in bulk action', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300 translate-x-full`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.remove('translate-x-full'), 100);
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Under Review': 'bg-blue-100 text-blue-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Cancelled': 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const ProposalCard = ({ proposal }) => {
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [approveComments, setApproveComments] = useState('');
    const [approvePrice, setApprovePrice] = useState(proposal.estimatedValue || 50);
    const [approveStock, setApproveStock] = useState(1);
    const [rejectComments, setRejectComments] = useState('');

    return (
      <Card key={proposal._id} className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-start space-x-4">
            <input
              type="checkbox"
              checked={selectedProposals.includes(proposal._id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedProposals(prev => [...prev, proposal._id]);
                } else {
                  setSelectedProposals(prev => prev.filter(id => id !== proposal._id));
                }
              }}
              className="mt-1"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{proposal.name}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <FiPackage className="w-4 h-4 mr-2" />
                  <span>{proposal.category}</span>
                </div>
                <div className="flex items-center">
                  <FiUser className="w-4 h-4 mr-2" />
                  <span>{proposal.proposedBy?.userName}</span>
                </div>
                <div className="flex items-center">
                  <FiDollarSign className="w-4 h-4 mr-2" />
                  <span>{formatPrice(proposal.estimatedValue || 0)}</span>
                </div>
                <div className="flex items-center">
                  <FiCalendar className="w-4 h-4 mr-2" />
                  <span>{formatDate(proposal.createdAt)}</span>
                </div>
              </div>
              <p className="text-sm text-gray-700 mt-2 line-clamp-2">{proposal.description}</p>
              <div className="mt-2">
                <span className="text-xs text-gray-500">Justification: </span>
                <span className="text-sm text-gray-700">{proposal.justification}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            {getStatusBadge(proposal.status)}
            <span className={`text-xs px-2 py-1 rounded ${
              proposal.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
              proposal.priority === 'High' ? 'bg-orange-100 text-orange-800' :
              proposal.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {proposal.priority}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedProposal(proposal);
                setShowDetailModal(true);
              }}
            >
              <FiEye className="w-4 h-4 mr-1" />
              Details
            </Button>
          </div>

          {proposal.status === 'Pending' && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRejectModal(true)}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <FiX className="w-4 h-4 mr-1" />
                Reject
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowApproveModal(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <FiCheck className="w-4 h-4 mr-1" />
                Approve
              </Button>
            </div>
          )}
        </div>

        {/* Approve Modal */}
        {showApproveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Approve Equipment</h3>
              <p className="text-gray-600 mb-4">Approve "{proposal.name}" for marketplace?</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sale Price (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={approvePrice}
                    onChange={(e) => setApprovePrice(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={approveStock}
                    onChange={(e) => setApproveStock(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comments (optional)
                  </label>
                  <textarea
                    value={approveComments}
                    onChange={(e) => setApproveComments(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Add approval comments..."
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowApproveModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    handleApprove(proposal._id, approveComments, approvePrice, approveStock);
                    setShowApproveModal(false);
                  }}
                  disabled={processing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {processing ? 'Processing...' : 'Approve'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Reject Equipment</h3>
              <p className="text-gray-600 mb-4">Reject "{proposal.name}"?</p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectComments}
                  onChange={(e) => setRejectComments(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Please provide a reason for rejection..."
                  required
                />
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    handleReject(proposal._id, rejectComments);
                    setShowRejectModal(false);
                  }}
                  disabled={processing || !rejectComments.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {processing ? 'Processing...' : 'Reject'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    );
  };

  // Check if user has admin access
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Access Denied</h2>
          <p className="text-muted-foreground">You need administrator privileges to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-card-foreground">Equipment Approval</h1>
              <p className="text-muted-foreground mt-2">
                Manage and review equipment proposals
              </p>
            </div>

            {selectedProposals.length > 0 && (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setBulkAction('approve');
                    setShowBulkModal(true);
                  }}
                  className="bg-green-50 text-green-600 border-green-600 hover:bg-green-100"
                >
                  <FiCheck className="w-4 h-4 mr-2" />
                  Bulk Approve ({selectedProposals.length})
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setBulkAction('reject');
                    setShowBulkModal(true);
                  }}
                  className="bg-red-50 text-red-600 border-red-600 hover:bg-red-100"
                >
                  <FiX className="w-4 h-4 mr-2" />
                  Bulk Reject ({selectedProposals.length})
                </Button>
              </div>
            )}
          </div>

          {/* Statistics */}
          {statistics.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {statistics.map(stat => (
                <div key={stat._id} className="bg-secondary p-4 rounded-lg">
                  <div className="text-2xl font-bold text-card-foreground">{stat.count}</div>
                  <div className="text-sm text-muted-foreground">{stat._id}</div>
                  <div className="text-xs text-muted-foreground">
                    Total Value: {formatPrice(stat.totalValue || 0)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search proposals..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="border border-border rounded-lg px-3 py-2 bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>

              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="border border-border rounded-lg px-3 py-2 bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Categories</option>
                <option value="Football">Football</option>
                <option value="Basketball">Basketball</option>
                <option value="Tennis">Tennis</option>
                <option value="Volleyball">Volleyball</option>
                <option value="Swimming">Swimming</option>
                <option value="Gym">Gym</option>
                <option value="Track & Field">Track & Field</option>
                <option value="Other">Other</option>
              </select>

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FiFilter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>

            {showFilters && (
              <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-2">
                      Sort By
                    </label>
                    <select
                      value={`${filters.sortBy}-${filters.sortOrder}`}
                      onChange={(e) => {
                        const [sortBy, sortOrder] = e.target.value.split('-');
                        handleFilterChange('sortBy', sortBy);
                        handleFilterChange('sortOrder', sortOrder);
                      }}
                      className="w-full border border-border rounded-lg px-3 py-2 bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="createdAt-desc">Newest First</option>
                      <option value="createdAt-asc">Oldest First</option>
                      <option value="name-asc">Name: A to Z</option>
                      <option value="name-desc">Name: Z to A</option>
                      <option value="estimatedValue-desc">Value: High to Low</option>
                      <option value="estimatedValue-asc">Value: Low to High</option>
                      <option value="priority-desc">Priority: High to Low</option>
                    </select>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {proposals.length === 0 ? (
          <div className="text-center py-12">
            <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No proposals found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.search || filters.status !== 'all' || filters.category !== 'all' 
                ? 'Try adjusting your search or filters.' 
                : 'No equipment proposals have been submitted yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map(proposal => (
              <ProposalCard key={proposal._id} proposal={proposal} />
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage <= 1}
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                >
                  <FiChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let page;
                    if (pagination.totalPages <= 5) {
                      page = i + 1;
                    } else if (pagination.currentPage <= 3) {
                      page = i + 1;
                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                      page = pagination.totalPages - 4 + i;
                    } else {
                      page = pagination.currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: page }))}
                        className={`px-3 py-2 text-sm rounded ${
                          page === pagination.currentPage
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage >= pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                >
                  Next
                  <FiChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bulk Action Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              Bulk {bulkAction === 'approve' ? 'Approve' : 'Reject'} Proposals
            </h3>
            <p className="text-gray-600 mb-4">
              {bulkAction === 'approve' ? 'Approve' : 'Reject'} {selectedProposals.length} selected proposals?
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comments {bulkAction === 'reject' ? '*' : '(optional)'}
              </label>
              <textarea
                value={bulkComments}
                onChange={(e) => setBulkComments(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={`Add ${bulkAction} comments...`}
                required={bulkAction === 'reject'}
              />
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowBulkModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleBulkAction}
                disabled={processing || (bulkAction === 'reject' && !bulkComments.trim())}
                className={`flex-1 ${bulkAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {processing ? 'Processing...' : `${bulkAction === 'approve' ? 'Approve' : 'Reject'} All`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">{selectedProposal.name}</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Basic Information</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Category:</strong> {selectedProposal.category}</div>
                      <div><strong>Type:</strong> {selectedProposal.type}</div>
                      <div><strong>Brand:</strong> {selectedProposal.brand || 'N/A'}</div>
                      <div><strong>Model:</strong> {selectedProposal.model || 'N/A'}</div>
                      <div><strong>Condition:</strong> {selectedProposal.condition}</div>
                      <div><strong>Estimated Value:</strong> {formatPrice(selectedProposal.estimatedValue || 0)}</div>
                      <div><strong>Priority:</strong> {selectedProposal.priority}</div>
                      <div><strong>Status:</strong> {getStatusBadge(selectedProposal.status)}</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <p className="text-sm text-gray-700">{selectedProposal.description}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Justification</h3>
                    <p className="text-sm text-gray-700">{selectedProposal.justification}</p>
                  </div>
                </div>

                {/* Proposer and Review Information */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Proposed By</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Name:</strong> {selectedProposal.proposedBy?.userName}</div>
                      <div><strong>Role:</strong> {selectedProposal.proposedBy?.userRole}</div>
                      <div><strong>Email:</strong> {selectedProposal.proposedBy?.userEmail || 'N/A'}</div>
                      <div><strong>Date:</strong> {formatDate(selectedProposal.createdAt)}</div>
                    </div>
                  </div>

                  {selectedProposal.review && selectedProposal.review.reviewedBy && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Review Information</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>Reviewed By:</strong> {selectedProposal.review.reviewedBy.userName}</div>
                        <div><strong>Review Date:</strong> {formatDate(selectedProposal.review.reviewDate)}</div>
                        <div><strong>Decision:</strong> {selectedProposal.review.decision}</div>
                        {selectedProposal.review.comments && (
                          <div><strong>Comments:</strong> {selectedProposal.review.comments}</div>
                        )}
                        {selectedProposal.review.approvedBudget && (
                          <div><strong>Approved Budget:</strong> {formatPrice(selectedProposal.review.approvedBudget)}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedProposal.ecommerceInfo && selectedProposal.ecommerceInfo.isForSale && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">E-commerce Settings</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>For Sale:</strong> {selectedProposal.ecommerceInfo.isForSale ? 'Yes' : 'No'}</div>
                        <div><strong>Price:</strong> {formatPrice(selectedProposal.ecommerceInfo.price || 0)}</div>
                        <div><strong>Stock:</strong> {selectedProposal.ecommerceInfo.stock || 0}</div>
                        <div><strong>Approval Status:</strong> {selectedProposal.ecommerceInfo.approvalStatus}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Images */}
              {selectedProposal.images && selectedProposal.images.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedProposal.images.map((image, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={`https://sportify-equipement.onrender.com/uploads/${image.filename}`}
                          alt={`Equipment ${index + 1}`}
                          className="w-full h-32 object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<div class="w-full h-32 flex items-center justify-center bg-gray-100 text-gray-500">No Image</div>';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action History */}
              {selectedProposal.actionHistory && selectedProposal.actionHistory.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Action History</h3>
                  <div className="space-y-2">
                    {selectedProposal.actionHistory.map((action, index) => (
                      <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{action.action}</div>
                          <div className="text-sm text-gray-600">
                            By {action.performedBy.userName} - {formatDate(action.date)}
                          </div>
                          {action.notes && (
                            <div className="text-sm text-gray-700 mt-1">{action.notes}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentApproval;