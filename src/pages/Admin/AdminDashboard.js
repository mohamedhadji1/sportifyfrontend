import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../shared/ui/components/Card';
import { Button } from '../../shared/ui/components/Button';
import { 
  FiPackage, 
  FiShoppingCart, 
  FiUsers, 
  FiBarChart3,
  FiSettings,
  FiFileText,
  FiTrendingUp,
  FiDollarSign
} from 'react-icons/fi';

const AdminDashboard = () => {
  const { user } = useAuth();

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

  const adminModules = [
    {
      title: 'Equipment Approval',
      description: 'Review and approve equipment proposals for the marketplace',
      icon: FiFileText,
      path: '/admin/equipment-approval',
      color: 'bg-blue-500',
      stats: 'Pending Reviews'
    },
    {
      title: 'Marketplace Management',
      description: 'Manage products, pricing, and inventory in the marketplace',
      icon: FiShoppingCart,
      path: '/admin/marketplace',
      color: 'bg-green-500',
      stats: 'Active Products'
    },
    {
      title: 'Equipment Inventory',
      description: 'Track and manage all equipment assets and proposals',
      icon: FiPackage,
      path: '/admin/inventory',
      color: 'bg-purple-500',
      stats: 'Total Items'
    },
    {
      title: 'User Management',
      description: 'Manage user accounts and permissions',
      icon: FiUsers,
      path: '/admin/users',
      color: 'bg-orange-500',
      stats: 'Active Users'
    },
    {
      title: 'Sales Analytics',
      description: 'View sales reports and marketplace analytics',
      icon: FiBarChart3,
      path: '/admin/analytics',
      color: 'bg-indigo-500',
      stats: 'Monthly Sales'
    },
    {
      title: 'Financial Overview',
      description: 'Track revenue, expenses, and financial metrics',
      icon: FiDollarSign,
      path: '/admin/finance',
      color: 'bg-emerald-500',
      stats: 'Total Revenue'
    },
    {
      title: 'System Settings',
      description: 'Configure system preferences and settings',
      icon: FiSettings,
      path: '/admin/settings',
      color: 'bg-gray-500',
      stats: 'Configurations'
    },
    {
      title: 'Performance Metrics',
      description: 'Monitor system performance and usage statistics',
      icon: FiTrendingUp,
      path: '/admin/metrics',
      color: 'bg-cyan-500',
      stats: 'Active Sessions'
    }
  ];

  const handleNavigate = (path) => {
    if (path === '/admin/equipment-approval') {
      // For now, we'll show the EquipmentApproval component
      // In a real app, you'd use React Router
      window.location.hash = path;
    } else {
      // Placeholder for other admin modules
      alert(`Navigation to ${path} - This module is under development`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-card-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-2">
                Welcome back, {user.name || user.username}! Manage your sportify platform.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Logged in as</div>
                <div className="font-medium text-card-foreground">{user.role}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <FiFileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-card-foreground">12</div>
                <div className="text-sm text-muted-foreground">Pending Approvals</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <FiShoppingCart className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-card-foreground">87</div>
                <div className="text-sm text-muted-foreground">Active Products</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <FiDollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-card-foreground">€2,457</div>
                <div className="text-sm text-muted-foreground">Monthly Revenue</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-full">
                <FiUsers className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-card-foreground">156</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Admin Modules */}
        <div>
          <h2 className="text-2xl font-bold text-card-foreground mb-6">Administration Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminModules.map((module, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 ${module.color} rounded-lg`}>
                    <module.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">{module.stats}</div>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-card-foreground mb-2 group-hover:text-primary transition-colors">
                  {module.title}
                </h3>
                
                <p className="text-muted-foreground text-sm mb-4">
                  {module.description}
                </p>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigate(module.path)}
                  className="w-full group-hover:border-primary group-hover:text-primary"
                >
                  Access Module
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-card-foreground mb-6">Recent Activities</h2>
          <Card className="p-6">
            <div className="space-y-4">
              {[
                {
                  action: 'Equipment Proposal Submitted',
                  details: 'New volleyball net proposed by John Doe',
                  time: '2 hours ago',
                  type: 'proposal'
                },
                {
                  action: 'Product Added to Marketplace',
                  details: 'Basketball shoes are now available for sale',
                  time: '4 hours ago',
                  type: 'product'
                },
                {
                  action: 'Order Completed',
                  details: 'Tennis racket sold to customer #1234',
                  time: '6 hours ago',
                  type: 'sale'
                },
                {
                  action: 'Equipment Approved',
                  details: 'Swimming goggles approved for marketplace',
                  time: '1 day ago',
                  type: 'approval'
                },
                {
                  action: 'New User Registered',
                  details: 'Sarah Smith joined as a player',
                  time: '2 days ago',
                  type: 'user'
                }
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'proposal' ? 'bg-yellow-400' :
                      activity.type === 'product' ? 'bg-green-400' :
                      activity.type === 'sale' ? 'bg-blue-400' :
                      activity.type === 'approval' ? 'bg-green-400' :
                      'bg-purple-400'
                    }`} />
                    <div>
                      <div className="font-medium text-card-foreground">{activity.action}</div>
                      <div className="text-sm text-muted-foreground">{activity.details}</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">{activity.time}</div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <Button variant="outline" size="sm">
                View All Activities
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;