import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  FiPackage, 
  FiEye, 
  FiCheck, 
  FiX, 
  FiUser, 
  FiCalendar,
  FiTag,
  FiClock,
  FiDollarSign,
  FiShoppingCart,
  FiAlert
} from 'react-icons/fi';

const ProposalsList = () => {
  const { user } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedProposal, setSelectedProposal] = useState(null);

  useEffect(() => {
    fetchProposals();
  }, [filter]);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = 'http://localhost:5009/api/proposals';
      
      if (filter !== 'all') {
        url += `?status=${filter}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setProposals(result.data);
      } else {
        console.error('Error fetching proposals');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProposal = async (proposalId, decision) => {
    if (!['Approved', 'Rejected'].includes(decision)) return;

    const comments = prompt(`Please provide comments for ${decision.toLowerCase()} this proposal:`);
    if (comments === null) return; // User cancelled

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5009/api/proposals/${proposalId}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          decision,
          comments
        })
      });

      if (response.ok) {
        alert(`Proposal ${decision.toLowerCase()} successfully!`);
        fetchProposals(); // Refresh the list
      } else {
        const error = await response.json();
        alert(error.message || `Error ${decision.toLowerCase().slice(0, -1)}ing proposal`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Error ${decision.toLowerCase().slice(0, -1)}ing proposal`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Approved': return 'text-green-600 bg-green-100';
      case 'Rejected': return 'text-red-600 bg-red-100';
      case 'Cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return 'text-red-600 bg-red-100';
      case 'High': return 'text-orange-600 bg-orange-100';
      case 'Medium': return 'text-blue-600 bg-blue-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading proposals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Equipment Proposals</h1>
        <p className="text-muted-foreground">
          {user?.role === 'Admin' || user?.role === 'Manager' 
            ? 'Review and manage equipment proposals from users' 
            : 'View and manage your equipment proposals'
          }
        </p>
      </div>

      {/* Filter buttons */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          All Proposals
        </button>
        <button
          onClick={() => setFilter('Pending')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'Pending'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('Approved')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'Approved'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setFilter('Rejected')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'Rejected'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          Rejected
        </button>
      </div>

      {proposals.length === 0 ? (
        <div className="text-center py-12">
          <FiPackage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Proposals Found</h3>
          <p className="text-gray-500">
            {filter === 'all' ? 'No equipment proposals have been created yet.' : `No ${filter.toLowerCase()} proposals found.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {proposals.map((proposal) => (
            <div key={proposal._id} className="bg-card border border-border rounded-lg shadow-sm">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-card-foreground">
                        {proposal.name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                        {proposal.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(proposal.priority)}`}>
                        {proposal.priority}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center">
                        <FiTag className="w-4 h-4 mr-1" />
                        {proposal.category}
                      </span>
                      <span className="flex items-center">
                        <FiUser className="w-4 h-4 mr-1" />
                        {proposal.proposedBy?.userName || 'Unknown User'}
                      </span>
                      <span className="flex items-center">
                        <FiCalendar className="w-4 h-4 mr-1" />
                        {new Date(proposal.createdAt).toLocaleDateString()}
                      </span>
                      {proposal.estimatedValue && (
                        <span className="flex items-center">
                          <FiDollarSign className="w-4 h-4 mr-1" />
                          €{proposal.estimatedValue}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                      {proposal.description}
                    </p>

                    {/* E-commerce info */}
                    {proposal.ecommerceInfo?.isForSale && (
                      <div className="flex items-center gap-2 mb-3">
                        <FiShoppingCart className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-blue-600 font-medium">
                          Proposed for E-commerce Shop
                        </span>
                        {proposal.ecommerceInfo.price > 0 && (
                          <span className="text-sm text-muted-foreground">
                            (Suggested price: €{proposal.ecommerceInfo.price})
                          </span>
                        )}
                      </div>
                    )}

                    {/* Review info */}
                    {proposal.review?.decision && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <p className="text-sm text-gray-600">
                          <strong>Review by {proposal.review.reviewedBy?.userName}:</strong> {proposal.review.comments}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => setSelectedProposal(selectedProposal === proposal._id ? null : proposal._id)}
                      className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
                    >
                      <FiEye className="w-4 h-4 mr-1" />
                      {selectedProposal === proposal._id ? 'Hide' : 'Details'}
                    </button>

                    {/* Admin/Manager actions */}
                    {(user?.role === 'Admin' || user?.role === 'Manager') && proposal.status === 'Pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveProposal(proposal._id, 'Approved')}
                          className="flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm"
                        >
                          <FiCheck className="w-4 h-4 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleApproveProposal(proposal._id, 'Rejected')}
                          className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
                        >
                          <FiX className="w-4 h-4 mr-1" />
                          Reject
                        </button>
                      </div>
                    )}

                    {/* E-commerce approval for approved proposals */}
                    {user?.role === 'Admin' && proposal.status === 'Approved' && 
                     proposal.ecommerceInfo?.isForSale && 
                     proposal.ecommerceInfo?.approvalStatus === 'pending' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <div className="flex items-center mb-2">
                          <FiAlert className="w-4 h-4 text-blue-500 mr-2" />
                          <span className="text-sm font-medium text-blue-800">
                            E-commerce Approval Needed
                          </span>
                        </div>
                        <button
                          onClick={() => window.location.href = '/admin/ecommerce-approval'}
                          className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          Review for Shop →
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {selectedProposal === proposal._id && (
                  <div className="border-t border-border pt-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Equipment Details</h4>
                        <div className="space-y-2 text-sm">
                          <p><span className="font-medium">Type:</span> {proposal.type}</p>
                          <p><span className="font-medium">Brand:</span> {proposal.brand || 'Not specified'}</p>
                          <p><span className="font-medium">Model:</span> {proposal.model || 'Not specified'}</p>
                          <p><span className="font-medium">Condition:</span> {proposal.condition}</p>
                        </div>

                        <div className="mt-4">
                          <h5 className="font-medium mb-2">Justification</h5>
                          <p className="text-sm text-muted-foreground">{proposal.justification}</p>
                        </div>
                      </div>

                      <div>
                        {/* Images */}
                        {proposal.images && proposal.images.length > 0 && (
                          <div>
                            <h5 className="font-medium mb-2">Images</h5>
                            <div className="grid grid-cols-2 gap-2">
                              {proposal.images.map((image, index) => (
                                <img
                                  key={index}
                                  src={`http://localhost:5009/uploads/proposals/${image.filename}`}
                                  alt={`Equipment ${index + 1}`}
                                  className="w-full h-24 object-cover rounded border"
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tags */}
                        {proposal.tags && proposal.tags.length > 0 && (
                          <div className="mt-4">
                            <h5 className="font-medium mb-2">Tags</h5>
                            <div className="flex flex-wrap gap-1">
                              {proposal.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProposalsList;