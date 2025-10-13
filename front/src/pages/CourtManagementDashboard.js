import React, { useState, useEffect } from 'react';
import { Card } from '../shared/ui/components/Card';
import { ToastContainer, useToast } from '../shared/ui/components/Toast';
import Pagination from '../shared/ui/components/Pagination';
import SearchBar from '../shared/ui/components/SearchBar';
import DataTable from '../shared/ui/components/DataTable';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle, 
  XCircle, 
  Building,
  UserCheck
} from 'lucide-react';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Court Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-[#0F172A] rounded-lg shadow-md">
          <div className="text-center py-8">
            <XCircle size={64} className="mx-auto text-red-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Something went wrong</h3>
            <p className="text-gray-500 mb-4">
              There was an error loading the dashboard. Please refresh the page.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const CourtManagementDashboard = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [bookings, setBookings] = useState([]);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  // Search and filter states
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courtFilter, setCourtFilter] = useState('all');
  
  const { toasts, success, error: showError, removeToast } = useToast();

  // Search configuration
  const searchFilters = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'cancelled', label: 'Cancelled' }
      ]
    },
    {
      key: 'courtId',
      label: 'Court',
      options: Array.isArray(courts) && courts.length > 0 ? courts.map(court => ({
        value: court?._id || '',
        label: `${court?.name || 'Unknown'} (${court?.companyName || 'Unknown Company'})`
      })).filter(option => option.value) : []
    }
  ];

  const sortOptions = [
    { value: 'date', label: 'Date' },
    { value: 'userDetails.name', label: 'Player Name' },
    { value: 'companyName', label: 'Company' }
  ];

  const handleSearch = (searchParams) => {
    try {
      // Safely extract search parameters with defaults
      const query = searchParams?.query || '';
      const status = searchParams?.status || 'all';
      const courtId = searchParams?.courtId || 'all';
      
      // Update search states
      setSearchQuery(query);
      setStatusFilter(status);
      setCourtFilter(courtId);
      
      // Reset to first page when search changes
      setCurrentPage(1);
    } catch (error) {
      console.error('Error handling search:', error);
      // Reset to safe defaults
      setSearchQuery('');
      setStatusFilter('all');
      setCourtFilter('all');
      setCurrentPage(1);
    }
  };

  // Apply filters whenever bookings or filter states change
  const applyFilters = () => {
    if (!Array.isArray(bookings)) {
      setFilteredBookings([]);
      return;
    }
    
    let filtered = [...bookings];
    
    // Apply search query filter
    if (searchQuery && searchQuery.trim()) {
      filtered = filtered.filter(booking => {
        const searchTermLower = searchQuery.toLowerCase();
        return (
          booking.userDetails?.name?.toLowerCase().includes(searchTermLower) ||
          booking.teamDetails?.teamName?.toLowerCase().includes(searchTermLower) ||
          booking.companyDetails?.companyName?.toLowerCase().includes(searchTermLower) ||
          booking.courtDetails?.name?.toLowerCase().includes(searchTermLower) ||
          booking.companyName?.toLowerCase().includes(searchTermLower)
        );
      });
    }
    
    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'confirmed') {
        filtered = filtered.filter(booking => booking.status !== 'cancelled');
      } else if (statusFilter === 'cancelled') {
        filtered = filtered.filter(booking => booking.status === 'cancelled');
      }
    }
    
    // Apply court filter
    if (courtFilter && courtFilter !== 'all') {
      filtered = filtered.filter(booking => {
        return booking.courtId === courtFilter;
      });
    }
    
    setFilteredBookings(filtered);
  };

  // Effect to apply filters when dependencies change
  React.useEffect(() => {
    try {
      applyFilters();
    } catch (error) {
      console.error('Error applying filters:', error);
      setFilteredBookings([]);
    }
  }, [bookings, searchQuery, statusFilter, courtFilter]);

  // Pagination handlers
  const handlePageChange = (page) => {
    try {
      if (typeof page === 'number' && page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error changing page:', error);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    try {
      if (typeof newItemsPerPage === 'number' && newItemsPerPage > 0) {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Reset to first page
      }
    } catch (error) {
      console.error('Error changing items per page:', error);
    }
  };

  // Get current page data from filtered results
  const totalPages = Math.ceil((filteredBookings?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = Array.isArray(filteredBookings) ? filteredBookings.slice(startIndex, endIndex) : [];

  // Fetch manager's companies and their bookings
  const fetchManagerData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showError('Authentication required');
        return;
      }

      // Get user info first
      const userResponse = await fetch('http://localhost:5000/api/auth/profile', {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json',
        },
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        const userId = userData.user?._id || userData.user?.id;
        
        if (userId) {
          // Get all companies owned by this manager
          const companiesResponse = await fetch(`http://localhost:5001/api/companies/owner/${userId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (companiesResponse.ok) {
            const companiesData = await companiesResponse.json();
            const companies = Array.isArray(companiesData) ? companiesData : (companiesData.companies || []);
            
            
            // Get all bookings for all companies
            let allBookings = [];
            let allCourts = [];
            
            for (const company of companies) {
              // Get courts for this company
              try {
                const courtsResponse = await fetch(`http://localhost:5003/api/courts/company/${company._id}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                });
                
                if (courtsResponse.ok) {
                  const courtsData = await courtsResponse.json();
                  
                  const companyCourts = (courtsData.courts || []).map(court => ({
                    ...court,
                    companyName: company.companyName
                  }));
                  allCourts.push(...companyCourts);
                }
              } catch (error) {
                console.warn('Failed to fetch courts for company:', company._id, error);
              }
              
              // Get bookings for this company
              try {
                const bookingsUrl = `http://localhost:5005/api/bookings/company/${company._id}?limit=1000`;
                
                const bookingsResponse = await fetch(bookingsUrl, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                });
                
                if (bookingsResponse.ok) {
                  const bookingsData = await bookingsResponse.json();
                  
                  const companyBookings = (bookingsData.bookings || []).map(booking => ({
                    ...booking,
                    companyName: company.companyName
                  }));
                  allBookings.push(...companyBookings);
                } else {
                  const errorText = await bookingsResponse.text();
                  console.error(`❌ Bookings fetch failed for ${company.companyName}:`, errorText);
                }
              } catch (error) {
                console.warn('Failed to fetch bookings for company:', company._id, error);
              }
            }
            
            setCourts(Array.isArray(allCourts) ? allCourts : []);
            setBookings(Array.isArray(allBookings) ? allBookings : []);
            // Initialize filtered bookings with all bookings
            setFilteredBookings(Array.isArray(allBookings) ? allBookings : []);
          } else {
            const errorText = await companiesResponse.text();
            console.error('❌ Companies fetch failed:', errorText);
            setError('Failed to load companies');
          }
        } else {
          setError('No user ID found');
        }
      } else {
        const errorText = await userResponse.text();
        setError('Failed to get user information');
      }
    } catch (error) {
      console.error('Error fetching manager data:', error);
      setError('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.warn('Error formatting date:', dateString, error);
      return 'Invalid Date';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.warn('Error formatting time:', timeString, error);
      return 'Invalid Time';
    }
  };

  // Define columns for DataTable
  const columns = [
    {
      Header: 'Court Name',
      accessor: 'courtName',
      Cell: ({ row }) => {
        if (!row) return <span className="text-slate-500">No data</span>;
        
        const court = Array.isArray(courts) ? courts.find(c => c?._id === row.courtId) : null;
        const courtName = court?.name || row.courtDetails?.name || 'Unknown Court';
        return (
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-blue-400" />
            <span className="font-medium text-slate-100">{courtName}</span>
          </div>
        );
      },
    },
    {
      Header: 'Company Name',
      accessor: 'companyName',
      Cell: ({ row }) => {
        if (!row) return <span className="text-slate-500">No data</span>;
        
        const court = Array.isArray(courts) ? courts.find(c => c?._id === row.courtId) : null;
        const companyName = court?.companyName || row.companyName || row.companyDetails?.companyName || 'Unknown Company';
        return (
          <div className="flex items-center gap-2">
            <Building size={16} className="text-green-400" />
            <span className="text-slate-300">{companyName}</span>
          </div>
        );
      },
    },
    {
      Header: 'Player Name',
      accessor: 'playerName',
      Cell: ({ row }) => {
        if (!row) return <span className="text-slate-500">No data</span>;
        
        return (
          <div className="flex items-center gap-2">
            <UserCheck size={16} className="text-purple-400" />
            <span className="text-slate-300">{row.userDetails?.name || 'Unknown Player'}</span>
          </div>
        );
      },
    },
    {
      Header: 'Team Name',
      accessor: 'teamName',
      Cell: ({ row }) => {
        if (!row) return <span className="text-slate-500">No data</span>;
        
        return (
          <div className="flex items-center gap-2">
            <Users size={16} className="text-orange-400" />
            <span className="text-slate-300">{row.teamDetails?.teamName || 'No Team'}</span>
          </div>
        );
      },
    },
    {
      Header: 'Date & Time',
      accessor: 'date',
      Cell: ({ row }) => {
        if (!row || !row.date) return <span className="text-slate-500">No date</span>;
        
        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <Calendar size={14} className="text-gray-400" />
              <span className="text-slate-300">{formatDate(row.date)}</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Clock size={14} className="text-gray-400" />
              <span className="text-sm text-slate-400">
                {row.startTime ? formatTime(row.startTime) : 'N/A'} - {row.endTime ? formatTime(row.endTime) : 'N/A'}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      Header: 'Price per Person',
      accessor: 'price',
      Cell: () => (
        <span className="font-semibold text-green-400">15 DT</span>
      ),
    },
    {
      Header: 'Status',
      accessor: 'status',
      Cell: ({ value, row }) => {
        if (!row) return <span className="text-slate-500">No data</span>;
        
        if (value === 'cancelled') {
          return (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white bg-red-500/80">
              <XCircle size={14} className="mr-1.5" />
              Cancelled
            </span>
          );
        } else {
          return (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white bg-green-500/80">
              <CheckCircle size={14} className="mr-1.5" />
              Confirmed
            </span>
          );
        }
      },
    },
  ];

  useEffect(() => {
    fetchManagerData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-[#0F172A] rounded-lg shadow-md">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="p-6 bg-[#0F172A] rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-white mb-4">Court Management Dashboard</h2>
        <p className="text-gray-400 mb-6">Manage bookings across all your companies and courts</p>
        
        {/* Advanced Search Bar */}
        {!error && (
          <SearchBar
            onSearch={handleSearch}
            filters={searchFilters}
            sortOptions={sortOptions}
            placeholder="Search bookings by player or team name..."
            className="mb-6"
          />
        )}

        {error ? (
          <div className="text-red-400 text-center py-8">{error}</div>
        ) : !Array.isArray(currentBookings) || currentBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No bookings found</h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== 'all' || courtFilter !== 'all'
                ? "Try adjusting your search filters to see more results." 
                : "You don't have any bookings yet."}
            </p>
          </div>
        ) : (
          <>
            {Array.isArray(currentBookings) && currentBookings.length > 0 && (
              <DataTable 
                columns={columns} 
                data={currentBookings} 
                itemsPerPage={itemsPerPage}
              />
            )}
            
            {/* Pagination */}
            {Array.isArray(filteredBookings) && filteredBookings.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                total={filteredBookings.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                className="mt-6"
              />
            )}
          </>
        )}
      </div>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ErrorBoundary>
  );
};

export default CourtManagementDashboard;
