import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { CustomerRegistrationForm } from './forms/CustomerRegistrationForm';
import { CreateJobCardForm } from './forms/CreateJobCardForm';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { LoadingSpinner, TableSkeleton, PageLoader, ErrorState, EmptyState } from './ui/loading';
import Pagination from './Pagination';
import SortDropdown from './SortDropdown';
import debounce from 'lodash/debounce';
import { extractData } from '../lib/api';
import { 
  Plus, 
  Eye, 
  Wrench, 
  ClipboardList, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  Search,
  FileText,
  Users,
  Calculator,
  Download,
  Printer,
  Trash2,
  FileSearch,
  Package,
  X,
  Car,
  User,
  IndianRupee,
  Check,
  Edit2,
  Edit,
  Save,
  MessageCircle
} from 'lucide-react';
import { sendServiceCompletion, sendServiceBill } from '../lib/whatsapp';
import ConfirmDialog from './ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Services = () => {
  const location = useLocation();
  
  const navigationItems = [
    { name: 'Overview', path: '/services', icon: Wrench },
    { name: 'New Registration', path: '/services/new', icon: Plus },
    { name: 'View Registrations', path: '/services/registrations', icon: Eye },
    { name: 'Job Cards', path: '/services/job-cards', icon: ClipboardList },
    { name: 'Service Bills', path: '/services/billing', icon: FileText },
    { name: 'Service Due', path: '/services/due', icon: Calendar }
  ];

  return (
    <div className="space-y-6">
      {/* Sub Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 p-1">
        <div className="flex flex-wrap gap-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<ServicesOverview />} />
        <Route path="/new" element={<CustomerRegistrationForm />} />
        <Route path="/registrations" element={<ViewRegistration />} />
        <Route path="/job-cards" element={<JobCards />} />
        <Route path="/billing" element={<ServicesBilling />} />
        <Route path="/due" element={<ServiceDue />} />
      </Routes>
    </div>
  );
};

const ServicesOverview = () => {
  const [stats, setStats] = useState({
    pendingServices: 0,
    completedToday: 0,
    inProgress: 0
  });

  const fetchStats = async () => {
    try {
      const [pending, inProgress, completed] = await Promise.all([
        axios.get(`${API}/services?status=pending&limit=4000`),
        axios.get(`${API}/services?status=in_progress&limit=4000`),
        axios.get(`${API}/services?status=completed&limit=4000`)
      ]);
      
      setStats({
        pendingServices: extractData(pending).length,
        inProgress: extractData(inProgress).length,
        completedToday: extractData(completed).filter(s => 
          new Date(s.completion_date).toDateString() === new Date().toDateString()
        ).length
      });
    } catch (error) {
      toast.error('Failed to fetch service statistics');
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Services</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingServices}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedToday}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/services/new">
              <Button className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                New Service Registration
              </Button>
            </Link>
            <Link to="/services/job-cards">
              <Button variant="outline" className="w-full justify-start">
                <ClipboardList className="w-4 h-4 mr-2" />
                View Job Cards
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Regular Service</span>
                <Badge variant="outline">45%</Badge>
              </div>
              <div className="flex justify-between">
                <span>Repair Work</span>
                <Badge variant="outline">30%</Badge>
              </div>
              <div className="flex justify-between">
                <span>Parts Replacement</span>
                <Badge variant="outline">25%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const NewService = () => {
  const [registrationData, setRegistrationData] = useState({
    customer_name: '',
    phone_number: '',
    customer_address: '',
    vehicle_brand: '',
    vehicle_model: '',
    vehicle_year: '',
    vehicle_reg_no: '',
    chassis_number: '',
    engine_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [chassisOptions, setChassisOptions] = useState([]);

  // Close chassis options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('#chassis_number') && !event.target.closest('.chassis-dropdown')) {
        setChassisOptions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const brands = ['TVS', 'BAJAJ', 'HERO', 'HONDA', 'TRIUMPH', 'KTM', 'SUZUKI', 'APRILIA', 'YAMAHA', 'PIAGGIO', 'ROYAL ENFIELD'];

  const handleInputChange = (field, value) => {
    setRegistrationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleChassisSelection = (selectedChassis) => {
    setRegistrationData(prev => ({
      ...prev,
      chassis_number: selectedChassis.chassis_number,
      vehicle_brand: selectedChassis.brand,
      vehicle_model: selectedChassis.model
    }));
    setChassisOptions([]);
    // Auto-fill other details based on selected chassis
    debouncedSearchByChassisNumber(selectedChassis.chassis_number);
  };

  // Search for customer data by phone number
  const searchByPhone = async (phoneNumber) => {
    if (!phoneNumber || phoneNumber.length < 4) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const token = localStorage.getItem('token');
      
      // Search customers and sales data
      const [customersResponse, salesResponse] = await Promise.all([
        axios.get(`${API}/customers`, {
          params: {
            page: 1,
            limit: 10000,
            sort: 'created_at',
            order: 'desc'
          },
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/sales`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      // Find matching customer by mobile phone
      const customers = customersResponse.data.data || customersResponse.data;
      const matchingCustomer = customers.find(customer => 
        customer.mobile && customer.mobile.includes(phoneNumber)
      );

      if (matchingCustomer) {
        // Find associated sales record to get vehicle information
        const customerSales = salesResponse.data.filter(sale => 
          sale.customer_id === matchingCustomer.id
        );

        let vehicleInfo = null;
        if (customerSales.length > 0) {
          // Get vehicle details from the most recent sale
          const latestSale = customerSales.sort((a, b) => 
            new Date(b.sale_date) - new Date(a.sale_date)
          )[0];
          
          // Fetch vehicle details
          try {
            const vehicleResponse = await axios.get(`${API}/vehicles/${latestSale.vehicle_id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            vehicleInfo = vehicleResponse.data;
          } catch (error) {
            console.log('Vehicle not found for sale');
          }
        }

        // Auto-populate form with found data
        setRegistrationData(prev => ({
          ...prev,
          customer_name: matchingCustomer.name || '',
          phone_number: matchingCustomer.mobile || '',
          customer_address: matchingCustomer.address || '',
          vehicle_brand: vehicleInfo?.brand || matchingCustomer.vehicle_info?.brand || '',
          vehicle_model: vehicleInfo?.model || matchingCustomer.vehicle_info?.model || '',
          vehicle_year: new Date().getFullYear().toString(),
          vehicle_reg_no: vehicleInfo?.vehicle_number || matchingCustomer.vehicle_info?.vehicle_number || '',
          chassis_number: vehicleInfo?.chassis_number || matchingCustomer.vehicle_info?.chassis_number || '',
          engine_number: vehicleInfo?.engine_number || ''
        }));

        toast.success('Customer details found and populated!');
      }
    } catch (error) {
      console.error('Error searching by phone:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Search for chassis number suggestions
  const searchChassisNumbers = async (partialChassisNumber) => {
    if (!partialChassisNumber || partialChassisNumber.length < 3) {
      setChassisOptions([]);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const vehiclesResponse = await axios.get(`${API}/vehicles`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Filter vehicles by partial chassis number match
      const matchingVehicles = vehiclesResponse.data.filter(vehicle => 
        vehicle.chassis_number && 
        vehicle.chassis_number.toLowerCase().includes(partialChassisNumber.toLowerCase())
      ).slice(0, 10); // Limit to 10 suggestions

      setChassisOptions(matchingVehicles.map(vehicle => ({
        chassis_number: vehicle.chassis_number,
        brand: vehicle.brand,
        model: vehicle.model,
        vehicle_id: vehicle.id
      })));
    } catch (error) {
      console.error('Error fetching chassis numbers:', error);
      setChassisOptions([]);
    }
  };

  // Search for vehicle data by chassis number
  const searchByChassisNumber = async (chassisNumber) => {
    if (!chassisNumber || chassisNumber.length < 4) {
      return;
    }

    try {
      setSearchLoading(true);
      const token = localStorage.getItem('token');
      
      // Search vehicles and sales data
      const [vehiclesResponse, salesResponse, customersResponse] = await Promise.all([
        axios.get(`${API}/vehicles`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/sales`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/customers`, {
          params: {
            page: 1,
            limit: 10000,
            sort: 'created_at',
            order: 'desc'
          },
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const customers = customersResponse.data.data || customersResponse.data;

      // Find matching vehicle by chassis number
      const matchingVehicle = vehiclesResponse.data.find(vehicle => 
        vehicle.chassis_number && vehicle.chassis_number.toLowerCase() === chassisNumber.toLowerCase()
      );

      if (matchingVehicle) {
        // Find associated sales record and customer
        const vehicleSale = salesResponse.data.find(sale => 
          sale.vehicle_id === matchingVehicle.id
        );

        let customerInfo = null;
        if (vehicleSale) {
          customerInfo = customers.find(customer => 
            customer.id === vehicleSale.customer_id
          );
        }

        // Auto-populate form with found data
        setRegistrationData(prev => ({
          ...prev,
          customer_name: customerInfo?.name || '',
          phone_number: customerInfo?.mobile || '',
          customer_address: customerInfo?.address || '',
          vehicle_brand: matchingVehicle.brand || '',
          vehicle_model: matchingVehicle.model || '',
          vehicle_year: new Date().getFullYear().toString(),
          chassis_number: matchingVehicle.chassis_number || '',
          engine_number: matchingVehicle.engine_number || '',
          vehicle_reg_no: matchingVehicle.vehicle_number || ''
        }));

        toast.success('Vehicle details found and populated!');
      }
    } catch (error) {
      console.error('Error searching by chassis:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search functions
  const debouncedSearchByPhone = useCallback(
    debounce((phoneNumber) => searchByPhone(phoneNumber), 1500),
    []
  );

  const debouncedSearchByChassisNumber = useCallback(
    debounce((chassisNumber) => searchByChassisNumber(chassisNumber), 1500),
    []
  );

  const debouncedSearchChassisNumbers = useCallback(
    debounce((partialChassisNumber) => searchChassisNumbers(partialChassisNumber), 1300),
    []
  );

  const resetForm = () => {
    setRegistrationData({
      customer_name: '',
      phone_number: '',
      customer_address: '',
      vehicle_brand: '',
      vehicle_model: '',
      vehicle_year: '',
      vehicle_reg_no: '',
      chassis_number: '',
      engine_number: ''
    });
    setChassisOptions([]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!registrationData.customer_name) {
      toast.error('Please enter customer name');
      setLoading(false);
      return;
    }
    if (!registrationData.phone_number) {
      toast.error('Please enter phone number');
      setLoading(false);
      return;
    }
    if (!registrationData.vehicle_reg_no) {
      toast.error('Please enter vehicle registration number');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Create registration record
      await axios.post(`${API}/registrations`, {
        customer_name: registrationData.customer_name,
        customer_mobile: registrationData.phone_number,
        customer_address: registrationData.customer_address,
        vehicle_number: registrationData.vehicle_reg_no,
        vehicle_brand: registrationData.vehicle_brand,
        vehicle_model: registrationData.vehicle_model,
        vehicle_year: registrationData.vehicle_year,
        chassis_number: registrationData.chassis_number,
        engine_number: registrationData.engine_number
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Customer & Vehicle registration completed successfully!');
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to complete registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Customer & Vehicle Registration</CardTitle>
        <CardDescription>Register a customer and their vehicle (one-time). You can then create job cards for this registration.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          {/* Auto-fill Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <FileSearch className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">Auto-fill Feature</h4>
                <p className="text-xs text-blue-600">
                  Enter mobile number or chassis number to automatically fill customer and vehicle details from existing sales records.
                </p>
              </div>
            </div>
          </div>

          {/* Customer Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-600 border-b pb-2">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_name">Customer Name</Label>
                <Input
                  id="customer_name"
                  placeholder="Enter customer name"
                  value={registrationData.customer_name}
                  onChange={(e) => handleInputChange('customer_name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone_number">
                  Mobile
                  {searchLoading && <span className="ml-2 text-blue-600 text-sm">Searching...</span>}
                </Label>
                <Input
                  id="phone_number"
                  placeholder="Enter mobile number to auto-fill details"
                  value={registrationData.phone_number}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange('phone_number', value);
                    debouncedSearchByPhone(value);
                  }}
                  className={searchLoading ? "border-blue-300" : ""}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="customer_address">Address</Label>
                <Input
                  id="customer_address"
                  placeholder="Enter customer address"
                  value={registrationData.customer_address}
                  onChange={(e) => handleInputChange('customer_address', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Vehicle Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-green-600 border-b pb-2">Vehicle Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicle_reg_no">Vehicle Registration No</Label>
                <Input
                  id="vehicle_reg_no"
                  placeholder="Enter vehicle registration number"
                  value={registrationData.vehicle_reg_no}
                  onChange={(e) => handleInputChange('vehicle_reg_no', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="vehicle_brand">Vehicle Brand</Label>
                <Select value={registrationData.vehicle_brand} onValueChange={(value) => handleInputChange('vehicle_brand', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="vehicle_model">Vehicle Model</Label>
                <Input
                  id="vehicle_model"
                  placeholder="Enter vehicle model"
                  value={registrationData.vehicle_model}
                  onChange={(e) => handleInputChange('vehicle_model', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="vehicle_year">Vehicle Year</Label>
                <Input
                  id="vehicle_year"
                  placeholder="Enter vehicle year (e.g., 2024)"
                  value={registrationData.vehicle_year}
                  onChange={(e) => handleInputChange('vehicle_year', e.target.value)}
                  type="number"
                  min="1990"
                  max="2030"
                />
              </div>
              <div className="relative">
                <Label htmlFor="chassis_number">
                  Chassis Number
                  {searchLoading && <span className="ml-2 text-blue-600 text-sm">Searching...</span>}
                </Label>
                <Input
                  id="chassis_number"
                  placeholder="Enter chassis number"
                  value={registrationData.chassis_number}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange('chassis_number', value);
                    debouncedSearchChassisNumbers(value);
                    if (value.length >= 4) {
                      debouncedSearchByChassisNumber(value);
                    }
                  }}
                  className={searchLoading ? "border-blue-300" : ""}
                />
                
                {/* Chassis Number Dropdown Suggestions */}
                {chassisOptions.length > 0 && (
                  <div className="chassis-dropdown absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                    {chassisOptions.map((option, index) => (
                      <div
                        key={index}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handleChassisSelection(option)}
                      >
                        <div className="font-medium text-sm">{option.chassis_number}</div>
                        <div className="text-xs text-gray-600">{option.brand} {option.model}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="engine_number">Engine Number</Label>
                <Input
                  id="engine_number"
                  placeholder="Enter engine number"
                  value={registrationData.engine_number}
                  onChange={(e) => handleInputChange('engine_number', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
            <Button 
              type="submit" 
              disabled={loading} 
              className="flex-1 sm:flex-none sm:px-8"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Saving Registration...
                </>
              ) : 'Save Registration'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={resetForm}
              className="flex-1 sm:flex-none sm:px-8"
            >
              Reset Form
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const ViewRegistration = () => {
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const [registrations, setRegistrations] = useState([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  
  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [sortBy, setSortBy] = useState('registration_date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    filterRegistrations();
  }, [registrations, searchTerm, sortBy, sortOrder]);

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [registrationsRes, customersRes] = await Promise.all([
        axios.get(`${API}/registrations`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/customers`, {
          params: {
            page: 1,
            limit: 10000,
            sort: 'created_at',
            order: 'desc'
          },
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const registrationsData = registrationsRes.data;
      const customers = customersRes.data.data || customersRes.data;

      // Map registration data for display
      const combined = registrationsData.map(reg => {
        return {
          id: reg.id,
          registration_number: reg.registration_number,
          registration_date: reg.registration_date || reg.created_at,
          customer_name: reg.customer_name || 'Unknown',
          phone_number: reg.customer_mobile || 'N/A',
          vehicle_brand: reg.vehicle_brand || 'N/A',
          vehicle_model: reg.vehicle_model || 'N/A',
          vehicle_year: reg.vehicle_year || 'N/A',
          vehicle_reg_no: reg.vehicle_number || 'N/A',
          chassis_number: reg.chassis_number || 'N/A',
          engine_number: reg.engine_number || 'N/A',
          customer_address: reg.customer_address || 'N/A',
          customer_id: reg.customer_id
        };
      });

      setRegistrations(combined);
      setCustomers(customers);
    } catch (error) {
      toast.error('Failed to fetch registration data');
    } finally {
      setLoading(false);
    }
  };

  const filterRegistrations = () => {
    let filtered = registrations;

    if (searchTerm) {
      filtered = registrations.filter(reg =>
        reg.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.vehicle_brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.vehicle_model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.vehicle_year?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.vehicle_reg_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.job_card_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'registration_date':
          aVal = new Date(a.registration_date || 0);
          bVal = new Date(b.registration_date || 0);
          break;
        case 'customer_name':
          aVal = a.customer_name || '';
          bVal = b.customer_name || '';
          break;
        case 'vehicle_brand':
          aVal = a.vehicle_brand || '';
          bVal = b.vehicle_brand || '';
          break;
        case 'amount':
          aVal = a.amount || 0;
          bVal = b.amount || 0;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredRegistrations(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleViewRegistration = (registration) => {
    setSelectedRegistration(registration);
    setShowViewModal(true);
  };

  const handleEditRegistration = (registration) => {
    setEditingRegistration(registration);
    setEditFormData({
      customer_name: registration.customer_name || '',
      customer_mobile: registration.phone_number !== 'N/A' ? registration.phone_number : '',
      customer_address: registration.customer_address !== 'N/A' ? registration.customer_address : '',
      vehicle_number: registration.vehicle_reg_no !== 'N/A' ? registration.vehicle_reg_no : '',
      vehicle_brand: registration.vehicle_brand !== 'N/A' ? registration.vehicle_brand : '',
      vehicle_model: registration.vehicle_model !== 'N/A' ? registration.vehicle_model : '',
      vehicle_year: registration.vehicle_year !== 'N/A' ? registration.vehicle_year : '',
      chassis_number: registration.chassis_number !== 'N/A' ? registration.chassis_number : '',
      engine_number: registration.engine_number !== 'N/A' ? registration.engine_number : ''
    });
    setShowEditModal(true);
  };

  const handleDeleteRegistration = async (registration) => {
    const ok = await confirm({
      title: `Delete registration for "${registration.customer_name}"?`,
      description: `Vehicle: ${registration.vehicle_reg_no}. This action cannot be undone.`,
      confirmLabel: 'Delete Registration',
    });
    if (!ok) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/registrations/${registration.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove from local state
      const updatedRegistrations = registrations.filter(reg => reg.id !== registration.id);
      setRegistrations(updatedRegistrations);
      
      toast.success('Registration deleted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete registration');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingRegistration) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Prepare the data for registration update
      const updateData = {
        customer_name: editFormData.customer_name,
        customer_mobile: editFormData.customer_mobile,
        customer_address: editFormData.customer_address || '',
        vehicle_number: editFormData.vehicle_number,
        vehicle_brand: editFormData.vehicle_brand || null,
        vehicle_model: editFormData.vehicle_model || null,
        vehicle_year: editFormData.vehicle_year || null,
        chassis_number: editFormData.chassis_number || null,
        engine_number: editFormData.engine_number || null
      };
      
      await axios.put(`${API}/registrations/${editingRegistration.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Registration updated successfully!');
      setShowEditModal(false);
      setEditingRegistration(null);
      setEditFormData({});
      fetchAllData(); // Refresh the data
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update registration');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingRegistration(null);
    setEditFormData({});
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    const currentPageItems = filteredRegistrations.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
    
    if (selectAll) {
      // Deselect all on current page
      setSelectedIds(prev => prev.filter(id => !currentPageItems.find(item => item.id === id)));
      setSelectAll(false);
    } else {
      // Select all on current page
      const currentPageIds = currentPageItems.map(item => item.id);
      setSelectedIds(prev => [...new Set([...prev, ...currentPageIds])]);
      setSelectAll(true);
    }
  };

  const handleSelectItem = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error('No items selected for deletion');
      return;
    }

    const ok = await confirm({
      title: `Delete ${selectedIds.length} registration(s)?`,
      description: 'This action cannot be undone.',
      confirmLabel: `Delete ${selectedIds.length} Record(s)`,
    });
    if (!ok) return;

    setBulkDeleting(true);
    try {
      const token = localStorage.getItem('token');
      let successCount = 0;
      let failCount = 0;

      for (const id of selectedIds) {
        try {
          await axios.delete(`${API}/registrations/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          successCount++;
        } catch (error) {
          failCount++;
          console.error(`Failed to delete registration ${id}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} registration(s)`);
      }
      if (failCount > 0) {
        toast.error(`Failed to delete ${failCount} registration(s)`);
      }

      // Clear selection and refresh data
      setSelectedIds([]);
      setSelectAll(false);
      fetchAllData();
    } catch (error) {
      toast.error('Failed to perform bulk delete');
    } finally {
      setBulkDeleting(false);
    }
  };

  // Update selectAll state when page changes
  useEffect(() => {
    const currentPageItems = filteredRegistrations.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
    const allSelected = currentPageItems.length > 0 && 
      currentPageItems.every(item => selectedIds.includes(item.id));
    setSelectAll(allSelected);
  }, [currentPage, filteredRegistrations, selectedIds, itemsPerPage]);

  const exportRegistrations = () => {
    try {
      const csvContent = [
        ['Registration Date', 'Customer Name', 'Phone Number', 'Vehicle Brand', 'Vehicle Model', 'Vehicle Year', 'Vehicle Reg No', 'Service Type', 'Amount'].join(','),
        ...filteredRegistrations.map(reg => [
          new Date(reg.registration_date).toLocaleDateString('en-IN'),
          reg.customer_name || '',
          reg.phone_number || '',
          reg.vehicle_brand || '',
          reg.vehicle_model || '',
          reg.vehicle_year || '',
          reg.vehicle_reg_no || '',
          reg.service_type || '',
          reg.amount || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `service_registrations_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Registrations exported successfully!');
    } catch (error) {
      toast.error('Failed to export registrations');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="spinner"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer & Vehicle Registrations</h2>
          <p className="text-gray-600">View and manage all customer/vehicle registrations. Create job cards from here.</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button 
              onClick={handleBulkDelete} 
              variant="destructive" 
              className="flex items-center gap-2"
              disabled={bulkDeleting}
            >
              <Trash2 className="w-4 h-4" />
              {bulkDeleting ? 'Deleting...' : `Delete Selected (${selectedIds.length})`}
            </Button>
          )}
          <Button onClick={exportRegistrations} variant="outline" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Export CSV
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Print List
          </Button>
        </div>
      </div>

      {/* Search Bar & Sort */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by customer name, phone, vehicle brand, model, year, or registration number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <SortDropdown
          currentSort={sortBy}
          currentOrder={sortOrder}
          onSortChange={(field, order) => {
            setSortBy(field);
            setSortOrder(order);
          }}
          options={[
            { field: 'registration_date', order: 'desc', label: 'Newest First' },
            { field: 'registration_date', order: 'asc', label: 'Oldest First' },
            { field: 'customer_name', order: 'asc', label: 'Customer (A-Z)' },
            { field: 'customer_name', order: 'desc', label: 'Customer (Z-A)' },
            { field: 'vehicle_brand', order: 'asc', label: 'Brand (A-Z)' },
            { field: 'vehicle_brand', order: 'desc', label: 'Brand (Z-A)' },
            { field: 'amount', order: 'desc', label: 'Amount (High to Low)' },
            { field: 'amount', order: 'asc', label: 'Amount (Low to High)' }
          ]}
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Registrations</p>
                <p className="text-2xl font-bold text-gray-900">{registrations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unique Customers</p>
                <p className="text-2xl font-bold text-green-600">
                  {new Set(registrations.map(r => r.phone_number)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Car className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Filtered Results</p>
                <p className="text-2xl font-bold text-purple-600">{filteredRegistrations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Registrations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Registrations ({filteredRegistrations.length} records)
            </CardTitle>
            {selectedIds.length > 0 && (
              <div className="text-sm text-blue-600 font-medium">
                {selectedIds.length} item(s) selected
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold w-10">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="text-left p-3 font-semibold">Registration Date</th>
                  <th className="text-left p-3 font-semibold">Customer Name</th>
                  <th className="text-left p-3 font-semibold">Phone Number</th>
                  <th className="text-left p-3 font-semibold">Vehicle Brand</th>
                  <th className="text-left p-3 font-semibold">Vehicle Model</th>
                  <th className="text-left p-3 font-semibold">Vehicle Year</th>
                  <th className="text-left p-3 font-semibold">Vehicle Reg. No</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-8 text-center text-gray-500">
                      {searchTerm ? 'No registrations found matching your search' : 'No service registrations found'}
                    </td>
                  </tr>
                ) : (
                  filteredRegistrations
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((registration) => (
                      <tr key={registration.id} className={`border-b hover:bg-gray-50 transition-colors ${selectedIds.includes(registration.id) ? 'bg-blue-50' : ''}`}>
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(registration.id)}
                            onChange={() => handleSelectItem(registration.id)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-3 text-gray-600">
                          {new Date(registration.registration_date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-gray-900">{registration.customer_name}</div>
                        </td>
                        <td className="p-3 text-gray-600">{registration.phone_number}</td>
                        <td className="p-3">
                          <span className={`font-medium ${registration.vehicle_brand !== 'N/A' ? 'text-blue-600' : 'text-gray-400'}`}>
                            {registration.vehicle_brand}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600">{registration.vehicle_model}</td>
                        <td className="p-3 text-gray-600">{registration.vehicle_year}</td>
                        <td className="p-3 text-gray-600 font-mono">{registration.vehicle_reg_no}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewRegistration(registration)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditRegistration(registration)}
                              className="flex items-center gap-1"
                            >
                              <FileText className="w-4 h-4" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteRegistration(registration)}
                              className="flex items-center gap-1 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
        
        {/* Pagination */}
        {filteredRegistrations.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredRegistrations.length / itemsPerPage)}
            total={filteredRegistrations.length}
            limit={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </Card>

      {/* View Registration Modal */}
      {showViewModal && selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Registration Details</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </Button>
              </div>

              <div className="space-y-6">
                {/* Registration Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Registration Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Registration Number:</strong> {selectedRegistration.registration_number || 'N/A'}</div>
                    <div><strong>Registration Date:</strong> {new Date(selectedRegistration.registration_date).toLocaleDateString('en-IN')}</div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Name:</strong> {selectedRegistration.customer_name}</div>
                    <div><strong>Phone:</strong> {selectedRegistration.phone_number}</div>
                    <div className="md:col-span-2"><strong>Address:</strong> {selectedRegistration.customer_address}</div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-green-600">Vehicle Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Registration No:</strong> {selectedRegistration.vehicle_reg_no}</div>
                    <div><strong>Brand:</strong> {selectedRegistration.vehicle_brand}</div>
                    <div><strong>Model:</strong> {selectedRegistration.vehicle_model}</div>
                    <div><strong>Year:</strong> {selectedRegistration.vehicle_year}</div>
                    <div><strong>Chassis Number:</strong> {selectedRegistration.chassis_number}</div>
                    <div><strong>Engine Number:</strong> {selectedRegistration.engine_number}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditRegistration(selectedRegistration);
                  }}
                >
                  Edit Registration
                </Button>
                <Button onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Registration Modal */}
      {showEditModal && editingRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Registration</h2>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>

              <div className="space-y-6">
                {/* Customer Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue-600 border-b pb-2">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customer_name">Customer Name</Label>
                      <Input
                        id="customer_name"
                        placeholder="Enter customer name"
                        value={editFormData.customer_name || ''}
                        onChange={(e) => setEditFormData({...editFormData, customer_name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="customer_mobile">Mobile Number</Label>
                      <Input
                        id="customer_mobile"
                        placeholder="Enter mobile number"
                        value={editFormData.customer_mobile || ''}
                        onChange={(e) => setEditFormData({...editFormData, customer_mobile: e.target.value})}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="customer_address">Address</Label>
                      <Input
                        id="customer_address"
                        placeholder="Enter customer address"
                        value={editFormData.customer_address || ''}
                        onChange={(e) => setEditFormData({...editFormData, customer_address: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Vehicle Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-green-600 border-b pb-2">Vehicle Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vehicle_number">Vehicle Registration Number</Label>
                      <Input
                        id="vehicle_number"
                        placeholder="Enter vehicle registration number"
                        value={editFormData.vehicle_number || ''}
                        onChange={(e) => setEditFormData({...editFormData, vehicle_number: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicle_brand">Vehicle Brand</Label>
                      <Select 
                        value={editFormData.vehicle_brand || ''} 
                        onValueChange={(value) => setEditFormData({...editFormData, vehicle_brand: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle brand" />
                        </SelectTrigger>
                        <SelectContent>
                          {['TVS', 'BAJAJ', 'HERO', 'HONDA', 'TRIUMPH', 'KTM', 'SUZUKI', 'APRILIA', 'YAMAHA', 'PIAGGIO', 'ROYAL ENFIELD'].map((brand) => (
                            <SelectItem key={brand} value={brand}>
                              {brand}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="vehicle_model">Vehicle Model</Label>
                      <Input
                        id="vehicle_model"
                        placeholder="Enter vehicle model"
                        value={editFormData.vehicle_model || ''}
                        onChange={(e) => setEditFormData({...editFormData, vehicle_model: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicle_year">Vehicle Year</Label>
                      <Input
                        id="vehicle_year"
                        placeholder="Enter vehicle year (e.g., 2024)"
                        value={editFormData.vehicle_year || ''}
                        onChange={(e) => setEditFormData({...editFormData, vehicle_year: e.target.value})}
                        type="number"
                        min="1990"
                        max="2030"
                      />
                    </div>
                    <div>
                      <Label htmlFor="chassis_number">Chassis Number</Label>
                      <Input
                        id="chassis_number"
                        placeholder="Enter chassis number"
                        value={editFormData.chassis_number || ''}
                        onChange={(e) => setEditFormData({...editFormData, chassis_number: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="engine_number">Engine Number</Label>
                      <Input
                        id="engine_number"
                        placeholder="Enter engine number"
                        value={editFormData.engine_number || ''}
                        onChange={(e) => setEditFormData({...editFormData, engine_number: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
      <ConfirmDialogComponent />
  );
};

const JobCards = () => {
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const [jobCards, setJobCards] = useState([]);
  const [filteredJobCards, setFilteredJobCards] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobCard, setSelectedJobCard] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingJobCard, setEditingJobCard] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  
  // Inline edit state for service date in view modal
  const [editingServiceDate, setEditingServiceDate] = useState(false);
  const [editServiceDateValue, setEditServiceDateValue] = useState('');
  
  // New Job Card form state
  const [newJobCardData, setNewJobCardData] = useState({
    customer_id: '',
    customer_name: '',
    customer_mobile: '',
    vehicle_number: '',
    vehicle_brand: '',
    vehicle_model: '',
    vehicle_year: '',
    service_type: '',
    complaint: '',
    estimated_amount: '',
    service_number: '',
    kms_driven: '',
    service_date: new Date().toISOString().split('T')[0] // Default to today
  });
  const [savingJobCard, setSavingJobCard] = useState(false);
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkUpdatingStatus, setBulkUpdatingStatus] = useState(false);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');
  
  // Customer search state for Job Card form
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  
  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [sortBy, setSortBy] = useState('service_date');
  const [sortOrder, setSortOrder] = useState('desc');

  const vehicleBrands = ['TVS', 'BAJAJ', 'HERO', 'HONDA', 'TRIUMPH', 'KTM', 'SUZUKI', 'APRILIA', 'YAMAHA', 'PIAGGIO', 'ROYAL ENFIELD'];
  const serviceTypes = [
    { value: 'regular_service', label: 'Regular Service' },
    { value: 'oil_change', label: 'Oil Change' },
    { value: 'brake_service', label: 'Brake Service' },
    { value: 'engine_repair', label: 'Engine Repair' },
    { value: 'electrical_work', label: 'Electrical Work' },
    { value: 'body_work', label: 'Body Work' },
    { value: 'tire_replacement', label: 'Tire Replacement' },
    { value: 'chain_sprocket', label: 'Chain & Sprocket' },
    { value: 'clutch_service', label: 'Clutch Service' },
    { value: 'suspension_service', label: 'Suspension Service' },
    { value: 'general_checkup', label: 'General Checkup' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    filterJobCards();
  }, [jobCards, searchTerm, sortBy, sortOrder]);

  const fetchAllData = async () => {
    try {
      const [servicesRes, customersRes] = await Promise.all([
        axios.get(`${API}/services?limit=4000`),
        axios.get(`${API}/customers`, {
          params: {
            page: 1,
            limit: 10000,
            sort: 'created_at',
            order: 'desc'
          }
        })
      ]);

      const services = extractData(servicesRes);
      const customers = customersRes.data.data || customersRes.data;

      // Combine service and customer data to create job card records
      const combined = services.map(service => {
        const customer = customers.find(c => c.id === service.customer_id);

        return {
          id: service.id,
          job_card_id: service.job_card_number || `JOB-${service.id.slice(-6)}`,
          service_number: service.service_number || null,
          kms_driven: service.kms_driven || null,
          customer_name: customer?.name || 'Unknown',
          phone_number: customer?.mobile || customer?.phone || 'N/A',
          vehicle_brand: service.vehicle_brand || 'N/A',
          vehicle_model: service.vehicle_model || 'N/A',
          vehicle_year: service.vehicle_year || 'N/A',
          vehicle_reg_no: service.vehicle_number || 'N/A',
          complaint: service.description || 'No complaint specified',
          status: service.status || 'pending',
          service_type: service.service_type,
          amount: service.amount,
          service_date: service.service_date,
          completion_date: service.completion_date,
          created_by: service.created_by,
          customer_address: customer?.address || 'N/A',
          customer_id: service.customer_id
        };
      });

      setJobCards(combined);
      setCustomers(customers);
    } catch (error) {
      toast.error('Failed to fetch job cards data');
    } finally {
      setLoading(false);
    }
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    const currentPageItems = filteredJobCards.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
    
    if (selectAll) {
      setSelectedIds(prev => prev.filter(id => !currentPageItems.find(item => item.id === id)));
      setSelectAll(false);
    } else {
      const currentPageIds = currentPageItems.map(item => item.id);
      setSelectedIds(prev => [...new Set([...prev, ...currentPageIds])]);
      setSelectAll(true);
    }
  };

  const handleSelectItem = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error('No items selected for deletion');
      return;
    }

    const ok = await confirm({
      title: `Delete ${selectedIds.length} job card(s)?`,
      description: 'This action cannot be undone.',
      confirmLabel: `Delete ${selectedIds.length} Job Card(s)`,
    });
    if (!ok) return;

    setBulkDeleting(true);
    try {
      const token = localStorage.getItem('token');
      let successCount = 0;
      let failCount = 0;

      for (const id of selectedIds) {
        try {
          await axios.delete(`${API}/services/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          successCount++;
        } catch (error) {
          failCount++;
          console.error(`Failed to delete job card ${id}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} job card(s)`);
      }
      if (failCount > 0) {
        toast.error(`Failed to delete ${failCount} job card(s)`);
      }

      setSelectedIds([]);
      setSelectAll(false);
      fetchAllData();
    } catch (error) {
      toast.error('Failed to perform bulk delete');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedIds.length === 0) {
      toast.error('No items selected for status update');
      return;
    }

    if (!bulkStatus) {
      toast.error('Please select a status');
      return;
    }

    setBulkUpdatingStatus(true);
    try {
      const token = localStorage.getItem('token');
      let successCount = 0;
      let failCount = 0;

      for (const id of selectedIds) {
        try {
          await axios.put(`${API}/services/${id}/status`, 
            { status: bulkStatus },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          successCount++;
        } catch (error) {
          failCount++;
          console.error(`Failed to update status for job card ${id}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully updated status for ${successCount} job card(s)`);
      }
      if (failCount > 0) {
        toast.error(`Failed to update status for ${failCount} job card(s)`);
      }

      setSelectedIds([]);
      setSelectAll(false);
      setShowBulkStatusModal(false);
      setBulkStatus('');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to perform bulk status update');
    } finally {
      setBulkUpdatingStatus(false);
    }
  };

  // Update selectAll state when page changes
  useEffect(() => {
    const currentPageItems = filteredJobCards.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
    const allSelected = currentPageItems.length > 0 && 
      currentPageItems.every(item => selectedIds.includes(item.id));
    setSelectAll(allSelected);
  }, [currentPage, filteredJobCards, selectedIds, itemsPerPage]);

  const extractVehicleInfo = (description, vehicleNumber) => {
    const brands = ['TVS', 'BAJAJ', 'HERO', 'HONDA', 'TRIUMPH', 'KTM', 'SUZUKI', 'APRILIA', 'YAMAHA', 'PIAGGIO', 'ROYAL ENFIELD'];
    let brand = 'N/A';
    let model = 'N/A';
    let year = 'N/A';
    let complaint = 'General service';

    if (description) {
      // Find brand in description
      const foundBrand = brands.find(b => description.toUpperCase().includes(b));
      if (foundBrand) {
        brand = foundBrand;
        
        // Try to extract model (text after brand, before year or dash)
        const brandIndex = description.toUpperCase().indexOf(foundBrand);
        const afterBrand = description.substring(brandIndex + foundBrand.length).trim();
        const modelMatch = afterBrand.match(/^([A-Za-z0-9\s+\-]+?)(?:\s*\(|\s*-|$)/);
        if (modelMatch) {
          model = modelMatch[1].trim();
        }
        
        // Try to extract year (4 digits in parentheses)
        const yearMatch = description.match(/\((\d{4})\)/);
        if (yearMatch) {
          year = yearMatch[1];
        }
        
        // Extract complaint (text after the dash or after vehicle info)
        const complaintMatch = description.match(/(?:-\s*(.+)|(?:\(\d{4}\)\s*-?\s*(.+)))/);
        if (complaintMatch) {
          complaint = complaintMatch[1] || complaintMatch[2] || complaint;
        }
      } else {
        // If no brand found, treat entire description as complaint
        complaint = description;
      }
    }

    return { brand, model, year, complaint };
  };

  const filterJobCards = () => {
    let filtered = jobCards;

    if (searchTerm) {
      filtered = jobCards.filter(job =>
        job.job_card_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.vehicle_brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.vehicle_model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.vehicle_year?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.vehicle_reg_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.complaint?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.status?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'service_date':
          aVal = new Date(a.service_date || 0);
          bVal = new Date(b.service_date || 0);
          break;
        case 'customer_name':
          aVal = a.customer_name || '';
          bVal = b.customer_name || '';
          break;
        case 'job_card_id':
          aVal = a.job_card_id || '';
          bVal = b.job_card_id || '';
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredJobCards(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      completed: { label: 'Completed', className: 'bg-green-100 text-green-800 border-green-200' },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800 border-red-200' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const handleViewJobCard = (jobCard) => {
    setSelectedJobCard(jobCard);
    setEditingServiceDate(false);
    setEditServiceDateValue('');
    setShowViewModal(true);
  };

  const handleEditServiceDate = () => {
    if (selectedJobCard) {
      const currentDate = new Date(selectedJobCard.service_date);
      setEditServiceDateValue(currentDate.toISOString().split('T')[0]);
      setEditingServiceDate(true);
    }
  };

  const handleSaveServiceDate = async () => {
    if (!selectedJobCard || !editServiceDateValue) {
      toast.error('Please select a date');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Update the service date via API
      await axios.put(`${API}/services/${selectedJobCard.id}`, {
        customer_id: selectedJobCard.customer_id,
        vehicle_number: selectedJobCard.vehicle_reg_no,
        service_type: selectedJobCard.service_type,
        description: selectedJobCard.complaint,
        amount: selectedJobCard.amount,
        service_number: selectedJobCard.service_number,
        kms_driven: selectedJobCard.kms_driven,
        service_date: new Date(editServiceDateValue).toISOString()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state immediately
      const newServiceDate = new Date(editServiceDateValue);
      
      setSelectedJobCard(prev => ({
        ...prev,
        service_date: newServiceDate
      }));
      
      // Update the job cards list
      setJobCards(prev => prev.map(jc => 
        jc.id === selectedJobCard.id 
          ? { ...jc, service_date: newServiceDate }
          : jc
      ));
      
      setEditingServiceDate(false);
      setEditServiceDateValue('');
      toast.success('Service date updated successfully');
      
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update service date');
    }
  };

  const handleCancelServiceDateEdit = () => {
    setEditingServiceDate(false);
    setEditServiceDateValue('');
  };

  const handleEditJobCard = (jobCard) => {
    setEditingJobCard(jobCard);
    setEditFormData({
      customer_id: customers.find(c => c.name === jobCard.customer_name)?.id || '',
      vehicle_number: jobCard.vehicle_reg_no,
      vehicle_brand: jobCard.vehicle_brand || '',
      vehicle_model: jobCard.vehicle_model || '',
      vehicle_year: jobCard.vehicle_year || '',
      service_type: jobCard.service_type,
      service_date: jobCard.service_date ? new Date(jobCard.service_date).toISOString().split('T')[0] : '',
      description: jobCard.complaint,
      amount: jobCard.amount,
      service_number: jobCard.service_number || '',
      kms_driven: jobCard.kms_driven || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingJobCard) return;
    
    try {
      setLoading(true);
      const updateData = {
        ...editFormData,
        service_date: editFormData.service_date ? new Date(editFormData.service_date).toISOString() : null,
        kms_driven: editFormData.kms_driven ? parseInt(editFormData.kms_driven) : null
      };
      await axios.put(`${API}/services/${editingJobCard.id}`, updateData);
      toast.success('Job card updated successfully!');
      setShowEditModal(false);
      setEditingJobCard(null);
      setEditFormData({});
      fetchAllData(); // Refresh the data
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update job card');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingJobCard(null);
    setEditFormData({});
  };

  const handleAddNewJob = () => {
    // Reset form
    setNewJobCardData({
      customer_id: '',
      customer_name: '',
      customer_mobile: '',
      vehicle_number: '',
      vehicle_brand: '',
      vehicle_model: '',
      vehicle_year: '',
      service_type: '',
      complaint: '',
      estimated_amount: '',
      service_number: '',
      kms_driven: '',
      service_date: new Date().toISOString().split('T')[0] // Default to today
    });
    setCustomerSearchTerm('');
    setCustomerSuggestions([]);
    setShowCustomerSuggestions(false);
    setShowAddModal(true);
  };

  const handleCustomerSelect = async (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setNewJobCardData({
        ...newJobCardData,
        customer_id: customerId,
        customer_name: customer.name,
        customer_mobile: customer.mobile || customer.phone || ''
      });
      setCustomerSearchTerm(customer.name);
      setShowCustomerSuggestions(false);
      
      // Fetch vehicle info from sales for this customer
      await fetchVehicleFromSales(customerId);
    }
  };

  // Search customers by name or mobile
  const searchCustomers = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setCustomerSuggestions([]);
      setShowCustomerSuggestions(false);
      return;
    }

    setSearchingCustomers(true);
    try {
      const lowerSearch = searchTerm.toLowerCase();
      const filtered = customers.filter(c => 
        c.name?.toLowerCase().includes(lowerSearch) ||
        c.mobile?.includes(searchTerm) ||
        c.phone?.includes(searchTerm)
      ).slice(0, 10);
      
      setCustomerSuggestions(filtered);
      setShowCustomerSuggestions(filtered.length > 0);
    } catch (error) {
      console.error('Error searching customers:', error);
    } finally {
      setSearchingCustomers(false);
    }
  };

  // Fetch vehicle info from sales records for a customer
  const fetchVehicleFromSales = async (customerId) => {
    try {
      const token = localStorage.getItem('token');
      const salesResponse = await axios.get(`${API}/sales`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const sales = salesResponse.data;
      // Find sales for this customer
      const customerSales = sales.filter(sale => sale.customer_id === customerId);
      
      if (customerSales.length > 0) {
        // Get the most recent sale
        const latestSale = customerSales.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        )[0];
        
        // If we have vehicle info in the sale, populate the form
        if (latestSale.vehicle_id) {
          // Fetch vehicle details
          const vehicleResponse = await axios.get(`${API}/vehicles/${latestSale.vehicle_id}`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => null);
          
          if (vehicleResponse && vehicleResponse.data) {
            const vehicle = vehicleResponse.data;
            setNewJobCardData(prev => ({
              ...prev,
              vehicle_number: vehicle.vehicle_number || vehicle.registration_number || '',
              vehicle_brand: vehicle.brand || '',
              vehicle_model: vehicle.model || '',
              vehicle_year: vehicle.year?.toString() || ''
            }));
            toast.success('Vehicle info loaded from sales record');
            return;
          }
        }
        
        // Try to get vehicle info from sale record itself
        if (latestSale.vehicle_brand || latestSale.vehicle_model || latestSale.chassis_number) {
          setNewJobCardData(prev => ({
            ...prev,
            vehicle_brand: latestSale.vehicle_brand || prev.vehicle_brand,
            vehicle_model: latestSale.vehicle_model || prev.vehicle_model,
            vehicle_number: latestSale.vehicle_number || latestSale.chassis_number || prev.vehicle_number
          }));
          toast.success('Vehicle info loaded from sales record');
        }
      }
    } catch (error) {
      console.error('Error fetching vehicle from sales:', error);
    }
  };

  // Debounced customer search
  const debouncedCustomerSearch = useCallback(
    debounce((term) => searchCustomers(term), 300),
    [customers]
  );

  const handleSaveNewJobCard = async () => {
    // Validation
    if (!newJobCardData.customer_id && !newJobCardData.customer_name) {
      toast.error('Please select a customer or enter customer name');
      return;
    }
    if (!newJobCardData.vehicle_number) {
      toast.error('Please enter vehicle registration number');
      return;
    }
    if (!newJobCardData.service_type) {
      toast.error('Please select a service type');
      return;
    }
    if (!newJobCardData.complaint) {
      toast.error('Please enter the complaint/issue');
      return;
    }

    setSavingJobCard(true);
    try {
      const token = localStorage.getItem('token');
      
      // If no customer selected but name provided, create/find customer
      let customerId = newJobCardData.customer_id;
      if (!customerId && newJobCardData.customer_name) {
        // Try to find existing customer by mobile
        const existingCustomer = customers.find(c => 
          c.mobile === newJobCardData.customer_mobile || 
          c.phone === newJobCardData.customer_mobile
        );
        
        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          // Create new customer
          const customerResponse = await axios.post(`${API}/customers`, {
            name: newJobCardData.customer_name,
            mobile: newJobCardData.customer_mobile,
            address: ''
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          customerId = customerResponse.data.id;
        }
      }

      // Create service/job card
      const jobCardData = {
        customer_id: customerId,
        vehicle_number: newJobCardData.vehicle_number,
        vehicle_brand: newJobCardData.vehicle_brand,
        vehicle_model: newJobCardData.vehicle_model,
        vehicle_year: newJobCardData.vehicle_year,
        service_type: newJobCardData.service_type,
        description: newJobCardData.complaint,
        amount: parseFloat(newJobCardData.estimated_amount) || 0,
        service_number: newJobCardData.service_number,
        kms_driven: newJobCardData.kms_driven ? parseInt(newJobCardData.kms_driven) : null,
        service_date: newJobCardData.service_date ? new Date(newJobCardData.service_date).toISOString() : null
      };

      await axios.post(`${API}/services`, jobCardData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Job card created successfully!');
      setShowAddModal(false);
      fetchAllData(); // Refresh the data
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create job card');
    } finally {
      setSavingJobCard(false);
    }
  };

  const updateJobStatus = async (jobId, newStatus) => {
    try {
      await axios.put(`${API}/services/${jobId}/status`, { status: newStatus });
      toast.success('Job card status updated successfully');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to update job card status');
    }
  };

  const exportJobCards = () => {
    try {
      const csvContent = [
        ['Job Card ID', 'Service Number', 'Service Date', 'Customer Name', 'Phone Number', 'Vehicle Brand', 'Vehicle Model', 'KMs Driven', 'Vehicle Reg No', 'Complaint', 'Status', 'Amount'].join(','),
        ...filteredJobCards.map(job => [
          job.job_card_id || '',
          job.service_number || '',
          job.service_date ? new Date(job.service_date).toLocaleDateString('en-IN') : '',
          job.customer_name || '',
          job.phone_number || '',
          job.vehicle_brand || '',
          job.vehicle_model || '',
          job.kms_driven || '',
          job.vehicle_reg_no || '',
          job.complaint || '',
          job.status || '',
          job.amount || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `job_cards_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Job cards exported successfully!');
    } catch (error) {
      toast.error('Failed to export job cards');
    }
  };

  const handleDeleteService = async (serviceId, jobCardNumber) => {
    const ok = await confirm({
      title: `Delete job card "${jobCardNumber}"?`,
      description: 'This action cannot be undone.',
      confirmLabel: 'Delete Job Card',
    });
    if (!ok) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/services/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove from local state
      const updatedJobCards = jobCards.filter(job => job.id !== serviceId);
      setJobCards(updatedJobCards);
      
      toast.success('Service deleted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete service');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="spinner"></div></div>;
  }

  const pendingCount = jobCards.filter(job => job.status === 'pending').length;
  const inProgressCount = jobCards.filter(job => job.status === 'in_progress').length;
  const completedCount = jobCards.filter(job => job.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header with Search and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Job Cards Management</h2>
          <p className="text-gray-600">Manage and track all service job cards</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selectedIds.length > 0 && (
            <>
              <Button 
                onClick={() => setShowBulkStatusModal(true)} 
                variant="outline" 
                className="flex items-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <CheckCircle className="w-4 h-4" />
                Update Status ({selectedIds.length})
              </Button>
              <Button 
                onClick={handleBulkDelete} 
                variant="destructive" 
                className="flex items-center gap-2"
                disabled={bulkDeleting}
              >
                <Trash2 className="w-4 h-4" />
                {bulkDeleting ? 'Deleting...' : `Delete Selected (${selectedIds.length})`}
              </Button>
            </>
          )}
          <Button onClick={handleAddNewJob} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add New Job
          </Button>
          <Button onClick={exportJobCards} variant="outline" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Search Bar & Sort */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by job card ID, customer name, phone, vehicle details, complaint, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <SortDropdown
          currentSort={sortBy}
          currentOrder={sortOrder}
          onSortChange={(field, order) => {
            setSortBy(field);
            setSortOrder(order);
          }}
          options={[
            { field: 'service_date', order: 'desc', label: 'Newest First' },
            { field: 'service_date', order: 'asc', label: 'Oldest First' },
            { field: 'customer_name', order: 'asc', label: 'Customer (A-Z)' },
            { field: 'customer_name', order: 'desc', label: 'Customer (Z-A)' },
            { field: 'job_card_id', order: 'asc', label: 'Job Card ID (A-Z)' },
            { field: 'job_card_id', order: 'desc', label: 'Job Card ID (Z-A)' },
            { field: 'status', order: 'asc', label: 'Status (A-Z)' },
            { field: 'status', order: 'desc', label: 'Status (Z-A)' }
          ]}
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ClipboardList className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Job Cards</p>
                <p className="text-2xl font-bold text-gray-900">{jobCards.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Cards Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Job Cards ({filteredJobCards.length} records)
            </CardTitle>
            {selectedIds.length > 0 && (
              <div className="text-sm text-blue-600 font-medium">
                {selectedIds.length} item(s) selected
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold w-10">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="text-left p-3 font-semibold">Job Card ID</th>
                  <th className="text-left p-3 font-semibold">Service No.</th>
                  <th className="text-left p-3 font-semibold">Service Date</th>
                  <th className="text-left p-3 font-semibold">Customer Name</th>
                  <th className="text-left p-3 font-semibold">Phone Number</th>
                  <th className="text-left p-3 font-semibold">Vehicle Brand</th>
                  <th className="text-left p-3 font-semibold">Vehicle Model</th>
                  <th className="text-left p-3 font-semibold">KMs Driven</th>
                  <th className="text-left p-3 font-semibold">Vehicle Reg. No</th>
                  <th className="text-left p-3 font-semibold">Complaint</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="14" className="p-0">
                      <TableSkeleton rows={5} columns={14} />
                    </td>
                  </tr>
                ) : filteredJobCards.length === 0 ? (
                  <tr>
                    <td colSpan="14" className="p-8 text-center text-gray-500">
                      <EmptyState 
                        title={searchTerm ? 'No job cards found' : 'No job cards yet'}
                        description={searchTerm ? 'Try adjusting your search terms' : 'Create a new job card to get started'}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredJobCards
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((jobCard) => (
                      <tr key={jobCard.id} className={`border-b hover:bg-gray-50 transition-colors ${selectedIds.includes(jobCard.id) ? 'bg-blue-50' : ''}`}>
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(jobCard.id)}
                            onChange={() => handleSelectItem(jobCard.id)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-3">
                          <span className="font-medium text-blue-600">{jobCard.job_card_id}</span>
                        </td>
                        <td className="p-3">
                          <span className={`font-medium ${jobCard.service_number ? 'text-purple-600' : 'text-gray-400'}`}>
                            {jobCard.service_number || '-'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-gray-600">
                            {jobCard.service_date ? new Date(jobCard.service_date).toLocaleDateString('en-IN') : '-'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-gray-900">{jobCard.customer_name}</div>
                        </td>
                        <td className="p-3 text-gray-600">{jobCard.phone_number}</td>
                        <td className="p-3">
                          <span className={`font-medium ${jobCard.vehicle_brand !== 'N/A' ? 'text-blue-600' : 'text-gray-400'}`}>
                            {jobCard.vehicle_brand}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600">{jobCard.vehicle_model}</td>
                        <td className="p-3">
                          <span className={`font-medium ${jobCard.kms_driven ? 'text-green-600' : 'text-gray-400'}`}>
                            {jobCard.kms_driven ? `${jobCard.kms_driven.toLocaleString()} km` : '-'}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600 font-mono">{jobCard.vehicle_reg_no}</td>
                        <td className="p-3 max-w-xs">
                          <div className="truncate" title={jobCard.complaint}>
                            {jobCard.complaint}
                          </div>
                        </td>
                        <td className="p-3">
                          {getStatusBadge(jobCard.status)}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (!jobCard.phone_number && !jobCard.customer_phone) {
                                  toast.error('Customer phone number not available');
                                  return;
                                }
                                sendServiceCompletion(jobCard.customer_name, jobCard.phone_number || jobCard.customer_phone, jobCard.vehicle_number, jobCard.job_card_number, jobCard.service_type, jobCard.amount);
                              }}
                              className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Message Service Status on WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewJobCard(jobCard)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditJobCard(jobCard)}
                              className="flex items-center gap-1"
                            >
                              <FileText className="w-4 h-4" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteService(jobCard.id, jobCard.job_card_number)}
                              className="flex items-center gap-1 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
        
        {/* Pagination */}
        {filteredJobCards.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredJobCards.length / itemsPerPage)}
            total={filteredJobCards.length}
            limit={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </Card>

      {/* View Job Card Modal */}
      {showViewModal && selectedJobCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Job Card Details</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </Button>
              </div>

              <div className="space-y-6">
                {/* Job Card Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Job Card Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Job Card ID:</strong> {selectedJobCard.job_card_id}</div>
                    <div><strong>Service Number:</strong> <span className={selectedJobCard.service_number ? 'text-purple-600 font-medium' : 'text-gray-400'}>{selectedJobCard.service_number || 'Not assigned'}</span></div>
                    <div>
                      <strong>Service Date:</strong>{' '}
                      {editingServiceDate ? (
                        <span className="inline-flex items-center gap-2">
                          <Input
                            type="date"
                            value={editServiceDateValue}
                            onChange={(e) => setEditServiceDateValue(e.target.value)}
                            className="w-40 h-8 text-sm inline-block"
                          />
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={handleSaveServiceDate}
                            className="text-green-600 hover:bg-green-50 px-2 py-1 h-7"
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={handleCancelServiceDateEdit}
                            className="text-red-600 hover:bg-red-50 px-2 py-1 h-7"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </span>
                      ) : (
                        <span 
                          className="cursor-pointer hover:bg-gray-100 rounded px-1 -mx-1 inline-flex items-center gap-1 group"
                          onClick={handleEditServiceDate}
                          title="Click to edit service date"
                        >
                          {new Date(selectedJobCard.service_date).toLocaleDateString('en-IN')}
                          <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                      )}
                    </div>
                    <div><strong>Service Type:</strong> {selectedJobCard.service_type?.replace('_', ' ')}</div>
                    <div><strong>Status:</strong> {getStatusBadge(selectedJobCard.status)}</div>
                    {selectedJobCard.completion_date && (
                      <div><strong>Completion Date:</strong> {new Date(selectedJobCard.completion_date).toLocaleDateString('en-IN')}</div>
                    )}
                    <div><strong>Amount:</strong> ₹{selectedJobCard.amount?.toLocaleString() || '0'}</div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Name:</strong> {selectedJobCard.customer_name}</div>
                    <div><strong>Phone:</strong> {selectedJobCard.phone_number}</div>
                    <div className="md:col-span-2"><strong>Address:</strong> {selectedJobCard.customer_address}</div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Vehicle Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Brand:</strong> {selectedJobCard.vehicle_brand}</div>
                    <div><strong>Model:</strong> {selectedJobCard.vehicle_model}</div>
                    <div><strong>Year:</strong> {selectedJobCard.vehicle_year}</div>
                    <div><strong>Registration No:</strong> {selectedJobCard.vehicle_reg_no}</div>
                    <div><strong>Kilometers Driven:</strong> <span className={selectedJobCard.kms_driven ? 'text-green-600 font-medium' : 'text-gray-400'}>{selectedJobCard.kms_driven ? `${selectedJobCard.kms_driven.toLocaleString()} km` : 'Not recorded'}</span></div>
                  </div>
                </div>

                {/* Complaint/Service Details */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Service Details</h3>
                  <div>
                    <strong>Complaint/Description:</strong>
                    <p className="mt-1 text-gray-600">{selectedJobCard.complaint}</p>
                  </div>
                </div>

                {/* Status Update Actions */}
                {selectedJobCard.status !== 'completed' && (
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 text-blue-600">Update Status</h3>
                    <div className="flex gap-2">
                      {selectedJobCard.status === 'pending' && (
                        <Button
                          onClick={() => {
                            updateJobStatus(selectedJobCard.id, 'in_progress');
                            setShowViewModal(false);
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Start Work
                        </Button>
                      )}
                      {selectedJobCard.status === 'in_progress' && (
                        <Button
                          onClick={() => {
                            updateJobStatus(selectedJobCard.id, 'completed');
                            setShowViewModal(false);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Mark Completed
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditJobCard(selectedJobCard);
                  }}
                >
                  Edit Job Card
                </Button>
                <Button onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Job Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Open New Job Card</h2>
                  <p className="text-gray-600">Enter the service details to create a new job card</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <CreateJobCardForm 
                onSuccess={() => { setShowAddModal(false); fetchAllData(); }} 
                onCancel={() => setShowAddModal(false)} 
                customers={customers} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Job Card Modal */}
      {showEditModal && editingJobCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Job Card</h2>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>

              <div className="space-y-6">
                {/* Customer Information Section */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 text-blue-600">Customer Information</h3>
                  <div>
                    <Label htmlFor="customer_id">Customer</Label>
                    <Select 
                      value={editFormData.customer_id} 
                      onValueChange={(value) => setEditFormData({...editFormData, customer_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name} - {customer.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Vehicle Information Section */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 text-blue-600">Vehicle Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vehicle_number">Registration Number *</Label>
                      <Input
                        id="vehicle_number"
                        placeholder="e.g., KA-01-AB-1234"
                        value={editFormData.vehicle_number || ''}
                        onChange={(e) => setEditFormData({...editFormData, vehicle_number: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicle_brand">Vehicle Brand</Label>
                      <Input
                        id="vehicle_brand"
                        placeholder="e.g., Honda, Yamaha, TVS"
                        value={editFormData.vehicle_brand || ''}
                        onChange={(e) => setEditFormData({...editFormData, vehicle_brand: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicle_model">Vehicle Model</Label>
                      <Input
                        id="vehicle_model"
                        placeholder="e.g., Activa, FZ, Apache"
                        value={editFormData.vehicle_model || ''}
                        onChange={(e) => setEditFormData({...editFormData, vehicle_model: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicle_year">Vehicle Year</Label>
                      <Input
                        id="vehicle_year"
                        type="number"
                        placeholder="e.g., 2024"
                        min="1990"
                        max="2030"
                        value={editFormData.vehicle_year || ''}
                        onChange={(e) => setEditFormData({...editFormData, vehicle_year: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="kms_driven">Kilometers Driven</Label>
                      <Input
                        id="kms_driven"
                        type="number"
                        placeholder="e.g., 15000"
                        min="0"
                        value={editFormData.kms_driven || ''}
                        onChange={(e) => setEditFormData({...editFormData, kms_driven: e.target.value ? parseInt(e.target.value) : null})}
                      />
                    </div>
                  </div>
                </div>

                {/* Service Details Section */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 text-blue-600">Service Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="service_number">Service Number</Label>
                      <Input
                        id="service_number"
                        placeholder="e.g., SRV-001"
                        value={editFormData.service_number || ''}
                        onChange={(e) => setEditFormData({...editFormData, service_number: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="service_date">Service Date</Label>
                      <Input
                        id="service_date"
                        type="date"
                        value={editFormData.service_date || ''}
                        onChange={(e) => setEditFormData({...editFormData, service_date: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="service_type">Service Type *</Label>
                      <Select 
                        value={editFormData.service_type} 
                        onValueChange={(value) => setEditFormData({...editFormData, service_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select service type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="regular_service">Regular Service</SelectItem>
                          <SelectItem value="periodic_service">Periodic Service</SelectItem>
                          <SelectItem value="oil_change">Oil Change</SelectItem>
                          <SelectItem value="brake_service">Brake Service</SelectItem>
                          <SelectItem value="engine_repair">Engine Repair</SelectItem>
                          <SelectItem value="electrical_work">Electrical Work</SelectItem>
                          <SelectItem value="body_work">Body Work</SelectItem>
                          <SelectItem value="tire_replacement">Tire Replacement</SelectItem>
                          <SelectItem value="chain_sprocket">Chain & Sprocket</SelectItem>
                          <SelectItem value="clutch_service">Clutch Service</SelectItem>
                          <SelectItem value="suspension_service">Suspension Service</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="amount">Amount (₹) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="Enter service amount"
                        value={editFormData.amount || ''}
                        onChange={(e) => setEditFormData({...editFormData, amount: parseFloat(e.target.value)})}
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="description">Complaint/Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter complaint or service description"
                      value={editFormData.description || ''}
                      onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Status Update Modal */}
      {showBulkStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Update Status for {selectedIds.length} Job Card(s)</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setShowBulkStatusModal(false);
                    setBulkStatus('');
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="bulk_status">Select New Status</Label>
                  <Select 
                    value={bulkStatus} 
                    onValueChange={setBulkStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-600" />
                          Pending
                        </div>
                      </SelectItem>
                      <SelectItem value="in_progress">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-blue-600" />
                          In Progress
                        </div>
                      </SelectItem>
                      <SelectItem value="completed">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Completed
                        </div>
                      </SelectItem>
                      <SelectItem value="cancelled">
                        <div className="flex items-center gap-2">
                          <X className="w-4 h-4 text-red-600" />
                          Cancelled
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-700">
                    This will update the status of <strong>{selectedIds.length}</strong> selected job card(s) to the chosen status.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowBulkStatusModal(false);
                    setBulkStatus('');
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleBulkStatusUpdate} 
                  disabled={bulkUpdatingStatus || !bulkStatus}
                >
                  {bulkUpdatingStatus ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
      <ConfirmDialogComponent />
  );
};

const ServicesBilling = () => {
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const [activeTab, setActiveTab] = useState('create');
  const [customers, setCustomers] = useState([]);
  const [serviceBills, setServiceBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [jobCardNumber, setJobCardNumber] = useState('');
  const [serviceDetails, setServiceDetails] = useState(null);
  const [fetchingService, setFetchingService] = useState(false);
  const [jobCardSuggestions, setJobCardSuggestions] = useState([]);
  const [spareParts, setSpareParts] = useState([]);
  const [sparePartSuggestions, setSparePartSuggestions] = useState([]);
  const [activeDescriptionIndex, setActiveDescriptionIndex] = useState(null);
  const [billItems, setBillItems] = useState([{
    sl_no: 1,
    description: '',
    hsn_sac: '',
    qty: 1,
    unit: 'Nos',
    rate: 0,
    labor: 0,
    disc_percent: 0,
    gst_percent: 18,
    cgst_amount: 0,
    sgst_amount: 0,
    total_tax: 0,
    amount: 0
  }]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [billNumber, setBillNumber] = useState(`SB-${Date.now().toString().slice(-6)}`);
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  
  // Edit Service Items state
  const [showEditServiceItemsModal, setShowEditServiceItemsModal] = useState(false);
  const [editableServiceItems, setEditableServiceItems] = useState([]);

  const units = ['Nos', 'Kgs', 'Ltrs', 'Hrs', 'Days', 'Pcs'];
  const gstRates = [0, 5, 12, 18, 28];

  // Predefined service items commonly used in two-wheeler servicing
  const [serviceItems, setServiceItems] = useState([
    // Engine Oil & Filters
    { name: 'Engine Oil (20W-40)', hsn_sac: '27101981', unit: 'Ltrs', rate: 450, gst_percent: 28 },
    { name: 'Engine Oil (10W-30)', hsn_sac: '27101981', unit: 'Ltrs', rate: 520, gst_percent: 28 },
    { name: 'Oil Filter', hsn_sac: '84219990', unit: 'Nos', rate: 180, gst_percent: 28 },
    { name: 'Air Filter', hsn_sac: '84213910', unit: 'Nos', rate: 250, gst_percent: 28 },
    
    // Spark Plugs & Electrical
    { name: 'Spark Plug (Standard)', hsn_sac: '85111000', unit: 'Nos', rate: 120, gst_percent: 18 },
    { name: 'Spark Plug (Iridium)', hsn_sac: '85111000', unit: 'Nos', rate: 280, gst_percent: 18 },
    { name: 'Battery (12V)', hsn_sac: '85070020', unit: 'Nos', rate: 1850, gst_percent: 18 },
    
    // Brake System
    { name: 'Brake Pad (Front)', hsn_sac: '87084010', unit: 'Set', rate: 320, gst_percent: 28 },
    { name: 'Brake Pad (Rear)', hsn_sac: '87084010', unit: 'Set', rate: 280, gst_percent: 28 },
    { name: 'Brake Oil (DOT 3)', hsn_sac: '38200000', unit: 'Ltrs', rate: 180, gst_percent: 28 },
    
    // Chain & Drive
    { name: 'Chain & Sprocket Kit', hsn_sac: '87149100', unit: 'Set', rate: 650, gst_percent: 28 },
    { name: 'Chain Lubricant', hsn_sac: '34031900', unit: 'Nos', rate: 95, gst_percent: 18 }
  ]);

  useEffect(() => {
    fetchCustomers();
    fetchSpareParts();
    if (activeTab === 'view') {
      fetchServiceBills();
    }
  }, [activeTab]);

  useEffect(() => {
    filterBills();
  }, [serviceBills, searchTerm]);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API}/customers`, {
        params: {
          page: 1,
          limit: 10000,
          sort: 'created_at',
          order: 'desc'
        }
      });
      setCustomers(response.data.data || response.data);
    } catch (error) {
      toast.error('Failed to fetch customers');
    }
  };

  const fetchSpareParts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/spare-parts?limit=4000`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSpareParts(extractData(response));
    } catch (error) {
      console.error('Failed to fetch spare parts:', error);
    }
  };

  // Search spare parts for autocomplete
  const searchSpareParts = (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setSparePartSuggestions([]);
      return;
    }

    const lowerSearch = searchTerm.toLowerCase();
    
    // Combine spare parts from database with predefined service items
    const dbMatches = spareParts.filter(part => 
      part.name?.toLowerCase().includes(lowerSearch) ||
      part.part_number?.toLowerCase().includes(lowerSearch) ||
      part.brand?.toLowerCase().includes(lowerSearch)
    ).map(part => ({
      id: part.id,  // Include spare part ID for inventory tracking
      name: part.name,
      hsn_sac: part.hsn_sac || '',
      unit: part.unit || 'Nos',
      rate: part.unit_price || 0,
      gst_percent: part.gst_percentage || 18,
      quantity: part.quantity || 0,  // Include available quantity
      source: 'spare_parts'
    }));

    const predefinedMatches = serviceItems.filter(item =>
      item.name.toLowerCase().includes(lowerSearch)
    ).map(item => ({
      ...item,
      id: null,  // Predefined items don't have inventory IDs
      source: 'predefined'
    }));

    // Combine and limit suggestions
    const allSuggestions = [...dbMatches, ...predefinedMatches].slice(0, 10);
    setSparePartSuggestions(allSuggestions);
  };

  // Debounced search for description field
  const debouncedSparePartSearch = useCallback(
    debounce((searchTerm) => searchSpareParts(searchTerm), 300),
    [spareParts, serviceItems]
  );

  const fetchServiceBills = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch only from service-bills endpoint (itemized bills) - NOT job cards
      const serviceBillsResponse = await axios.get(`${API}/service-bills`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => ({ data: [] })); // Return empty if endpoint doesn't exist
      
      const serviceBills = serviceBillsResponse.data || [];
      
      // Map itemized service bills only (no job cards)
      const itemizedBills = serviceBills.map(bill => ({
        ...bill,
        job_card_number: bill.bill_number,
        customer_name: bill.customer_name || 'Unknown Customer',
        customer_phone: bill.customer_mobile || 'N/A',
        vehicle_reg_no: bill.vehicle_number || 'N/A',
        amount: bill.total_amount,
        service_type: 'billing',
        status: bill.status || 'pending',
        isItemized: true // Flag to identify itemized bills
      }));
      
      setServiceBills(itemizedBills);
    } catch (error) {
      toast.error('Failed to fetch service bills');
    } finally {
      setLoading(false);
    }
  };

  const filterBills = () => {
    let filtered = serviceBills;

    if (searchTerm) {
      filtered = filtered.filter(bill => 
        bill.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.customer_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.vehicle_reg_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.job_card_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.bill_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.service_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredBills(filtered);
  };

  const fetchJobCardSuggestions = async (partialJobCard) => {
    if (!partialJobCard || partialJobCard.length < 3) {
      setJobCardSuggestions([]);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/services?limit=4000`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Filter services by partial job card number match
      const matchingServices = extractData(response).filter(service => 
        service.job_card_number && 
        service.job_card_number.toLowerCase().includes(partialJobCard.toLowerCase())
      ).slice(0, 10); // Limit to 10 suggestions

      setJobCardSuggestions(matchingServices.map(service => ({
        job_card_number: service.job_card_number,
        customer_name: service.customer_name || 'Unknown Customer',
        service_type: service.service_type,
        service_id: service.id
      })));
    } catch (error) {
      console.error('Error fetching job card suggestions:', error);
      setJobCardSuggestions([]);
    }
  };

  const fetchServiceByJobCard = async (jobCard) => {
    setFetchingService(true);
    setJobCardSuggestions([]); // Clear suggestions when fetching
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/services/job-card/${jobCard}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const service = response.data;
      setServiceDetails(service);
      
      // Auto-populate customer selection
      setSelectedCustomer(service.customer_id);
      
      // Set bill number with SB- prefix using only the numeric part from job card
      // Extract numbers from job card (e.g., "JOB-000294" -> "000294")
      const jobCardNumber = jobCard.replace(/[^0-9]/g, '');
      setBillNumber(`SB-${jobCardNumber}`);
      
      // Auto-populate first bill item with service details
      const serviceItem = {
        sl_no: 1,
        description: `${service.service_type ? service.service_type.replace('_', ' ').toUpperCase() : 'SERVICE'} - ${service.description}`,
        hsn_sac: service.service_type === 'repair' ? '99800' : '99820', // Service HSN codes
        qty: 1,
        unit: 'Nos',
        rate: service.amount,
        labor: 0,
        disc_percent: 0,
        gst_percent: 18,
        cgst_amount: 0,
        sgst_amount: 0,
        total_tax: 0,
        amount: 0
      };
      
      // Calculate amounts for the auto-populated item
      const calculatedAmounts = calculateItemAmounts(serviceItem);
      const updatedItem = { ...serviceItem, ...calculatedAmounts };
      
      setBillItems([updatedItem]);
      
      toast.success(`Customer details loaded: ${service.customer_name} (${service.customer_phone})`);
      
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Service not found with this job card number');
      setServiceDetails(null);
    } finally {
      setFetchingService(false);
    }
  };

  // Edit Service Items handlers
  const handleOpenEditServiceItems = () => {
    setEditableServiceItems([...serviceItems]);
    setShowEditServiceItemsModal(true);
  };

  const handleUpdateServiceItem = (index, field, value) => {
    const updated = [...editableServiceItems];
    updated[index] = { ...updated[index], [field]: field === 'rate' || field === 'gst_percent' ? parseFloat(value) || 0 : value };
    setEditableServiceItems(updated);
  };

  const handleAddNewServiceItem = () => {
    setEditableServiceItems([...editableServiceItems, {
      name: '',
      hsn_sac: '',
      unit: 'Nos',
      rate: 0,
      gst_percent: 18
    }]);
  };

  const handleRemoveServiceItem = (index) => {
    const updated = editableServiceItems.filter((_, i) => i !== index);
    setEditableServiceItems(updated);
  };

  const handleSaveServiceItems = () => {
    // Validate items
    const validItems = editableServiceItems.filter(item => item.name.trim() !== '');
    if (validItems.length === 0) {
      toast.error('Please add at least one service item');
      return;
    }
    setServiceItems(validItems);
    setShowEditServiceItemsModal(false);
    toast.success('Service items updated successfully!');
  };

  // Debounced search function for job card suggestions
  const debouncedJobCardSearch = useCallback(
    debounce((partialJobCard) => fetchJobCardSuggestions(partialJobCard), 300),
    []
  );

  const handleJobCardSearch = (e) => {
    const jobCard = e.target.value.toUpperCase();
    setJobCardNumber(jobCard);
    // Trigger suggestions as user types
    if (jobCard.length >= 3) {
      debouncedJobCardSearch(jobCard);
    } else {
      setJobCardSuggestions([]);
    }
  };

  const handleJobCardSelection = (selectedJobCard) => {
    setJobCardNumber(selectedJobCard.job_card_number);
    setJobCardSuggestions([]);
    // Fetch full service details for selected job card
    fetchServiceByJobCard(selectedJobCard.job_card_number);
  };

  const handleJobCardBlur = () => {
    // Delay clearing suggestions to allow clicking on them
    setTimeout(() => {
      if (jobCardNumber && jobCardSuggestions.length === 0) {
        fetchServiceByJobCard(jobCardNumber);
      }
    }, 200);
  };

  const clearServiceDetails = () => {
    setJobCardNumber('');
    setServiceDetails(null);
    setSelectedCustomer('');
    setBillItems([{
      sl_no: 1,
      description: '',
      hsn_sac: '',
      qty: 1,
      unit: 'Nos',
      rate: 0,
      labor: 0,
      disc_percent: 0,
      gst_percent: 18,
      cgst_amount: 0,
      sgst_amount: 0,
      total_tax: 0,
      amount: 0
    }]);
  };

  const handleDeleteServiceBill = async (bill) => {
    const ok = await confirm({
      title: `Delete bill "${bill.bill_number || bill.job_card_number}"?`,
      description: 'This action cannot be undone.',
      confirmLabel: 'Delete Bill',
    });
    if (!ok) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/service-bills/${bill.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove from local state
      const updatedBills = serviceBills.filter(b => b.id !== bill.id);
      setServiceBills(updatedBills);
      
      toast.success('Service bill deleted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete service bill');
    }
  };

  const addPredefinedItem = (item) => {
    const newItem = {
      sl_no: billItems.length + 1,
      description: item.name,
      hsn_sac: item.hsn_sac,
      qty: 1,
      unit: item.unit,
      rate: item.rate,
      labor: 0,
      disc_percent: 0,
      gst_percent: item.gst_percent,
      cgst_amount: 0,
      sgst_amount: 0,
      total_tax: 0,
      amount: 0
    };
    
    // Calculate amounts for the new item
    const calculatedAmounts = calculateItemAmounts(newItem);
    const finalItem = { ...newItem, ...calculatedAmounts };
    
    setBillItems([...billItems, finalItem]);
    toast.success(`Added ${item.name} to bill`);
  };

  const addServicePackage = () => {
    const servicePackageItems = [
      { name: 'General Service Labor', hsn_sac: '99820', unit: 'Hrs', rate: 300, gst_percent: 18 },
      { name: 'Engine Oil (20W-40)', hsn_sac: '27101981', unit: 'Ltrs', rate: 450, gst_percent: 28 },
      { name: 'Oil Filter', hsn_sac: '84219990', unit: 'Nos', rate: 180, gst_percent: 28 },
      { name: 'Air Filter Cleaning', hsn_sac: '99820', unit: 'Nos', rate: 50, gst_percent: 18 },
      { name: 'Chain Lubrication', hsn_sac: '99820', unit: 'Nos', rate: 100, gst_percent: 18 }
    ];

    const newItems = servicePackageItems.map((item, index) => {
      const newItem = {
        sl_no: billItems.length + index + 1,
        description: item.name,
        hsn_sac: item.hsn_sac,
        qty: 1,
        unit: item.unit,
        rate: item.rate,
        labor: 0,
        disc_percent: 0,
        gst_percent: item.gst_percent,
        cgst_amount: 0,
        sgst_amount: 0,
        total_tax: 0,
        amount: 0
      };
      
      // Calculate amounts for the new item
      const calculatedAmounts = calculateItemAmounts(newItem);
      return { ...newItem, ...calculatedAmounts };
    });
    
    setBillItems([...billItems, ...newItems]);
    toast.success('Added complete service package to bill');
  };

  const calculateItemAmounts = (item) => {
    const baseAmount = (item.qty * item.rate) + item.labor;
    const discountAmount = (baseAmount * item.disc_percent) / 100;
    const taxableAmount = baseAmount - discountAmount;
    
    const gstAmount = (taxableAmount * item.gst_percent) / 100;
    const cgstAmount = gstAmount / 2;
    const sgstAmount = gstAmount / 2;
    const totalTax = cgstAmount + sgstAmount;
    const finalAmount = taxableAmount + totalTax;

    return {
      cgst_amount: parseFloat(cgstAmount.toFixed(2)),
      sgst_amount: parseFloat(sgstAmount.toFixed(2)),
      total_tax: parseFloat(totalTax.toFixed(2)),
      amount: parseFloat(finalAmount.toFixed(2))
    };
  };

  const handleSelectSparePart = (index, part) => {
    const updatedItems = [...billItems];
    updatedItems[index] = {
      ...updatedItems[index],
      description: part.name,
      hsn_sac: part.hsn_sac,
      unit: part.unit,
      rate: part.rate,
      gst_percent: part.gst_percent,
      spare_part_id: part.id || null,  // Track spare part ID for inventory deduction
      source: part.source || 'manual'
    };
    
    // Recalculate amounts
    const calculatedAmounts = calculateItemAmounts(updatedItems[index]);
    updatedItems[index] = { ...updatedItems[index], ...calculatedAmounts };
    
    setBillItems(updatedItems);
    setSparePartSuggestions([]);
    setActiveDescriptionIndex(null);
  };

  const updateBillItem = (index, field, value) => {
    const updatedItems = [...billItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate amounts for this item
    const calculatedAmounts = calculateItemAmounts(updatedItems[index]);
    updatedItems[index] = { ...updatedItems[index], ...calculatedAmounts };
    
    setBillItems(updatedItems);
  };

  // Back-calculate Rate when Amount is directly edited
  const updateBillItemAmount = (index, newAmount) => {
    const updatedItems = [...billItems];
    const item = updatedItems[index];
    
    // Parse the new amount
    const targetAmount = parseFloat(newAmount) || 0;
    
    if (targetAmount <= 0) {
      // If amount is 0 or negative, just set rate to 0
      updatedItems[index] = { 
        ...item, 
        rate: 0,
        amount: 0,
        cgst_amount: 0,
        sgst_amount: 0,
        total_tax: 0
      };
    } else {
      // Back-calculate: Amount -> taxableAmount -> baseAmount -> rate
      // finalAmount = taxableAmount * (1 + gst_percent/100)
      const gstMultiplier = 1 + (item.gst_percent / 100);
      const taxableAmount = targetAmount / gstMultiplier;
      
      // taxableAmount = baseAmount * (1 - disc_percent/100)
      const discountMultiplier = 1 - (item.disc_percent / 100);
      const baseAmount = discountMultiplier > 0 ? taxableAmount / discountMultiplier : taxableAmount;
      
      // baseAmount = (qty * rate) + labor
      // rate = (baseAmount - labor) / qty
      const qty = item.qty || 1;
      const labor = item.labor || 0;
      const calculatedRate = qty > 0 ? Math.max(0, (baseAmount - labor) / qty) : 0;
      
      // Update the rate and recalculate all amounts
      updatedItems[index] = { ...item, rate: parseFloat(calculatedRate.toFixed(2)) };
      const calculatedAmounts = calculateItemAmounts(updatedItems[index]);
      updatedItems[index] = { ...updatedItems[index], ...calculatedAmounts };
    }
    
    setBillItems(updatedItems);
  };

  const handleDescriptionChange = (index, value) => {
    updateBillItem(index, 'description', value);
    setActiveDescriptionIndex(index);
    debouncedSparePartSearch(value);
  };

  const addBillItem = () => {
    const newItem = {
      sl_no: billItems.length + 1,
      description: '',
      hsn_sac: '',
      qty: 1,
      unit: 'Nos',
      rate: 0,
      labor: 0,
      disc_percent: 0,
      gst_percent: 18,
      cgst_amount: 0,
      sgst_amount: 0,
      total_tax: 0,
      amount: 0
    };
    setBillItems([...billItems, newItem]);
  };

  const removeBillItem = (index) => {
    if (billItems.length > 1) {
      const updatedItems = billItems.filter((_, i) => i !== index);
      // Update serial numbers
      const reNumberedItems = updatedItems.map((item, i) => ({
        ...item,
        sl_no: i + 1
      }));
      setBillItems(reNumberedItems);
    }
  };

  // Duplicate function removed - using the first declaration above

  const calculateTotals = () => {
    const subtotal = billItems.reduce((sum, item) => sum + (item.qty * item.rate) + item.labor, 0);
    const totalDiscount = billItems.reduce((sum, item) => sum + ((item.qty * item.rate + item.labor) * item.disc_percent / 100), 0);
    const totalCGST = billItems.reduce((sum, item) => sum + item.cgst_amount, 0);
    const totalSGST = billItems.reduce((sum, item) => sum + item.sgst_amount, 0);
    const totalTax = billItems.reduce((sum, item) => sum + item.total_tax, 0);
    const grandTotal = billItems.reduce((sum, item) => sum + item.amount, 0);

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      totalDiscount: parseFloat(totalDiscount.toFixed(2)),
      totalCGST: parseFloat(totalCGST.toFixed(2)),
      totalSGST: parseFloat(totalSGST.toFixed(2)),
      totalTax: parseFloat(totalTax.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2))
    };
  };

  const handleSaveBill = async () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }

    if (billItems.length === 0 || billItems.every(item => !item.description)) {
      toast.error('Please add at least one item with description');
      return;
    }

    setLoading(true);
    try {
      const totals = calculateTotals();
      const customerData = customers.find(c => c.id === selectedCustomer);
      
      // Create itemized service bill
      const billData = {
        bill_number: billNumber,
        job_card_number: jobCardNumber || null,
        customer_id: selectedCustomer,
        customer_name: customerData?.name || '',
        customer_mobile: customerData?.mobile || customerData?.phone || '',
        vehicle_number: serviceDetails?.vehicle_number || '',
        vehicle_brand: serviceDetails?.vehicle_brand || '',
        vehicle_model: serviceDetails?.vehicle_model || '',
        items: billItems.filter(item => item.description).map(item => ({
          sl_no: item.sl_no,
          description: item.description,
          hsn_sac: item.hsn_sac,
          qty: item.qty,
          unit: item.unit,
          rate: item.rate,
          labor: item.labor,
          disc_percent: item.disc_percent,
          gst_percent: item.gst_percent,
          cgst_amount: item.cgst_amount,
          sgst_amount: item.sgst_amount,
          total_tax: item.total_tax,
          amount: item.amount,
          spare_part_id: item.spare_part_id || null  // Include spare part ID for inventory deduction
        })),
        subtotal: totals.subtotal,
        total_discount: totals.totalDiscount,
        total_cgst: totals.totalCgst,
        total_sgst: totals.totalSgst,
        total_tax: totals.totalTax,
        total_amount: totals.grandTotal,
        bill_date: billDate,
        status: 'pending'
      };

      const token = localStorage.getItem('token');
      await axios.post(`${API}/service-bills`, billData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Service bill saved successfully!');
      
      // Reset form
      setBillItems([{
        sl_no: 1,
        description: '',
        hsn_sac: '',
        qty: 1,
        unit: 'Nos',
        rate: 0,
        labor: 0,
        disc_percent: 0,
        gst_percent: 18,
        cgst_amount: 0,
        sgst_amount: 0,
        total_tax: 0,
        amount: 0
      }]);
      setSelectedCustomer('');
      setBillNumber(`SB-${Date.now().toString().slice(-6)}`);
      setBillDate(new Date().toISOString().split('T')[0]);
      setJobCardNumber('');
      setServiceDetails(null);
      
    } catch (error) {
      toast.error('Failed to save service bill');
      console.error('Save bill error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintBill = () => {
    // Create professional itemized bill for printing
    const selectedCustomerData = customers.find(c => c.id === selectedCustomer);
    const totals = calculateTotals();
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Service Bill - ${billNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Arial', sans-serif; 
              line-height: 1.4; 
              color: #333;
              background: white;
            }
            .bill-container { 
              max-width: 210mm; 
              margin: 0 auto; 
              padding: 15mm;
              background: white;
            }
            
            /* Header Styles */
            .bill-header { 
              text-align: center; 
              border-bottom: 3px solid #2563eb;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .company-name { 
              font-size: 28px; 
              font-weight: bold; 
              color: #1e40af;
              margin-bottom: 4px;
            }
            .company-tagline { 
              font-size: 14px; 
              color: #6b7280;
              margin-bottom: 8px;
            }
            .company-address { 
              font-size: 12px; 
              color: #4b5563;
              line-height: 1.4;
            }
            
            /* Bill Title */
            .bill-title { 
              text-align: center;
              background: linear-gradient(135deg, #2563eb, #1d4ed8);
              color: white;
              padding: 12px;
              font-size: 20px;
              font-weight: bold;
              margin: 20px 0;
              border-radius: 8px;
            }
            
            /* Bill Info */
            .bill-info { 
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
              padding: 15px;
              background: #f8fafc;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
            }
            .info-section h4 { 
              color: #1e40af;
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 8px;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 4px;
            }
            .info-row { 
              display: flex;
              justify-content: space-between;
              margin-bottom: 6px;
              padding: 3px 0;
            }
            .info-label { 
              font-weight: 600;
              color: #374151;
              font-size: 12px;
            }
            .info-value { 
              color: #111827;
              font-size: 12px;
            }
            
            /* Items Table */
            .items-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0;
              font-size: 12px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .items-table th { 
              background: linear-gradient(135deg, #1e40af, #3b82f6);
              color: white;
              font-weight: bold;
              padding: 15px 8px;
              text-align: center;
              font-size: 12px;
              border: 1px solid #1e40af;
            }
            .items-table td { 
              padding: 12px 8px;
              border: 1px solid #d1d5db;
              text-align: center;
            }
            .items-table tbody tr:nth-child(even) { 
              background: #f8fafc;
            }
            .items-table tbody tr:hover { 
              background: #e0f2fe;
            }
            .description-cell { 
              text-align: left !important;
              font-weight: 500;
            }
            .amount-cell { 
              font-weight: bold;
              color: #059669;
            }
            
            /* Totals Section */
            .totals-section { 
              margin-top: 30px;
              display: grid;
              grid-template-columns: 1fr 400px;
              gap: 30px;
            }
            .totals-table { 
              width: 100%;
              border-collapse: collapse;
            }
            .totals-table tr { 
              border-bottom: 1px solid #e5e7eb;
            }
            .totals-table td { 
              padding: 12px 15px;
              font-size: 16px;
            }
            .totals-table .label { 
              font-weight: 600;
              color: #374151;
            }
            .totals-table .value { 
              text-align: right;
              font-weight: bold;
              color: #111827;
            }
            .grand-total { 
              background: linear-gradient(135deg, #059669, #10b981) !important;
              color: white !important;
              font-size: 20px !important;
              font-weight: bold !important;
            }
            
            /* Terms Section */
            .terms-section { 
              margin-top: 30px;
              padding: 20px;
              background: #fef3c7;
              border: 1px solid #f59e0b;
              border-radius: 8px;
            }
            .terms-section h4 { 
              color: #92400e;
              margin-bottom: 10px;
              font-size: 16px;
            }
            .terms-section p { 
              color: #78350f;
              font-size: 14px;
              margin-bottom: 5px;
            }
            
            /* Footer */
            .bill-footer { 
              margin-top: 40px;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              border-top: 2px solid #e5e7eb;
              padding-top: 20px;
            }
            
            @media print {
              body { -webkit-print-color-adjust: exact; }
              .bill-container { padding: 8mm; }
            }
          </style>
        </head>
        <body>
          <div class="bill-container">
            <!-- Header -->
            <div class="bill-header">
              <div class="company-name">M M MOTORS</div>
              <div class="company-tagline">Two Wheeler Service Excellence</div>
              <div class="company-address">
                Bengaluru main road, behind Ruchi Bakery<br>
                Malur, Karnataka 563130<br>
                Phone: 7026263123 | Email: mmmotors3123@gmail.com
              </div>
            </div>
            
            <!-- Bill Title -->
            <div class="bill-title">
              GST SERVICE BILL
            </div>
            
            <!-- Bill Information -->
            <div class="bill-info">
              <div class="info-section">
                <h4>Bill Details</h4>
                <div class="info-row">
                  <span class="info-label">Bill Number:</span>
                  <span class="info-value">${billNumber}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Bill Date:</span>
                  <span class="info-value">${new Date(billDate).toLocaleDateString('en-IN')}</span>
                </div>
                ${serviceDetails ? `
                <div class="info-row">
                  <span class="info-label">Job Card:</span>
                  <span class="info-value">${serviceDetails.job_card_number}</span>
                </div>
                ` : ''}
              </div>
              
              <div class="info-section">
                <h4>Customer Details</h4>
                <div class="info-row">
                  <span class="info-label">Name:</span>
                  <span class="info-value">${selectedCustomerData?.name || serviceDetails?.customer_name || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Phone:</span>
                  <span class="info-value">${selectedCustomerData?.phone || serviceDetails?.customer_phone || 'N/A'}</span>
                </div>
                ${serviceDetails?.vehicle_number ? `
                <div class="info-row">
                  <span class="info-label">Vehicle:</span>
                  <span class="info-value">${serviceDetails.vehicle_number}</span>
                </div>
                ` : ''}
              </div>
            </div>
            
            <!-- Items Table -->
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 5%;">S.No</th>
                  <th style="width: 25%;">Description of Services</th>
                  <th style="width: 10%;">HSN/SAC</th>
                  <th style="width: 8%;">Qty</th>
                  <th style="width: 8%;">Unit</th>
                  <th style="width: 10%;">Rate</th>
                  <th style="width: 10%;">Labor</th>
                  <th style="width: 8%;">Disc%</th>
                  <th style="width: 8%;">GST%</th>
                  <th style="width: 10%;">CGST</th>
                  <th style="width: 10%;">SGST</th>
                  <th style="width: 12%;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${billItems.map((item, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td class="description-cell">${item.description || 'Service Item'}</td>
                    <td>${item.hsn_sac || '998'}</td>
                    <td>${item.qty}</td>
                    <td>${item.unit}</td>
                    <td>₹${item.rate.toFixed(2)}</td>
                    <td>₹${item.labor.toFixed(2)}</td>
                    <td>${item.disc_percent}%</td>
                    <td>${item.gst_percent}%</td>
                    <td>₹${item.cgst_amount.toFixed(2)}</td>
                    <td>₹${item.sgst_amount.toFixed(2)}</td>
                    <td class="amount-cell">₹${item.amount.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <!-- Totals Section -->
            <div class="totals-section">
              <div class="terms-section">
                <h4>Terms & Conditions:</h4>
                <p>• Service warranty: 30 days or 1000 km whichever is earlier</p>
                <p>• Parts warranty as per manufacturer terms</p>
                <p>• Bill must be presented for warranty claims</p>
                <p>• Payment due immediately upon service completion</p>
              </div>
              
              <table class="totals-table">
                <tr>
                  <td class="label">Subtotal:</td>
                  <td class="value">₹${totals.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td class="label">Total Discount:</td>
                  <td class="value">₹${totals.totalDiscount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td class="label">Total CGST:</td>
                  <td class="value">₹${totals.totalCGST.toFixed(2)}</td>
                </tr>
                <tr>
                  <td class="label">Total SGST:</td>
                  <td class="value">₹${totals.totalSGST.toFixed(2)}</td>
                </tr>
                <tr>
                  <td class="label">Total Tax:</td>
                  <td class="value">₹${totals.totalTax.toFixed(2)}</td>
                </tr>
                <tr class="grand-total">
                  <td class="label">GRAND TOTAL:</td>
                  <td class="value">₹${totals.grandTotal.toFixed(2)}</td>
                </tr>
              </table>
            </div>
            
            <!-- Footer -->
            <div class="bill-footer">
              <p><strong>Thank you for choosing M M Motors!</strong></p>
              <p>For any queries, please contact us at mmmotors3123@gmail.com or 7026263123</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 p-1">
        <div className="flex gap-1">
          <Button 
            variant={activeTab === 'create' ? 'default' : 'ghost'}
            className="flex-1"
            onClick={() => setActiveTab('create')}
          >
            Create Bill
          </Button>
          <Button 
            variant={activeTab === 'view' ? 'default' : 'ghost'}
            className="flex-1"
            onClick={() => setActiveTab('view')}
          >
            View Bills
          </Button>
        </div>
      </div>

      {activeTab === 'create' ? (
        <CreateBillContent 
          customers={customers}
          billItems={billItems}
          setBillItems={setBillItems}
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          billNumber={billNumber}
          setBillNumber={setBillNumber}
          billDate={billDate}
          setBillDate={setBillDate}
          loading={loading}
          calculateItemAmounts={calculateItemAmounts}
          calculateTotals={calculateTotals}
          updateBillItem={updateBillItem}
          updateBillItemAmount={updateBillItemAmount}
          addBillItem={addBillItem}
          removeBillItem={removeBillItem}
          addPredefinedItem={addPredefinedItem}
          addServicePackage={addServicePackage}
          handleSaveBill={handleSaveBill}
          handlePrintBill={handlePrintBill}
          units={units}
          gstRates={gstRates}
          serviceItems={serviceItems}
          jobCardNumber={jobCardNumber}
          setJobCardNumber={setJobCardNumber}
          serviceDetails={serviceDetails}
          fetchingService={fetchingService}
          handleJobCardSearch={handleJobCardSearch}
          handleJobCardBlur={handleJobCardBlur}
          clearServiceDetails={clearServiceDetails}
          jobCardSuggestions={jobCardSuggestions}
          handleJobCardSelection={handleJobCardSelection}
          activeDescriptionIndex={activeDescriptionIndex}
          setActiveDescriptionIndex={setActiveDescriptionIndex}
          sparePartSuggestions={sparePartSuggestions}
          handleDescriptionChange={handleDescriptionChange}
          handleSelectSparePart={handleSelectSparePart}
          handleOpenEditServiceItems={handleOpenEditServiceItems}
        />
      ) : (
        <ViewBillsContent 
          serviceBills={filteredBills}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          loading={loading}
          onDeleteBill={handleDeleteServiceBill}
          setServiceBills={setServiceBills}
        />
      )}

      {/* Edit Service Items Modal */}
      {showEditServiceItemsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Edit Quick Add Service Items</h2>
                  <p className="text-gray-600">Modify the service items that appear in the Quick Add section</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowEditServiceItemsModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-600 border-b pb-2">
                  <div className="col-span-4">Item Name</div>
                  <div className="col-span-2">HSN/SAC</div>
                  <div className="col-span-1">Unit</div>
                  <div className="col-span-2">Rate (₹)</div>
                  <div className="col-span-2">GST %</div>
                  <div className="col-span-1">Action</div>
                </div>

                {/* Editable Items */}
                {editableServiceItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <Input
                        value={item.name}
                        onChange={(e) => handleUpdateServiceItem(index, 'name', e.target.value)}
                        placeholder="Item name"
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        value={item.hsn_sac}
                        onChange={(e) => handleUpdateServiceItem(index, 'hsn_sac', e.target.value)}
                        placeholder="HSN/SAC"
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-1">
                      <Select 
                        value={item.unit} 
                        onValueChange={(value) => handleUpdateServiceItem(index, 'unit', value)}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map(unit => (
                            <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={item.rate}
                        onChange={(e) => handleUpdateServiceItem(index, 'rate', e.target.value)}
                        placeholder="Rate"
                        className="text-sm"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-span-2">
                      <Select 
                        value={item.gst_percent?.toString()} 
                        onValueChange={(value) => handleUpdateServiceItem(index, 'gst_percent', value)}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {gstRates.map(rate => (
                            <SelectItem key={rate} value={rate.toString()}>{rate}%</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveServiceItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Add New Item Button */}
                <Button
                  variant="outline"
                  onClick={handleAddNewServiceItem}
                  className="w-full flex items-center justify-center gap-2 border-dashed"
                >
                  <Plus className="w-4 h-4" />
                  Add New Item
                </Button>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowEditServiceItemsModal(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveServiceItems}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CreateBillContent = ({ 
  customers, billItems, setBillItems, selectedCustomer, setSelectedCustomer,
  billNumber, setBillNumber, billDate, setBillDate, loading,
  calculateItemAmounts, calculateTotals, updateBillItem, updateBillItemAmount, addBillItem, removeBillItem,
  addPredefinedItem, addServicePackage, handleSaveBill, handlePrintBill, units, gstRates,
  serviceItems, jobCardNumber, setJobCardNumber, serviceDetails, fetchingService,
  handleJobCardSearch, handleJobCardBlur, clearServiceDetails, jobCardSuggestions, handleJobCardSelection,
  activeDescriptionIndex, setActiveDescriptionIndex, sparePartSuggestions, handleDescriptionChange, handleSelectSparePart,
  handleOpenEditServiceItems
}) => {
  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create Service Bill</h2>
          <p className="text-gray-600">Create GST-compliant service bills</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrintBill} variant="outline" className="flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Print Bill
          </Button>
          <Button onClick={handleSaveBill} disabled={loading} className="flex items-center gap-2">
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Saving...
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4" />
                Save Bill
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Bill Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Job Card Lookup - Professional Design */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/60 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
                  <FileSearch className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-blue-900 text-lg">Job Card Lookup</h4>
                  <p className="text-blue-600/80 text-sm">Auto-populate service details from existing job cards</p>
                </div>
              </div>
              {serviceDetails && (
                <div className="flex items-center gap-2 bg-green-100 px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-800 text-xs font-medium">ACTIVE</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Search Input Section */}
              <div className="lg:col-span-1">
                <div className="relative">
                  <Label htmlFor="job_card" className="text-slate-700 font-semibold mb-2 block">
                    Job Card Number
                  </Label>
                  <div className="relative">
                    <Input
                      id="job_card"
                      value={jobCardNumber}
                      onChange={handleJobCardSearch}
                      onBlur={handleJobCardBlur}
                      placeholder="JOB-000001"
                      className="pl-4 pr-10 py-3 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg text-slate-800 font-medium"
                    />
                    {fetchingService ? (
                      <div className="absolute right-3 top-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-200 border-t-blue-600"></div>
                      </div>
                    ) : (
                      <div className="absolute right-3 top-3">
                        <FileSearch className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                    
                    {/* Job Card Suggestions Dropdown */}
                    {jobCardSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto mt-1">
                        <div className="p-2 text-xs text-blue-600 font-medium border-b">
                          Job Card Suggestions
                        </div>
                        {jobCardSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onMouseDown={() => handleJobCardSelection(suggestion)}
                          >
                            <div className="font-medium text-sm text-blue-900">{suggestion.job_card_number}</div>
                            <div className="text-xs text-gray-600">{suggestion.customer_name}</div>
                            <div className="text-xs text-green-600 capitalize">{suggestion.service_type?.replace('_', ' ')}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Enter job card to auto-fill service details</p>
                </div>
              </div>

              {/* Service Details Section */}
              <div className="lg:col-span-2">
                {serviceDetails ? (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3">
                      <h5 className="font-bold text-white flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Service Details Retrieved
                      </h5>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="p-1.5 bg-blue-100 rounded-lg">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Customer Details</p>
                              <p className="font-semibold text-slate-800">{serviceDetails.customer_name}</p>
                              <p className="text-xs text-blue-600 font-medium">📱 {serviceDetails.customer_phone}</p>
                              {serviceDetails.customer_address && (
                                <p className="text-xs text-slate-500 mt-1">📍 {serviceDetails.customer_address}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="p-1.5 bg-purple-100 rounded-lg">
                              <Car className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Vehicle</p>
                              <p className="font-semibold text-slate-800">{serviceDetails.vehicle_number}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="p-1.5 bg-orange-100 rounded-lg">
                              <Wrench className="w-4 h-4 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Service Type</p>
                              <p className="font-semibold text-slate-800 capitalize">
                                {serviceDetails.service_type.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {serviceDetails.description && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Description</p>
                          <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">
                            {serviceDetails.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/50 rounded-xl border-2 border-dashed border-slate-300 p-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-slate-100 rounded-full">
                        <FileSearch className="w-8 h-8 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-600">No service selected</p>
                        <p className="text-sm text-slate-500">Enter a job card number to view service details</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {serviceDetails && (
              <div className="mt-6 flex justify-between items-center pt-4 border-t border-blue-200/50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-green-100 px-3 py-2 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-800">Service loaded successfully</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Job Card: <span className="font-mono font-medium">{serviceDetails.job_card_number}</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearServiceDetails}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Selection
                </Button>
              </div>
            )}
          </div>

          {/* Bill Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="bill_number">Bill Number</Label>
              <Input
                id="bill_number"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                placeholder="Enter bill number"
              />
            </div>
            <div>
              <Label htmlFor="bill_date">Bill Date</Label>
              <Input
                id="bill_date"
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bill Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 text-left font-semibold">Sl. No.</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Description of Goods</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">HSN/SAC</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Qty.</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Unit</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Rate</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Labor</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Disc%</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">GST%</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">CGST Amount</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">SGST Amount</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Total Tax</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Amount</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold no-print">Actions</th>
                </tr>
              </thead>
              <tbody>
                {billItems.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-2 text-center font-medium">{item.sl_no}</td>
                    <td className="border border-gray-300 p-2 relative">
                      <Input
                        value={item.description}
                        onChange={(e) => handleDescriptionChange(index, e.target.value)}
                        onFocus={() => setActiveDescriptionIndex(index)}
                        onBlur={() => {
                          // Delay hiding to allow clicking on suggestions
                          setTimeout(() => setActiveDescriptionIndex(null), 200);
                        }}
                        placeholder="Type to search spare parts..."
                        className="border-0 p-1"
                      />
                      {/* Spare Parts Autocomplete Dropdown */}
                      {activeDescriptionIndex === index && sparePartSuggestions.length > 0 && (
                        <div className="absolute z-50 w-72 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          <div className="p-2 text-xs font-medium text-blue-600 border-b bg-blue-50">
                            <Package className="inline w-3 h-3 mr-1" />
                            Matching Parts & Items
                          </div>
                          {sparePartSuggestions.map((part, idx) => (
                            <div
                              key={idx}
                              className={`p-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                                part.source === 'spare_parts' && part.quantity === 0 ? 'opacity-50' : ''
                              }`}
                              onMouseDown={() => handleSelectSparePart(index, part)}
                            >
                              <div className="font-medium text-sm text-gray-900">{part.name}</div>
                              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                {part.hsn_sac && <span>HSN: {part.hsn_sac}</span>}
                                <span>₹{part.rate}</span>
                                <span>{part.unit}</span>
                                <span className="text-green-600">GST: {part.gst_percent}%</span>
                                {part.source === 'spare_parts' && (
                                  <span className={`font-medium ${part.quantity > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                    Stock: {part.quantity}
                                  </span>
                                )}
                                <Badge variant="outline" className="text-xs py-0">
                                  {part.source === 'spare_parts' ? 'Inventory' : 'Service'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.hsn_sac}
                        onChange={(e) => updateBillItem(index, 'hsn_sac', e.target.value)}
                        placeholder="HSN/SAC"
                        className="border-0 p-1 w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        type="number"
                        value={item.qty}
                        onChange={(e) => updateBillItem(index, 'qty', parseFloat(e.target.value) || 0)}
                        className="border-0 p-1 w-16"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Select value={item.unit} onValueChange={(value) => updateBillItem(index, 'unit', value)}>
                        <SelectTrigger className="border-0 p-1 w-16">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateBillItem(index, 'rate', parseFloat(e.target.value) || 0)}
                        className="border-0 p-1 w-20"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        type="number"
                        value={item.labor}
                        onChange={(e) => updateBillItem(index, 'labor', parseFloat(e.target.value) || 0)}
                        className="border-0 p-1 w-20"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        type="number"
                        value={item.disc_percent}
                        onChange={(e) => updateBillItem(index, 'disc_percent', parseFloat(e.target.value) || 0)}
                        className="border-0 p-1 w-16"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Select value={item.gst_percent.toString()} onValueChange={(value) => updateBillItem(index, 'gst_percent', parseFloat(value))}>
                        <SelectTrigger className="border-0 p-1 w-16">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {gstRates.map((rate) => (
                            <SelectItem key={rate} value={rate.toString()}>
                              {rate}%
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="border border-gray-300 p-2 text-right font-medium">₹{item.cgst_amount}</td>
                    <td className="border border-gray-300 p-2 text-right font-medium">₹{item.sgst_amount}</td>
                    <td className="border border-gray-300 p-2 text-right font-medium">₹{item.total_tax}</td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex items-center justify-end">
                        <span className="mr-1">₹</span>
                        <Input
                          type="number"
                          value={item.amount}
                          onChange={(e) => updateBillItemAmount(index, e.target.value)}
                          className="border-0 p-1 w-24 text-right font-bold"
                          min="0"
                          step="0.01"
                          data-testid={`bill-item-amount-${index}`}
                        />
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2 text-center no-print">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeBillItem(index)}
                        disabled={billItems.length === 1}
                        className="w-8 h-8 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick Add Service Items */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-4 no-print">
            <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Quick Add Service Items
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-3">
              {serviceItems.slice(0, 12).map((item, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="justify-start text-xs p-2 h-auto min-h-[40px] hover:bg-green-100 border-green-200"
                  onClick={() => addPredefinedItem(item)}
                >
                  <div className="text-left">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-green-600">₹{item.rate}</div>
                  </div>
                </Button>
              ))}
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-green-700">Click any item to add it to the bill</p>
              <div className="flex gap-2">
                <Button onClick={addBillItem} variant="outline" size="sm" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Custom Item
                </Button>
                <Button onClick={handleOpenEditServiceItems} variant="outline" size="sm" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Edit
                </Button>
                <Button onClick={addServicePackage} variant="outline" size="sm" className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100">
                  <Wrench className="w-4 h-4" />
                  Add Service Package
                </Button>
              </div>
            </div>
          </div>

          {/* Bill Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div></div>
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b">
                <span>Subtotal:</span>
                <span className="font-medium">₹{totals.subtotal}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Total Discount:</span>
                <span className="font-medium text-red-600">-₹{totals.totalDiscount}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Total CGST:</span>
                <span className="font-medium">₹{totals.totalCGST}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Total SGST:</span>
                <span className="font-medium">₹{totals.totalSGST}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Total Tax:</span>
                <span className="font-medium">₹{totals.totalTax}</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-gray-400">
                <span className="font-bold text-lg">Grand Total:</span>
                <span className="font-bold text-lg text-green-600">₹{totals.grandTotal}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ViewBillsContent = ({ serviceBills, searchTerm, setSearchTerm, loading, onDeleteBill, setServiceBills }) => {
  const [selectedBill, setSelectedBill] = React.useState(null);
  const [showViewModal, setShowViewModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [editingBill, setEditingBill] = React.useState(null);
  const [editBillItems, setEditBillItems] = React.useState([]);
  const [editLoading, setEditLoading] = React.useState(false);

  const units = ['Nos', 'Kgs', 'Ltrs', 'Hrs', 'Days', 'Pcs'];
  const gstRates = [0, 5, 12, 18, 28];

  const handleViewBill = (bill) => {
    setSelectedBill(bill);
    setShowViewModal(true);
  };

  const handleEditBill = (bill) => {
    setEditingBill({
      ...bill,
      bill_number: bill.bill_number || bill.job_card_number || '',
      customer_name: bill.customer_name || '',
      vehicle_reg_no: bill.vehicle_reg_no || '',
      status: bill.status || 'unpaid'
    });
    // Initialize edit items from bill
    if (bill.items && bill.items.length > 0) {
      setEditBillItems(bill.items.map((item, idx) => ({
        sl_no: idx + 1,
        description: item.description || item.name || '',
        hsn_sac: item.hsn_sac || '',
        qty: item.qty || 1,
        unit: item.unit || 'Nos',
        rate: item.rate || 0,
        labor: item.labor || 0,
        disc_percent: item.disc_percent || 0,
        gst_percent: item.gst_percent || 18,
        cgst_amount: item.cgst_amount || 0,
        sgst_amount: item.sgst_amount || 0,
        total_tax: item.total_tax || 0,
        amount: item.amount || 0
      })));
    } else {
      // Create a single item from bill total if no items
      const baseAmount = (bill.amount || 0) / 1.18;
      const gstAmount = baseAmount * 0.18;
      setEditBillItems([{
        sl_no: 1,
        description: bill.description || 'Service Charge',
        hsn_sac: '99820',
        qty: 1,
        unit: 'Nos',
        rate: parseFloat(baseAmount.toFixed(2)),
        labor: 0,
        disc_percent: 0,
        gst_percent: 18,
        cgst_amount: parseFloat((gstAmount / 2).toFixed(2)),
        sgst_amount: parseFloat((gstAmount / 2).toFixed(2)),
        total_tax: parseFloat(gstAmount.toFixed(2)),
        amount: bill.amount || 0
      }]);
    }
    setShowEditModal(true);
  };

  const calculateEditItemAmounts = (item) => {
    const baseAmount = (item.qty * item.rate) + item.labor;
    const discountAmount = (baseAmount * item.disc_percent) / 100;
    const taxableAmount = baseAmount - discountAmount;
    const gstAmount = (taxableAmount * item.gst_percent) / 100;
    const cgstAmount = gstAmount / 2;
    const sgstAmount = gstAmount / 2;
    const totalTax = cgstAmount + sgstAmount;
    const finalAmount = taxableAmount + totalTax;

    return {
      cgst_amount: parseFloat(cgstAmount.toFixed(2)),
      sgst_amount: parseFloat(sgstAmount.toFixed(2)),
      total_tax: parseFloat(totalTax.toFixed(2)),
      amount: parseFloat(finalAmount.toFixed(2))
    };
  };

  const updateEditBillItem = (index, field, value) => {
    const updatedItems = [...editBillItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    const calculatedAmounts = calculateEditItemAmounts(updatedItems[index]);
    updatedItems[index] = { ...updatedItems[index], ...calculatedAmounts };
    setEditBillItems(updatedItems);
  };

  const updateEditBillItemAmount = (index, newAmount) => {
    const updatedItems = [...editBillItems];
    const item = updatedItems[index];
    const targetAmount = parseFloat(newAmount) || 0;
    
    if (targetAmount <= 0) {
      updatedItems[index] = { ...item, rate: 0, amount: 0, cgst_amount: 0, sgst_amount: 0, total_tax: 0 };
    } else {
      const gstMultiplier = 1 + (item.gst_percent / 100);
      const taxableAmount = targetAmount / gstMultiplier;
      const discountMultiplier = 1 - (item.disc_percent / 100);
      const baseAmount = discountMultiplier > 0 ? taxableAmount / discountMultiplier : taxableAmount;
      const qty = item.qty || 1;
      const labor = item.labor || 0;
      const calculatedRate = qty > 0 ? Math.max(0, (baseAmount - labor) / qty) : 0;
      
      updatedItems[index] = { ...item, rate: parseFloat(calculatedRate.toFixed(2)) };
      const calculatedAmounts = calculateEditItemAmounts(updatedItems[index]);
      updatedItems[index] = { ...updatedItems[index], ...calculatedAmounts };
    }
    setEditBillItems(updatedItems);
  };

  const addEditBillItem = () => {
    setEditBillItems([...editBillItems, {
      sl_no: editBillItems.length + 1,
      description: '',
      hsn_sac: '',
      qty: 1,
      unit: 'Nos',
      rate: 0,
      labor: 0,
      disc_percent: 0,
      gst_percent: 18,
      cgst_amount: 0,
      sgst_amount: 0,
      total_tax: 0,
      amount: 0
    }]);
  };

  const removeEditBillItem = (index) => {
    if (editBillItems.length > 1) {
      const updatedItems = editBillItems.filter((_, i) => i !== index)
        .map((item, idx) => ({ ...item, sl_no: idx + 1 }));
      setEditBillItems(updatedItems);
    }
  };

  const calculateEditTotals = () => {
    const subtotal = editBillItems.reduce((sum, item) => sum + ((item.qty * item.rate) + item.labor - ((item.qty * item.rate + item.labor) * item.disc_percent / 100)), 0);
    const totalCgst = editBillItems.reduce((sum, item) => sum + item.cgst_amount, 0);
    const totalSgst = editBillItems.reduce((sum, item) => sum + item.sgst_amount, 0);
    const totalTax = totalCgst + totalSgst;
    const grandTotal = editBillItems.reduce((sum, item) => sum + item.amount, 0);
    return { subtotal, totalCgst, totalSgst, totalTax, grandTotal };
  };

  const handleSaveEditBill = async () => {
    if (!editingBill) return;
    
    setEditLoading(true);
    try {
      const token = localStorage.getItem('token');
      const editTotals = calculateEditTotals();
      
      const updateData = {
        bill_number: editingBill.bill_number,
        customer_name: editingBill.customer_name,
        vehicle_reg_no: editingBill.vehicle_reg_no,
        status: editingBill.status,
        amount: editTotals.grandTotal,
        items: editBillItems.map(item => ({
          description: item.description,
          hsn_sac: item.hsn_sac,
          qty: item.qty,
          unit: item.unit,
          rate: item.rate,
          labor: item.labor,
          disc_percent: item.disc_percent,
          gst_percent: item.gst_percent,
          cgst_amount: item.cgst_amount,
          sgst_amount: item.sgst_amount,
          total_tax: item.total_tax,
          amount: item.amount
        }))
      };

      await axios.put(`${API}/service-bills/${editingBill.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      const updatedBills = serviceBills.map(bill => 
        bill.id === editingBill.id 
          ? { ...bill, ...updateData, job_card_number: updateData.bill_number }
          : bill
      );
      setServiceBills(updatedBills);
      
      toast.success('Service bill updated successfully!');
      setShowEditModal(false);
      setEditingBill(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update service bill');
    } finally {
      setEditLoading(false);
    }
  };

  const handlePrintBill = (bill) => {
    // Check if bill has itemized data
    const hasItems = bill.items && bill.items.length > 0;
    
    // Generate items rows for the table
    const itemsRows = hasItems ? bill.items.map((item, index) => `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td>${item.description || item.name || 'Service Item'}</td>
        <td style="text-align: center;">${item.hsn_sac || '-'}</td>
        <td style="text-align: center;">${item.qty || 1} ${item.unit || 'Nos'}</td>
        <td style="text-align: right;">₹${(item.rate || 0).toFixed(2)}</td>
        <td style="text-align: right;">₹${(item.cgst_amount || 0).toFixed(2)}</td>
        <td style="text-align: right;">₹${(item.sgst_amount || 0).toFixed(2)}</td>
        <td style="text-align: right; font-weight: bold;">₹${(item.amount || 0).toFixed(2)}</td>
      </tr>
    `).join('') : `
      <tr>
        <td style="text-align: center;">1</td>
        <td>${bill.description || 'Service Charge'}</td>
        <td style="text-align: center;">9987</td>
        <td style="text-align: center;">1 Nos</td>
        <td style="text-align: right;">₹${((bill.amount || 0) / 1.18).toFixed(2)}</td>
        <td style="text-align: right;">₹${((bill.amount || 0) * 0.09 / 1.18).toFixed(2)}</td>
        <td style="text-align: right;">₹${((bill.amount || 0) * 0.09 / 1.18).toFixed(2)}</td>
        <td style="text-align: right; font-weight: bold;">₹${(bill.amount || 0).toFixed(2)}</td>
      </tr>
    `;
    
    // Calculate totals
    const subtotal = hasItems 
      ? bill.items.reduce((sum, item) => sum + ((item.rate || 0) * (item.qty || 1)), 0)
      : (bill.amount || 0) / 1.18;
    const totalCgst = hasItems 
      ? bill.items.reduce((sum, item) => sum + (item.cgst_amount || 0), 0)
      : (bill.amount || 0) * 0.09 / 1.18;
    const totalSgst = hasItems 
      ? bill.items.reduce((sum, item) => sum + (item.sgst_amount || 0), 0)
      : (bill.amount || 0) * 0.09 / 1.18;
    const grandTotal = bill.total_amount || bill.amount || 0;
    
    // Number to words function
    const numberToWordsLocal = (num) => {
      const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
        'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
      const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      
      if (num === 0) return 'Zero';
      
      const convertLessThanThousand = (n) => {
        if (n === 0) return '';
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
        return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
      };
      
      const rupees = Math.floor(num);
      let result = '';
      let n = rupees;
      
      if (n >= 10000000) {
        result += convertLessThanThousand(Math.floor(n / 10000000)) + ' Crore ';
        n %= 10000000;
      }
      if (n >= 100000) {
        result += convertLessThanThousand(Math.floor(n / 100000)) + ' Lakh ';
        n %= 100000;
      }
      if (n >= 1000) {
        result += convertLessThanThousand(Math.floor(n / 1000)) + ' Thousand ';
        n %= 1000;
      }
      if (n > 0) {
        result += convertLessThanThousand(n);
      }
      
      return result.trim() || 'Zero';
    };
    
    // Create professional itemized service bill for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Service Bill - ${bill.bill_number || bill.job_card_number || 'N/A'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Arial', sans-serif; 
              line-height: 1.4; 
              color: #333;
              background: white;
              font-size: 12px;
            }
            .bill-container { 
              max-width: 210mm; 
              margin: 0 auto; 
              padding: 10mm;
              background: white;
            }
            
            /* Header Styles */
            .bill-header { 
              text-align: center; 
              border-bottom: 2px solid #1e40af;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .company-name { 
              font-size: 24px; 
              font-weight: bold; 
              color: #1e40af;
              margin-bottom: 2px;
            }
            .company-tagline { 
              font-size: 12px; 
              color: #6b7280;
              margin-bottom: 5px;
            }
            .company-address { 
              font-size: 11px; 
              color: #4b5563;
            }
            .gstin { 
              font-size: 11px; 
              color: #1e40af;
              font-weight: bold;
              margin-top: 5px;
            }
            
            /* Bill Title */
            .bill-title { 
              text-align: center;
              background: #1e40af;
              color: white;
              padding: 8px;
              font-size: 16px;
              font-weight: bold;
              margin: 10px 0;
            }
            
            /* Bill Info Grid */
            .bill-info { 
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 15px;
              padding: 10px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
            }
            .info-section h4 { 
              color: #1e40af;
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 5px;
              border-bottom: 1px solid #3b82f6;
              padding-bottom: 3px;
            }
            .info-row { 
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
              font-size: 11px;
            }
            .info-label { font-weight: 600; color: #374151; }
            .info-value { color: #111827; }
            
            /* Items Table */
            .items-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 10px 0;
              font-size: 11px;
            }
            .items-table th { 
              background: #1e40af;
              color: white;
              font-weight: bold;
              padding: 8px 5px;
              text-align: left;
              border: 1px solid #1e40af;
            }
            .items-table td { 
              padding: 6px 5px;
              border: 1px solid #d1d5db;
            }
            .items-table tr:nth-child(even) { background: #f8fafc; }
            
            /* Summary Section */
            .summary-section {
              display: flex;
              justify-content: flex-end;
              margin-top: 15px;
            }
            .summary-table {
              width: 300px;
              border-collapse: collapse;
            }
            .summary-table td {
              padding: 6px 10px;
              border: 1px solid #d1d5db;
              font-size: 11px;
            }
            .summary-table .label { background: #f8fafc; font-weight: 600; }
            .summary-table .total-row { background: #1e40af; color: white; font-weight: bold; font-size: 14px; }
            
            /* Amount in Words */
            .amount-words {
              background: #dbeafe;
              padding: 8px 12px;
              margin: 15px 0;
              border-left: 4px solid #1e40af;
              font-size: 11px;
            }
            
            /* Terms */
            .terms {
              margin-top: 20px;
              padding-top: 10px;
              border-top: 1px solid #e5e7eb;
              font-size: 10px;
              color: #6b7280;
            }
            .terms h4 { font-size: 11px; color: #374151; margin-bottom: 5px; }
            .terms ol { margin-left: 15px; }
            
            /* Signatures */
            .signatures {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 50px;
              margin-top: 40px;
              padding-top: 20px;
            }
            .signature-box {
              text-align: center;
              padding-top: 30px;
              border-top: 1px solid #374151;
              font-size: 11px;
            }
            
            /* Footer */
            .bill-footer { 
              margin-top: 20px;
              text-align: center;
              color: #6b7280;
              font-size: 11px;
              border-top: 1px solid #e5e7eb;
              padding-top: 10px;
            }
            
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .bill-container { padding: 5mm; }
            }
          </style>
        </head>
        <body>
          <div class="bill-container">
            <!-- Header -->
            <div class="bill-header">
              <div class="company-name">M M MOTORS</div>
              <div class="company-tagline">Two Wheeler Service Excellence</div>
              <div class="company-address">
                Bengaluru main road, behind Ruchi Bakery, Malur, Karnataka 563130<br>
                Phone: 7026263123 | Email: mmmotors3123@gmail.com
              </div>
              <div class="gstin">GSTIN: 29CUJPM6814P1ZQ</div>
            </div>
            
            <!-- Bill Title -->
            <div class="bill-title">TAX INVOICE / SERVICE BILL</div>
            
            <!-- Bill Information -->
            <div class="bill-info">
              <div class="info-section">
                <h4>Bill Information</h4>
                <div class="info-row">
                  <span class="info-label">Bill Number:</span>
                  <span class="info-value">${bill.bill_number || bill.job_card_number || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Bill Date:</span>
                  <span class="info-value">${bill.created_at || bill.bill_date ? new Date(bill.created_at || bill.bill_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Payment Status:</span>
                  <span class="info-value">${bill.status === 'paid' || bill.status === 'completed' ? 'PAID' : 'UNPAID'}</span>
                </div>
              </div>
              
              <div class="info-section">
                <h4>Customer Details</h4>
                <div class="info-row">
                  <span class="info-label">Name:</span>
                  <span class="info-value">${bill.customer_name || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Mobile:</span>
                  <span class="info-value">${bill.customer_mobile || bill.customer_phone || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Vehicle:</span>
                  <span class="info-value">${bill.vehicle_reg_no || bill.vehicle_number || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <!-- Items Table -->
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 5%; text-align: center;">Sl</th>
                  <th style="width: 35%;">Description of Goods/Services</th>
                  <th style="width: 10%; text-align: center;">HSN/SAC</th>
                  <th style="width: 10%; text-align: center;">Qty</th>
                  <th style="width: 10%; text-align: right;">Rate</th>
                  <th style="width: 10%; text-align: right;">CGST</th>
                  <th style="width: 10%; text-align: right;">SGST</th>
                  <th style="width: 10%; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>
            
            <!-- Summary -->
            <div class="summary-section">
              <table class="summary-table">
                <tr>
                  <td class="label">Subtotal:</td>
                  <td style="text-align: right;">₹${subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td class="label">CGST:</td>
                  <td style="text-align: right;">₹${totalCgst.toFixed(2)}</td>
                </tr>
                <tr>
                  <td class="label">SGST:</td>
                  <td style="text-align: right;">₹${totalSgst.toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                  <td>Grand Total:</td>
                  <td style="text-align: right;">₹${grandTotal.toFixed(2)}</td>
                </tr>
              </table>
            </div>
            
            <!-- Amount in Words -->
            <div class="amount-words">
              <strong>Amount in Words:</strong> ${numberToWordsLocal(grandTotal)} Rupees Only
            </div>
            
            <!-- Terms -->
            <div class="terms">
              <h4>Terms & Conditions:</h4>
              <ol>
                <li>Warranty as per manufacturer terms only</li>
                <li>Payment due on delivery</li>
                <li>Goods once sold will not be taken back</li>
              </ol>
            </div>
            
            <!-- Signatures -->
            <div class="signatures">
              <div class="signature-box">Customer Signature</div>
              <div class="signature-box">For M M MOTORS<br>Authorized Signatory</div>
            </div>
            
            <!-- Footer -->
            <div class="bill-footer">
              <p><strong>Thank you for your business!</strong></p>
              <p>This is a computer generated invoice.</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadBill = (bill) => {
    // Check if bill has itemized data
    const hasItems = bill.items && bill.items.length > 0;
    
    // Calculate totals
    const subtotal = hasItems 
      ? bill.items.reduce((sum, item) => sum + ((item.rate || 0) * (item.qty || 1)), 0)
      : (bill.amount || 0) / 1.18;
    const totalCgst = hasItems 
      ? bill.items.reduce((sum, item) => sum + (item.cgst_amount || 0), 0)
      : (bill.amount || 0) * 0.09 / 1.18;
    const totalSgst = hasItems 
      ? bill.items.reduce((sum, item) => sum + (item.sgst_amount || 0), 0)
      : (bill.amount || 0) * 0.09 / 1.18;
    const grandTotal = bill.total_amount || bill.amount || 0;

    // Generate items rows for the table
    let itemsHtml = '';
    if (hasItems) {
      bill.items.forEach((item, index) => {
        itemsHtml += `
          <tr>
            <td style="text-align: center;">${index + 1}</td>
            <td>${item.description || item.name || 'Service Item'}</td>
            <td style="text-align: center;">${item.hsn_sac || '-'}</td>
            <td style="text-align: center;">${item.qty || 1} ${item.unit || 'Nos'}</td>
            <td style="text-align: right;">₹${(item.rate || 0).toFixed(2)}</td>
            <td style="text-align: right;">₹${(item.cgst_amount || 0).toFixed(2)}</td>
            <td style="text-align: right;">₹${(item.sgst_amount || 0).toFixed(2)}</td>
            <td style="text-align: right;">₹${(item.amount || 0).toFixed(2)}</td>
          </tr>
        `;
      });
    } else {
      itemsHtml = `
        <tr>
          <td style="text-align: center;">1</td>
          <td>${bill.description || 'Service Charge'}</td>
          <td style="text-align: center;">9987</td>
          <td style="text-align: center;">1 Nos</td>
          <td style="text-align: right;">₹${((bill.amount || 0) / 1.18).toFixed(2)}</td>
          <td style="text-align: right;">₹${((bill.amount || 0) * 0.09 / 1.18).toFixed(2)}</td>
          <td style="text-align: right;">₹${((bill.amount || 0) * 0.09 / 1.18).toFixed(2)}</td>
          <td style="text-align: right;">₹${(bill.amount || 0).toFixed(2)}</td>
        </tr>
      `;
    }

    // Generate PDF-like HTML content
    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Service Bill - ${bill.bill_number || bill.job_card_number || 'N/A'}</title>
        <style>
          @page { size: A4; margin: 10mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 12px; 
            line-height: 1.4; 
            color: #333;
            padding: 20px;
          }
          .bill-container { 
            max-width: 800px; 
            margin: 0 auto; 
            border: 2px solid #333; 
            padding: 20px;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #333; 
            padding-bottom: 15px; 
            margin-bottom: 15px; 
          }
          .company-name { 
            font-size: 24px; 
            font-weight: bold; 
            color: #1a365d; 
            margin-bottom: 5px; 
          }
          .company-address { 
            font-size: 11px; 
            color: #666; 
            margin-bottom: 3px; 
          }
          .gstin { 
            font-weight: bold; 
            color: #333; 
            margin-top: 5px; 
          }
          .bill-title { 
            font-size: 16px; 
            font-weight: bold; 
            text-align: center; 
            background: #1a365d; 
            color: white; 
            padding: 8px; 
            margin: 15px 0; 
          }
          .info-section { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 15px; 
            gap: 20px;
          }
          .info-box { 
            flex: 1; 
            border: 1px solid #ddd; 
            padding: 10px; 
            background: #f9f9f9; 
          }
          .info-box h4 { 
            font-size: 12px; 
            color: #1a365d; 
            border-bottom: 1px solid #ddd; 
            padding-bottom: 5px; 
            margin-bottom: 8px; 
          }
          .info-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 4px; 
          }
          .info-label { 
            color: #666; 
            font-size: 11px; 
          }
          .info-value { 
            font-weight: bold; 
            font-size: 11px; 
          }
          .items-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 15px 0; 
          }
          .items-table th { 
            background: #1a365d; 
            color: white; 
            padding: 8px 5px; 
            font-size: 10px; 
            text-align: center; 
            border: 1px solid #333; 
          }
          .items-table td { 
            padding: 6px 5px; 
            border: 1px solid #ddd; 
            font-size: 10px; 
          }
          .items-table tr:nth-child(even) { 
            background: #f9f9f9; 
          }
          .totals-section { 
            display: flex; 
            justify-content: flex-end; 
            margin-top: 15px; 
          }
          .totals-box { 
            width: 250px; 
            border: 1px solid #333; 
          }
          .totals-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 5px 10px; 
            border-bottom: 1px solid #ddd; 
          }
          .totals-row.grand-total { 
            background: #1a365d; 
            color: white; 
            font-weight: bold; 
            font-size: 14px; 
          }
          .footer { 
            text-align: center; 
            margin-top: 20px; 
            padding-top: 15px; 
            border-top: 1px solid #ddd; 
            color: #666; 
            font-size: 11px; 
          }
          .status-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 10px;
          }
          .status-paid { background: #c6f6d5; color: #22543d; }
          .status-unpaid { background: #fed7d7; color: #822727; }
          @media print {
            body { padding: 0; }
            .bill-container { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="bill-container">
          <div class="header">
            <div class="company-name">M M MOTORS</div>
            <div class="company-address">Bengaluru main road, behind Ruchi Bakery</div>
            <div class="company-address">Malur, Karnataka 563130</div>
            <div class="company-address">Phone: 7026263123 | Email: mmmotors3123@gmail.com</div>
            <div class="gstin">GSTIN: 29CUJPM6814P1ZQ</div>
          </div>

          <div class="bill-title">SERVICE BILL / TAX INVOICE</div>

          <div class="info-section">
            <div class="info-box">
              <h4>Bill Information</h4>
              <div class="info-row">
                <span class="info-label">Bill Number:</span>
                <span class="info-value">${bill.bill_number || bill.job_card_number || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Bill Date:</span>
                <span class="info-value">${bill.created_at || bill.bill_date ? new Date(bill.created_at || bill.bill_date).toLocaleDateString('en-IN') : 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Payment Status:</span>
                <span class="status-badge ${bill.status === 'paid' || bill.status === 'completed' ? 'status-paid' : 'status-unpaid'}">
                  ${bill.status === 'paid' || bill.status === 'completed' ? 'PAID' : 'UNPAID'}
                </span>
              </div>
            </div>
            <div class="info-box">
              <h4>Customer Details</h4>
              <div class="info-row">
                <span class="info-label">Name:</span>
                <span class="info-value">${bill.customer_name || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Mobile:</span>
                <span class="info-value">${bill.customer_mobile || bill.customer_phone || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Vehicle:</span>
                <span class="info-value">${bill.vehicle_reg_no || bill.vehicle_number || 'N/A'}</span>
              </div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 5%;">Sl</th>
                <th style="width: 35%;">Description</th>
                <th style="width: 10%;">HSN/SAC</th>
                <th style="width: 10%;">Qty</th>
                <th style="width: 10%;">Rate</th>
                <th style="width: 10%;">CGST</th>
                <th style="width: 10%;">SGST</th>
                <th style="width: 10%;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals-section">
            <div class="totals-box">
              <div class="totals-row">
                <span>Subtotal:</span>
                <span>₹${subtotal.toFixed(2)}</span>
              </div>
              <div class="totals-row">
                <span>CGST (9%):</span>
                <span>₹${totalCgst.toFixed(2)}</span>
              </div>
              <div class="totals-row">
                <span>SGST (9%):</span>
                <span>₹${totalSgst.toFixed(2)}</span>
              </div>
              <div class="totals-row grand-total">
                <span>GRAND TOTAL:</span>
                <span>₹${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <p><strong>Thank you for your business!</strong></p>
            <p>This is a computer-generated invoice.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Create a new window for printing/saving as PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    
    // Wait for content to load then trigger print (which allows saving as PDF)
    printWindow.onload = () => {
      printWindow.print();
    };
    
    toast.success('PDF ready! Use "Save as PDF" in the print dialog to download.');
  };

  // Toggle payment status (paid/unpaid)
  const handleTogglePaymentStatus = async (bill) => {
    const newStatus = (bill.status === 'paid' || bill.status === 'completed') ? 'unpaid' : 'paid';
    const ok = await confirm({
      title: `Mark bill as ${newStatus.toUpperCase()}?`,
      description: `Bill: ${bill.bill_number || bill.job_card_number}`,
      confirmLabel: `Mark as ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
      variant: 'warning',
    });
    if (!ok) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/service-bills/${bill.id}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state immediately for instant UI feedback
      setServiceBills(prevBills => 
        prevBills.map(b => 
          b.id === bill.id ? { ...b, status: newStatus } : b
        )
      );
      
      toast.success(`Bill marked as ${newStatus.toUpperCase()}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update payment status');
    }
  };

  // Number to words converter for Indian currency
  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    
    const convertLessThanThousand = (n) => {
      if (n === 0) return '';
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
    };
    
    const convertToWords = (n) => {
      if (n === 0) return '';
      
      // Indian numbering system: Crore, Lakh, Thousand, Hundred
      let result = '';
      
      if (n >= 10000000) {
        result += convertLessThanThousand(Math.floor(n / 10000000)) + ' Crore ';
        n %= 10000000;
      }
      if (n >= 100000) {
        result += convertLessThanThousand(Math.floor(n / 100000)) + ' Lakh ';
        n %= 100000;
      }
      if (n >= 1000) {
        result += convertLessThanThousand(Math.floor(n / 1000)) + ' Thousand ';
        n %= 1000;
      }
      if (n > 0) {
        result += convertLessThanThousand(n);
      }
      
      return result.trim();
    };
    
    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);
    
    let result = convertToWords(rupees);
    if (paise > 0) {
      result += ' and ' + convertToWords(paise) + ' Paise';
    }
    
    return result || 'Zero';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Service Bills</h2>
          <p className="text-gray-600">View all service bills and invoices</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search bills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Bills Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-gray-500">Bill #</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-500">Customer</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-500">Vehicle</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-500">Service Type</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-500">Amount</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-500">Payment</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-500">Date</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="p-6 text-center text-gray-500">
                      Loading service bills...
                    </td>
                  </tr>
                ) : serviceBills.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-6 text-center text-gray-500">
                      No service bills found
                    </td>
                  </tr>
                ) : (
                  serviceBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-gray-50">
                      <td className="p-3 text-sm font-medium text-blue-600">
                        {bill.job_card_number || 'N/A'}
                      </td>
                      <td className="p-3 text-sm text-gray-900">
                        {bill.customer_name || 'N/A'}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {bill.vehicle_reg_no || bill.vehicle_number || 'N/A'}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {bill.service_type ? bill.service_type.replace('_', ' ').toUpperCase() : 'N/A'}
                        </span>
                      </td>
                      <td className="p-3 text-sm font-medium text-green-600">
                        ₹{bill.amount?.toLocaleString() || '0'}
                      </td>
                      <td className="p-3 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          bill.status === 'paid' || bill.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {bill.status === 'paid' || bill.status === 'completed' ? 'PAID' : 'UNPAID'}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {bill.created_at ? new Date(bill.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleTogglePaymentStatus(bill)}
                            className={bill.status === 'paid' || bill.status === 'completed' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                            title={bill.status === 'paid' || bill.status === 'completed' ? 'Mark as Unpaid' : 'Mark as Paid'}
                          >
                            {bill.status === 'paid' || bill.status === 'completed' ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const phone = bill.customer_phone || bill.customer_mobile;
                              if (!phone || phone === 'N/A') {
                                toast.error('Customer phone number not available');
                                return;
                              }
                              sendServiceBill(bill.customer_name, phone, bill.job_card_number || bill.bill_number, bill.vehicle_reg_no || bill.vehicle_number, bill.amount || bill.total_amount, bill.items);
                            }}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Send Bill via WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewBill(bill)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditBill(bill)}
                            className="text-blue-600 hover:text-blue-700"
                            data-testid={`edit-bill-${bill.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handlePrintBill(bill)}
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDownloadBill(bill)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          {onDeleteBill && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => onDeleteBill(bill)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {serviceBills.length > 0 && (
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>Showing {serviceBills.length} service bills</span>
          <span>Total Revenue: ₹{serviceBills.reduce((sum, bill) => sum + (bill.amount || 0), 0).toLocaleString()}</span>
        </div>
      )}

      {/* View Service Bill Modal */}
      {showViewModal && selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Service Bill Details</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </Button>
              </div>

              <div className="space-y-6">
                {/* Header */}
                <div className="text-center border-b pb-4">
                  <h3 className="text-xl font-bold">M M MOTORS</h3>
                  <p className="text-gray-600">Service Department</p>
                  <p className="text-gray-600">Bengaluru main road, behind Ruchi Bakery</p>
                  <p className="text-gray-600">Malur, Karnataka 563130</p>
                  <p className="text-gray-600 mt-2">GSTIN: 29CUJPM6814P1ZQ</p>
                </div>

                {/* Bill Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-blue-600 border-b pb-1">Bill Information</h4>
                    <p><strong>Bill Number:</strong> {selectedBill.job_card_number || 'N/A'}</p>
                    <p><strong>Bill Date:</strong> {selectedBill.created_at ? new Date(selectedBill.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</p>
                    <p><strong>Payment Status:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        selectedBill.status === 'paid' || selectedBill.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedBill.status === 'paid' || selectedBill.status === 'completed' ? 'PAID' : 'UNPAID'}
                      </span>
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-blue-600 border-b pb-1">Customer Details</h4>
                    <p><strong>Name:</strong> {selectedBill.customer_name || 'N/A'}</p>
                    <p><strong>Vehicle:</strong> {selectedBill.vehicle_reg_no || 'N/A'}</p>
                    <p><strong>Service Type:</strong> {selectedBill.service_type ? selectedBill.service_type.replace('_', ' ').toUpperCase() : 'N/A'}</p>
                  </div>
                </div>

                {/* Itemized Bill Table */}
                <div>
                  <h4 className="font-semibold text-blue-600 mb-3">Parts & Services Breakdown</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 text-left font-semibold">Sl</th>
                          <th className="p-2 text-left font-semibold">Description</th>
                          <th className="p-2 text-center font-semibold">HSN/SAC</th>
                          <th className="p-2 text-center font-semibold">Qty</th>
                          <th className="p-2 text-right font-semibold">Rate</th>
                          <th className="p-2 text-right font-semibold">CGST</th>
                          <th className="p-2 text-right font-semibold">SGST</th>
                          <th className="p-2 text-right font-semibold">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBill.items && selectedBill.items.length > 0 ? (
                          selectedBill.items.map((item, index) => (
                            <tr key={index} className="border-t hover:bg-gray-50">
                              <td className="p-2 text-center">{index + 1}</td>
                              <td className="p-2">{item.description || item.name || 'Service Item'}</td>
                              <td className="p-2 text-center">{item.hsn_sac || '-'}</td>
                              <td className="p-2 text-center">{item.qty || 1} {item.unit || 'Nos'}</td>
                              <td className="p-2 text-right">₹{(item.rate || 0).toLocaleString()}</td>
                              <td className="p-2 text-right">₹{(item.cgst_amount || 0).toFixed(2)}</td>
                              <td className="p-2 text-right">₹{(item.sgst_amount || 0).toFixed(2)}</td>
                              <td className="p-2 text-right font-medium">₹{(item.amount || 0).toLocaleString()}</td>
                            </tr>
                          ))
                        ) : (
                          <tr className="border-t">
                            <td className="p-2 text-center">1</td>
                            <td className="p-2">{selectedBill.description || 'Service Charge'}</td>
                            <td className="p-2 text-center">9987</td>
                            <td className="p-2 text-center">1 Nos</td>
                            <td className="p-2 text-right">₹{((selectedBill.amount || 0) / 1.18).toFixed(2)}</td>
                            <td className="p-2 text-right">₹{((selectedBill.amount || 0) * 0.09 / 1.18).toFixed(2)}</td>
                            <td className="p-2 text-right">₹{((selectedBill.amount || 0) * 0.09 / 1.18).toFixed(2)}</td>
                            <td className="p-2 text-right font-medium">₹{(selectedBill.amount || 0).toLocaleString()}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bill Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div></div>
                  <div className="space-y-2 border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">₹{selectedBill.items ? 
                        selectedBill.items.reduce((sum, item) => sum + ((item.rate || 0) * (item.qty || 1)), 0).toFixed(2) :
                        ((selectedBill.amount || 0) / 1.18).toFixed(2)
                      }</span>
                    </div>
                    <div className="flex justify-between py-1 border-b text-sm">
                      <span className="text-gray-600">CGST (9%):</span>
                      <span>₹{selectedBill.items ?
                        selectedBill.items.reduce((sum, item) => sum + (item.cgst_amount || 0), 0).toFixed(2) :
                        ((selectedBill.amount || 0) * 0.09 / 1.18).toFixed(2)
                      }</span>
                    </div>
                    <div className="flex justify-between py-1 border-b text-sm">
                      <span className="text-gray-600">SGST (9%):</span>
                      <span>₹{selectedBill.items ?
                        selectedBill.items.reduce((sum, item) => sum + (item.sgst_amount || 0), 0).toFixed(2) :
                        ((selectedBill.amount || 0) * 0.09 / 1.18).toFixed(2)
                      }</span>
                    </div>
                    <div className="flex justify-between py-2 text-lg font-bold text-green-600 border-t-2">
                      <span>Grand Total:</span>
                      <span>₹{(selectedBill.amount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Amount in Words */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm"><strong>Amount in Words:</strong> {numberToWords(selectedBill.amount || 0)} Rupees Only</p>
                </div>

                {/* Terms */}
                <div className="text-xs text-gray-500 space-y-1 border-t pt-4">
                  <p><strong>Terms & Conditions:</strong></p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Warranty as per manufacturer terms only</li>
                    <li>Payment due on delivery</li>
                    <li>Goods once sold will not be taken back</li>
                  </ol>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handlePrintBill(selectedBill)}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleDownloadBill(selectedBill)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Bill Modal */}
      {showEditModal && editingBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Edit Service Bill</h2>
                  <p className="text-gray-600">Modify bill details and line items</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingBill(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Bill Information */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <Label htmlFor="edit-bill-number">Bill Number</Label>
                  <Input
                    id="edit-bill-number"
                    value={editingBill.bill_number}
                    onChange={(e) => setEditingBill({...editingBill, bill_number: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-customer-name">Customer Name</Label>
                  <Input
                    id="edit-customer-name"
                    value={editingBill.customer_name}
                    onChange={(e) => setEditingBill({...editingBill, customer_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-vehicle-reg">Vehicle Reg No</Label>
                  <Input
                    id="edit-vehicle-reg"
                    value={editingBill.vehicle_reg_no}
                    onChange={(e) => setEditingBill({...editingBill, vehicle_reg_no: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-status">Payment Status</Label>
                  <Select value={editingBill.status} onValueChange={(value) => setEditingBill({...editingBill, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bill Items Table */}
              <div className="overflow-x-auto mb-4">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2 text-left">Sl.</th>
                      <th className="border border-gray-300 p-2 text-left">Description</th>
                      <th className="border border-gray-300 p-2 text-left">HSN/SAC</th>
                      <th className="border border-gray-300 p-2 text-left">Qty</th>
                      <th className="border border-gray-300 p-2 text-left">Unit</th>
                      <th className="border border-gray-300 p-2 text-left">Rate</th>
                      <th className="border border-gray-300 p-2 text-left">Labor</th>
                      <th className="border border-gray-300 p-2 text-left">Disc%</th>
                      <th className="border border-gray-300 p-2 text-left">GST%</th>
                      <th className="border border-gray-300 p-2 text-left">CGST</th>
                      <th className="border border-gray-300 p-2 text-left">SGST</th>
                      <th className="border border-gray-300 p-2 text-left">Amount</th>
                      <th className="border border-gray-300 p-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editBillItems.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-1 text-center">{item.sl_no}</td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            value={item.description}
                            onChange={(e) => updateEditBillItem(index, 'description', e.target.value)}
                            className="border-0 p-1 text-sm"
                            placeholder="Description"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            value={item.hsn_sac}
                            onChange={(e) => updateEditBillItem(index, 'hsn_sac', e.target.value)}
                            className="border-0 p-1 w-20 text-sm"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            type="number"
                            value={item.qty}
                            onChange={(e) => updateEditBillItem(index, 'qty', parseFloat(e.target.value) || 0)}
                            className="border-0 p-1 w-16 text-sm"
                            min="0"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Select value={item.unit} onValueChange={(value) => updateEditBillItem(index, 'unit', value)}>
                            <SelectTrigger className="border-0 p-1 h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {units.map((unit) => (
                                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            type="number"
                            value={item.rate}
                            onChange={(e) => updateEditBillItem(index, 'rate', parseFloat(e.target.value) || 0)}
                            className="border-0 p-1 w-20 text-sm"
                            min="0"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            type="number"
                            value={item.labor}
                            onChange={(e) => updateEditBillItem(index, 'labor', parseFloat(e.target.value) || 0)}
                            className="border-0 p-1 w-16 text-sm"
                            min="0"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            type="number"
                            value={item.disc_percent}
                            onChange={(e) => updateEditBillItem(index, 'disc_percent', parseFloat(e.target.value) || 0)}
                            className="border-0 p-1 w-14 text-sm"
                            min="0"
                            max="100"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Select value={item.gst_percent.toString()} onValueChange={(value) => updateEditBillItem(index, 'gst_percent', parseFloat(value))}>
                            <SelectTrigger className="border-0 p-1 h-8 w-16 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {gstRates.map((rate) => (
                                <SelectItem key={rate} value={rate.toString()}>{rate}%</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="border border-gray-300 p-1 text-right">₹{item.cgst_amount}</td>
                        <td className="border border-gray-300 p-1 text-right">₹{item.sgst_amount}</td>
                        <td className="border border-gray-300 p-1">
                          <div className="flex items-center">
                            <span className="mr-1">₹</span>
                            <Input
                              type="number"
                              value={item.amount}
                              onChange={(e) => updateEditBillItemAmount(index, e.target.value)}
                              className="border-0 p-1 w-20 text-right font-bold text-sm"
                              min="0"
                            />
                          </div>
                        </td>
                        <td className="border border-gray-300 p-1 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeEditBillItem(index)}
                            disabled={editBillItems.length === 1}
                            className="w-7 h-7 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Item Button */}
              <Button 
                variant="outline" 
                onClick={addEditBillItem}
                className="mb-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>

              {/* Bill Totals */}
              <div className="flex justify-end mb-6">
                <div className="w-80 space-y-2 border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">₹{calculateEditTotals().subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b text-sm">
                    <span className="text-gray-600">CGST:</span>
                    <span>₹{calculateEditTotals().totalCgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b text-sm">
                    <span className="text-gray-600">SGST:</span>
                    <span>₹{calculateEditTotals().totalSgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-lg font-bold text-green-600 border-t-2">
                    <span>Grand Total:</span>
                    <span>₹{calculateEditTotals().grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingBill(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveEditBill}
                  disabled={editLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {editLoading ? (
                    <>
                      <div className="spinner w-4 h-4 mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
      <ConfirmDialogComponent />
  );
};

const ServiceDue = () => {
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const [dueServices, setDueServices] = useState([]);
  const [dismissedKeys, setDismissedKeys] = useState(new Set());
  const [baseDateOverrides, setBaseDateOverrides] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredServices, setFilteredServices] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'overdue', 'due_soon'
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  
  // Edit base date state
  const [editingBaseDateId, setEditingBaseDateId] = useState(null);
  const [editBaseDateValue, setEditBaseDateValue] = useState('');

  useEffect(() => {
    fetchDueServices();
    fetchDismissedRecords();
    fetchBaseDateOverrides();
  }, []);

  useEffect(() => {
    filterServices();
  }, [dueServices, searchTerm, activeFilter, dismissedKeys, baseDateOverrides]);

  const fetchBaseDateOverrides = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/service-due-base-date`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const overridesMap = {};
      response.data.forEach(o => {
        overridesMap[o.service_due_key] = o.custom_base_date;
      });
      setBaseDateOverrides(overridesMap);
    } catch (error) {
      console.error('Failed to fetch base date overrides:', error);
    }
  };

  const fetchDismissedRecords = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/dismissed-service-due`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const keys = new Set(response.data.map(d => d.service_due_key));
      setDismissedKeys(keys);
    } catch (error) {
      console.error('Failed to fetch dismissed records:', error);
    }
  };

  const fetchDueServices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch all necessary data
      const [servicesResponse, salesResponse, customersResponse] = await Promise.all([
        axios.get(`${API}/services?limit=4000`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/sales?limit=4000`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/customers`, {
          params: {
            page: 1,
            limit: 10000,
            sort: 'created_at',
            order: 'desc'
          },
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      const services = extractData(servicesResponse);
      const sales = extractData(salesResponse);
      const customers = customersResponse.data.data || customersResponse.data;
      const today = new Date();
      
      // Create a map of vehicles with their purchase dates and latest service dates
      const vehicleServiceMap = {};
      
      // First, populate with purchase dates from sales
      sales.forEach(sale => {
        if (sale && sale.vehicle_id && sale.created_at) {
          vehicleServiceMap[sale.vehicle_id] = {
            purchase_date: new Date(sale.created_at),
            latest_service_date: null,
            customer_name: customers.find(c => c && c.id === sale.customer_id)?.name || 'Unknown',
            vehicle_details: sale.vehicle_id
          };
        }
      });
      
      // Then, update with latest service dates
      services.forEach(service => {
        if (service && service.customer_id && service.vehicle_number) {
          const customer = customers.find(c => c && c.id === service.customer_id);
          const customerName = customer?.name || service.customer_name || 'Unknown';
          
          // Skip services without valid dates
          const serviceDateStr = service.completion_date || service.service_date || service.created_at;
          if (!serviceDateStr) return;
          
          const serviceDate = new Date(serviceDateStr);
          
          // Skip if date is invalid
          if (isNaN(serviceDate.getTime())) return;
          
          // Create a unique key for each customer-vehicle combination
          const vehicleKey = `${service.customer_id}-${service.vehicle_number}`;
          
          if (!vehicleServiceMap[vehicleKey]) {
            vehicleServiceMap[vehicleKey] = {
              purchase_date: null,
              latest_service_date: serviceDate,
              customer_name: customerName,
              vehicle_details: service.vehicle_number,
              customer_id: service.customer_id
            };
          } else {
            // Update with the latest service date
            if (!vehicleServiceMap[vehicleKey].latest_service_date || 
                serviceDate > vehicleServiceMap[vehicleKey].latest_service_date) {
              vehicleServiceMap[vehicleKey].latest_service_date = serviceDate;
            }
            vehicleServiceMap[vehicleKey].customer_name = customerName;
            vehicleServiceMap[vehicleKey].customer_id = service.customer_id;
          }
        }
      });
      
      // Calculate due dates based on business rules
      const vehiclesWithDueDates = Object.keys(vehicleServiceMap).map(vehicleKey => {
        const vehicleData = vehicleServiceMap[vehicleKey];
        let baseDate, dueDate, serviceType;
        
        if (vehicleData.latest_service_date) {
          // Rule: 90 days from the date of last service
          baseDate = vehicleData.latest_service_date;
          dueDate = new Date(baseDate);
          dueDate.setDate(baseDate.getDate() + 90);
          serviceType = 'Regular Service (90 days from last service)';
        } else if (vehicleData.purchase_date) {
          // Rule: 30 days from the date of purchase
          baseDate = vehicleData.purchase_date;
          dueDate = new Date(baseDate);
          dueDate.setDate(baseDate.getDate() + 30);
          serviceType = 'First Service (30 days from purchase)';
        } else {
          // Skip vehicles without purchase or service dates
          return null;
        }
        
        const daysDifference = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        return {
          id: vehicleKey,
          customer_name: vehicleData.customer_name || 'Unknown',
          vehicle_reg_no: vehicleData.vehicle_details || 'N/A',
          last_service_date: vehicleData.latest_service_date,
          purchase_date: vehicleData.purchase_date,
          base_date: baseDate,
          due_date: dueDate,
          days_until_due: daysDifference,
          is_overdue: daysDifference < 0,
          is_due_soon: daysDifference >= 0 && daysDifference <= 7,
          service_type: serviceType,
          customer_id: vehicleData.customer_id
        };
      }).filter(vehicle => vehicle !== null);
      
      // Sort by priority: overdue first, then due soon, then by due date
      vehiclesWithDueDates.sort((a, b) => {
        if (a.is_overdue && !b.is_overdue) return -1;
        if (!a.is_overdue && b.is_overdue) return 1;
        if (a.is_due_soon && !b.is_due_soon) return -1;
        if (!a.is_due_soon && b.is_due_soon) return 1;
        return a.due_date - b.due_date;
      });

      setDueServices(vehiclesWithDueDates);
    } catch (error) {
      toast.error('Failed to fetch service due information');
    } finally {
      setLoading(false);
    }
  };

  // Apply base date overrides to due services when overrides are loaded
  useEffect(() => {
    if (Object.keys(baseDateOverrides).length > 0 && dueServices.length > 0) {
      const today = new Date();
      const updatedServices = dueServices.map(service => {
        if (baseDateOverrides[service.id]) {
          const newBaseDate = new Date(baseDateOverrides[service.id]);
          const dueDate = new Date(newBaseDate);
          // Apply the same logic: 90 days for regular service, 30 days for first service
          if (service.last_service_date) {
            dueDate.setDate(newBaseDate.getDate() + 90);
          } else {
            dueDate.setDate(newBaseDate.getDate() + 30);
          }
          const daysDifference = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
          
          return {
            ...service,
            base_date: newBaseDate,
            due_date: dueDate,
            days_until_due: daysDifference,
            is_overdue: daysDifference < 0,
            is_due_soon: daysDifference >= 0 && daysDifference <= 7
          };
        }
        return service;
      });
      
      // Only update if there are actual changes
      const hasChanges = updatedServices.some((s, i) => 
        s.base_date !== dueServices[i].base_date
      );
      
      if (hasChanges) {
        setDueServices(updatedServices);
      }
    }
  }, [baseDateOverrides]);

  const filterServices = () => {
    // First, filter out dismissed records
    let filtered = dueServices.filter(service => !dismissedKeys.has(service.id));

    // Apply status filter
    if (activeFilter === 'overdue') {
      filtered = filtered.filter(service => service.is_overdue);
    } else if (activeFilter === 'due_soon') {
      filtered = filtered.filter(service => service.is_due_soon && !service.is_overdue);
    }
    // 'all' shows everything, no additional filtering needed

    // Then apply search filter
    if (searchTerm) {
      filtered = filtered.filter(service => 
        service.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.vehicle_reg_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.service_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredServices(filtered);
  };

  const handleEditBaseDate = (service) => {
    setEditingBaseDateId(service.id);
    // Format date for input (YYYY-MM-DD)
    const currentDate = baseDateOverrides[service.id] 
      ? new Date(baseDateOverrides[service.id])
      : new Date(service.base_date);
    setEditBaseDateValue(currentDate.toISOString().split('T')[0]);
  };

  const handleSaveBaseDate = async (service) => {
    if (!editBaseDateValue) {
      toast.error('Please select a date');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      await axios.post(`${API}/service-due-base-date`, {
        service_due_key: service.id,
        custom_base_date: new Date(editBaseDateValue).toISOString(),
        notes: 'Manually updated'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state immediately
      const newBaseDate = new Date(editBaseDateValue);
      setBaseDateOverrides(prev => ({
        ...prev,
        [service.id]: newBaseDate.toISOString()
      }));
      
      // Recalculate the due services with the new base date
      setDueServices(prev => prev.map(s => {
        if (s.id === service.id) {
          const dueDate = new Date(newBaseDate);
          // Apply the same logic: 90 days for regular service, 30 days for first service
          if (s.last_service_date) {
            dueDate.setDate(newBaseDate.getDate() + 90);
          } else {
            dueDate.setDate(newBaseDate.getDate() + 30);
          }
          const today = new Date();
          const daysDifference = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
          
          return {
            ...s,
            base_date: newBaseDate,
            due_date: dueDate,
            days_until_due: daysDifference,
            is_overdue: daysDifference < 0,
            is_due_soon: daysDifference >= 0 && daysDifference <= 7
          };
        }
        return s;
      }));
      
      setEditingBaseDateId(null);
      setEditBaseDateValue('');
      toast.success('Base date updated successfully');
      
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update base date');
    }
  };

  const handleCancelEditBaseDate = () => {
    setEditingBaseDateId(null);
    setEditBaseDateValue('');
  };

  const handleFilterClick = (filterType) => {
    setActiveFilter(filterType);
    // Clear search when changing filters for better UX
    if (filterType !== 'all') {
      setSearchTerm('');
    }
  };

  const handleSendReminder = (service) => {
    // In a real application, this would send SMS/email reminder
    toast.success(`Reminder sent to ${service.customer_name} for ${service.vehicle_reg_no}`);
  };

  const handleDeleteServiceDue = async (service) => {
    const ok = await confirm({
      title: `Remove reminder for ${service.customer_name}?`,
      description: `Vehicle: ${service.vehicle_reg_no}`,
      confirmLabel: 'Remove Reminder',
    });
    if (!ok) return;

    try {
      const token = localStorage.getItem('token');
      
      // Dismiss the service due record
      await axios.post(`${API}/dismissed-service-due`, {
        service_due_key: service.id,
        customer_id: service.customer_id,
        customer_name: service.customer_name,
        vehicle_reg_no: service.vehicle_reg_no,
        reason: 'Manually dismissed'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state immediately
      setDismissedKeys(prev => new Set([...prev, service.id]));
      setSelectedIds(prev => prev.filter(id => id !== service.id));
      
      toast.success('Service due record removed from view');
      
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete service due record');
    }
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredServices.map(s => s.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectItem = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error('No items selected');
      return;
    }

    const ok = await confirm({
      title: `Remove ${selectedIds.length} service reminder(s)?`,
      description: 'This action cannot be undone.',
      confirmLabel: `Remove ${selectedIds.length} Reminder(s)`,
    });
    if (!ok) return;

    setBulkDeleting(true);
    try {
      const token = localStorage.getItem('token');
      
      // Get the selected services data
      const itemsToDelete = filteredServices
        .filter(s => selectedIds.includes(s.id))
        .map(s => ({
          service_due_key: s.id,
          customer_id: s.customer_id,
          customer_name: s.customer_name,
          vehicle_reg_no: s.vehicle_reg_no,
          reason: 'Bulk dismissed'
        }));
      
      await axios.post(`${API}/dismissed-service-due/bulk`, {
        items: itemsToDelete
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state immediately
      setDismissedKeys(prev => new Set([...prev, ...selectedIds]));
      setSelectedIds([]);
      setSelectAll(false);
      
      toast.success(`Successfully removed ${itemsToDelete.length} service due record(s)`);
      
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete service due records');
    } finally {
      setBulkDeleting(false);
    }
  };

  const getDueDateColor = (service) => {
    if (service.is_overdue) return 'text-red-600 bg-red-50';
    if (service.is_due_soon) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getDueDateText = (service) => {
    if (service.is_overdue) {
      return `Overdue by ${Math.abs(service.days_until_due)} days`;
    }
    if (service.is_due_soon) {
      return `Due in ${service.days_until_due} days`;
    }
    return `Due in ${service.days_until_due} days`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Service Due Reminders</h2>
          <p className="text-gray-600">Track service due dates: 30 days from purchase, 90 days from last service</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button onClick={fetchDueServices}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
            activeFilter === 'overdue' ? 'ring-2 ring-red-500 bg-red-50' : 'hover:bg-red-50'
          }`}
          onClick={() => handleFilterClick('overdue')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue Services</p>
                <p className="text-2xl font-bold text-red-600">
                  {dueServices.filter(s => s.is_overdue && !dismissedKeys.has(s.id)).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {activeFilter === 'overdue' ? 'Currently filtered' : 'Click to filter'}
                </p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
            activeFilter === 'due_soon' ? 'ring-2 ring-yellow-500 bg-yellow-50' : 'hover:bg-yellow-50'
          }`}
          onClick={() => handleFilterClick('due_soon')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Due This Week</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {dueServices.filter(s => s.is_due_soon && !s.is_overdue && !dismissedKeys.has(s.id)).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {activeFilter === 'due_soon' ? 'Currently filtered' : 'Click to filter'}
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
            activeFilter === 'all' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-blue-50'
          }`}
          onClick={() => handleFilterClick('all')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tracked</p>
                <p className="text-2xl font-bold text-blue-600">
                  {dueServices.filter(s => !dismissedKeys.has(s.id)).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {activeFilter === 'all' ? 'Showing all' : 'Click to show all'}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Due Services Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle>Service Due Schedule</CardTitle>
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{selectedIds.length} selected</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleBulkDelete}
                    disabled={bulkDeleting}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    {bulkDeleting ? 'Deleting...' : 'Delete Selected'}
                  </Button>
                </div>
              )}
            </div>
            {activeFilter !== 'all' && (
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  activeFilter === 'overdue' ? 'bg-red-100 text-red-800' :
                  activeFilter === 'due_soon' ? 'bg-yellow-100 text-yellow-800' : ''
                }`}>
                  {activeFilter === 'overdue' ? 'Showing Overdue Only' : 
                   activeFilter === 'due_soon' ? 'Showing Due This Week Only' : ''}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleFilterClick('all')}
                >
                  Clear Filter
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-gray-500 w-10">
                    <input
                      type="checkbox"
                      checked={selectAll && filteredServices.length > 0}
                      onChange={handleSelectAll}
                      disabled={filteredServices.length === 0}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-gray-500">Customer</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-500">Vehicle</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-500">Base Date</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-500">Service Type</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-500">Due Date</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="p-0">
                      <TableSkeleton rows={5} columns={8} />
                    </td>
                  </tr>
                ) : filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-6 text-center text-gray-500">
                      <EmptyState 
                        title="No services due"
                        description="All vehicles are up to date with their service schedules"
                      />
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((service) => (
                    <tr key={service.id} className={`hover:bg-gray-50 ${selectedIds.includes(service.id) ? 'bg-blue-50' : ''}`}>
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(service.id)}
                          onChange={() => handleSelectItem(service.id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-3 text-sm font-medium text-gray-900">
                        {service.customer_name || 'N/A'}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {service.vehicle_reg_no || 'N/A'}
                      </td>
                      <td className="p-3 text-sm">
                        {editingBaseDateId === service.id ? (
                          <div className="flex flex-col gap-1">
                            <Input
                              type="date"
                              value={editBaseDateValue}
                              onChange={(e) => setEditBaseDateValue(e.target.value)}
                              className="w-36 text-sm"
                            />
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleSaveBaseDate(service)}
                                className="text-green-600 hover:bg-green-50 px-2 py-1 h-7"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={handleCancelEditBaseDate}
                                className="text-red-600 hover:bg-red-50 px-2 py-1 h-7"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-gray-100 rounded p-1 -m-1 group"
                            onClick={() => handleEditBaseDate(service)}
                            title="Click to edit base date"
                          >
                            <div className="flex items-center gap-1">
                              <span className={baseDateOverrides[service.id] ? 'text-purple-600 font-medium' : ''}>
                                {service.base_date ? 
                                  new Date(service.base_date).toLocaleDateString('en-IN') : 
                                  'N/A'
                                }
                              </span>
                              <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <span className="text-xs text-gray-400">
                              {baseDateOverrides[service.id] ? (
                                <span className="text-purple-500">Custom Date</span>
                              ) : (
                                service.last_service_date ? 'Last Service' : 'Purchase Date'
                              )}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {service.last_service_date ? 'Regular Service' : 'First Service'}
                        </span>
                        <br />
                        <span className="text-xs text-gray-500">
                          {service.last_service_date ? '90 days cycle' : '30 days from purchase'}
                        </span>
                      </td>
                      <td className="p-3 text-sm font-medium">
                        {service.due_date ? service.due_date.toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-3 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDueDateColor(service)}`}>
                          {getDueDateText(service)}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleSendReminder(service)}
                          >
                            Send Reminder
                          </Button>
                          <Button size="sm" variant="outline">
                            <Calendar className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteServiceDue(service)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
      <ConfirmDialogComponent />
  );
};

export default Services;
