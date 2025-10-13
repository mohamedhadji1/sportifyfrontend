import React, { useState, useEffect } from 'react';
import { AdminDashboard, EquipmentApproval } from '../pages/Admin';

const AdminApp = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    // Listen for hash changes
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#/admin/equipment-approval') {
        setCurrentPage('equipment-approval');
      } else {
        setCurrentPage('dashboard');
      }
    };

    // Set initial page based on current hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'equipment-approval':
        return <EquipmentApproval />;
      case 'dashboard':
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-card-foreground">Sportify Admin</h1>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    window.location.hash = '#/admin/dashboard';
                    setCurrentPage('dashboard');
                  }}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === 'dashboard'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-card-foreground hover:bg-muted'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    window.location.hash = '#/admin/equipment-approval';
                    setCurrentPage('equipment-approval');
                  }}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === 'equipment-approval'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-card-foreground hover:bg-muted'
                  }`}
                >
                  Equipment Approval
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      {renderPage()}
    </div>
  );
};

export default AdminApp;