import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import Pagination from './Pagination';
import SortDropdown from './SortDropdown';
import ConfirmDialog from './ConfirmDialog';
import { 
  Plus, 
  Search, 
  Filter,
  Package,
  TrendingUp,
  Eye,
  ArrowLeft,
  Edit,
  Save,
  X,
  Trash2
} from 'lucide-react';

// Custom Motorcycle Icon Component
import { toast } from 'sonner';
import MotorcycleIcon from './ui/MotorcycleIcon';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VehicleStock = () => {
  const location = useLocation();
  const [selectedBrand, setSelectedBrand] = useState('all');
  
  const navigationItems = [
    { name: 'Overview', path: '/vehicles', icon: TrendingUp },
    { name: 'Add Vehicle', path: '/vehicles/add', icon: Plus },
    { name: 'Stock View', path: '/vehicles/stock', icon: Package }
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
        <Route path="/" element={<BrandOverview />} />
        <Route path="/add" element={<AddVehicle />} />
        <Route path="/stock" element={<StockView />} />
        <Route path="/brand/:brand" element={<BrandDetails />} />
      </Routes>
    </div>
  );
};

const BrandOverview = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const brands = [
    { name: 'TVS', color: 'from-red-500 to-red-600' },
    { name: 'BAJAJ', color: 'from-blue-500 to-blue-600' },
    { name: 'HERO', color: 'from-green-500 to-green-600' },
    { name: 'HONDA', color: 'from-yellow-500 to-yellow-600' },
    { name: 'TRIUMPH', color: 'from-purple-500 to-purple-600' },
    { name: 'KTM', color: 'from-orange-500 to-orange-600' },
    { name: 'SUZUKI', color: 'from-pink-500 to-pink-600' },
    { name: 'APRILIA', color: 'from-indigo-500 to-indigo-600' },
    { name: 'YAMAHA', color: 'from-teal-500 to-teal-600' },
    { name: 'PIAGGIO', color: 'from-cyan-500 to-cyan-600' },
    { name: 'ROYAL ENFIELD', color: 'from-amber-500 to-amber-600' }
  ];

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await axios.get(`${API}/vehicles?limit=4000`);
      // Handle both paginated and legacy response formats
      const data = response.data?.data || response.data;
      setVehicles(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  const getBrandStats = (brandName) => {
    const brandVehicles = vehicles.filter(v => v.brand === brandName);
    return {
      total: brandVehicles.length,
      inStock: brandVehicles.filter(v => v.status === 'in_stock').length,
      sold: brandVehicles.filter(v => v.status === 'sold').length
    };
  };

  const handleBrandClick = (brandName) => {
    navigate(`/vehicles/brand/${brandName}`);
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="spinner"></div></div>;
  }

  const totalVehicles = vehicles.length;
  const inStockVehicles = vehicles.filter(v => v.status === 'in_stock').length;
  const soldVehicles = vehicles.filter(v => v.status === 'sold').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vehicle Stock by Brand</h2>
          <p className="text-gray-600">Click on any brand to view detailed inventory</p>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MotorcycleIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                <p className="text-2xl font-bold text-gray-900">{totalVehicles}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Stock</p>
                <p className="text-2xl font-bold text-green-600">{inStockVehicles}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sold</p>
                <p className="text-2xl font-bold text-orange-600">{soldVehicles}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Brand Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {brands.map((brand) => {
          const stats = getBrandStats(brand.name);
          return (
            <Card 
              key={brand.name} 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
              onClick={() => handleBrandClick(brand.name)}
            >
              <div className={`h-3 bg-gradient-to-r ${brand.color} rounded-t-lg`}></div>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${brand.color} rounded-full flex items-center justify-center`}>
                    <MotorcycleIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{brand.name}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-semibold">{stats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">In Stock:</span>
                      <span className="font-semibold text-green-600">{stats.inStock}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-600">Sold:</span>
                      <span className="font-semibold text-orange-600">{stats.sold}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

const EditVehicleModal = ({ vehicle, isOpen, onClose, onUpdate }) => {
  const [editData, setEditData] = useState({
    brand: '',
    model: '',
    chassis_number: '',
    engine_number: '',
    color: '',
    vehicle_number: '',
    key_number: '',
    inbound_location: '',
    page_number: '',
    outbound_location: '',
    status: 'in_stock',
    date_received: '',
    date_returned: ''
  });
  const [loading, setLoading] = useState(false);

  const brands = ['TVS', 'BAJAJ', 'HERO', 'HONDA', 'TRIUMPH', 'KTM', 'SUZUKI', 'APRILIA', 'YAMAHA', 'PIAGGIO', 'ROYAL ENFIELD'];
  const statusOptions = [
    { value: 'in_stock', label: 'In Stock' },
    { value: 'sold', label: 'Sold' },
    { value: 'returned', label: 'Returned' }
  ];

  useEffect(() => {
    if (vehicle && isOpen) {
      setEditData({
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        chassis_number: vehicle.chassis_number || '',
        engine_number: vehicle.engine_number || '',
        color: vehicle.color || '',
        vehicle_number: vehicle.vehicle_number || '',
        key_number: vehicle.key_number || '',
        inbound_location: vehicle.inbound_location || '',
        page_number: vehicle.page_number || '',
        outbound_location: vehicle.outbound_location || '',
        status: vehicle.status || 'in_stock',
        date_received: vehicle.date_received ? new Date(vehicle.date_received).toISOString().split('T')[0] : '',
        date_returned: vehicle.date_returned ? new Date(vehicle.date_returned).toISOString().split('T')[0] : ''
      });
    }
  }, [vehicle, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Prepare the full vehicle update payload
      const updateData = {
        brand: editData.brand,
        model: editData.model,
        chassis_number: editData.chassis_number,
        engine_number: editData.engine_number,
        color: editData.color,
        vehicle_number: editData.vehicle_number,
        key_number: editData.key_number,
        inbound_location: editData.inbound_location,
        page_number: editData.page_number,
        outbound_location: editData.outbound_location,
        status: editData.status
      };

      // Add date_received if provided
      if (editData.date_received) {
        updateData.date_received = new Date(editData.date_received).toISOString();
      }

      // Add return date if status is 'returned' and date is provided
      if (editData.status === 'returned' && editData.date_returned) {
        updateData.date_returned = editData.date_returned;
      }

      // Use the full vehicle update endpoint
      const response = await axios.put(`${API}/vehicles/${vehicle.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Vehicle updated successfully!');
      onUpdate(response.data);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Vehicle Details</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-brand">Brand</Label>
              <Select value={editData.brand} onValueChange={(value) => setEditData({...editData, brand: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
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
              <Label htmlFor="edit-date-received">Date Received</Label>
              <Input
                id="edit-date-received"
                type="date"
                value={editData.date_received}
                onChange={(e) => setEditData({...editData, date_received: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="edit-model">Model</Label>
              <Input
                id="edit-model"
                placeholder="Enter model name"
                value={editData.model}
                onChange={(e) => setEditData({...editData, model: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-chassis">Chassis Number</Label>
              <Input
                id="edit-chassis"
                placeholder="Enter chassis number"
                value={editData.chassis_number}
                onChange={(e) => setEditData({...editData, chassis_number: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-engine">Engine Number</Label>
              <Input
                id="edit-engine"
                placeholder="Enter engine number"
                value={editData.engine_number}
                onChange={(e) => setEditData({...editData, engine_number: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-color">Color</Label>
              <Input
                id="edit-color"
                placeholder="Enter color"
                value={editData.color}
                onChange={(e) => setEditData({...editData, color: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-vehicle-number">Vehicle Number (Registration)</Label>
              <Input
                id="edit-vehicle-number"
                placeholder="Enter vehicle registration number"
                value={editData.vehicle_number}
                onChange={(e) => setEditData({...editData, vehicle_number: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="edit-key">Key Number</Label>
              <Input
                id="edit-key"
                placeholder="Enter key number"
                value={editData.key_number}
                onChange={(e) => setEditData({...editData, key_number: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-inbound">Inbound Location</Label>
              <Input
                id="edit-inbound"
                placeholder="Enter inbound location"
                value={editData.inbound_location}
                onChange={(e) => setEditData({...editData, inbound_location: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-outbound">Outbound Location</Label>
              <Input
                id="edit-outbound"
                placeholder="Enter outbound location"
                value={editData.outbound_location}
                onChange={(e) => setEditData({...editData, outbound_location: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="edit-page">Page Number</Label>
              <Input
                id="edit-page"
                placeholder="Enter page number"
                value={editData.page_number}
                onChange={(e) => setEditData({...editData, page_number: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select value={editData.status} onValueChange={(value) => setEditData({...editData, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Return Date Field - Only shown when status is 'returned' */}
            {editData.status === 'returned' && (
              <div>
                <Label htmlFor="edit-return-date">Return Date</Label>
                <Input
                  id="edit-return-date"
                  type="date"
                  value={editData.date_returned}
                  onChange={(e) => setEditData({...editData, date_returned: e.target.value})}
                  required
                />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="spinner w-4 h-4 mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Updating...' : 'Update Vehicle'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const BrandDetails = () => {
  const { brand } = useParams();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editVehicle, setEditVehicle] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);

  useEffect(() => {
    fetchBrandVehicles();
  }, [brand]);

  useEffect(() => {
    filterVehicles();
  }, [vehicles, searchTerm]);

  const fetchBrandVehicles = async () => {
    try {
      const response = await axios.get(`${API}/vehicles?brand=${brand}&limit=4000`);
      const data = response.data?.data || response.data;
      setVehicles(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(`Failed to fetch ${brand} vehicles`);
    } finally {
      setLoading(false);
    }
  };

  const filterVehicles = () => {
    let filtered = vehicles;
    if (searchTerm) {
      filtered = vehicles.filter(vehicle =>
        vehicle.chassis_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.engine_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.color?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.key_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredVehicles(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      in_stock: { label: 'In Stock', className: 'bg-green-100 text-green-800 border-green-200' },
      sold: { label: 'Sold', className: 'bg-orange-100 text-orange-800 border-orange-200' },
      returned: { label: 'Returned', className: 'bg-blue-100 text-blue-800 border-blue-200' }
    };

    const config = statusConfig[status] || statusConfig.in_stock;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const handleEditVehicle = (vehicle) => {
    setEditVehicle(vehicle);
    setIsEditModalOpen(true);
  };

  const handleUpdateVehicle = (updatedVehicle) => {
    const updatedVehicles = vehicles.map(v => 
      v.id === updatedVehicle.id ? updatedVehicle : v
    );
    setVehicles(updatedVehicles);
  };

  const promptDeleteVehicle = (vehicleId, chassisNo) => {
    setVehicleToDelete({ id: vehicleId, chassisNo });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteVehicle = async () => {
    if (!vehicleToDelete) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/vehicles/${vehicleToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove from local state
      const updatedVehicles = vehicles.filter(v => v.id !== vehicleToDelete.id);
      setVehicles(updatedVehicles);
      
      toast.success('Vehicle deleted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete vehicle');
    } finally {
      setVehicleToDelete(null);
    }
  };

  const exportBrandData = () => {
    try {
      const csvContent = [
        ['Date', 'Chassis No', 'Engine No', 'Model', 'Color', 'Vehicle No', 'Key No', 'Inbound Location', 'Status', 'Return Date', 'Page Number', 'Outbound Location'].join(','),
        ...filteredVehicles.map(vehicle => [
          new Date(vehicle.date_received).toLocaleDateString('en-IN'),
          vehicle.chassis_number || '',
          vehicle.engine_number || '',
          vehicle.model || '',
          vehicle.color || '',
          vehicle.vehicle_number || '',
          vehicle.key_number || '',
          vehicle.inbound_location || '',
          vehicle.status || '',
          vehicle.status === 'returned' && vehicle.date_returned 
            ? new Date(vehicle.date_returned).toLocaleDateString('en-IN')
            : '',
          vehicle.page_number || '',
          vehicle.outbound_location || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${brand}_vehicles_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success(`${brand} vehicle data exported successfully!`);
    } catch (error) {
      toast.error('Failed to export vehicle data');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="spinner"></div></div>;
  }

  const inStockCount = vehicles.filter(v => v.status === 'in_stock').length;
  const soldCount = vehicles.filter(v => v.status === 'sold').length;

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/vehicles')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Brands
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{brand} Vehicle Stock</h2>
            <p className="text-gray-600">Detailed inventory for {brand} vehicles</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportBrandData} variant="outline" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Brand Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MotorcycleIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total {brand}</p>
                <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Stock</p>
                <p className="text-2xl font-bold text-green-600">{inStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sold</p>
                <p className="text-2xl font-bold text-orange-600">{soldCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by chassis no, engine no, model, color, vehicle no, or key number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Vehicle Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {brand} Vehicles ({filteredVehicles.length} vehicles)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold">Date</th>
                  <th className="text-left p-3 font-semibold">Chassis No</th>
                  <th className="text-left p-3 font-semibold">Engine No</th>
                  <th className="text-left p-3 font-semibold">Model</th>
                  <th className="text-left p-3 font-semibold">Color</th>
                  <th className="text-left p-3 font-semibold">Vehicle No</th>
                  <th className="text-left p-3 font-semibold">Key no.</th>
                  <th className="text-left p-3 font-semibold">Inbound Location</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Return Date</th>
                  <th className="text-left p-3 font-semibold">Page Number</th>
                  <th className="text-left p-3 font-semibold">Outbound Location</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="p-8 text-center text-gray-500">
                      {searchTerm ? `No ${brand} vehicles found matching your search` : `No ${brand} vehicles found`}
                    </td>
                  </tr>
                ) : (
                  filteredVehicles
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((vehicle) => (
                    <tr key={vehicle.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-gray-600">
                        {new Date(vehicle.date_received).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-3 text-gray-900 font-mono font-medium">{vehicle.chassis_number}</td>
                      <td className="p-3 text-gray-900 font-mono font-medium">{vehicle.engine_number}</td>
                      <td className="p-3 text-gray-900 font-medium">{vehicle.model}</td>
                      <td className="p-3 text-gray-600">{vehicle.color}</td>
                      <td className="p-3 text-gray-600 font-mono">{vehicle.vehicle_number}</td>
                      <td className="p-3 text-gray-600 font-mono">{vehicle.key_number}</td>
                      <td className="p-3 text-gray-600">{vehicle.inbound_location}</td>
                      <td className="p-3">
                        {getStatusBadge(vehicle.status)}
                      </td>
                      <td className="p-3 text-gray-600">
                        {vehicle.status === 'returned' && vehicle.date_returned 
                          ? new Date(vehicle.date_returned).toLocaleDateString('en-IN')
                          : (vehicle.status === 'returned' ? 'Not Set' : 'N/A')
                        }
                      </td>
                      <td className="p-3 text-gray-600">{vehicle.page_number || 'N/A'}</td>
                      <td className="p-3 text-gray-600">{vehicle.outbound_location || 'N/A'}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditVehicle(vehicle)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => promptDeleteVehicle(vehicle.id, vehicle.chassis_number)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
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
        {filteredVehicles.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredVehicles.length / itemsPerPage)}
            total={filteredVehicles.length}
            limit={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </Card>

      {/* Edit Vehicle Modal */}
      <EditVehicleModal
        vehicle={editVehicle}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleUpdateVehicle}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Vehicle"
        description={`Are you sure you want to delete vehicle with chassis number "${vehicleToDelete?.chassisNo}"? This action cannot be undone.`}
        confirmLabel="Delete Vehicle"
        variant="destructive"
        onConfirm={confirmDeleteVehicle}
      />
    </div>
  );
};

const AddVehicle = () => {
  const [vehicleData, setVehicleData] = useState({
    brand: '',
    model: '',
    chassis_number: '',
    engine_number: '',
    color: '',
    vehicle_number: '',
    key_number: '',
    inbound_location: '',
    page_number: '',
    date_received: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  const brands = ['TVS', 'BAJAJ', 'HERO', 'HONDA', 'TRIUMPH', 'KTM', 'SUZUKI', 'APRILIA', 'YAMAHA', 'PIAGGIO', 'ROYAL ENFIELD'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert date_received to ISO format for API
      const submitData = {
        ...vehicleData,
        date_received: vehicleData.date_received ? new Date(vehicleData.date_received).toISOString() : null
      };
      await axios.post(`${API}/vehicles`, submitData);
      toast.success('Vehicle added successfully!');
      setVehicleData({
        brand: '',
        model: '',
        chassis_number: '',
        engine_number: '',
        color: '',
        vehicle_number: '',
        key_number: '',
        inbound_location: '',
        page_number: '',
        date_received: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Vehicle</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Select value={vehicleData.brand} onValueChange={(value) => setVehicleData({...vehicleData, brand: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
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
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                placeholder="Enter model name"
                value={vehicleData.model}
                onChange={(e) => setVehicleData({...vehicleData, model: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="chassis_number">Chassis Number</Label>
              <Input
                id="chassis_number"
                placeholder="Enter chassis number"
                value={vehicleData.chassis_number}
                onChange={(e) => setVehicleData({...vehicleData, chassis_number: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="engine_number">Engine Number</Label>
              <Input
                id="engine_number"
                placeholder="Enter engine number"
                value={vehicleData.engine_number}
                onChange={(e) => setVehicleData({...vehicleData, engine_number: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                placeholder="Enter color"
                value={vehicleData.color}
                onChange={(e) => setVehicleData({...vehicleData, color: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="vehicle_number">Vehicle Number (Registration)</Label>
              <Input
                id="vehicle_number"
                placeholder="Enter vehicle registration number"
                value={vehicleData.vehicle_number}
                onChange={(e) => setVehicleData({...vehicleData, vehicle_number: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="key_number">Key Number</Label>
              <Input
                id="key_number"
                placeholder="Enter key number"
                value={vehicleData.key_number}
                onChange={(e) => setVehicleData({...vehicleData, key_number: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="inbound_location">Inbound Location</Label>
              <Input
                id="inbound_location"
                placeholder="Enter inbound location"
                value={vehicleData.inbound_location}
                onChange={(e) => setVehicleData({...vehicleData, inbound_location: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="page_number">Page Number (Optional)</Label>
              <Input
                id="page_number"
                placeholder="Enter page number"
                value={vehicleData.page_number}
                onChange={(e) => setVehicleData({...vehicleData, page_number: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="date_received">Date Received</Label>
              <Input
                id="date_received"
                type="date"
                value={vehicleData.date_received}
                onChange={(e) => setVehicleData({...vehicleData, date_received: e.target.value})}
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Adding Vehicle...' : 'Add Vehicle'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const StockView = () => {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editVehicle, setEditVehicle] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [forceDelete, setForceDelete] = useState(false);
  const [deleteErrors, setDeleteErrors] = useState([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  
  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [sortBy, setSortBy] = useState('date_received');
  const [sortOrder, setSortOrder] = useState('desc');

  const brands = ['TVS', 'BAJAJ', 'HERO', 'HONDA', 'TRIUMPH', 'KTM', 'SUZUKI', 'APRILIA', 'YAMAHA', 'PIAGGIO', 'ROYAL ENFIELD'];

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    filterVehicles();
  }, [vehicles, searchTerm, selectedBrand, selectedStatus, sortBy, sortOrder]);

  const fetchVehicles = async () => {
    try {
      const response = await axios.get(`${API}/vehicles?limit=4000`);
      const data = response.data?.data || response.data;
      setVehicles(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  const filterVehicles = () => {
    let filtered = vehicles;

    if (searchTerm) {
      filtered = filtered.filter(vehicle => 
        vehicle.chassis_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.engine_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedBrand !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.brand === selectedBrand);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.status === selectedStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'date_received':
          aVal = new Date(a.date_received || 0);
          bVal = new Date(b.date_received || 0);
          break;
        case 'brand':
          aVal = a.brand || '';
          bVal = b.brand || '';
          break;
        case 'model':
          aVal = a.model || '';
          bVal = b.model || '';
          break;
        case 'chassis_number':
          aVal = a.chassis_number || '';
          bVal = b.chassis_number || '';
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

    setFilteredVehicles(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleEditVehicle = (vehicle) => {
    setEditVehicle(vehicle);
    setIsEditModalOpen(true);
  };

  const handleUpdateVehicle = (updatedVehicle) => {
    const updatedVehicles = vehicles.map(v => 
      v.id === updatedVehicle.id ? updatedVehicle : v
    );
    setVehicles(updatedVehicles);
  };

  // Delete confirmation dialog state
  const [stockDeleteDialogOpen, setStockDeleteDialogOpen] = useState(false);
  const [stockVehicleToDelete, setStockVehicleToDelete] = useState(null);

  const promptDeleteVehicle = (vehicleId, chassisNo) => {
    setStockVehicleToDelete({ id: vehicleId, chassisNo });
    setStockDeleteDialogOpen(true);
  };

  const confirmDeleteVehicle = async () => {
    if (!stockVehicleToDelete) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/vehicles/${stockVehicleToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove from local state
      const updatedVehicles = vehicles.filter(v => v.id !== stockVehicleToDelete.id);
      setVehicles(updatedVehicles);
      
      toast.success('Vehicle deleted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete vehicle');
    } finally {
      setStockVehicleToDelete(null);
    }
  };
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedVehicles(filteredVehicles.map(v => v.id));
    } else {
      setSelectedVehicles([]);
    }
  };

  const handleSelectVehicle = (vehicleId) => {
    setSelectedVehicles(prev =>
      prev.includes(vehicleId)
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  const handleBulkDelete = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API}/vehicles`, {
        data: { ids: selectedVehicles, force_delete: forceDelete },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.deleted > 0) {
        toast.success(`Successfully deleted ${response.data.deleted} vehicle(s)`);
        if (forceDelete && response.data.cascade_deleted) {
          toast.info(`Also deleted: ${response.data.cascade_deleted.sales || 0} sales, ${response.data.cascade_deleted.services || 0} services`);
        }
      }

      if (response.data.failed && response.data.failed.length > 0) {
        // Prepare detailed error information
        const failedCount = response.data.failed.length;
        const errorDetails = response.data.failed.map((failed) => {
          const vehicle = vehicles.find(v => v.id === failed.id);
          return {
            vehicleInfo: vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.chassis_number})` : failed.id,
            error: failed.error,
            vehicle: vehicle
          };
        });
        
        setDeleteErrors(errorDetails);
        setShowErrorModal(true);
        toast.error(`Could not delete ${failedCount} vehicle(s). See details below.`);
      }

      setSelectedVehicles([]);
      setShowBulkDeleteModal(false);
      setForceDelete(false); // Reset force delete
      fetchVehicles(); // Refresh the list
    } catch (error) {
      toast.error('Failed to delete vehicles: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      in_stock: { label: 'In Stock', variant: 'success' },
      sold: { label: 'Sold', variant: 'secondary' },
      returned: { label: 'Returned', variant: 'default' }
    };
    const config = statusMap[status] || statusMap.in_stock;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="spinner"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-64">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by chassis, engine, or model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="brand">Brand</Label>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Sort By</Label>
              <SortDropdown
                currentSort={sortBy}
                currentOrder={sortOrder}
                onSortChange={(field, order) => {
                  setSortBy(field);
                  setSortOrder(order);
                }}
                options={[
                  { field: 'date_received', order: 'desc', label: 'Newest First' },
                  { field: 'date_received', order: 'asc', label: 'Oldest First' },
                  { field: 'brand', order: 'asc', label: 'Brand (A-Z)' },
                  { field: 'brand', order: 'desc', label: 'Brand (Z-A)' },
                  { field: 'model', order: 'asc', label: 'Model (A-Z)' },
                  { field: 'model', order: 'desc', label: 'Model (Z-A)' },
                  { field: 'chassis_number', order: 'asc', label: 'Chassis No (A-Z)' },
                  { field: 'chassis_number', order: 'desc', label: 'Chassis No (Z-A)' }
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Vehicle Stock ({filteredVehicles.length} vehicles)</CardTitle>
            {selectedVehicles.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkDeleteModal(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedVehicles.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">
                    <input
                      type="checkbox"
                      checked={selectedVehicles.length === filteredVehicles.length && filteredVehicles.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Brand</th>
                  <th className="text-left p-2">Model</th>
                  <th className="text-left p-2">Chassis No</th>
                  <th className="text-left p-2">Engine No</th>
                  <th className="text-left p-2">Color</th>
                  <th className="text-left p-2">Key No</th>
                  <th className="text-left p-2">Location</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Return Date</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="p-8 text-center text-gray-500">
                      {searchTerm || selectedBrand !== 'all' || selectedStatus !== 'all'
                        ? 'No vehicles found matching your filters'
                        : 'No vehicles found'}
                    </td>
                  </tr>
                ) : (
                  filteredVehicles
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((vehicle) => (
                      <tr key={vehicle.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selectedVehicles.includes(vehicle.id)}
                            onChange={() => handleSelectVehicle(vehicle.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="p-2">{new Date(vehicle.date_received).toLocaleDateString()}</td>
                        <td className="p-2 font-medium">{vehicle.brand}</td>
                        <td className="p-2">{vehicle.model}</td>
                        <td className="p-2">{vehicle.chassis_number}</td>
                        <td className="p-2">{vehicle.engine_number}</td>
                        <td className="p-2">{vehicle.color}</td>
                        <td className="p-2">{vehicle.key_number}</td>
                        <td className="p-2">{vehicle.inbound_location}</td>
                        <td className="p-2">{getStatusBadge(vehicle.status)}</td>
                        <td className="p-2">
                          {vehicle.status === 'returned' && vehicle.date_returned 
                            ? new Date(vehicle.date_returned).toLocaleDateString('en-IN')
                            : (vehicle.status === 'returned' ? 'Not Set' : 'N/A')
                          }
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditVehicle(vehicle)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="w-3 h-3" />
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => promptDeleteVehicle(vehicle.id, vehicle.chassis_number)}
                              className="flex items-center gap-1 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
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
      </Card>

      {/* Edit Vehicle Modal */}
      <EditVehicleModal
        vehicle={editVehicle}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleUpdateVehicle}
      />
      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4 text-red-600">⚠️ Confirm Delete</h2>
            <p className="mb-4 font-semibold">
              Are you sure you want to delete {selectedVehicles.length} vehicle(s)?
            </p>
            
            {/* Force Delete Option */}
            <div className="mb-4 p-4 border-2 border-red-200 rounded-lg bg-red-50">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceDelete}
                  onChange={(e) => setForceDelete(e.target.checked)}
                  className="mt-1 rounded"
                />
                <div>
                  <span className="font-bold text-red-700">Force Delete (Cascade)</span>
                  <p className="text-sm text-red-600 mt-1">
                    ⚠️ This will permanently delete the vehicles AND all associated sales and service records. This action is irreversible!
                  </p>
                </div>
              </label>
            </div>

            {!forceDelete ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                <p className="text-sm text-yellow-800 font-semibold mb-2">⚠️ Normal Delete Restrictions:</p>
                <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                  <li>Vehicles with sales records cannot be deleted</li>
                  <li>Vehicles with service records cannot be deleted</li>
                  <li>You must delete associated records first, OR enable Force Delete</li>
                </ul>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-300 rounded p-3 mb-4">
                <p className="text-sm text-red-800 font-bold mb-2">🚨 Force Delete WILL REMOVE:</p>
                <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                  <li>All selected vehicles</li>
                  <li>All sales records for these vehicles</li>
                  <li>All service records for these vehicles</li>
                  <li>Customer purchase history will be affected</li>
                </ul>
                <p className="text-sm text-red-800 font-bold mt-2">
                  ⚠️ THIS CANNOT BE UNDONE!
                </p>
              </div>
            )}
            
            <p className="text-sm text-gray-600 mb-4">
              {forceDelete 
                ? "All selected vehicles and their complete history will be permanently deleted."
                : "Only vehicles without any sales or service history will be deleted. Others will be skipped."
              }
            </p>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowBulkDeleteModal(false);
                  setForceDelete(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleBulkDelete} 
                disabled={loading}
                className={forceDelete ? "bg-red-700 hover:bg-red-800" : ""}
              >
                {loading ? 'Deleting...' : forceDelete ? '🚨 Force Delete All' : 'Proceed with Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error Details Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-red-600">⚠️ Deletion Failed</h2>
              <p className="text-gray-600 mt-2">
                {deleteErrors.length} vehicle(s) could not be deleted due to the following reasons:
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {deleteErrors.map((errorItem, index) => (
                  <div key={index} className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{errorItem.vehicleInfo}</p>
                        <p className="text-red-700 mt-1">{errorItem.error}</p>
                        {errorItem.vehicle && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Details:</span> {errorItem.vehicle.brand} {errorItem.vehicle.model} • 
                            Status: <span className={errorItem.vehicle.status === 'sold' ? 'text-orange-600' : 'text-green-600'}>
                              {errorItem.vehicle.status === 'in_stock' ? 'In Stock' : errorItem.vehicle.status === 'sold' ? 'Sold' : 'Returned'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <h3 className="font-bold text-yellow-800 mb-2">💡 How to Delete These Vehicles:</h3>
                <ul className="text-sm text-yellow-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="font-bold">Option 1:</span>
                    <span>Delete associated sales/service records first, then delete the vehicles.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">Option 2:</span>
                    <span>Use the <strong>"Force Delete"</strong> option in the delete confirmation to remove vehicles along with all their associated records (⚠️ This cannot be undone!).</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowErrorModal(false);
                  setDeleteErrors([]);
                }}
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  setShowErrorModal(false);
                  setDeleteErrors([]);
                  setForceDelete(true);
                  setShowBulkDeleteModal(true);
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Try Force Delete Instead
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Single Delete Confirmation Dialog */}
      <ConfirmDialog
        open={stockDeleteDialogOpen}
        onOpenChange={setStockDeleteDialogOpen}
        title="Delete Vehicle"
        description={`Are you sure you want to delete vehicle with chassis number "${stockVehicleToDelete?.chassisNo}"? This action cannot be undone.`}
        confirmLabel="Delete Vehicle"
        variant="destructive"
        onConfirm={confirmDeleteVehicle}
      />
    </div>
  );
};



export default VehicleStock;
