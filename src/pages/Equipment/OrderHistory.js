import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../shared/ui/components/Card';
import { Button } from '../../shared/ui/components/Button';
import LoadingSpinner from '../../shared/ui/components/LoadingSpinner';
import { 
  FiPackage, 
  FiCalendar, 
  FiClock, 
  FiCheck, 
  FiX,
  FiTruck,
  FiEye,
  FiRefreshCw,
  FiFilter
} from 'react-icons/fi';

const OrderHistory = () => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    limit: 10
  });

  useEffect(() => {
    if (!authLoading && user) {
      fetchOrders();
    }
  }, [user, authLoading, filters, pagination.currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...filters
      });

      const response = await fetch(`https://sportify-equipement.onrender.com/api/payments/orders?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setOrders(data.data.orders);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'completed':
        return <FiCheck className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <FiTruck className="w-5 h-5 text-blue-500" />;
      case 'cancelled':
        return <FiX className="w-5 h-5 text-red-500" />;
      default:
        return <FiClock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'payment_pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const viewOrderDetails = async (orderId) => {
    try {
      const response = await fetch(`https://sportify-equipement.onrender.com/api/payments/order/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setSelectedOrder(data.data);
        setShowOrderDetails(true);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 text-center">
          <h2 className="text-2xl font-bold text-card-foreground mb-4">Login Required</h2>
          <p className="text-muted-foreground mb-6">Please log in to view your order history.</p>
          <Button onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  // Order Details Modal
  if (showOrderDetails && selectedOrder) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b border-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="flex items-center text-muted-foreground hover:text-card-foreground transition-colors"
                >
                  <FiEye className="w-5 h-5 mr-2" />
                  Back to Orders
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-card-foreground">
                    Order #{selectedOrder.orderNumber}
                  </h1>
                  <p className="text-muted-foreground">
                    Placed on {formatDate(selectedOrder.createdAt)}
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedOrder.status)}`}>
                {selectedOrder.status.replace('_', ' ').toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Items */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <h3 className="text-lg font-semibold text-card-foreground mb-4">Order Items</h3>
                <div className="space-y-4">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border border-border rounded-lg">
                      <div className="w-16 h-16 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                        <div className="w-full h-full flex items-center justify-center">
                          <FiPackage className="w-6 h-6 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-card-foreground">{item.equipmentTypeName}</h4>
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-card-foreground">{formatPrice(item.totalPrice)}</p>
                        <p className="text-sm text-muted-foreground">{formatPrice(item.unitPrice)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <Card>
                  <h3 className="text-lg font-semibold text-card-foreground mb-4">Shipping Address</h3>
                  <div className="text-muted-foreground">
                    <p>{selectedOrder.shippingAddress.street}</p>
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.postalCode}</p>
                    <p>{selectedOrder.shippingAddress.country}</p>
                  </div>
                </Card>
              )}
            </div>

            {/* Order Summary & Payment Info */}
            <div className="space-y-6">
              <Card>
                <h3 className="text-lg font-semibold text-card-foreground mb-4">Order Summary</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-card-foreground">{formatPrice(selectedOrder.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="border-t border-border pt-2">
                    <div className="flex justify-between text-lg font-semibold">
                      <span className="text-card-foreground">Total</span>
                      <span className="text-primary">{formatPrice(selectedOrder.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {selectedOrder.payment && (
                <Card>
                  <h3 className="text-lg font-semibold text-card-foreground mb-4">Payment Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Method</span>
                      <span className="text-card-foreground capitalize">{selectedOrder.payment.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Status</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedOrder.payment.paymentStatus)}`}>
                        {selectedOrder.payment.paymentStatus.toUpperCase()}
                      </span>
                    </div>
                    {selectedOrder.payment.paymentDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Date</span>
                        <span className="text-card-foreground">{formatDate(selectedOrder.payment.paymentDate)}</span>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-card-foreground flex items-center">
                <FiPackage className="w-8 h-8 mr-3" />
                Order History
              </h1>
              <p className="text-muted-foreground mt-2">
                {pagination.totalOrders} order(s) found
              </p>
            </div>
            
            <Button variant="outline" onClick={fetchOrders}>
              <FiRefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          {/* Filters */}
          <div className="mt-6 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FiFilter className="w-4 h-4 text-muted-foreground" />
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="border border-border rounded-lg px-3 py-2 bg-card text-card-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Orders</option>
                <option value="paid">Paid</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                setFilters(prev => ({ ...prev, sortBy, sortOrder }));
              }}
              className="border border-border rounded-lg px-3 py-2 bg-card text-card-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="totalAmount-desc">Highest Amount</option>
              <option value="totalAmount-asc">Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {orders.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-6xl text-muted-foreground mb-4">📦</div>
            <h3 className="text-lg font-medium text-card-foreground mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-6">Start shopping to place your first order.</p>
            <Button onClick={() => window.location.href = '/marketplace'}>
              <FiPackage className="w-4 h-4 mr-2" />
              Browse Marketplace
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order._id} className="group hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(order.status)}
                      <div>
                        <h3 className="font-semibold text-card-foreground">
                          Order #{order.orderNumber}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Placed on {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center space-x-6 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <FiPackage className="w-4 h-4 mr-1" />
                        {order.items.length} item(s)
                      </div>
                      <div className="flex items-center">
                        <FiCalendar className="w-4 h-4 mr-1" />
                        {formatDate(order.createdAt)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="text-lg font-semibold text-primary mb-2">
                      {formatPrice(order.totalAmount)}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewOrderDetails(order._id)}
                    >
                      <FiEye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
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
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
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
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage >= pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;