import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  FiCheck, 
  FiX, 
  FiDollarSign, 
  FiPackage, 
  FiEye, 
  FiClock,
  FiUser,
  FiCalendar,
  FiTag,
  FiAlertCircle
} from 'react-icons/fi';

const EcommerceApproval = () => {
  const { user } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [approvalData, setApprovalData] = useState({
    price: '',
    stock: 0
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPendingProposals();
  }, []);

  const fetchPendingProposals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5009/api/proposals/pending-ecommerce', {
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

  const handleApprove = async (proposalId) => {
    if (!approvalData.price || approvalData.price <= 0) {
      alert('Please enter a valid price');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5009/api/proposals/${proposalId}/approve-ecommerce`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          price: parseFloat(approvalData.price),
          stock: parseInt(approvalData.stock) || 0
        })
      });

      if (response.ok) {
        alert('Equipment approved for e-commerce successfully!');
        setSelectedProposal(null);
        setApprovalData({ price: '', stock: 0 });
        fetchPendingProposals(); // Refresh the list
      } else {
        const error = await response.json();
        alert(error.message || 'Error approving equipment');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error approving equipment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (proposalId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5009/api/proposals/${proposalId}/reject-ecommerce`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        alert('Equipment rejected for e-commerce');
        setSelectedProposal(null);
        fetchPendingProposals(); // Refresh the list
      } else {
        const error = await response.json();
        alert(error.message || 'Error rejecting equipment');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error rejecting equipment');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || user.role !== 'Admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Admin privileges required to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading pending proposals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">E-commerce Approval</h1>
        <p className="text-muted-foreground">
          Review and approve equipment proposals for the online shop
        </p>
      </div>

      {proposals.length === 0 ? (
        <div className="text-center py-12">
          <FiPackage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Pending Proposals</h3>
          <p className="text-gray-500">All equipment proposals have been reviewed.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {proposals.map((proposal) => (
            <div key={proposal._id} className="bg-card border border-border rounded-lg shadow-sm">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-card-foreground mb-2">
                      {proposal.name}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <FiTag className="w-4 h-4 mr-1" />
                        {proposal.category}
                      </span>
                      <span className="flex items-center">
                        <FiUser className="w-4 h-4 mr-1" />
                        {proposal.proposedBy.userName}
                      </span>
                      <span className="flex items-center">
                        <FiCalendar className="w-4 h-4 mr-1" />
                        {new Date(proposal.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedProposal(selectedProposal === proposal._id ? null : proposal._id)}
                      className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                    >
                      <FiEye className="w-4 h-4 mr-1" />
                      {selectedProposal === proposal._id ? 'Hide' : 'Review'}
                    </button>
                  </div>
                </div>

                {selectedProposal === proposal._id && (
                  <div className="border-t border-border pt-6 mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Equipment Details</h4>
                        <div className="space-y-2 text-sm">
                          <p><span className="font-medium">Type:</span> {proposal.type}</p>
                          <p><span className="font-medium">Brand:</span> {proposal.brand || 'Not specified'}</p>
                          <p><span className="font-medium">Model:</span> {proposal.model || 'Not specified'}</p>
                          <p><span className="font-medium">Condition:</span> {proposal.condition}</p>
                          <p><span className="font-medium">Estimated Value:</span> ${proposal.estimatedValue || 'Not specified'}</p>
                          <p><span className="font-medium">Priority:</span> {proposal.priority}</p>
                        </div>

                        <div className="mt-4">
                          <h5 className="font-medium mb-2">Description</h5>
                          <p className="text-sm text-muted-foreground">{proposal.description}</p>
                        </div>

                        <div className="mt-4">
                          <h5 className="font-medium mb-2">Justification</h5>
                          <p className="text-sm text-muted-foreground">{proposal.justification}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Set E-commerce Details</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Sale Price ($) *
                            </label>
                            <input
                              type="number"
                              value={approvalData.price}
                              onChange={(e) => setApprovalData({...approvalData, price: e.target.value})}
                              min="0"
                              step="0.01"
                              className="w-full border border-border rounded-md px-3 py-2 bg-card focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                              placeholder="0.00"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Initial Stock Quantity
                            </label>
                            <input
                              type="number"
                              value={approvalData.stock}
                              onChange={(e) => setApprovalData({...approvalData, stock: e.target.value})}
                              min="0"
                              className="w-full border border-border rounded-md px-3 py-2 bg-card focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                              placeholder="0"
                            />
                          </div>

                          <div className="flex gap-3 pt-4">
                            <button
                              onClick={() => handleApprove(proposal._id)}
                              disabled={submitting}
                              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                            >
                              {submitting ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              ) : (
                                <FiCheck className="w-4 h-4 mr-2" />
                              )}
                              Approve for Shop
                            </button>
                            
                            <button
                              onClick={() => handleReject(proposal._id)}
                              disabled={submitting}
                              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                            >
                              <FiX className="w-4 h-4 mr-2" />
                              Reject
                            </button>
                          </div>
                        </div>

                        {/* Images */}
                        {proposal.images && proposal.images.length > 0 && (
                          <div className="mt-6">
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

export default EcommerceApproval;