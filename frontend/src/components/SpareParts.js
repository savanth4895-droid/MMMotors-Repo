import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { 
  Plus, 
  Package, 
  ShoppingCart, 
  TrendingDown,
  FileText,
  Search,
  AlertTriangle,
  Eye,
  Printer,
  Download,
  Trash2,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { extractData } from '../lib/api';
import ConfirmDialog from './ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';
import { sendSparePartsBill } from '../lib/whatsapp';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SpareParts = () => {
  const location = useLocation();
  
  const navigationItems = [
    { name: 'Overview', path: '/spare-parts', icon: Package },
    { name: 'Add Part', path: '/spare-parts/add', icon: Plus },
    { name: 'Inventory', path: '/spare-parts/inventory', icon: Package },
    { name: 'Create Bill', path: '/spare-parts/create-bill', icon: ShoppingCart },
    { name: 'Bills', path: '/spare-parts/bills', icon: FileText },
    { name: 'Reports', path: '/spare-parts/reports', icon: FileText },
    { name: 'Low Stock', path: '/spare-parts/low-stock', icon: TrendingDown }
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
                  <span className="hidden sm:inline">{item.name}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<SparePartsOverview />} />
        <Route path="/add" element={<AddSparePart />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/create-bill" element={<CreateBill />} />
        <Route path="/bills" element={<Bills />} />
        <Route path="/reports" element={<SparePartsReports />} />
        <Route path="/low-stock" element={<LowStock />} />
      </Routes>
    </div>
  );
};

const SparePartsOverview = () => {
  const [stats, setStats] = useState({
    totalParts: 0,
    lowStockParts: 0,
    totalValue: 0,
    monthlyBills: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [partsResponse, lowStockResponse, billsResponse] = await Promise.all([
        axios.get(`${API}/spare-parts?limit=4000`),
        axios.get(`${API}/spare-parts?low_stock=true&limit=4000`),
        axios.get(`${API}/spare-parts/bills`)
      ]);

      const partsData = extractData(partsResponse);
      const lowStockData = extractData(lowStockResponse);
      const billsData = extractData(billsResponse);

      const totalValue = partsData.reduce((sum, part) => sum + (part.quantity * part.unit_price), 0);
      
      setStats({
        totalParts: partsData.length,
        lowStockParts: lowStockData.length,
        totalValue: totalValue,
        monthlyBills: billsData.filter(bill => 
          new Date(bill.bill_date).getMonth() === new Date().getMonth()
        ).length
      });
    } catch (error) {
      toast.error('Failed to fetch spare parts statistics');
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Parts</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalParts}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.lowStockParts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                <p className="text-2xl font-bold text-green-600">₹{stats.totalValue.toLocaleString()}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Bills</p>
                <p className="text-2xl font-bold text-purple-600">{stats.monthlyBills}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-600" />
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
            <Link to="/spare-parts/add">
              <Button className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                Add New Part
              </Button>
            </Link>
            <Link to="/spare-parts/create-bill">
              <Button variant="outline" className="w-full justify-start">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Create Bill
              </Button>
            </Link>
            <Link to="/spare-parts/low-stock">
              <Button variant="outline" className="w-full justify-start text-red-600">
                <AlertTriangle className="w-4 h-4 mr-2" />
                View Low Stock
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Engine Parts</span>
                <Badge variant="outline">35%</Badge>
              </div>
              <div className="flex justify-between">
                <span>Brake System</span>
                <Badge variant="outline">28%</Badge>
              </div>
              <div className="flex justify-between">
                <span>Electrical</span>
                <Badge variant="outline">22%</Badge>
              </div>
              <div className="flex justify-between">
                <span>Body Parts</span>
                <Badge variant="outline">15%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const AddSparePart = () => {
  const [partData, setPartData] = useState({
    name: '',
    part_number: '',
    brand: '',
    quantity: '',
    unit: 'Nos',
    unit_price: '',
    hsn_sac: '',
    gst_percentage: '18',
    compatible_models: '',
    low_stock_threshold: '5',
    supplier: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/spare-parts`, {
        ...partData,
        quantity: parseInt(partData.quantity),
        unit_price: parseFloat(partData.unit_price),
        gst_percentage: parseFloat(partData.gst_percentage),
        low_stock_threshold: parseInt(partData.low_stock_threshold)
      });
      toast.success('Spare part added successfully!');
      setPartData({
        name: '',
        part_number: '',
        brand: '',
        quantity: '',
        unit: 'Nos',
        unit_price: '',
        hsn_sac: '',
        gst_percentage: '18',
        compatible_models: '',
        low_stock_threshold: '5',
        supplier: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add spare part');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Spare Part</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Part Name</Label>
              <Input
                id="name"
                placeholder="Enter part name"
                value={partData.name}
                onChange={(e) => setPartData({...partData, name: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="part_number">Part Number</Label>
              <Input
                id="part_number"
                placeholder="Enter part number"
                value={partData.part_number}
                onChange={(e) => setPartData({...partData, part_number: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                placeholder="Enter brand"
                value={partData.brand}
                onChange={(e) => setPartData({...partData, brand: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="Enter quantity"
                value={partData.quantity}
                onChange={(e) => setPartData({...partData, quantity: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="unit">Unit</Label>
              <Select value={partData.unit} onValueChange={(value) => setPartData({...partData, unit: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Nos">Nos</SelectItem>
                  <SelectItem value="Kg">Kg</SelectItem>
                  <SelectItem value="Ltr">Ltr</SelectItem>
                  <SelectItem value="Mtr">Mtr</SelectItem>
                  <SelectItem value="Set">Set</SelectItem>
                  <SelectItem value="Pair">Pair</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="unit_price">Unit Price (₹)</Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                placeholder="Enter unit price"
                value={partData.unit_price}
                onChange={(e) => setPartData({...partData, unit_price: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="hsn_sac">HSN/SAC Code</Label>
              <Input
                id="hsn_sac"
                placeholder="Enter HSN/SAC code"
                value={partData.hsn_sac}
                onChange={(e) => setPartData({...partData, hsn_sac: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="gst_percentage">GST Percentage</Label>
              <Select value={partData.gst_percentage} onValueChange={(value) => setPartData({...partData, gst_percentage: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select GST%" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="12">12%</SelectItem>
                  <SelectItem value="18">18%</SelectItem>
                  <SelectItem value="28">28%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="compatible_models">Compatible Models</Label>
              <Input
                id="compatible_models"
                placeholder="Enter compatible models (e.g., Apache RTR 160, Activa 5G)"
                value={partData.compatible_models}
                onChange={(e) => setPartData({...partData, compatible_models: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
              <Input
                id="low_stock_threshold"
                type="number"
                placeholder="Enter threshold"
                value={partData.low_stock_threshold}
                onChange={(e) => setPartData({...partData, low_stock_threshold: e.target.value})}
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="supplier">Supplier (Optional)</Label>
              <Input
                id="supplier"
                placeholder="Enter supplier name"
                value={partData.supplier}
                onChange={(e) => setPartData({...partData, supplier: e.target.value})}
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Adding Part...' : 'Add Spare Part'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const Inventory = () => {
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const [parts, setParts] = useState([]);
  const [filteredParts, setFilteredParts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    fetchParts();
  }, []);

  useEffect(() => {
    filterParts();
  }, [parts, searchTerm]);

  const fetchParts = async () => {
    try {
      const response = await axios.get(`${API}/spare-parts?limit=4000`);
      setParts(extractData(response));
    } catch (error) {
      toast.error('Failed to fetch spare parts');
    } finally {
      setLoading(false);
    }
  };

  const filterParts = () => {
    let filtered = parts;

    if (searchTerm) {
      filtered = filtered.filter(part => 
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.part_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (part.compatible_models && part.compatible_models.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredParts(filtered);
  };

  const handleEditPart = (part) => {
    setEditingPart(part);
    setEditFormData({
      name: part.name,
      part_number: part.part_number,
      brand: part.brand,
      quantity: part.quantity,
      unit: part.unit || 'Nos',
      unit_price: part.unit_price,
      hsn_sac: part.hsn_sac || '',
      gst_percentage: part.gst_percentage || 18,
      compatible_models: part.compatible_models || '',
      low_stock_threshold: part.low_stock_threshold || 5,
      supplier: part.supplier || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPart) return;
    
    try {
      setLoading(true);
      await axios.put(`${API}/spare-parts/${editingPart.id}`, editFormData);
      toast.success('Spare part updated successfully!');
      setShowEditModal(false);
      setEditingPart(null);
      setEditFormData({});
      fetchParts(); // Refresh the data
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update spare part');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingPart(null);
    setEditFormData({});
  };

  const handleDeletePart = async (partId, partName) => {
    const ok = await confirm({
      title: `Delete spare part "${partName}"?`,
      description: 'This action cannot be undone.',
      confirmLabel: 'Delete Part',
    });
    if (!ok) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/spare-parts/${partId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove from local state
      const updatedParts = parts.filter(part => part.id !== partId);
      setParts(updatedParts);
      
      toast.success('Spare part deleted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete spare part');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="spinner"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search parts by name, number, brand, or compatible models..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Parts List */}
      <Card>
        <CardHeader>
          <CardTitle>Spare Parts Inventory ({filteredParts.length} parts)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold">Sl. No.</th>
                  <th className="text-left p-3 font-semibold">Description of Goods</th>
                  <th className="text-left p-3 font-semibold">Part Number</th>
                  <th className="text-left p-3 font-semibold">HSN/SAC</th>
                  <th className="text-left p-3 font-semibold">Qty.</th>
                  <th className="text-left p-3 font-semibold">Unit</th>
                  <th className="text-left p-3 font-semibold">Rate</th>
                  <th className="text-left p-3 font-semibold">GST%</th>
                  <th className="text-left p-3 font-semibold">Compatible Models</th>
                  <th className="text-left p-3 font-semibold">Total Value</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredParts.map((part, index) => (
                  <tr key={part.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-center">{index + 1}</td>
                    <td className="p-3 font-medium">{part.name}</td>
                    <td className="p-3 font-mono text-sm">{part.part_number}</td>
                    <td className="p-3">{part.hsn_sac || 'N/A'}</td>
                    <td className="p-3 text-right">{part.quantity}</td>
                    <td className="p-3">{part.unit || 'Nos'}</td>
                    <td className="p-3 text-right">₹{part.unit_price.toFixed(2)}</td>
                    <td className="p-3 text-right">{part.gst_percentage || 18}%</td>
                    <td className="p-3">{part.compatible_models || 'N/A'}</td>
                    <td className="p-3 text-right font-semibold">₹{(part.quantity * part.unit_price).toFixed(2)}</td>
                    <td className="p-3">
                      {part.quantity <= part.low_stock_threshold ? (
                        <Badge variant="destructive">Low Stock</Badge>
                      ) : (
                        <Badge variant="success">In Stock</Badge>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditPart(part)}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeletePart(part.id, part.name)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Spare Part Modal */}
      {showEditModal && editingPart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Spare Part</h2>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Part Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter part name"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="part_number">Part Number</Label>
                  <Input
                    id="part_number"
                    placeholder="Enter part number"
                    value={editFormData.part_number || ''}
                    onChange={(e) => setEditFormData({...editFormData, part_number: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    placeholder="Enter brand"
                    value={editFormData.brand || ''}
                    onChange={(e) => setEditFormData({...editFormData, brand: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="Enter quantity"
                    value={editFormData.quantity || ''}
                    onChange={(e) => setEditFormData({...editFormData, quantity: parseInt(e.target.value)})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={editFormData.unit} onValueChange={(value) => setEditFormData({...editFormData, unit: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nos">Nos</SelectItem>
                      <SelectItem value="Kg">Kg</SelectItem>
                      <SelectItem value="Ltr">Ltr</SelectItem>
                      <SelectItem value="Mtr">Mtr</SelectItem>
                      <SelectItem value="Set">Set</SelectItem>
                      <SelectItem value="Pair">Pair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="unit_price">Unit Price (₹)</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    step="0.01"
                    placeholder="Enter unit price"
                    value={editFormData.unit_price || ''}
                    onChange={(e) => setEditFormData({...editFormData, unit_price: parseFloat(e.target.value)})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="hsn_sac">HSN/SAC Code</Label>
                  <Input
                    id="hsn_sac"
                    placeholder="Enter HSN/SAC code"
                    value={editFormData.hsn_sac || ''}
                    onChange={(e) => setEditFormData({...editFormData, hsn_sac: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="gst_percentage">GST Percentage</Label>
                  <Select value={editFormData.gst_percentage?.toString()} onValueChange={(value) => setEditFormData({...editFormData, gst_percentage: parseFloat(value)})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select GST%" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0%</SelectItem>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="12">12%</SelectItem>
                      <SelectItem value="18">18%</SelectItem>
                      <SelectItem value="28">28%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="compatible_models">Compatible Models</Label>
                  <Input
                    id="compatible_models"
                    placeholder="Enter compatible models (e.g., Apache RTR 160, Activa 5G)"
                    value={editFormData.compatible_models || ''}
                    onChange={(e) => setEditFormData({...editFormData, compatible_models: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
                  <Input
                    id="low_stock_threshold"
                    type="number"
                    placeholder="Enter threshold"
                    value={editFormData.low_stock_threshold || ''}
                    onChange={(e) => setEditFormData({...editFormData, low_stock_threshold: parseInt(e.target.value)})}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="supplier">Supplier (Optional)</Label>
                  <Input
                    id="supplier"
                    placeholder="Enter supplier name"
                    value={editFormData.supplier || ''}
                    onChange={(e) => setEditFormData({...editFormData, supplier: e.target.value})}
                  />
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

const CreateBill = () => {
  const [parts, setParts] = useState([]);
  const [customerData, setCustomerData] = useState({
    name: '',
    mobile: '',
    vehicle_name: '',
    vehicle_number: ''
  });
  const [billItems, setBillItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [itemForm, setItemForm] = useState({
    part_id: '',
    description: '',
    hsn_sac: '',
    quantity: '',
    unit: 'Nos',
    rate: '',
    discount_percent: '0',
    gst_percent: '18'
  });

  useEffect(() => {
    fetchParts();
  }, []);



  const fetchParts = async () => {
    try {
      const response = await axios.get(`${API}/spare-parts?limit=4000`);
      setParts(extractData(response));
    } catch (error) {
      toast.error('Failed to fetch spare parts');
    }
  };

  const handlePartSelection = (partId) => {
    const selectedPart = parts.find(p => p.id === partId);
    if (selectedPart) {
      setItemForm({
        ...itemForm,
        part_id: partId,
        description: selectedPart.name,
        hsn_sac: selectedPart.hsn_sac || '',
        unit: selectedPart.unit || 'Nos',
        rate: selectedPart.unit_price.toString(),
        gst_percent: selectedPart.gst_percentage?.toString() || '18'
      });
    }
  };

  const calculateGST = (rate, quantity, discountPercent, gstPercent) => {
    const subtotal = rate * quantity;
    const discountAmount = (subtotal * discountPercent) / 100;
    const taxableAmount = subtotal - discountAmount;
    const cgstAmount = (taxableAmount * (gstPercent / 2)) / 100;
    const sgstAmount = (taxableAmount * (gstPercent / 2)) / 100;
    const totalTax = cgstAmount + sgstAmount;
    const finalAmount = taxableAmount + totalTax;

    return {
      subtotal,
      discountAmount,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      totalTax,
      finalAmount
    };
  };

  const addItem = () => {
    if (!itemForm.description || !itemForm.hsn_sac || !itemForm.quantity || !itemForm.rate) {
      toast.error('Please fill all required fields: Description, HSN/SAC, Quantity, and Rate');
      return;
    }

    const calculations = calculateGST(
      parseFloat(itemForm.rate),
      parseFloat(itemForm.quantity),
      parseFloat(itemForm.discount_percent),
      parseFloat(itemForm.gst_percent)
    );

    const newItem = {
      sl_no: billItems.length + 1,
      part_id: itemForm.part_id || `MANUAL-${Date.now()}`, // Generate ID for manual entries
      description: itemForm.description,
      hsn_sac: itemForm.hsn_sac,
      quantity: parseFloat(itemForm.quantity),
      unit: itemForm.unit,
      rate: parseFloat(itemForm.rate),
      discount_percent: parseFloat(itemForm.discount_percent),
      gst_percent: parseFloat(itemForm.gst_percent),
      ...calculations
    };

    setBillItems([...billItems, newItem]);

    // Reset form
    setItemForm({
      part_id: '',
      description: '',
      hsn_sac: '',
      quantity: '',
      unit: 'Nos',
      rate: '',
      discount_percent: '0',
      gst_percent: '18'
    });
  };

  const removeItem = (index) => {
    const updatedItems = billItems.filter((_, i) => i !== index);
    // Update serial numbers
    const reIndexedItems = updatedItems.map((item, i) => ({
      ...item,
      sl_no: i + 1
    }));
    setBillItems(reIndexedItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (billItems.length === 0) {
      toast.error('Please add at least one item to generate bill');
      return;
    }

    if (!customerData.name || !customerData.mobile) {
      toast.error('Please enter customer name and mobile number');
      return;
    }

    setLoading(true);

    const billPayload = {
      customer_data: customerData,
      items: billItems,
      subtotal: totals.subtotal,
      total_discount: totals.totalDiscount,
      total_cgst: totals.totalCGST,
      total_sgst: totals.totalSGST,
      total_tax: totals.totalTax,
      total_amount: totals.totalAmount
    };

    try {
      console.log('Submitting bill payload:', billPayload);
      const response = await axios.post(`${API}/spare-parts/bills`, billPayload);
      console.log('Bill response:', response.data);
      toast.success('GST Bill generated successfully!');
      setCustomerData({ name: '', mobile: '', vehicle_name: '', vehicle_number: '' });
      setBillItems([]);
    } catch (error) {
      console.error('Bill generation error:', error);
      toast.error(error.response?.data?.detail || 'Failed to generate bill');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const subtotal = billItems.reduce((sum, item) => sum + item.subtotal, 0);
    const totalDiscount = billItems.reduce((sum, item) => sum + item.discountAmount, 0);
    const totalCGST = billItems.reduce((sum, item) => sum + item.cgstAmount, 0);
    const totalSGST = billItems.reduce((sum, item) => sum + item.sgstAmount, 0);
    const totalTax = billItems.reduce((sum, item) => sum + item.totalTax, 0);
    const totalAmount = billItems.reduce((sum, item) => sum + item.finalAmount, 0);

    return { subtotal, totalDiscount, totalCGST, totalSGST, totalTax, totalAmount };
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Spare Parts Bill</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer & Vehicle Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer & Vehicle Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer_name">Customer Name *</Label>
                    <Input
                      id="customer_name"
                      placeholder="Enter customer name"
                      value={customerData.name}
                      onChange={(e) => setCustomerData({...customerData, name: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="mobile">Mobile Number *</Label>
                    <Input
                      id="mobile"
                      placeholder="Enter mobile number"
                      value={customerData.mobile}
                      onChange={(e) => setCustomerData({...customerData, mobile: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="vehicle_name">Vehicle Name</Label>
                    <Input
                      id="vehicle_name"
                      placeholder="Enter vehicle name (e.g., TVS Apache)"
                      value={customerData.vehicle_name}
                      onChange={(e) => setCustomerData({...customerData, vehicle_name: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="vehicle_number">Vehicle Number</Label>
                    <Input
                      id="vehicle_number"
                      placeholder="Enter vehicle number (e.g., TN01AB1234)"
                      value={customerData.vehicle_number}
                      onChange={(e) => setCustomerData({...customerData, vehicle_number: e.target.value})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Item Entry Form */}
            <Card>
              <CardHeader>
                <CardTitle>Add Items to Bill</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="part">Select Part</Label>
                    <Select value={itemForm.part_id} onValueChange={handlePartSelection}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select part" />
                      </SelectTrigger>
                      <SelectContent>
                        {parts.map((part) => (
                          <SelectItem key={part.id} value={part.id}>
                            {part.name} - {part.part_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Description of Goods *</Label>
                    <Input
                      id="description"
                      placeholder="Enter description"
                      value={itemForm.description}
                      onChange={(e) => setItemForm({...itemForm, description: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="hsn_sac">HSN/SAC *</Label>
                    <Input
                      id="hsn_sac"
                      placeholder="Enter HSN/SAC code"
                      value={itemForm.hsn_sac}
                      onChange={(e) => setItemForm({...itemForm, hsn_sac: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      placeholder="Enter quantity"
                      value={itemForm.quantity}
                      onChange={(e) => setItemForm({...itemForm, quantity: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Select value={itemForm.unit} onValueChange={(value) => setItemForm({...itemForm, unit: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nos">Nos</SelectItem>
                        <SelectItem value="Kg">Kg</SelectItem>
                        <SelectItem value="Ltr">Ltr</SelectItem>
                        <SelectItem value="Mtr">Mtr</SelectItem>
                        <SelectItem value="Set">Set</SelectItem>
                        <SelectItem value="Pair">Pair</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="rate">Rate (₹) *</Label>
                    <Input
                      id="rate"
                      type="number"
                      step="0.01"
                      placeholder="Enter rate"
                      value={itemForm.rate}
                      onChange={(e) => setItemForm({...itemForm, rate: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="discount">Disc% </Label>
                    <Input
                      id="discount"
                      type="number"
                      step="0.01"
                      placeholder="Enter discount %"
                      value={itemForm.discount_percent}
                      onChange={(e) => setItemForm({...itemForm, discount_percent: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="gst">GST% *</Label>
                    <Select value={itemForm.gst_percent} onValueChange={(value) => setItemForm({...itemForm, gst_percent: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select GST%" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="12">12%</SelectItem>
                        <SelectItem value="18">18%</SelectItem>
                        <SelectItem value="28">28%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button type="button" onClick={addItem} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bill Items Table */}
            {billItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Bill Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-2 border">Sl. No.</th>
                          <th className="text-left p-2 border">Description of Goods</th>
                          <th className="text-left p-2 border">HSN/SAC</th>
                          <th className="text-left p-2 border">Qty.</th>
                          <th className="text-left p-2 border">Unit</th>
                          <th className="text-left p-2 border">Rate</th>
                          <th className="text-left p-2 border">Disc%</th>
                          <th className="text-left p-2 border">GST%</th>
                          <th className="text-left p-2 border">CGST Amount</th>
                          <th className="text-left p-2 border">SGST Amount</th>
                          <th className="text-left p-2 border">Total Tax</th>
                          <th className="text-left p-2 border">Amount</th>
                          <th className="text-left p-2 border">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billItems.map((item, index) => (
                          <tr key={index} className="border-t hover:bg-gray-50">
                            <td className="p-2 border text-center">{item.sl_no}</td>
                            <td className="p-2 border">{item.description}</td>
                            <td className="p-2 border">{item.hsn_sac}</td>
                            <td className="p-2 border text-right">{item.quantity}</td>
                            <td className="p-2 border">{item.unit}</td>
                            <td className="p-2 border text-right">₹{item.rate.toFixed(2)}</td>
                            <td className="p-2 border text-right">{item.discount_percent}%</td>
                            <td className="p-2 border text-right">{item.gst_percent}%</td>
                            <td className="p-2 border text-right">₹{item.cgstAmount.toFixed(2)}</td>
                            <td className="p-2 border text-right">₹{item.sgstAmount.toFixed(2)}</td>
                            <td className="p-2 border text-right">₹{item.totalTax.toFixed(2)}</td>
                            <td className="p-2 border text-right font-semibold">₹{item.finalAmount.toFixed(2)}</td>
                            <td className="p-2 border text-center">
                              <Button 
                                type="button" 
                                size="sm" 
                                variant="outline" 
                                onClick={() => removeItem(index)}
                              >
                                Remove
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Bill Summary */}
                  <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Subtotal:</span>
                        <div className="font-semibold">₹{totals.subtotal.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Discount:</span>
                        <div className="font-semibold">₹{totals.totalDiscount.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Total CGST:</span>
                        <div className="font-semibold">₹{totals.totalCGST.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Total SGST:</span>
                        <div className="font-semibold">₹{totals.totalSGST.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total Tax:</span>
                        <span className="text-lg font-bold">₹{totals.totalTax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xl font-bold text-green-600">
                        <span>Final Amount:</span>
                        <span>₹{totals.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {billItems.length > 0 && (
              <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="px-8 py-3 text-lg">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {loading ? 'Generating Bill...' : 'Generate GST Bill'}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const Bills = () => {
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const response = await axios.get(`${API}/spare-parts/bills`);
      setBills(extractData(response));
    } catch (error) {
      toast.error('Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBill = (bill) => {
    setSelectedBill(bill);
    setShowViewModal(true);
  };

  const handleDeleteBill = async (bill) => {
    const ok = await confirm({
      title: `Delete bill "${bill.bill_number}"?`,
      description: 'This action cannot be undone.',
      confirmLabel: 'Delete Bill',
    });
    if (!ok) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/spare-parts/bills/${bill.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove from local state
      const updatedBills = bills.filter(b => b.id !== bill.id);
      setBills(updatedBills);
      
      toast.success('Spare parts bill deleted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete spare parts bill');
    }
  };

  const handlePrintBill = (bill) => {
    // Create a new window with professional bill design for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Spare Parts Bill - ${bill.bill_number}</title>
          <style>
            @media print {
              @page { 
                size: A4;
                margin: 10mm;
              }
              body { margin: 0; }
            }
            body { 
              font-family: Arial, sans-serif; 
              padding: 15px; 
              max-width: 190mm;
              margin: 0 auto; 
              background: white;
              color: #333;
              font-size: 10px;
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #333; 
              padding-bottom: 10px; 
              margin-bottom: 15px; 
            }
            .company-name { 
              font-size: 20px; 
              font-weight: bold; 
              margin-bottom: 3px;
              color: #333;
            }
            .company-info {
              font-size: 9px;
              color: #666;
              line-height: 1.4;
            }
            .bill-title {
              background: #f0f0f0;
              padding: 8px;
              margin-bottom: 12px;
              border-left: 3px solid #333;
            }
            .bill-title h2 {
              margin: 0;
              font-size: 14px;
              color: #333;
            }
            .details-grid {
              display: table;
              width: 100%;
              margin-bottom: 12px;
            }
            .details-col {
              display: table-cell;
              width: 50%;
              vertical-align: top;
              padding: 0 5px;
            }
            .detail-item {
              margin-bottom: 6px;
            }
            .detail-label {
              font-size: 8px;
              color: #666;
              font-weight: 600;
              margin-bottom: 2px;
            }
            .detail-value {
              font-size: 10px;
              color: #333;
              font-weight: 500;
            }
            table.items { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 15px; 
              font-size: 8px;
            }
            table.items thead {
              background: #333;
              color: white;
            }
            table.items th { 
              padding: 5px 2px;
              text-align: left; 
              font-weight: 600;
              font-size: 7px;
            }
            table.items td { 
              padding: 4px 2px;
              border-bottom: 1px solid #ddd;
              font-size: 8px;
            }
            table.items tbody tr:nth-child(even) {
              background: #f8f8f8;
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .totals-section {
              margin-top: 15px;
              border-top: 2px solid #333;
              padding-top: 10px;
            }
            .totals-table {
              width: 200px;
              margin-left: auto;
              font-size: 9px;
            }
            .totals-table td {
              padding: 3px 5px;
            }
            .total-row-final {
              background: #333;
              color: white;
              font-weight: bold;
              font-size: 11px;
            }
            .footer {
              margin-top: 15px;
              padding-top: 10px;
              border-top: 1px solid #ddd;
              font-size: 8px;
              color: #666;
              text-align: center;
            }
            /* Column width optimization for A4 */
            .col-sl { width: 4%; }
            .col-desc { width: 20%; }
            .col-hsn { width: 10%; }
            .col-qty { width: 5%; }
            .col-unit { width: 6%; }
            .col-rate { width: 10%; }
            .col-disc { width: 7%; }
            .col-gst { width: 7%; }
            .col-cgst { width: 10%; }
            .col-sgst { width: 10%; }
            .col-amt { width: 11%; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">M M MOTORS</div>
            <div class="company-info">Two Wheeler Sales & Service Center</div>
            <div class="company-info">Bengaluru main road, behind Ruchi Bakery, Malur, Karnataka 563130</div>
            <div class="company-info">Phone: +91 7026263123</div>
          </div>
          
          <div class="bill-title">
            <h2>SPARE PARTS BILL</h2>
          </div>
          
          <div class="details-grid">
            <div class="details-col">
              <div class="detail-item">
                <div class="detail-label">BILL NO.</div>
                <div class="detail-value">${bill.bill_number}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">CUSTOMER</div>
                <div class="detail-value">${bill.customer_data?.name || 'N/A'}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">MOBILE</div>
                <div class="detail-value">${bill.customer_data?.mobile || 'N/A'}</div>
              </div>
            </div>
            <div class="details-col">
              <div class="detail-item">
                <div class="detail-label">DATE</div>
                <div class="detail-value">${new Date(bill.bill_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              </div>
              ${bill.customer_data?.vehicle_name ? `
              <div class="detail-item">
                <div class="detail-label">VEHICLE</div>
                <div class="detail-value">${bill.customer_data.vehicle_name}</div>
              </div>
              ` : ''}
              ${bill.customer_data?.vehicle_number ? `
              <div class="detail-item">
                <div class="detail-label">REG. NO.</div>
                <div class="detail-value">${bill.customer_data.vehicle_number}</div>
              </div>
              ` : ''}
            </div>
          </div>
          
          <table class="items">
            <thead>
              <tr>
                <th class="col-sl">SL</th>
                <th class="col-desc">DESCRIPTION</th>
                <th class="col-hsn text-center">HSN</th>
                <th class="col-qty text-center">QTY</th>
                <th class="col-unit text-center">UNIT</th>
                <th class="col-rate text-right">RATE</th>
                <th class="col-disc text-right">DISC%</th>
                <th class="col-gst text-right">GST%</th>
                <th class="col-cgst text-right">CGST</th>
                <th class="col-sgst text-right">SGST</th>
                <th class="col-amt text-right">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items.map((item, index) => `
                <tr>
                  <td class="col-sl">${index + 1}</td>
                  <td class="col-desc">${item.description}</td>
                  <td class="col-hsn text-center">${item.hsn_sac}</td>
                  <td class="col-qty text-center">${item.quantity}</td>
                  <td class="col-unit text-center">${item.unit}</td>
                  <td class="col-rate text-right">₹${item.rate.toFixed(2)}</td>
                  <td class="col-disc text-right">${item.discount_percent}%</td>
                  <td class="col-gst text-right">${item.gst_percent}%</td>
                  <td class="col-cgst text-right">₹${item.cgstAmount.toFixed(2)}</td>
                  <td class="col-sgst text-right">₹${item.sgstAmount.toFixed(2)}</td>
                  <td class="col-amt text-right"><strong>₹${item.finalAmount.toFixed(2)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals-section">
            <table class="totals-table">
              <tr>
                <td style="color: #666;">Subtotal:</td>
                <td class="text-right" style="font-weight: bold;">₹${bill.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="color: #666;">Discount:</td>
                <td class="text-right" style="font-weight: bold; color: #dc3545;">-₹${bill.total_discount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="color: #666;">CGST:</td>
                <td class="text-right" style="font-weight: bold;">₹${bill.total_cgst.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="color: #666;">SGST:</td>
                <td class="text-right" style="font-weight: bold;">₹${bill.total_sgst.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="color: #666; border-top: 1px solid #ddd; padding-top: 5px;">Total Tax:</td>
                <td class="text-right" style="font-weight: bold; border-top: 1px solid #ddd; padding-top: 5px;">₹${bill.total_tax.toFixed(2)}</td>
              </tr>
              <tr class="total-row-final">
                <td style="padding: 8px 5px;">TOTAL:</td>
                <td class="text-right" style="padding: 8px 5px;">₹${bill.total_amount.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <div class="footer">
            <p style="margin: 3px 0;">Thank you for your business!</p>
            <p style="margin: 3px 0;">This is a computer-generated bill.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadBill = async (bill) => {
    try {
      // Import html2pdf dynamically
      const { default: html2pdf } = await import('html2pdf.js');
      
      // Create A4-optimized template using tables
      const billHTML = `
        <div style="font-family: Arial, sans-serif; padding: 15px; width: 190mm; font-size: 10px;">
          <!-- Header -->
          <table style="width: 100%; margin-bottom: 12px; border-bottom: 2px solid #333;">
            <tr>
              <td style="text-align: center; padding-bottom: 8px;">
                <div style="font-size: 18px; font-weight: bold; margin-bottom: 3px;">M M MOTORS</div>
                <div style="font-size: 9px; color: #666;">Two Wheeler Sales & Service Center</div>
                <div style="font-size: 9px; color: #666;">Bengaluru main road, behind Ruchi Bakery, Malur, Karnataka 563130</div>
                <div style="font-size: 9px; color: #666;">Phone: +91 7026263123</div>
              </td>
            </tr>
          </table>
          
          <!-- Bill Title -->
          <table style="width: 100%; margin-bottom: 10px;">
            <tr>
              <td style="background: #f0f0f0; padding: 6px; border-left: 3px solid #333;">
                <div style="font-size: 13px; font-weight: bold;">SPARE PARTS BILL</div>
              </td>
            </tr>
          </table>
          
          <!-- Bill Details -->
          <table style="width: 100%; margin-bottom: 12px;">
            <tr>
              <td style="width: 50%; vertical-align: top; padding-right: 5px;">
                <table style="width: 100%;">
                  <tr><td style="font-size: 7px; color: #666; padding: 2px 0;">BILL NO.</td></tr>
                  <tr><td style="font-size: 9px; font-weight: bold; padding-bottom: 5px;">${bill.bill_number}</td></tr>
                  <tr><td style="font-size: 7px; color: #666; padding: 2px 0;">CUSTOMER</td></tr>
                  <tr><td style="font-size: 9px; padding-bottom: 5px;">${bill.customer_data?.name || 'N/A'}</td></tr>
                  <tr><td style="font-size: 7px; color: #666; padding: 2px 0;">MOBILE</td></tr>
                  <tr><td style="font-size: 9px; padding-bottom: 5px;">${bill.customer_data?.mobile || 'N/A'}</td></tr>
                </table>
              </td>
              <td style="width: 50%; vertical-align: top; padding-left: 5px;">
                <table style="width: 100%;">
                  <tr><td style="font-size: 7px; color: #666; padding: 2px 0;">DATE</td></tr>
                  <tr><td style="font-size: 9px; padding-bottom: 5px;">${new Date(bill.bill_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td></tr>
                  ${bill.customer_data?.vehicle_name ? `
                  <tr><td style="font-size: 7px; color: #666; padding: 2px 0;">VEHICLE</td></tr>
                  <tr><td style="font-size: 9px; padding-bottom: 5px;">${bill.customer_data.vehicle_name}</td></tr>
                  ` : ''}
                  ${bill.customer_data?.vehicle_number ? `
                  <tr><td style="font-size: 7px; color: #666; padding: 2px 0;">REG. NO.</td></tr>
                  <tr><td style="font-size: 9px; padding-bottom: 5px;">${bill.customer_data.vehicle_number}</td></tr>
                  ` : ''}
                </table>
              </td>
            </tr>
          </table>
          
          <!-- Items Table - Optimized for A4 -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 7px;">
            <thead>
              <tr style="background: #333; color: white;">
                <th style="padding: 5px 2px; text-align: left; border: 1px solid #333; width: 4%;">SL</th>
                <th style="padding: 5px 2px; text-align: left; border: 1px solid #333; width: 20%;">DESCRIPTION</th>
                <th style="padding: 5px 2px; text-align: center; border: 1px solid #333; width: 10%;">HSN</th>
                <th style="padding: 5px 2px; text-align: center; border: 1px solid #333; width: 5%;">QTY</th>
                <th style="padding: 5px 2px; text-align: center; border: 1px solid #333; width: 6%;">UNIT</th>
                <th style="padding: 5px 2px; text-align: right; border: 1px solid #333; width: 10%;">RATE</th>
                <th style="padding: 5px 2px; text-align: right; border: 1px solid #333; width: 7%;">DISC%</th>
                <th style="padding: 5px 2px; text-align: right; border: 1px solid #333; width: 7%;">GST%</th>
                <th style="padding: 5px 2px; text-align: right; border: 1px solid #333; width: 10%;">CGST</th>
                <th style="padding: 5px 2px; text-align: right; border: 1px solid #333; width: 10%;">SGST</th>
                <th style="padding: 5px 2px; text-align: right; border: 1px solid #333; width: 11%;">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items.map((item, index) => `
                <tr style="${index % 2 === 0 ? 'background: #f8f8f8;' : ''}">
                  <td style="padding: 4px 2px; border: 1px solid #ddd;">${index + 1}</td>
                  <td style="padding: 4px 2px; border: 1px solid #ddd; font-size: 7px;">${item.description}</td>
                  <td style="padding: 4px 2px; text-align: center; border: 1px solid #ddd;">${item.hsn_sac}</td>
                  <td style="padding: 4px 2px; text-align: center; border: 1px solid #ddd;">${item.quantity}</td>
                  <td style="padding: 4px 2px; text-align: center; border: 1px solid #ddd;">${item.unit}</td>
                  <td style="padding: 4px 2px; text-align: right; border: 1px solid #ddd;">₹${item.rate.toFixed(2)}</td>
                  <td style="padding: 4px 2px; text-align: right; border: 1px solid #ddd;">${item.discount_percent}%</td>
                  <td style="padding: 4px 2px; text-align: right; border: 1px solid #ddd;">${item.gst_percent}%</td>
                  <td style="padding: 4px 2px; text-align: right; border: 1px solid #ddd;">₹${item.cgstAmount.toFixed(2)}</td>
                  <td style="padding: 4px 2px; text-align: right; border: 1px solid #ddd;">₹${item.sgstAmount.toFixed(2)}</td>
                  <td style="padding: 4px 2px; text-align: right; font-weight: bold; border: 1px solid #ddd;">₹${item.finalAmount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <!-- Totals -->
          <table style="width: 100%; margin-top: 12px; border-top: 2px solid #333; padding-top: 8px;">
            <tr>
              <td style="width: 50%;"></td>
              <td style="width: 50%;">
                <table style="width: 100%; font-size: 8px;">
                  <tr>
                    <td style="padding: 2px 0; color: #666;">Subtotal:</td>
                    <td style="padding: 2px 0; text-align: right; font-weight: bold;">₹${bill.subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 2px 0; color: #666;">Discount:</td>
                    <td style="padding: 2px 0; text-align: right; font-weight: bold; color: #dc3545;">-₹${bill.total_discount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 2px 0; color: #666;">CGST:</td>
                    <td style="padding: 2px 0; text-align: right; font-weight: bold;">₹${bill.total_cgst.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 2px 0; color: #666;">SGST:</td>
                    <td style="padding: 2px 0; text-align: right; font-weight: bold;">₹${bill.total_sgst.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 2px 0; color: #666; border-top: 1px solid #ddd; padding-top: 3px;">Total Tax:</td>
                    <td style="padding: 2px 0; text-align: right; font-weight: bold; border-top: 1px solid #ddd; padding-top: 3px;">₹${bill.total_tax.toFixed(2)}</td>
                  </tr>
                  <tr style="background: #333; color: white;">
                    <td style="padding: 6px 3px; font-weight: bold; font-size: 10px;">TOTAL:</td>
                    <td style="padding: 6px 3px; text-align: right; font-weight: bold; font-size: 10px;">₹${bill.total_amount.toFixed(2)}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          
          <!-- Footer -->
          <table style="width: 100%; margin-top: 15px; border-top: 1px solid #ddd; padding-top: 8px;">
            <tr>
              <td style="text-align: center; font-size: 8px; color: #666;">
                <div style="margin: 2px 0;">Thank you for your business!</div>
                <div style="margin: 2px 0;">This is a computer-generated bill.</div>
              </td>
            </tr>
          </table>
        </div>
      `;
      
      // Create element
      const element = document.createElement('div');
      element.innerHTML = billHTML;
      
      // PDF options optimized for A4
      const opt = {
        margin: 10,
        filename: `${bill.bill_number}_${bill.customer_data?.name || 'Customer'}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { 
          scale: 2,
          logging: false,
          useCORS: true,
          width: 720  // Approximately A4 width
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' 
        }
      };
      
      // Generate PDF directly without adding to DOM
      await html2pdf().set(opt).from(element).save();
      
      toast.success('Bill PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="spinner"></div></div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Spare Parts Bills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold">Bill Number</th>
                  <th className="text-left p-3 font-semibold">Date</th>
                  <th className="text-left p-3 font-semibold">Customer Name</th>
                  <th className="text-left p-3 font-semibold">Mobile</th>
                  <th className="text-left p-3 font-semibold">Vehicle</th>
                  <th className="text-left p-3 font-semibold">Items</th>
                  <th className="text-left p-3 font-semibold">Total Amount</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-mono">{bill.bill_number}</td>
                    <td className="p-3">{new Date(bill.bill_date).toLocaleDateString('en-IN')}</td>
                    <td className="p-3 font-medium">
                      {bill.customer_data?.name || 'N/A'}
                    </td>
                    <td className="p-3">
                      {bill.customer_data?.mobile || 'N/A'}
                    </td>
                    <td className="p-3">
                      {bill.customer_data?.vehicle_name && bill.customer_data?.vehicle_number
                        ? `${bill.customer_data.vehicle_name} (${bill.customer_data.vehicle_number})`
                        : bill.customer_data?.vehicle_name || bill.customer_data?.vehicle_number || 'N/A'
                      }
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="outline">
                        {bill.items.length} items
                      </Badge>
                    </td>
                    <td className="p-3 font-semibold text-green-600">₹{bill.total_amount.toFixed(2)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewBill(bill)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
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
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => sendSparePartsBill(
                            bill.customer_data?.name,
                            bill.customer_data?.mobile,
                            bill.bill_number,
                            bill.total_amount,
                            bill.items
                          )}
                          title="Send bill via WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteBill(bill)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* View Bill Modal */}
    {showViewModal && selectedBill && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Bill Details - {selectedBill.bill_number}</h2>
              <Button 
                variant="outline" 
                onClick={() => setShowViewModal(false)}
              >
                Close
              </Button>
            </div>

            <div className="space-y-6">
              {/* Bill Header */}
              <div className="text-center border-b pb-4">
                <h3 className="text-xl font-bold">M M MOTORS</h3>
                <p className="text-gray-600">Bengaluru main road, behind Ruchi Bakery</p>
                <p className="text-gray-600">Malur, Karnataka 563130</p>
              </div>

              {/* Bill Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-600">Bill Information</h4>
                  <p><strong>Bill Number:</strong> {selectedBill.bill_number}</p>
                  <p><strong>Date:</strong> {new Date(selectedBill.bill_date).toLocaleDateString('en-IN')}</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-600">Customer Details</h4>
                  <p><strong>Name:</strong> {selectedBill.customer_data?.name || 'N/A'}</p>
                  <p><strong>Mobile:</strong> {selectedBill.customer_data?.mobile || 'N/A'}</p>
                  {selectedBill.customer_data?.vehicle_name && (
                    <p><strong>Vehicle:</strong> {selectedBill.customer_data.vehicle_name} {selectedBill.customer_data.vehicle_number ? `(${selectedBill.customer_data.vehicle_number})` : ''}</p>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-semibold text-blue-600 mb-3">Bill Items</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border p-2 text-left">Sl. No.</th>
                        <th className="border p-2 text-left">Description</th>
                        <th className="border p-2 text-left">HSN/SAC</th>
                        <th className="border p-2 text-left">Qty</th>
                        <th className="border p-2 text-left">Unit</th>
                        <th className="border p-2 text-left">Rate</th>
                        <th className="border p-2 text-left">Disc%</th>
                        <th className="border p-2 text-left">GST%</th>
                        <th className="border p-2 text-left">CGST</th>
                        <th className="border p-2 text-left">SGST</th>
                        <th className="border p-2 text-left">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBill.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border p-2 text-center">{index + 1}</td>
                          <td className="border p-2">{item.description}</td>
                          <td className="border p-2">{item.hsn_sac}</td>
                          <td className="border p-2 text-right">{item.quantity}</td>
                          <td className="border p-2">{item.unit}</td>
                          <td className="border p-2 text-right">₹{item.rate.toFixed(2)}</td>
                          <td className="border p-2 text-right">{item.discount_percent}%</td>
                          <td className="border p-2 text-right">{item.gst_percent}%</td>
                          <td className="border p-2 text-right">₹{item.cgstAmount.toFixed(2)}</td>
                          <td className="border p-2 text-right">₹{item.sgstAmount.toFixed(2)}</td>
                          <td className="border p-2 text-right font-semibold">₹{item.finalAmount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Subtotal:</span>
                    <div className="font-semibold">₹{selectedBill.subtotal.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Discount:</span>
                    <div className="font-semibold">₹{selectedBill.total_discount.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Total CGST:</span>
                    <div className="font-semibold">₹{selectedBill.total_cgst.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Total SGST:</span>
                    <div className="font-semibold">₹{selectedBill.total_sgst.toFixed(2)}</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Tax:</span>
                    <span className="text-lg font-bold">₹{selectedBill.total_tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xl font-bold text-green-600">
                    <span>Final Amount:</span>
                    <span>₹{selectedBill.total_amount.toFixed(2)}</span>
                  </div>
                </div>
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
    <>
      <ConfirmDialogComponent />
    </>
  );
};

const LowStock = () => {
  const [lowStockParts, setLowStockParts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLowStockParts();
  }, []);

  const fetchLowStockParts = async () => {
    try {
      const response = await axios.get(`${API}/spare-parts?low_stock=true&limit=4000`);
      setLowStockParts(extractData(response));
    } catch (error) {
      toast.error('Failed to fetch low stock parts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="spinner"></div></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          Low Stock Alert ({lowStockParts.length} parts)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {lowStockParts.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Low Stock Items</h3>
            <p className="text-gray-500">All spare parts are adequately stocked!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Part Name</th>
                  <th className="text-left p-2">Part Number</th>
                  <th className="text-left p-2">Brand</th>
                  <th className="text-left p-2">Current Stock</th>
                  <th className="text-left p-2">Threshold</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockParts.map((part) => (
                  <tr key={part.id} className="border-b hover:bg-red-50">
                    <td className="p-2 font-medium">{part.name}</td>
                    <td className="p-2">{part.part_number}</td>
                    <td className="p-2">{part.brand}</td>
                    <td className="p-2 text-red-600 font-semibold">{part.quantity}</td>
                    <td className="p-2">{part.low_stock_threshold}</td>
                    <td className="p-2">
                      <Badge variant="destructive">Low Stock</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const SparePartsReports = () => {
  const [reportData, setReportData] = useState({
    totalParts: 0,
    totalValue: 0,
    topSellingParts: [],
    lowStockCount: 0,
    monthlyBills: 0,
    monthlyRevenue: 0,
    brandAnalysis: [],
    inventoryTurnover: 0
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      const [partsResponse, billsResponse] = await Promise.all([
        axios.get(`${API}/spare-parts?limit=4000`),
        axios.get(`${API}/spare-parts/bills`)
      ]);

      const parts = extractData(partsResponse);
      const bills = extractData(billsResponse);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(dateRange));

      // Filter bills by date range
      const recentBills = bills.filter(bill => {
        const billDate = new Date(bill.bill_date);
        return billDate >= startDate && billDate <= endDate;
      });

      // Calculate total parts and value
      const totalValue = parts.reduce((sum, part) => sum + (part.quantity * part.unit_price), 0);
      const lowStockCount = parts.filter(part => part.quantity <= part.low_stock_threshold).length;

      // Calculate monthly revenue
      const monthlyRevenue = recentBills.reduce((sum, bill) => sum + bill.total_amount, 0);

      // Brand analysis
      const brandMap = {};
      parts.forEach(part => {
        if (!brandMap[part.brand]) {
          brandMap[part.brand] = {
            brand: part.brand,
            partCount: 0,
            totalValue: 0,
            avgPrice: 0
          };
        }
        brandMap[part.brand].partCount += 1;
        brandMap[part.brand].totalValue += (part.quantity * part.unit_price);
      });

      const brandAnalysis = Object.values(brandMap).map(brand => ({
        ...brand,
        avgPrice: brand.totalValue / brand.partCount
      })).sort((a, b) => b.totalValue - a.totalValue);

      // Top selling parts (based on recent bills)
      const partSalesMap = {};
      recentBills.forEach(bill => {
        bill.items.forEach(item => {
          if (!partSalesMap[item.description]) {
            partSalesMap[item.description] = {
              name: item.description,
              quantitySold: 0,
              revenue: 0
            };
          }
          partSalesMap[item.description].quantitySold += item.qty;
          partSalesMap[item.description].revenue += item.amount;
        });
      });

      const topSellingParts = Object.values(partSalesMap)
        .sort((a, b) => b.quantitySold - a.quantitySold)
        .slice(0, 5);

      setReportData({
        totalParts: parts.length,
        totalValue,
        topSellingParts,
        lowStockCount,
        monthlyBills: recentBills.length,
        monthlyRevenue,
        brandAnalysis: brandAnalysis.slice(0, 5),
        inventoryTurnover: totalValue > 0 ? (monthlyRevenue / totalValue * 12).toFixed(2) : 0
      });

    } catch (error) {
      toast.error('Failed to fetch report data');
    } finally {
      setLoading(false);
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
          <h2 className="text-2xl font-bold text-gray-900">Spare Parts Reports</h2>
          <p className="text-gray-600">Analytics and insights for spare parts business</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchReportData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Parts</p>
                <p className="text-2xl font-bold text-blue-600">{reportData.totalParts}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                <p className="text-2xl font-bold text-green-600">₹{reportData.totalValue.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bills ({dateRange} days)</p>
                <p className="text-2xl font-bold text-purple-600">{reportData.monthlyBills}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue ({dateRange} days)</p>
                <p className="text-2xl font-bold text-orange-600">₹{reportData.monthlyRevenue.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Parts */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Parts ({dateRange} days)</CardTitle>
          </CardHeader>
          <CardContent>
            {reportData.topSellingParts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No sales data available for the selected period
              </div>
            ) : (
              <div className="space-y-4">
                {reportData.topSellingParts.map((part, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{part.name}</p>
                      <p className="text-sm text-gray-600">Qty: {part.quantitySold}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">₹{part.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Brand Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Top Brands by Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.brandAnalysis.map((brand, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{brand.brand}</p>
                    <p className="text-sm text-gray-600">{brand.partCount} parts</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">₹{brand.totalValue.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Avg: ₹{brand.avgPrice.toFixed(0)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{reportData.lowStockCount}</p>
              <p className="text-gray-600">Parts below threshold</p>
              {reportData.lowStockCount > 0 && (
                <Button className="mt-3" variant="outline" size="sm">
                  View Low Stock Items
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Turnover</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{reportData.inventoryTurnover}x</p>
              <p className="text-gray-600">Annual turnover rate</p>
              <p className="text-sm text-gray-500 mt-2">
                {reportData.inventoryTurnover > 4 ? 'Excellent' : 
                 reportData.inventoryTurnover > 2 ? 'Good' : 'Needs Improvement'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full" variant="outline">
                Export Report
              </Button>
              <Button className="w-full" variant="outline">
                Print Summary
              </Button>
              <Button className="w-full" variant="outline">
                Email Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SpareParts;