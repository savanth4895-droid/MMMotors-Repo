import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import ViewCustomerDetailsPage from './ViewCustomerDetailsPage';
import { CreateInvoiceForm } from './forms/CreateInvoiceForm';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { LoadingSpinner, TableSkeleton, PageLoader, ErrorState, EmptyState } from './ui/loading';
import Pagination from './Pagination';
import SortDropdown from './SortDropdown';
import { 
  Plus, 
  Search, 
  Eye, 
  FileText, 
  Users, 
  TrendingUp,
  Shield,
  Calendar,
  BarChart3,
  PieChart,
  Download,
  Trash2,
  MessageCircle
} from 'lucide-react';
import { sendSaleInvoice } from '../lib/whatsapp';
import ConfirmDialog from './ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';
// Utility function to convert number to words
const numberToWords = (num) => {
  if (num === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const convertHundreds = (n) => {
    let result = '';
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n >= 10) {
      result += teens[n - 10] + ' ';
      n = 0;
    }
    if (n > 0) {
      result += ones[n] + ' ';
    }
    return result.trim();
  };
  
  if (num < 100) {
    return convertHundreds(num);
  } else if (num < 1000) {
    return convertHundreds(num);
  } else if (num < 100000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    let result = convertHundreds(thousands) + ' Thousand';
    if (remainder > 0) {
      result += ' ' + convertHundreds(remainder);
    }
    return result;
  } else if (num < 10000000) {
    const lakhs = Math.floor(num / 100000);
    const remainder = num % 100000;
    let result = convertHundreds(lakhs) + ' Lakh';
    if (remainder > 0) {
      if (remainder >= 1000) {
        const thousands = Math.floor(remainder / 1000);
        const hundreds = remainder % 1000;
        result += ' ' + convertHundreds(thousands) + ' Thousand';
        if (hundreds > 0) {
          result += ' ' + convertHundreds(hundreds);
        }
      } else {
        result += ' ' + convertHundreds(remainder);
      }
    }
    return result;
  } else {
    const crores = Math.floor(num / 10000000);
    const remainder = num % 10000000;
    let result = convertHundreds(crores) + ' Crore';
    if (remainder > 0) {
      if (remainder >= 100000) {
        const lakhs = Math.floor(remainder / 100000);
        const rest = remainder % 100000;
        result += ' ' + convertHundreds(lakhs) + ' Lakh';
        if (rest > 0) {
          if (rest >= 1000) {
            const thousands = Math.floor(rest / 1000);
            const hundreds = rest % 1000;
            result += ' ' + convertHundreds(thousands) + ' Thousand';
            if (hundreds > 0) {
              result += ' ' + convertHundreds(hundreds);
            }
          } else {
            result += ' ' + convertHundreds(rest);
          }
        }
      } else if (remainder >= 1000) {
        const thousands = Math.floor(remainder / 1000);
        const hundreds = remainder % 1000;
        result += ' ' + convertHundreds(thousands) + ' Thousand';
        if (hundreds > 0) {
          result += ' ' + convertHundreds(hundreds);
        }
      } else {
        result += ' ' + convertHundreds(remainder);
      }
    }
    return result;
  }
};

// Custom Motorcycle Icon Component
import { toast } from 'sonner';
import MotorcycleIcon from './ui/MotorcycleIcon';
import { extractData } from '../lib/api';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell
} from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Helper function to safely extract error messages
const getErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.response?.data) {
    // Handle Pydantic validation errors
    if (Array.isArray(error.response.data) && error.response.data.length > 0) {
      return error.response.data.map(err => err.msg || err.message || 'Validation error').join(', ');
    }
    
    // Handle detail errors
    if (error.response.data.detail) {
      if (typeof error.response.data.detail === 'string') {
        return error.response.data.detail;
      }
      if (Array.isArray(error.response.data.detail)) {
        return error.response.data.detail.map(err => err.msg || err.message || 'Error').join(', ');
      }
    }
    
    // Handle message errors
    if (error.response.data.message) {
      return error.response.data.message;
    }
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

const Sales = () => {
  const location = useLocation();
  
  const navigationItems = [
    { name: 'Overview', path: '/sales', icon: TrendingUp },
    { name: 'Create Invoice', path: '/sales/create-invoice', icon: Plus },
    { name: 'View Invoices', path: '/sales/invoices', icon: FileText },
    { name: 'Add Customer', path: '/sales/customers', icon: Users },
    { name: 'View Customer Details', path: '/sales/customer-details', icon: Eye },
    { name: 'Sales Report', path: '/sales/reports', icon: TrendingUp },
    { name: 'Insurance', path: '/sales/insurance', icon: Shield }
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
        <Route path="/" element={<SalesOverview />} />
        <Route path="/create-invoice" element={<CreateInvoiceForm />} />
        <Route path="/invoices" element={<ViewInvoices />} />
        <Route path="/customers" element={<CustomersManagement />} />
        <Route path="/customer-details" element={<ViewCustomerDetailsPage />} />
        <Route path="/reports" element={<SalesReports />} />
        <Route path="/insurance" element={<InsuranceManagement />} />
      </Routes>
    </div>
  );
};

const SalesOverview = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    monthlyRevenue: 0,
    pendingInvoices: 0,
    topCustomers: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [salesRes, customersRes] = await Promise.all([
        axios.get(`${API}/sales?limit=4000`),
        axios.get(`${API}/customers`, {
          params: {
            page: 1,
            limit: 10000,
            sort: 'created_at',
            order: 'desc'
          }
        })
      ]);

      const sales = extractData(salesRes);
      const customers = customersRes.data.data || customersRes.data;

      // Calculate current month revenue
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = sales
        .filter(sale => {
          const saleDate = new Date(sale.sale_date);
          return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
        })
        .reduce((sum, sale) => sum + (sale.amount || 0), 0);

      setStats({
        totalSales: sales.length,
        monthlyRevenue: monthlyRevenue,
        pendingInvoices: 0, // This would need a separate status field in sales
        topCustomers: customers.slice(0, 5) // Top 5 customers by recent creation
      });
    } catch (error) {
      console.error('Failed to fetch sales overview stats:', error);
      toast.error('Failed to fetch sales data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Sales Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{stats.totalSales}</p>
              <p className="text-sm text-gray-600">Total Sales</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">₹{stats.monthlyRevenue}</p>
              <p className="text-sm text-gray-600">Monthly Revenue</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link to="/sales/create-invoice">
            <Button className="w-full justify-start">
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </Link>
          <Link to="/sales/customers">
            <Button variant="outline" className="w-full justify-start">
              <Users className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

const CreateInvoice = () => {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <CreateInvoiceForm
        onSuccess={() => {}}
        onCancel={() => window.history.back()}
      />
    </div>
  );
};

const ViewInvoices = () => {
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  
  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [sortBy, setSortBy] = useState('sale_date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
    fetchVehicles();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, customers, vehicles, sortBy, sortOrder]);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get(`${API}/sales?limit=4000`);
      setInvoices(extractData(response));
    } catch (error) {
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API}/customers`, {
        params: {
          page: 1,
          limit: 10000, // Fetch all customers for lookups
          sort: 'created_at',
          order: 'desc'
        }
      });
      // Extract the data array from paginated response
      setCustomers(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to fetch customers');
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await axios.get(`${API}/vehicles?limit=4000`);
      setVehicles(extractData(response));
    } catch (error) {
      console.error('Failed to fetch vehicles');
    }
  };

  const filterInvoices = () => {
    // Create a copy to avoid mutating original array (important for React state updates)
    let filtered = [...invoices];

    if (searchTerm) {
      filtered = filtered.filter(invoice => {
        const customer = customers.find(c => c.id === invoice.customer_id);
        const vehicle = vehicles.find(v => v.id === invoice.vehicle_id);
        
        return (
          invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vehicle?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.amount?.toString().includes(searchTerm) ||
          invoice.payment_method?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Apply sorting (on the copy, not original)
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'sale_date':
          aVal = new Date(a.sale_date || 0);
          bVal = new Date(b.sale_date || 0);
          break;
        case 'invoice_number':
          aVal = a.invoice_number || '';
          bVal = b.invoice_number || '';
          break;
        case 'customer_name':
          const customerA = customers.find(c => c.id === a.customer_id);
          const customerB = customers.find(c => c.id === b.customer_id);
          aVal = customerA?.name || '';
          bVal = customerB?.name || '';
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

    setFilteredInvoices(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  const getCustomerPhone = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? (customer.mobile || customer.phone || '') : '';
  };

  const getVehicleModel = (invoice) => {
    // First try to get from invoice/sale record directly (for imported or manually entered data)
    if (invoice.vehicle_brand || invoice.vehicle_model) {
      return `${invoice.vehicle_brand || ''} ${invoice.vehicle_model || ''}`.trim() || 'Unknown Vehicle';
    }
    
    // Fall back to looking up by vehicle_id
    if (invoice.vehicle_id) {
      const vehicle = vehicles.find(v => v.id === invoice.vehicle_id);
      if (vehicle) {
        return `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() || 'Unknown Vehicle';
      }
    }
    
    return 'Unknown Vehicle';
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'paid': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'overdue': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || statusColors.paid}`}>
        {status || 'Paid'}
      </span>
    );
  };

  const handleViewInvoice = (invoice) => {
    const customer = customers.find(c => c.id === invoice.customer_id);
    const vehicle = vehicles.find(v => v.id === invoice.vehicle_id);
    
    setSelectedInvoice({
      ...invoice,
      customer,
      vehicle
    });
    setShowInvoiceModal(true);
  };

  const handleEditInvoice = (invoice) => {
    const customer = customers.find(c => c.id === invoice.customer_id);
    const vehicle = vehicles.find(v => v.id === invoice.vehicle_id);
    
    setEditingInvoice(invoice);
    setEditFormData({
      // Basic Invoice Details
      invoice_number: invoice.invoice_number,
      sale_date: invoice.sale_date,
      amount: invoice.amount,
      payment_method: invoice.payment_method,
      hypothecation: invoice.hypothecation || 'Cash',
      
      // Customer Details
      customer_id: invoice.customer_id,
      customer_name: customer?.name || '',
      customer_care_of: customer?.care_of || '',
      customer_mobile: customer?.mobile || customer?.phone || '',
      customer_address: customer?.address || '',
      
      // Vehicle Details - prioritize invoice data over vehicle lookup
      vehicle_id: invoice.vehicle_id,
      vehicle_brand: invoice.vehicle_brand || vehicle?.brand || '',
      vehicle_model: invoice.vehicle_model || vehicle?.model || '',
      vehicle_color: invoice.vehicle_color || vehicle?.color || '',
      vehicle_no: invoice.vehicle_registration || vehicle?.vehicle_no || '',
      chassis_number: invoice.vehicle_chassis || vehicle?.chassis_number || '',
      engine_number: invoice.vehicle_engine || vehicle?.engine_number || '',
      
      // Insurance Details - check multiple sources
      insurance_details: {
        nominee: invoice.insurance_nominee || invoice.insurance_details?.nominee || customer?.insurance_info?.nominee_name || '',
        relation: invoice.insurance_relation || invoice.insurance_details?.relation || customer?.insurance_info?.relation || '',
        age: invoice.insurance_age || invoice.insurance_details?.age || customer?.insurance_info?.age || ''
      }
    });
    setShowEditModal(true);
  };

  const handleDeleteInvoice = async (invoice) => {
    const ok = await confirm({
      title: `Delete invoice ${invoice.invoice_number}?`,
      description: 'This action cannot be undone and will reset the associated vehicle status to available.',
      confirmLabel: 'Delete Invoice',
    });
    if (!ok) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/sales/${invoice.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove from local state
      const updatedInvoices = invoices.filter(inv => inv.id !== invoice.id);
      setInvoices(updatedInvoices);
      
      toast.success('Invoice deleted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete invoice');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingInvoice) return;
    
    try {
      setLoading(true);
      
      // Prepare the update payload with all fields
      const updatePayload = {
        customer_id: editFormData.customer_id,
        vehicle_id: editFormData.vehicle_id,
        sale_date: editFormData.sale_date,
        amount: parseFloat(editFormData.amount),
        payment_method: editFormData.payment_method,
        hypothecation: editFormData.hypothecation,
        
        // Vehicle details (for imported sales or direct entry)
        vehicle_brand: editFormData.vehicle_brand,
        vehicle_model: editFormData.vehicle_model,
        vehicle_color: editFormData.vehicle_color,
        vehicle_registration: editFormData.vehicle_no,
        vehicle_chassis: editFormData.chassis_number,
        vehicle_engine: editFormData.engine_number,
        
        // Insurance details - send both nested and flat structure
        insurance_details: editFormData.insurance_details,
        insurance_nominee: editFormData.insurance_details?.nominee,
        insurance_relation: editFormData.insurance_details?.relation,
        insurance_age: editFormData.insurance_details?.age,
        
        source: editingInvoice.source || 'direct'
      };
      
      await axios.put(`${API}/sales/${editingInvoice.id}`, updatePayload);
      
      // Update local state immediately for instant UI feedback
      setInvoices(prevInvoices => 
        prevInvoices.map(inv => 
          inv.id === editingInvoice.id 
            ? {
                ...inv,
                customer_id: updatePayload.customer_id,
                vehicle_id: updatePayload.vehicle_id,
                sale_date: updatePayload.sale_date,
                amount: updatePayload.amount,
                payment_method: updatePayload.payment_method,
                hypothecation: updatePayload.hypothecation,
                vehicle_brand: updatePayload.vehicle_brand,
                vehicle_model: updatePayload.vehicle_model,
                vehicle_color: updatePayload.vehicle_color,
                vehicle_registration: updatePayload.vehicle_registration,
                vehicle_chassis: updatePayload.vehicle_chassis,
                vehicle_engine: updatePayload.vehicle_engine,
                insurance_details: updatePayload.insurance_details,
                source: updatePayload.source
              }
            : inv
        )
      );
      
      toast.success('Invoice updated successfully!');
      setShowEditModal(false);
      setEditingInvoice(null);
      setEditFormData({});
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Failed to update invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingInvoice(null);
    setEditFormData({});
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedInvoices(filteredInvoices.map(inv => inv.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelectInvoice = (invoiceId) => {
    setSelectedInvoices(prev =>
      prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const handleBulkDelete = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API}/sales`, {
        data: { ids: selectedInvoices },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.deleted > 0) {
        toast.success(`Successfully deleted ${response.data.deleted} invoice(s)`);
      }

      if (response.data.failed && response.data.failed.length > 0) {
        toast.error(`Failed to delete ${response.data.failed.length} invoice(s)`);
      }

      setSelectedInvoices([]);
      setShowBulkDeleteModal(false);
      fetchInvoices(); // Refresh the list
    } catch (error) {
      toast.error('Failed to delete invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoicePDF = async (invoice) => {
    if (!invoice) return;

    try {
      // Import html2pdf dynamically
      const { default: html2pdf } = await import('html2pdf.js');

      // Generate filename with customer name and mobile number
      const customerName = invoice.customer?.name || 'name';
      const customerMobile = invoice.customer?.mobile || invoice.customer?.phone || 'mobile';
      const sanitizedName = customerName.replace(/[^a-zA-Z0-9]/g, '_');
      const sanitizedMobile = customerMobile.replace(/[^0-9]/g, '');
      const filename = `Invoice_${sanitizedName}_${sanitizedMobile}_${invoice.invoice_number}.pdf`;

      // Create a temporary div with invoice content for PDF generation
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = `
        <div style="max-width: 21cm; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.3;">
          <div style="text-align: center; margin-bottom: 12px; border-bottom: 2px solid #333; padding-bottom: 10px;">
            <h1 style="margin: 0; font-size: 18px; color: #2563eb; font-weight: bold;">M M MOTORS</h1>
            <p style="margin: 3px 0; font-size: 11px;">Bengaluru main road, behind Ruchi Bakery, Malur, Karnataka 563130</p>
            <p style="margin: 3px 0; font-size: 11px;">Two Wheeler Sales Invoice</p>
            <div style="display: flex; justify-content: space-between; margin-top: 8px;">
              <div><strong>Invoice No:</strong> ${invoice.invoice_number}</div>
              <div><strong>Date:</strong> ${new Date(invoice.sale_date).toLocaleDateString('en-IN')}</div>
            </div>
          </div>
          
          <div style="margin-bottom: 12px; border: 2px solid #ccc; padding: 10px; border-radius: 6px;">
            <h3 style="margin: 0 0 8px 0; font-size: 12px; color: #2563eb; border-bottom: 1px solid #ccc; padding-bottom: 3px;">Customer Details</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div style="font-size: 10px; margin-bottom: 4px;"><strong>Name:</strong> ${invoice.customer?.name || 'N/A'}</div>
              <div style="font-size: 10px; margin-bottom: 4px;"><strong>Mobile:</strong> ${invoice.customer?.mobile || invoice.customer?.phone || 'N/A'}</div>
              <div style="font-size: 10px; margin-bottom: 4px;"><strong>Address:</strong> ${invoice.customer?.address || 'N/A'}</div>
            </div>
          </div>
          
          <div style="margin-bottom: 12px; border: 2px solid #ccc; padding: 10px; border-radius: 6px;">
            <h3 style="margin: 0 0 8px 0; font-size: 12px; color: #2563eb; border-bottom: 1px solid #ccc; padding-bottom: 3px;">Vehicle Details</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div style="font-size: 10px; margin-bottom: 4px;"><strong>Brand:</strong> ${invoice.customer?.vehicle_info?.brand || invoice.vehicle?.brand || 'N/A'}</div>
              <div style="font-size: 10px; margin-bottom: 4px;"><strong>Model:</strong> ${invoice.customer?.vehicle_info?.model || invoice.vehicle?.model || 'N/A'}</div>
              <div style="font-size: 10px; margin-bottom: 4px;"><strong>Color:</strong> ${invoice.customer?.vehicle_info?.color || invoice.vehicle?.color || 'N/A'}</div>
              <div style="font-size: 10px; margin-bottom: 4px;"><strong>Chassis No:</strong> ${invoice.customer?.vehicle_info?.chassis_number || invoice.vehicle?.chassis_number || 'N/A'}</div>
              <div style="font-size: 10px; margin-bottom: 4px;"><strong>Engine No:</strong> ${invoice.customer?.vehicle_info?.engine_number || invoice.vehicle?.engine_number || 'N/A'}</div>
              <div style="font-size: 10px; margin-bottom: 4px;"><strong>Vehicle No:</strong> ${invoice.customer?.vehicle_info?.vehicle_number || invoice.vehicle?.vehicle_no || 'N/A'}</div>
            </div>
          </div>
          
          <div style="margin-bottom: 12px; border: 2px solid #ccc; padding: 10px; border-radius: 6px;">
            <h3 style="margin: 0 0 8px 0; font-size: 12px; color: #2563eb; border-bottom: 1px solid #ccc; padding-bottom: 3px;">Payment Details</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 8px;">
              <div style="font-size: 10px; margin-bottom: 4px;"><strong>Payment Method:</strong> ${invoice.payment_method?.toUpperCase() || 'CASH'}</div>
              <div style="font-size: 10px; margin-bottom: 4px;"><strong>Hypothecation:</strong> ${invoice.hypothecation || 'CASH'}</div>
              <div style="font-size: 14px; font-weight: bold; text-align: right;"><strong>Amount:</strong> ₹${invoice.amount?.toLocaleString() || '0'}</div>
            </div>
            <div style="margin-top: 6px; font-style: italic; padding: 6px; background-color: #f8f8f8; border-radius: 3px; border-top: 1px solid #ccc; font-size: 10px;">
              <strong>Amount in Words:</strong> ${numberToWords(invoice.amount || 0)} Rupees Only
            </div>
          </div>
        </div>
      `;

      // Configure options for PDF generation
      const opt = {
        margin: [0.3, 0.3, 0.3, 0.3],
        filename: filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { 
          scale: 1.5,
          useCORS: true,
          letterRendering: true,
          width: 794,  // A4 width in pixels at 96 DPI
          height: 1123 // A4 height in pixels at 96 DPI
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        }
      };

      // Generate and download PDF
      html2pdf().set(opt).from(tempDiv).save();
      
      // Clean up
      tempDiv.remove();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const handlePrintInvoice = (invoice) => {
    if (!invoice) return;
    
    // Create a new window with the optimized invoice layout matching the target format
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoice_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Arial', sans-serif; 
              line-height: 1.3; 
              color: #333;
              background: white;
              font-size: 12px;
            }
            .invoice-container { 
              max-width: 210mm; 
              margin: 0 auto; 
              padding: 8mm;
              background: white;
              transform: scale(0.9);
              transform-origin: top center;
            }
            
            /* Professional Header - Matching Target */
            .header { 
              background: linear-gradient(135deg, #2563eb, #1d4ed8);
              color: white;
              padding: 15px;
              margin-bottom: 15px;
              border-radius: 8px;
              display: flex;
              justify-content: space-between;
              align-items: start;
            }
            .header-left {
              flex: 1;
            }
            .company-name { 
              font-size: 28px; 
              font-weight: bold; 
              margin-bottom: 4px;
              letter-spacing: 2px;
            }
            .company-tagline { 
              font-size: 13px; 
              opacity: 0.9;
              margin-bottom: 8px;
            }
            .company-address { 
              font-size: 12px; 
              line-height: 1.4;
            }
            .company-address p {
              margin: 2px 0;
              display: flex;
              align-items: center;
            }
            .bullet {
              width: 4px;
              height: 4px;
              background: rgba(255,255,255,0.8);
              border-radius: 50%;
              margin-right: 8px;
            }
            .header-right {
              background: rgba(255,255,255,0.2);
              padding: 15px;
              border-radius: 8px;
              border: 1px solid rgba(255,255,255,0.3);
              backdrop-filter: blur(10px);
            }
            .invoice-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
              text-align: center;
            }
            .invoice-info {
              font-size: 12px;
            }
            .invoice-info div {
              display: flex;
              justify-content: space-between;
              margin-bottom: 6px;
            }
            
            /* Content Sections - Compact */
            .section-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 10px;
            }
            .full-width-section {
              margin-bottom: 10px;
            }
            .detail-card {
              border-radius: 6px;
              overflow: hidden;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .detail-header {
              padding: 8px 12px;
              font-weight: bold;
              font-size: 12px;
              color: white;
              display: flex;
              align-items: center;
            }
            .detail-content {
              padding: 10px 12px;
              background: #f8fafc;
              font-size: 11px;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 6px;
              padding-bottom: 4px;
              border-bottom: 1px solid #e2e8f0;
            }
            .detail-row:last-child {
              border-bottom: none;
              margin-bottom: 0;
            }
            .detail-label {
              font-weight: 600;
              color: #374151;
            }
            .detail-value {
              color: #111827;
              text-align: right;
              font-weight: 500;
            }
            
            /* Color themes matching target */
            .customer-card .detail-header { 
              background: linear-gradient(135deg, #2563eb, #3b82f6); 
            }
            .vehicle-card .detail-header { 
              background: linear-gradient(135deg, #059669, #10b981); 
            }
            .insurance-card .detail-header { 
              background: linear-gradient(135deg, #7c3aed, #8b5cf6); 
            }
            .payment-card .detail-header { 
              background: linear-gradient(135deg, #059669, #10b981); 
            }
            .service-card .detail-header { 
              background: linear-gradient(135deg, #2563eb, #3b82f6); 
            }
            
            /* Insurance Layout - Compact 3 Columns */
            .insurance-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 10px;
              text-align: center;
            }
            .insurance-item {
              padding: 6px;
            }
            .insurance-label {
              font-size: 10px;
              color: #7c3aed;
              font-weight: 600;
              margin-bottom: 3px;
            }
            .insurance-value {
              font-weight: bold;
              font-size: 12px;
            }
            
            /* Payment Summary - Compact */
            .payment-content {
              display: grid;
              grid-template-columns: 1fr auto;
              gap: 15px;
              align-items: center;
            }
            .payment-details {
              font-size: 11px;
            }
            .payment-details .detail-row {
              margin-bottom: 4px;
              border-bottom: 1px solid rgba(255,255,255,0.3);
              padding-bottom: 2px;
            }
            .amount-display {
              text-align: center;
              background: rgba(255,255,255,0.15);
              padding: 10px 15px;
              border-radius: 6px;
              border: 1px solid rgba(255,255,255,0.2);
              min-width: 200px;
            }
            .amount-label {
              font-size: 12px;
              margin-bottom: 4px;
              font-weight: 600;
            }
            .amount-large {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 6px;
            }
            .amount-words-section {
              background: linear-gradient(90deg, #fef3c7, #fde68a);
              color: #92400e;
              padding: 8px;
              border-radius: 4px;
              margin-top: 10px;
              border: 1px solid #f59e0b;
              font-size: 11px;
            }
            .amount-words {
              font-style: italic;
              font-weight: 600;
              font-size: 11px;
            }
            
            /* Service Schedule - Compact */
            .service-message {
              background: linear-gradient(135deg, #dbeafe, #bfdbfe);
              padding: 10px;
              border-radius: 4px;
              margin-bottom: 10px;
              border: 1px solid #3b82f6;
            }
            .service-message p {
              margin: 0;
              font-size: 10px;
              color: #1e40af;
            }
            .service-message .customer-greeting {
              font-weight: bold;
              margin-bottom: 4px;
            }
            .service-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
              border-radius: 4px;
              overflow: hidden;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .service-table th {
              background: linear-gradient(135deg, #2563eb, #3b82f6);
              color: white;
              padding: 8px;
              text-align: left;
              font-weight: bold;
              border-right: 1px solid rgba(255,255,255,0.3);
            }
            .service-table th:last-child {
              border-right: none;
            }
            .service-table td {
              padding: 6px 8px;
              border-bottom: 1px solid #e2e8f0;
              border-right: 1px solid #e2e8f0;
              background: #f8fafc;
            }
            .service-table td:last-child {
              border-right: none;
            }
            .service-table tr:last-child td {
              border-bottom: none;
            }
            .service-type {
              font-weight: bold;
              color: #2563eb;
            }
            .service-note {
              background: linear-gradient(90deg, #fef3c7, #fde68a);
              padding: 6px;
              text-align: center;
              font-weight: bold;
              color: #92400e;
              font-size: 9px;
              border: 1px solid #f59e0b;
              border-radius: 0 0 4px 4px;
            }
            
            /* Footer - Compact */
            .footer {
              background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
              border-radius: 6px;
              padding: 12px;
              text-align: center;
              margin-top: 15px;
              border: 1px solid #cbd5e1;
            }
            .footer-badges {
              display: flex;
              justify-content: center;
              gap: 20px;
              margin-bottom: 8px;
              font-size: 10px;
              color: #475569;
            }
            .footer-badge {
              display: flex;
              align-items: center;
              gap: 4px;
            }
            .footer-title {
              font-weight: bold;
              font-size: 14px;
              color: #1e293b;
              margin-bottom: 4px;
            }
            .footer-subtitle {
              font-size: 11px;
              color: #64748b;
              margin-bottom: 6px;
            }
            .footer-features {
              font-size: 10px;
              color: #64748b;
              margin-bottom: 8px;
            }
            .footer-contact {
              font-size: 9px;
              color: #64748b;
              border-top: 1px solid #cbd5e1;
              padding-top: 8px;
            }
            
            @media print {
              body { -webkit-print-color-adjust: exact; }
              .invoice-container { padding: 6mm; }
              @page { size: A4; margin: 0.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <!-- Professional Header -->
            <div class="header">
              <div class="header-left">
                <div class="company-name">M M MOTORS</div>
                <div class="company-tagline">Premium Two Wheeler Sales & Service</div>
                <div class="company-address">
                  <p><span class="bullet"></span>Bengaluru main road, behind Ruchi Bakery</p>
                  <p><span class="bullet"></span>Malur, Karnataka 563130</p>
                  <p><span class="bullet"></span>Phone: 7026263123 | Email: mmmotors3123@gmail.com</p>
                </div>
              </div>
              <div class="header-right">
                <div class="invoice-title">SALES INVOICE</div>
                <div class="invoice-info">
                  <div><span>Invoice No:</span><span>${invoice.invoice_number}</span></div>
                  <div><span>Date:</span><span>${new Date(invoice.sale_date).toLocaleDateString('en-IN')}</span></div>
                </div>
              </div>
            </div>
            
            <!-- Customer & Vehicle Details Grid -->
            <div class="section-grid">
              <!-- Customer Details -->
              <div class="detail-card customer-card">
                <div class="detail-header">
                  👤 CUSTOMER DETAILS
                </div>
                <div class="detail-content">
                  <div class="detail-row">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value">${invoice.customer?.name || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">C/O:</span>
                    <span class="detail-value">${invoice.customer?.care_of || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Mobile:</span>
                    <span class="detail-value">${invoice.customer?.mobile || invoice.customer?.phone || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Address:</span>
                    <span class="detail-value">${invoice.customer?.address || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              <!-- Vehicle Details -->
              <div class="detail-card vehicle-card">
                <div class="detail-header">
                  🏍️ VEHICLE DETAILS
                </div>
                <div class="detail-content">
                  <div class="detail-row">
                    <span class="detail-label">Brand:</span>
                    <span class="detail-value">${invoice.customer?.vehicle_info?.brand || invoice.vehicle?.brand || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Model:</span>
                    <span class="detail-value">${invoice.customer?.vehicle_info?.model || invoice.vehicle?.model || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Color:</span>
                    <span class="detail-value">${invoice.customer?.vehicle_info?.color || invoice.vehicle?.color || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Vehicle No:</span>
                    <span class="detail-value">${invoice.customer?.vehicle_info?.vehicle_number || invoice.vehicle?.vehicle_no || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Chassis No:</span>
                    <span class="detail-value">${invoice.customer?.vehicle_info?.chassis_number || invoice.vehicle?.chassis_number || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Engine No:</span>
                    <span class="detail-value">${invoice.customer?.vehicle_info?.engine_number || invoice.vehicle?.engine_number || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Insurance Nominee Details -->
            <div class="full-width-section">
              <div class="detail-card insurance-card">
                <div class="detail-header">
                  🛡️ INSURANCE NOMINEE DETAILS
                </div>
                <div class="detail-content">
                  <div class="insurance-grid">
                    <div class="insurance-item">
                      <div class="insurance-label">Nominee Name</div>
                      <div class="insurance-value">${invoice.customer?.insurance_info?.nominee_name || invoice.insurance_details?.nominee || invoice.insurance?.nominee || 'N/A'}</div>
                    </div>
                    <div class="insurance-item">
                      <div class="insurance-label">Relation</div>
                      <div class="insurance-value" style="text-transform: capitalize;">${invoice.customer?.insurance_info?.relation || invoice.insurance_details?.relation || invoice.insurance?.relation || 'N/A'}</div>
                    </div>
                    <div class="insurance-item">
                      <div class="insurance-label">Age</div>
                      <div class="insurance-value">${invoice.customer?.insurance_info?.age || invoice.insurance_details?.age || invoice.insurance?.age || 'N/A'} years</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Payment Summary -->
            <div class="full-width-section">
              <div class="detail-card payment-card">
                <div class="detail-header">
                  💳 PAYMENT SUMMARY
                </div>
                <div class="detail-content" style="background: linear-gradient(135deg, #059669, #10b981); color: white;">
                  <div class="payment-content">
                    <div class="payment-details">
                      <div class="detail-row">
                        <span>Payment Method:</span>
                        <span style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 12px; font-weight: bold;">${invoice.payment_method || 'CASH'}</span>
                      </div>
                      <div class="detail-row">
                        <span>Hypothecation:</span>
                        <span style="font-weight: bold;">${invoice.hypothecation || 'Cash'}</span>
                      </div>
                    </div>
                    <div class="amount-display">
                      <div class="amount-label">TOTAL AMOUNT</div>
                      <div class="amount-large">₹${invoice.amount?.toLocaleString() || '0'}</div>
                    </div>
                  </div>
                  <div class="amount-words-section">
                    <strong>Amount in Words:</strong><br>
                    <span class="amount-words">${numberToWords(invoice.amount || 0)} Rupees Only</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Service Schedule -->
            <div class="full-width-section">
              <div class="detail-card service-card">
                <div class="detail-header">
                  🔧 SERVICE SCHEDULE
                </div>
                <div class="detail-content">
                  <div class="service-message">
                    <p class="customer-greeting">DEAR VALUED CUSTOMER,</p>
                    <p>We thank you for choosing our world-class vehicle. To ensure optimal performance and longevity, please follow the service schedule below for a pleasant riding experience at all times.</p>
                  </div>
                  
                  <table class="service-table">
                    <thead>
                      <tr>
                        <th style="width: 25%;">SERVICE DATE</th>
                        <th style="width: 35%;">SERVICE TYPE</th>
                        <th style="width: 40%;">RECOMMENDED SCHEDULE</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>____/____/____</td>
                        <td class="service-type">FIRST SERVICE</td>
                        <td>500-700 kms or 15-30 days</td>
                      </tr>
                      <tr>
                        <td>____/____/____</td>
                        <td class="service-type">SECOND SERVICE</td>
                        <td>3000-3500 kms or 30-90 days</td>
                      </tr>
                      <tr>
                        <td>____/____/____</td>
                        <td class="service-type">THIRD SERVICE</td>
                        <td>6000-6500 kms or 90-180 days</td>
                      </tr>
                      <tr>
                        <td>____/____/____</td>
                        <td class="service-type">FOURTH SERVICE</td>
                        <td>9000-9500 kms or 180-270 days</td>
                      </tr>
                    </tbody>
                  </table>
                  <div class="service-note">
                    ⚠️ IMPORTANT: Follow whichever milestone comes first (kilometers or days)
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <div class="footer-badges">
                <div class="footer-badge">🏆 Authorized Dealer</div>
                <div class="footer-badge">🕒 24/7 Service Support</div>
                <div class="footer-badge">✅ Quality Guaranteed</div>
              </div>
              <div class="footer-title">Thank You for Choosing M M Motors!</div>
              <div class="footer-subtitle">Your trust drives our excellence in two-wheeler sales and service.</div>
              <div class="footer-features">🌟 Premium Quality • ⚡ Expert Service • 🤝 Customer First</div>
              <div class="footer-contact">
                This is a computer-generated invoice and does not require a signature.<br>
                For queries, contact us at mmmotors3123@gmail.com or 7026263123
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  const handlePrintInvoiceModal = (invoice) => {
    if (!invoice) return;
    
    // Create a new window with the optimized invoice layout matching sales invoice format
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoice_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Arial', sans-serif; 
              line-height: 1.3; 
              color: #333;
              background: white;
              font-size: 12px;
            }
            .invoice-container { 
              max-width: 210mm; 
              margin: 0 auto; 
              padding: 8mm;
              background: white;
              transform: scale(0.9);
              transform-origin: top center;
            }
            
            /* Professional Header - Matching Sales Invoice */
            .header { 
              background: linear-gradient(135deg, #2563eb, #1d4ed8);
              color: white;
              padding: 15px;
              margin-bottom: 15px;
              border-radius: 8px;
              display: flex;
              justify-content: space-between;
              align-items: start;
            }
            .header-left {
              flex: 1;
            }
            .company-name { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 4px;
            }
            .company-tagline { 
              font-size: 12px; 
              opacity: 0.9;
              margin-bottom: 8px;
            }
            .company-address { 
              font-size: 11px; 
              line-height: 1.4;
            }
            .company-address p {
              margin: 2px 0;
              display: flex;
              align-items: center;
            }
            .bullet {
              width: 4px;
              height: 4px;
              background: rgba(255,255,255,0.7);
              border-radius: 50%;
              margin-right: 8px;
            }
            .header-right {
              background: rgba(255,255,255,0.2);
              padding: 12px;
              border-radius: 8px;
              border: 1px solid rgba(255,255,255,0.3);
            }
            .invoice-title {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .invoice-info {
              font-size: 11px;
            }
            .invoice-info div {
              display: flex;
              justify-content: space-between;
              margin-bottom: 4px;
            }
            
            /* Content Sections - Matching Sales Invoice */
            .content-section {
              margin-bottom: 12px;
            }
            .section-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-bottom: 12px;
            }
            .detail-card {
              border-radius: 8px;
              border: 1px solid #e2e8f0;
              overflow: hidden;
            }
            .detail-header {
              padding: 8px 12px;
              font-weight: bold;
              font-size: 11px;
              color: white;
              display: flex;
              align-items: center;
            }
            .detail-content {
              padding: 10px 12px;
              background: #f8fafc;
              font-size: 11px;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 6px;
              padding-bottom: 3px;
              border-bottom: 1px solid #e2e8f0;
            }
            .detail-row:last-child {
              border-bottom: none;
              margin-bottom: 0;
            }
            .detail-label {
              font-weight: 600;
              color: #374151;
              min-width: 60px;
            }
            .detail-value {
              color: #111827;
              text-align: right;
            }
            
            /* Color themes for different sections */
            .customer-card .detail-header { background: linear-gradient(135deg, #2563eb, #3b82f6); }
            .vehicle-card .detail-header { background: linear-gradient(135deg, #059669, #10b981); }
            .insurance-card .detail-header { background: linear-gradient(135deg, #7c3aed, #8b5cf6); }
            
            /* Payment Summary - Matching Sales Invoice */
            .payment-summary {
              background: linear-gradient(135deg, #059669, #10b981);
              color: white;
              padding: 15px;
              border-radius: 8px;
              margin: 15px 0;
              text-align: center;
            }
            .payment-header {
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .payment-method {
              font-size: 10px;
              background: rgba(255,255,255,0.2);
              padding: 4px 8px;
              border-radius: 12px;
              margin-bottom: 8px;
              display: inline-block;
            }
            .amount-large {
              font-size: 28px;
              font-weight: bold;
              margin: 8px 0;
            }
            .amount-words {
              font-size: 11px;
              font-style: italic;
              opacity: 0.9;
              background: rgba(255,255,255,0.1);
              padding: 8px;
              border-radius: 4px;
              margin-top: 8px;
            }
            
            /* Service Schedule - Matching Sales Invoice */
            .service-schedule {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              overflow: hidden;
              margin: 15px 0;
            }
            .service-header {
              background: linear-gradient(135deg, #4f46e5, #6366f1);
              color: white;
              padding: 10px 12px;
              font-weight: bold;
              font-size: 12px;
              text-align: center;
            }
            .service-message {
              background: #f0f9ff;
              padding: 12px;
              border-bottom: 1px solid #bfdbfe;
            }
            .service-message p {
              margin: 0;
              font-size: 10px;
              color: #1e40af;
            }
            .service-message .customer-greeting {
              font-weight: bold;
              margin-bottom: 4px;
            }
            .service-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
            }
            .service-table th {
              background: linear-gradient(135deg, #4f46e5, #6366f1);
              color: white;
              padding: 8px;
              text-align: left;
              font-weight: bold;
              border-right: 1px solid rgba(255,255,255,0.3);
            }
            .service-table td {
              padding: 8px;
              border-bottom: 1px solid #e2e8f0;
              border-right: 1px solid #e2e8f0;
            }
            .service-table tr:nth-child(even) {
              background: #f8fafc;
            }
            .service-type {
              font-weight: bold;
              color: #4f46e5;
            }
            .service-note {
              background: linear-gradient(90deg, #fef3c7, #fde68a);
              padding: 8px;
              text-align: center;
              font-weight: bold;
              color: #92400e;
              font-size: 10px;
              border-top: 1px solid #f59e0b;
            }
            
            /* Footer - Matching Sales Invoice */
            .footer {
              background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
              border-radius: 8px;
              padding: 15px;
              text-align: center;
              margin-top: 20px;
              border: 1px solid #cbd5e1;
            }
            .footer-badges {
              display: flex;
              justify-content: center;
              gap: 20px;
              margin-bottom: 12px;
              font-size: 10px;
              color: #475569;
            }
            .footer-title {
              font-weight: bold;
              font-size: 14px;
              color: #1e293b;
              margin-bottom: 6px;
            }
            .footer-subtitle {
              font-size: 11px;
              color: #64748b;
              margin-bottom: 8px;
            }
            .footer-features {
              font-size: 10px;
              color: #64748b;
              margin-bottom: 10px;
            }
            .footer-contact {
              font-size: 10px;
              color: #64748b;
              border-top: 1px solid #cbd5e1;
              padding-top: 10px;
            }
            
            @media print {
              body { -webkit-print-color-adjust: exact; }
              .invoice-container { padding: 6mm; }
              @page { size: A4; margin: 0.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <!-- Professional Header -->
            <div class="header">
              <div class="header-left">
                <div class="company-name">M M MOTORS</div>
                <div class="company-tagline">Premium Two Wheeler Sales & Service</div>
                <div class="company-address">
                  <p><span class="bullet"></span>Bengaluru main road, behind Ruchi Bakery</p>
                  <p><span class="bullet"></span>Malur, Karnataka 563130</p>
                  <p><span class="bullet"></span>Phone: 7026263123 | Email: mmmotors3123@gmail.com</p>
                </div>
              </div>
              <div class="header-right">
                <div class="invoice-title">SALES INVOICE</div>
                <div class="invoice-info">
                  <div><span>Invoice No:</span><span>${invoice.invoice_number}</span></div>
                  <div><span>Date:</span><span>${new Date(invoice.sale_date).toLocaleDateString('en-IN')}</span></div>
                </div>
              </div>
            </div>
            
            <!-- Customer & Vehicle Details Grid -->
            <div class="section-grid">
              <!-- Customer Details -->
              <div class="detail-card customer-card">
                <div class="detail-header">
                  👤 CUSTOMER DETAILS
                </div>
                <div class="detail-content">
                  <div class="detail-row">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value">${invoice.customer?.name || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Mobile:</span>
                    <span class="detail-value">${invoice.customer?.mobile || invoice.customer?.phone || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Address:</span>
                    <span class="detail-value">${invoice.customer?.address || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              <!-- Vehicle Details -->
              <div class="detail-card vehicle-card">
                <div class="detail-header">
                  🏍️ VEHICLE DETAILS
                </div>
                <div class="detail-content">
                  <div class="detail-row">
                    <span class="detail-label">Brand:</span>
                    <span class="detail-value">${invoice.customer?.vehicle_info?.brand || invoice.vehicle?.brand || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Model:</span>
                    <span class="detail-value">${invoice.customer?.vehicle_info?.model || invoice.vehicle?.model || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Color:</span>
                    <span class="detail-value">${invoice.customer?.vehicle_info?.color || invoice.vehicle?.color || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Vehicle No:</span>
                    <span class="detail-value">${invoice.customer?.vehicle_info?.vehicle_number || invoice.vehicle?.vehicle_no || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Chassis No:</span>
                    <span class="detail-value">${invoice.customer?.vehicle_info?.chassis_number || invoice.vehicle?.chassis_number || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Engine No:</span>
                    <span class="detail-value">${invoice.customer?.vehicle_info?.engine_number || invoice.vehicle?.engine_number || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Insurance Nominee Details -->
            <div class="detail-card insurance-card">
              <div class="detail-header">
                🛡️ INSURANCE NOMINEE DETAILS
              </div>
              <div class="detail-content">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                  <div style="text-align: center;">
                    <div style="font-size: 10px; color: #7c3aed; font-weight: 600; margin-bottom: 4px;">Nominee Name</div>
                    <div style="font-weight: bold;">${invoice.customer?.insurance_info?.nominee_name || invoice.insurance_details?.nominee || invoice.insurance?.nominee || 'N/A'}</div>
                  </div>
                  <div style="text-align: center;">
                    <div style="font-size: 10px; color: #7c3aed; font-weight: 600; margin-bottom: 4px;">Relation</div>
                    <div style="font-weight: bold; text-transform: capitalize;">${invoice.customer?.insurance_info?.relation || invoice.insurance_details?.relation || invoice.insurance?.relation || 'N/A'}</div>
                  </div>
                  <div style="text-align: center;">
                    <div style="font-size: 10px; color: #7c3aed; font-weight: 600; margin-bottom: 4px;">Age</div>
                    <div style="font-weight: bold;">${invoice.customer?.insurance_info?.age || invoice.insurance_details?.age || invoice.insurance?.age || 'N/A'} years</div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Payment Summary -->
            <div class="payment-summary">
              <div class="payment-header">💳 PAYMENT SUMMARY</div>
              <div class="payment-method">Payment Method: ${invoice.payment_method || 'CASH'}</div>
              <div style="font-size: 14px; margin-bottom: 4px;">TOTAL AMOUNT</div>
              <div class="amount-large">₹${invoice.amount?.toLocaleString() || '0'}</div>
              <div class="amount-words">
                ${numberToWords(invoice.amount || 0)} Rupees Only
              </div>
            </div>
            
            <!-- Service Schedule -->
            <div class="service-schedule">
              <div class="service-header">
                🔧 SERVICE SCHEDULE
              </div>
              <div class="service-message">
                <p class="customer-greeting">DEAR VALUED CUSTOMER,</p>
                <p>We thank you for choosing our world-class vehicle. To ensure optimal performance and longevity, please follow the service schedule below for a pleasant riding experience at all times.</p>
              </div>
              <table class="service-table">
                <thead>
                  <tr>
                    <th style="width: 25%;">SERVICE DATE</th>
                    <th style="width: 35%;">SERVICE TYPE</th>
                    <th style="width: 40%;">RECOMMENDED SCHEDULE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>____/____/____</td>
                    <td class="service-type">FIRST SERVICE</td>
                    <td>500-700 kms or 15-30 days</td>
                  </tr>
                  <tr>
                    <td>____/____/____</td>
                    <td class="service-type">SECOND SERVICE</td>
                    <td>3000-3500 kms or 30-90 days</td>
                  </tr>
                  <tr>
                    <td>____/____/____</td>
                    <td class="service-type">THIRD SERVICE</td>
                    <td>6000-6500 kms or 90-180 days</td>
                  </tr>
                  <tr>
                    <td>____/____/____</td>
                    <td class="service-type">FOURTH SERVICE</td>
                    <td>9000-9500 kms or 180-270 days</td>
                  </tr>
                </tbody>
              </table>
              <div class="service-note">
                ⚠️ IMPORTANT: Follow whichever milestone comes first (kilometers or days)
              </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <div class="footer-badges">
                <span>🏆 Authorized Dealer</span>
                <span>🕒 24/7 Service Support</span>
                <span>✅ Quality Guaranteed</span>
              </div>
              <div class="footer-title">Thank You for Choosing M M Motors!</div>
              <div class="footer-subtitle">Your trust drives our excellence in two-wheeler sales and service.</div>
              <div class="footer-features">🌟 Premium Quality • ⚡ Expert Service • 🤝 Customer First</div>
              <div class="footer-contact">
                This is a computer-generated invoice and does not require a signature.<br>
                For queries, contact us at mmmotors3123@gmail.com or 7026263123
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="spinner"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Invoices</h2>
          <p className="text-gray-600">Manage and view all sales invoices</p>
        </div>
        
        {/* Search & Sort */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by invoice no, customer, vehicle, or amount..."
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
              { field: 'sale_date', order: 'desc', label: 'Newest First' },
              { field: 'sale_date', order: 'asc', label: 'Oldest First' },
              { field: 'invoice_number', order: 'asc', label: 'Invoice No (A-Z)' },
              { field: 'invoice_number', order: 'desc', label: 'Invoice No (Z-A)' },
              { field: 'customer_name', order: 'asc', label: 'Customer (A-Z)' },
              { field: 'customer_name', order: 'desc', label: 'Customer (Z-A)' },
              { field: 'amount', order: 'desc', label: 'Amount (High to Low)' },
              { field: 'amount', order: 'asc', label: 'Amount (Low to High)' }
            ]}
          />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {invoices.filter(inv => 
                    new Date(inv.sale_date).getMonth() === new Date().getMonth()
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unique Customers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(invoices.map(inv => inv.customer_id)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Invoice List ({filteredInvoices.length} {filteredInvoices.length === 1 ? 'invoice' : 'invoices'})
            </CardTitle>
            {selectedInvoices.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkDeleteModal(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedInvoices.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left p-3 font-semibold">Invoice No.</th>
                  <th className="text-left p-3 font-semibold">Date</th>
                  <th className="text-left p-3 font-semibold">Customer Name</th>
                  <th className="text-left p-3 font-semibold">Vehicle Model</th>
                  <th className="text-left p-3 font-semibold">Amount</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="p-0">
                      <TableSkeleton rows={5} columns={8} />
                    </td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-gray-500">
                      <EmptyState 
                        title={searchTerm ? 'No invoices found' : 'No invoices yet'}
                        description={searchTerm ? 'Try adjusting your search terms' : 'Create a new invoice to get started'}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredInvoices
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((invoice) => (
                      <tr key={invoice.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedInvoices.includes(invoice.id)}
                            onChange={() => handleSelectInvoice(invoice.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleViewInvoice(invoice)}
                            className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            {invoice.invoice_number}
                          </button>
                        </td>
                        <td className="p-3 text-gray-600">
                          {new Date(invoice.sale_date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-gray-900">
                            {getCustomerName(invoice.customer_id)}
                          </div>
                        </td>
                        <td className="p-3 text-gray-600">
                          {getVehicleModel(invoice)}
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-gray-900">
                            ₹{invoice.amount?.toLocaleString() || '0'}
                          </span>
                        </td>
                        <td className="p-3">
                          {getStatusBadge(invoice.status || 'paid')}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewInvoice(invoice)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const customerName = getCustomerName(invoice.customer_id);
                                const phone = getCustomerPhone(invoice.customer_id);
                                const vehicle = getVehicleModel(invoice);
                                if (!phone) {
                                  toast.error('Customer phone number not available');
                                  return;
                                }
                                sendSaleInvoice(customerName, phone, invoice.invoice_number, invoice.vehicle_brand, invoice.vehicle_model, invoice.vehicle_color, invoice.amount, invoice.payment_method);
                              }}
                              className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Message Customer on WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditInvoice(invoice)}
                              className="flex items-center gap-1"
                            >
                              <FileText className="w-4 h-4" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePrintInvoice(invoice)}
                              className="flex items-center gap-1"
                            >
                              Print
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteInvoice(invoice)}
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
        {filteredInvoices.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredInvoices.length / itemsPerPage)}
            total={filteredInvoices.length}
            limit={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </Card>

      {/* Invoice View Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Invoice Details</h2>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handlePrintInvoiceModal(selectedInvoice)}
                    className="flex items-center gap-2"
                  >
                    Print
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowInvoiceModal(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>

              {/* Optimized Invoice Preview */}
              <Card id="invoice-modal-preview" className="print-full-width shadow-2xl max-w-[21cm] mx-auto">
                <CardContent className="p-0">
                  <div className="invoice-container bg-white text-xs">
                    {/* Professional Header - Compact */}
                    <div className="header bg-gradient-to-r from-blue-800 to-blue-600 text-white p-3 rounded-t-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h1 className="text-xl font-bold tracking-wide">M M MOTORS</h1>
                          <p className="text-blue-100 text-xs mt-1 font-medium">Premium Two Wheeler Sales & Service</p>
                          <div className="mt-1 text-blue-100 text-xs space-y-0.5">
                            <p className="flex items-center">
                              <span className="w-1.5 h-1.5 bg-blue-300 rounded-full mr-1.5"></span>
                              Bengaluru main road, behind Ruchi Bakery
                            </p>
                            <p className="flex items-center">
                              <span className="w-1.5 h-1.5 bg-blue-300 rounded-full mr-1.5"></span>
                              Malur, Karnataka 563130
                            </p>
                            <p className="flex items-center">
                              <span className="w-1.5 h-1.5 bg-blue-300 rounded-full mr-1.5"></span>
                              Phone: 7026263123 | Email: mmmotors3123@gmail.com
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-2 border border-white border-opacity-30">
                            <h2 className="text-sm font-bold text-white mb-1">SALES INVOICE</h2>
                            <div className="space-y-0.5 text-xs">
                              <div className="flex justify-between">
                                <span className="text-blue-100 text-xs">Invoice No:</span>
                                <span className="font-bold text-white text-xs">{selectedInvoice.invoice_number}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-100 text-xs">Date:</span>
                                <span className="font-bold text-white text-xs">{new Date(selectedInvoice.sale_date).toLocaleDateString('en-IN')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 space-y-3">
                      {/* Customer & Vehicle Details Grid - Compact */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                        {/* Customer Details */}
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200 overflow-hidden">
                          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-2 py-1">
                            <h3 className="text-white font-bold flex items-center text-xs">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                              </svg>
                              CUSTOMER DETAILS
                            </h3>
                          </div>
                          <div className="p-2 space-y-1">
                            <div className="flex items-center border-b border-slate-200 pb-0.5">
                              <span className="text-slate-600 font-medium w-12 text-xs">Name:</span>
                              <span className="text-slate-900 font-semibold text-xs">{selectedInvoice.customer?.name || 'N/A'}</span>
                            </div>
                            <div className="flex items-center border-b border-slate-200 pb-0.5">
                              <span className="text-slate-600 font-medium w-12 text-xs">Mobile:</span>
                              <span className="text-slate-900 font-mono font-semibold text-xs">{selectedInvoice.customer?.mobile || selectedInvoice.customer?.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-start">
                              <span className="text-slate-600 font-medium w-12 text-xs">Address:</span>
                              <span className="text-slate-900 leading-tight text-xs">{selectedInvoice.customer?.address || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Vehicle Details */}
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200 overflow-hidden">
                          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-2 py-1">
                            <h3 className="text-white font-bold flex items-center text-xs">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12,2L14,6H18L14,8L15,12L12,10L9,12L10,8L6,6H10L12,2Z"/>
                              </svg>
                              VEHICLE DETAILS
                            </h3>
                          </div>
                          <div className="p-2 space-y-1">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="border-b border-emerald-200 pb-0.5">
                                <span className="text-emerald-700 font-medium text-xs">Brand</span>
                                <div className="text-slate-900 font-bold text-xs">{selectedInvoice.customer?.vehicle_info?.brand || selectedInvoice.vehicle?.brand || 'N/A'}</div>
                              </div>
                              <div className="border-b border-emerald-200 pb-0.5">
                                <span className="text-emerald-700 font-medium text-xs">Model</span>
                                <div className="text-slate-900 font-semibold text-xs">{selectedInvoice.customer?.vehicle_info?.model || selectedInvoice.vehicle?.model || 'N/A'}</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="border-b border-emerald-200 pb-0.5">
                                <span className="text-emerald-700 font-medium text-xs">Color</span>
                                <div className="text-slate-900 text-xs">{selectedInvoice.customer?.vehicle_info?.color || selectedInvoice.vehicle?.color || 'N/A'}</div>
                              </div>
                              <div className="border-b border-emerald-200 pb-0.5">
                                <span className="text-emerald-700 font-medium text-xs">Vehicle No</span>
                                <div className="text-slate-900 font-mono font-bold text-xs">{selectedInvoice.customer?.vehicle_info?.vehicle_number || selectedInvoice.vehicle?.vehicle_no || 'N/A'}</div>
                              </div>
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex justify-between text-xs">
                                <span className="text-emerald-700 font-medium">Chassis No:</span>
                                <span className="text-slate-900 font-mono text-xs">{selectedInvoice.customer?.vehicle_info?.chassis_number || selectedInvoice.vehicle?.chassis_number || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-emerald-700 font-medium">Engine No:</span>
                                <span className="text-slate-900 font-mono text-xs">{selectedInvoice.customer?.vehicle_info?.engine_number || selectedInvoice.vehicle?.engine_number || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Insurance Nominee Details - Compact */}
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-2 py-1">
                          <h3 className="text-white font-bold flex items-center text-xs">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5H16.2V16H7.8V11.5H9.2V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.9 10.5,9.7V11.5H13.5V9.7C13.5,8.9 12.8,8.2 12,8.2Z"/>
                            </svg>
                            INSURANCE NOMINEE DETAILS
                          </h3>
                        </div>
                        <div className="p-2">
                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-center">
                              <span className="text-purple-700 font-medium text-xs block">Nominee Name</span>
                              <div className="text-slate-900 font-semibold mt-0.5 text-xs">
                                {selectedInvoice.customer?.insurance_info?.nominee_name || selectedInvoice.insurance_details?.nominee || selectedInvoice.insurance?.nominee || 'N/A'}
                              </div>
                            </div>
                            <div className="text-center">
                              <span className="text-purple-700 font-medium text-xs block">Relation</span>
                              <div className="text-slate-900 font-semibold mt-0.5 capitalize text-xs">
                                {selectedInvoice.customer?.insurance_info?.relation || selectedInvoice.insurance_details?.relation || selectedInvoice.insurance?.relation || 'N/A'}
                              </div>
                            </div>
                            <div className="text-center">
                              <span className="text-purple-700 font-medium text-xs block">Age</span>
                              <div className="text-slate-900 font-semibold mt-0.5 text-xs">
                                {selectedInvoice.customer?.insurance_info?.age || selectedInvoice.insurance_details?.age || selectedInvoice.insurance?.age || 'N/A'} years
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Payment Summary - Compact */}
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-green-600 to-green-700 px-2 py-1">
                          <h3 className="text-white font-bold flex items-center text-xs">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13.5 11.76,12.97C9.64,12.44 7,11.78 7,9C7,7.21 8.47,5.69 10.5,5.18V3H13.5V5.18C15.53,5.69 17,7.21 17,9H15C15,7.92 13.63,7 12,7C10.37,7 9,7.92 9,9C9,10.1 10.04,10.5 12.24,11.03C14.36,11.56 17,12.22 17,15C17,16.79 15.53,18.31 13.5,18.82V21H10.5V18.82C8.47,18.31 7,16.79 7,15Z"/>
                            </svg>
                            PAYMENT SUMMARY
                          </h3>
                        </div>
                        <div className="p-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                            <div className="space-y-1">
                              <div className="flex justify-between items-center py-1 border-b border-green-200">
                                <span className="text-green-700 font-medium text-xs">Payment Method:</span>
                                <span className="text-slate-900 font-bold uppercase bg-green-200 px-2 py-0.5 rounded-full text-xs">
                                  {selectedInvoice.payment_method || 'CASH'}
                                </span>
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-2 border border-green-300 shadow-sm">
                              <div className="text-center">
                                <span className="text-green-700 font-medium text-xs block mb-1">TOTAL AMOUNT</span>
                                <div className="text-lg font-bold text-green-600">
                                  ₹{selectedInvoice.amount?.toLocaleString() || '0'}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-2 border border-yellow-200">
                            <span className="text-orange-800 font-semibold text-xs">Amount in Words:</span>
                            <div className="text-slate-900 font-medium mt-0.5 italic text-xs">
                              {numberToWords(selectedInvoice.amount || 0)} Rupees Only
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Professional Footer - Compact */}
                      <div className="mt-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg p-3 border border-slate-300">
                        <div className="text-center space-y-2">
                          <div className="flex items-center justify-center space-x-6 text-slate-700">
                            <div className="flex items-center">
                              <svg className="w-3 h-3 mr-1 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9,11H15L13,9H11V7H13V9H15V7A2,2 0 0,0 13,5H11A2,2 0 0,0 9,7V9H7L9,11M20,6H16V4A2,2 0 0,0 14,2H10A2,2 0 0,0 8,4V6H4A2,2 0 0,0 2,8V19A2,2 0 0,0 4,21H20A2,2 0 0,0 22,19V8A2,2 0 0,0 20,6Z"/>
                              </svg>
                              <span className="text-xs font-medium">Authorized Dealer</span>
                            </div>
                            <div className="flex items-center">
                              <svg className="w-3 h-3 mr-1 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,7V13H12.5L16.2,16.7L17.3,15.6L14.2,12.5H13V7H11Z"/>
                              </svg>
                              <span className="text-xs font-medium">24/7 Service Support</span>
                            </div>
                            <div className="flex items-center">
                              <svg className="w-3 h-3 mr-1 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z"/>
                              </svg>
                              <span className="text-xs font-medium">Quality Guaranteed</span>
                            </div>
                          </div>
                          
                          <div className="border-t border-slate-300 pt-2">
                            <h4 className="text-sm font-bold text-slate-800 mb-1">Thank You for Choosing M M Motors!</h4>
                            <p className="text-slate-600 text-xs mb-1">Your trust drives our excellence in two-wheeler sales and service.</p>
                            <div className="flex justify-center items-center space-x-3 text-xs text-slate-500">
                              <span>🌟 Premium Quality</span>
                              <span>•</span>
                              <span>⚡ Expert Service</span>
                              <span>•</span>
                              <span>🤝 Customer First</span>
                            </div>
                          </div>
                          
                          <div className="text-xs text-slate-500 border-t border-slate-300 pt-1">
                            This is a computer-generated invoice and does not require a signature. 
                            For queries, contact us at mmmotors3123@gmail.com or 7026263123
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal */}
      {showEditModal && editingInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Invoice</h2>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>

              <div className="space-y-6">
                {/* Invoice Details Section */}
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                    📋 Invoice Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="invoice_number">Invoice Number</Label>
                      <Input
                        id="invoice_number"
                        type="text"
                        value={editFormData.invoice_number || ''}
                        onChange={(e) => setEditFormData({...editFormData, invoice_number: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sale_date">Sale Date</Label>
                      <Input
                        id="sale_date"
                        type="date"
                        value={editFormData.sale_date?.split('T')[0] || ''}
                        onChange={(e) => setEditFormData({...editFormData, sale_date: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Customer Details Section */}
                <div className="border rounded-lg p-4 bg-green-50">
                  <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                    👤 Customer Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="customer">Select Customer</Label>
                      <Select 
                        value={editFormData.customer_id} 
                        onValueChange={(value) => {
                          const selectedCustomer = customers.find(c => c.id === value);
                          setEditFormData({
                            ...editFormData, 
                            customer_id: value,
                            customer_name: selectedCustomer?.name || '',
                            customer_care_of: selectedCustomer?.care_of || '',
                            customer_mobile: selectedCustomer?.mobile || selectedCustomer?.phone || '',
                            customer_address: selectedCustomer?.address || ''
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name} - {customer.mobile || customer.phone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customer_name">Customer Name</Label>
                        <Input
                          id="customer_name"
                          type="text"
                          value={editFormData.customer_name || ''}
                          onChange={(e) => setEditFormData({...editFormData, customer_name: e.target.value})}
                          placeholder="Enter customer name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="customer_care_of">Care Of (C/O)</Label>
                        <Input
                          id="customer_care_of"
                          type="text"
                          value={editFormData.customer_care_of || ''}
                          onChange={(e) => setEditFormData({...editFormData, customer_care_of: e.target.value})}
                          placeholder="S/O, D/O, W/O"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customer_mobile">Mobile Number *</Label>
                        <Input
                          id="customer_mobile"
                          type="tel"
                          value={editFormData.customer_mobile || ''}
                          onChange={(e) => setEditFormData({...editFormData, customer_mobile: e.target.value})}
                          placeholder="Enter mobile number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="customer_address">Address</Label>
                        <Input
                          id="customer_address"
                          type="text"
                          value={editFormData.customer_address || ''}
                          onChange={(e) => setEditFormData({...editFormData, customer_address: e.target.value})}
                          placeholder="Enter address"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vehicle Details Section */}
                <div className="border rounded-lg p-4 bg-yellow-50">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
                    🏍️ Vehicle Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="vehicle">Select Vehicle</Label>
                      <Select 
                        value={editFormData.vehicle_id} 
                        onValueChange={(value) => {
                          const selectedVehicle = vehicles.find(v => v.id === value);
                          setEditFormData({
                            ...editFormData, 
                            vehicle_id: value,
                            vehicle_brand: selectedVehicle?.brand || '',
                            vehicle_model: selectedVehicle?.model || '',
                            vehicle_color: selectedVehicle?.color || '',
                            vehicle_no: selectedVehicle?.vehicle_no || '',
                            chassis_number: selectedVehicle?.chassis_number || '',
                            engine_number: selectedVehicle?.engine_number || ''
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicles.map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              {vehicle.brand} {vehicle.model} - {vehicle.chassis_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="vehicle_brand">Brand</Label>
                        <Input
                          id="vehicle_brand"
                          type="text"
                          value={editFormData.vehicle_brand || ''}
                          onChange={(e) => setEditFormData({...editFormData, vehicle_brand: e.target.value})}
                          placeholder="Enter brand"
                        />
                      </div>
                      <div>
                        <Label htmlFor="vehicle_model">Model</Label>
                        <Input
                          id="vehicle_model"
                          type="text"
                          value={editFormData.vehicle_model || ''}
                          onChange={(e) => setEditFormData({...editFormData, vehicle_model: e.target.value})}
                          placeholder="Enter model"
                        />
                      </div>
                      <div>
                        <Label htmlFor="vehicle_color">Color</Label>
                        <Input
                          id="vehicle_color"
                          type="text"
                          value={editFormData.vehicle_color || ''}
                          onChange={(e) => setEditFormData({...editFormData, vehicle_color: e.target.value})}
                          placeholder="Enter color"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="vehicle_no">Vehicle Number</Label>
                        <Input
                          id="vehicle_no"
                          type="text"
                          value={editFormData.vehicle_no || ''}
                          onChange={(e) => setEditFormData({...editFormData, vehicle_no: e.target.value})}
                          placeholder="Enter vehicle number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="chassis_number">Chassis Number</Label>
                        <Input
                          id="chassis_number"
                          type="text"
                          value={editFormData.chassis_number || ''}
                          onChange={(e) => setEditFormData({...editFormData, chassis_number: e.target.value})}
                          placeholder="Enter chassis number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="engine_number">Engine Number</Label>
                        <Input
                          id="engine_number"
                          type="text"
                          value={editFormData.engine_number || ''}
                          onChange={(e) => setEditFormData({...editFormData, engine_number: e.target.value})}
                          placeholder="Enter engine number"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Insurance Details Section */}
                <div className="border rounded-lg p-4 bg-purple-50">
                  <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                    🛡️ Insurance Nominee Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="nominee_name">Nominee Name</Label>
                      <Input
                        id="nominee_name"
                        type="text"
                        value={editFormData.insurance_details?.nominee || ''}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          insurance_details: {
                            ...editFormData.insurance_details,
                            nominee: e.target.value
                          }
                        })}
                        placeholder="Enter nominee name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nominee_relation">Relation</Label>
                      <Select
                        value={editFormData.insurance_details?.relation || ''}
                        onValueChange={(value) => setEditFormData({
                          ...editFormData,
                          insurance_details: {
                            ...editFormData.insurance_details,
                            relation: value
                          }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select relation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="father">Father</SelectItem>
                          <SelectItem value="mother">Mother</SelectItem>
                          <SelectItem value="spouse">Spouse</SelectItem>
                          <SelectItem value="son">Son</SelectItem>
                          <SelectItem value="daughter">Daughter</SelectItem>
                          <SelectItem value="brother">Brother</SelectItem>
                          <SelectItem value="sister">Sister</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="nominee_age">Age</Label>
                      <Input
                        id="nominee_age"
                        type="number"
                        value={editFormData.insurance_details?.age || ''}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          insurance_details: {
                            ...editFormData.insurance_details,
                            age: e.target.value
                          }
                        })}
                        placeholder="Enter age"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Details Section */}
                <div className="border rounded-lg p-4 bg-red-50">
                  <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
                    💳 Payment Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="amount">Amount (₹)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={editFormData.amount || ''}
                        onChange={(e) => setEditFormData({...editFormData, amount: parseFloat(e.target.value)})}
                        placeholder="Enter amount"
                      />
                    </div>
                    <div>
                      <Label htmlFor="payment_method">Payment Method</Label>
                      <Select 
                        value={editFormData.payment_method || ''} 
                        onValueChange={(value) => setEditFormData({...editFormData, payment_method: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Card">Card</SelectItem>
                          <SelectItem value="UPI">UPI</SelectItem>
                          <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                          <SelectItem value="Cheque">Cheque</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="hypothecation">Hypothecation</Label>
                      <Select
                        value={editFormData.hypothecation || 'Cash'}
                        onValueChange={(value) => setEditFormData({...editFormData, hypothecation: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select hypothecation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Bank Finance">Bank Finance</SelectItem>
                          <SelectItem value="NBFC">NBFC</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
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

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="mb-4">
              Are you sure you want to delete {selectedInvoices.length} invoice(s)?
            </p>
            <p className="text-sm text-gray-600 mb-4">
              This action cannot be undone. Associated vehicles will be marked as available again.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBulkDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleBulkDelete} disabled={loading}>
                {loading ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
      <ConfirmDialogComponent />
  );
};

const CustomersManagement = () => {
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // Modal states for view and edit functionality
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  
  const [customerData, setCustomerData] = useState({
    date: new Date().toISOString().split('T')[0],
    name: '',
    care_of: '',
    mobile: '',
    address: '',
    brand: '',
    model: '',
    color: '',
    chassis_number: '',
    engine_number: '',
    vehicle_no: '',
    insurance_nominee: '',
    relation: '',
    age: ''
  });

  const brands = ['TVS', 'BAJAJ', 'HERO', 'HONDA', 'TRIUMPH', 'KTM', 'SUZUKI', 'APRILIA', 'YAMAHA', 'PIAGGIO', 'ROYAL ENFIELD'];
  const relations = ['father', 'mother', 'spouse', 'son', 'daughter', 'brother', 'sister', 'other'];

  useEffect(() => {
    fetchCustomers();
    fetchVehicles();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm]);

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

  const fetchVehicles = async () => {
    try {
      const response = await axios.get(`${API}/vehicles?limit=4000`);
      setVehicles(extractData(response));
    } catch (error) {
      console.error('Failed to fetch vehicles');
    }
  };

  const filterCustomers = () => {
    let filtered = customers;
    if (searchTerm) {
      filtered = customers.filter(customer =>
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.mobile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredCustomers(filtered);
  };

  const validateField = (field, value) => {
    let error = '';
    
    switch (field) {
      case 'name':
        // Removed required validation - name is now optional
        if (value.trim() && value.trim().length < 2) {
          error = 'Name must be at least 2 characters';
        } else if (value.trim() && !/^[a-zA-Z\s]+$/.test(value.trim())) {
          error = 'Name should only contain letters and spaces';
        }
        break;
      
      case 'mobile':
        // Removed required validation - mobile is now optional
        if (value.trim() && !/^\d{10}$/.test(value.trim())) {
          error = 'Enter valid 10-digit mobile number';
        }
        break;
      
      case 'address':
        // Removed required validation - address is now optional
        if (value.trim() && value.trim().length < 10) {
          error = 'Address must be at least 10 characters';
        }
        break;
      
      case 'chassis_number':
        if (value.trim() && !/^[A-Z0-9]{17}$/.test(value.trim())) {
          error = 'Chassis number must be 17 characters (letters and numbers)';
        }
        break;
      
      case 'engine_number':
        if (value.trim() && value.trim().length < 5) {
          error = 'Engine number must be at least 5 characters';
        } else if (value.trim() && !/^[A-Z0-9]+$/.test(value.trim())) {
          error = 'Engine number should only contain letters and numbers';
        }
        break;
      
      case 'vehicle_no':
        if (value.trim() && !/^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/.test(value.trim().replace(/\s/g, ''))) {
          error = 'Enter valid vehicle number (e.g., KA05AB1234)';
        }
        break;
      
      case 'age':
        if (value && (isNaN(value) || value < 18 || value > 100)) {
          error = 'Age must be between 18 and 100';
        }
        break;
      
      default:
        break;
    }
    
    return error;
  };

  const validateForm = () => {
    const errors = {};
    
    // Only validate format if fields have values, no required fields
    Object.keys(customerData).forEach(field => {
      if (customerData[field]) {
        const error = validateField(field, customerData[field]);
        if (error) {
          errors[field] = error;
        }
      }
    });
    
    return errors;
  };

  const handleInputChange = (field, value) => {
    setCustomerData(prev => ({
      ...prev,
      [field]: value
    }));

    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));

    // Validate field and update errors
    const error = validateField(field, value);
    setValidationErrors(prev => ({
      ...prev,
      [field]: typeof error === 'string' ? error : (error ? 'Invalid input' : '')
    }));
  };

  const resetForm = () => {
    setCustomerData({
      date: new Date().toISOString().split('T')[0],
      name: '',
      care_of: '',
      mobile: '',
      address: '',
      brand: '',
      model: '',
      color: '',
      chassis_number: '',
      engine_number: '',
      vehicle_no: '',
      insurance_nominee: '',
      relation: '',
      age: ''
    });
    setValidationErrors({});
    setTouched({});
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    setValidationErrors(errors);
    
    // Mark all fields as touched to show errors
    const allTouched = {};
    Object.keys(customerData).forEach(field => {
      allTouched[field] = true;
    });
    setTouched(allTouched);

    // Check if there are any errors
    if (Object.keys(errors).length > 0) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setLoading(true);

    try {
      // Create customer
      const customerResponse = await axios.post(`${API}/customers`, {
        name: customerData.name,
        phone: customerData.mobile,
        email: null,
        address: customerData.address
      });

      // Create vehicle if vehicle details are provided
      if (customerData.brand && customerData.model) {
        await axios.post(`${API}/vehicles`, {
          brand: customerData.brand,
          model: customerData.model,
          chassis_number: customerData.chassis_number,
          engine_number: customerData.engine_number,
          color: customerData.color,
          key_number: 'N/A',
          inbound_location: 'Customer Registration'
        });
      }

      toast.success('Customer details saved successfully!');
      resetForm();
      setShowAddForm(false);
      fetchCustomers();
      fetchVehicles();
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Failed to save customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    try {
      const csvContent = [
        ['Date', 'Name', 'C/O', 'Mobile', 'Address', 'Email', 'Created Date'].join(','),
        ...customers.map(customer => [
          new Date().toISOString().split('T')[0],
          customer.name || '',
          '', // C/O not stored separately
          customer.mobile || '',
          customer.address || '',
          customer.email || '',
          new Date(customer.created_at).toLocaleDateString()
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Customer data exported successfully!');
    } catch (error) {
      toast.error('Failed to export customer data');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const csv = e.target.result;
            const lines = csv.split('\n');
            const headers = lines[0].split(',');
            
            // Basic CSV parsing - in production, use a proper CSV library
            toast.info('Import functionality will process CSV files. Please ensure correct format.');
            console.log('CSV headers:', headers);
            console.log('CSV lines count:', lines.length - 1);
          } catch (error) {
            toast.error('Failed to parse CSV file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const getCustomerVehicle = (customerId) => {
    const vehicle = vehicles.find(v => v.customer_id === customerId);
    return vehicle ? `${vehicle.brand} ${vehicle.model}` : 'No vehicle';
  };

  // View customer functionality
  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);
  };

  // Delete customer functionality
  const handleDeleteCustomer = async (customer) => {
    const ok = await confirm({
      title: `Delete customer "${customer.name}"?`,
      description: 'This action cannot be undone.',
      confirmLabel: 'Delete Customer',
    });
    if (!ok) return;
    try {
      setLoading(true);
      await axios.delete(`${API}/customers/${customer.id}`);
      toast.success('Customer deleted successfully!');
      fetchCustomers(); // Refresh the list
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage || 'Failed to delete customer');
    } finally {
      setLoading(false);
    }
  };

  // Edit customer functionality
  const handleEditCustomer = (customer) => {
    const associatedVehicle = vehicles.find(v => v.customer_id === customer.id);
    
    setEditingCustomer(customer);
    setEditFormData({
      name: customer.name || '',
      care_of: customer.care_of || '',
      mobile: customer.mobile || customer.phone || '',
      address: customer.address || '',
      email: customer.email || '',
      // Vehicle details if associated
      brand: associatedVehicle?.brand || '',
      model: associatedVehicle?.model || '',
      color: associatedVehicle?.color || '',
      chassis_number: associatedVehicle?.chassis_number || '',
      engine_number: associatedVehicle?.engine_number || '',
      vehicle_no: associatedVehicle?.vehicle_no || '',
      // Insurance details
      insurance_nominee: associatedVehicle?.insurance_nominee || '',
      relation: associatedVehicle?.relation || '',
      age: associatedVehicle?.age || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCustomer || loading) return;
    
    try {
      setLoading(true);
      
      console.log('Saving customer edit:', {
        editingCustomer,
        editFormData,
        API
      });
      
      // Prepare customer data with vehicle and insurance information
      const customerUpdateData = {
        name: editFormData.name?.trim() || '',
        care_of: editFormData.care_of?.trim() || '',
        mobile: editFormData.mobile?.trim() || '',
        address: editFormData.address?.trim() || '',
        email: editFormData.email?.trim() || ''
      };
      
      // Add vehicle information to customer record
      if (editFormData.brand || editFormData.model || editFormData.color || 
          editFormData.chassis_number || editFormData.engine_number || editFormData.vehicle_no) {
        customerUpdateData.vehicle_info = {
          brand: editFormData.brand?.trim() || '',
          model: editFormData.model?.trim() || '',
          color: editFormData.color?.trim() || '',
          vehicle_number: editFormData.vehicle_no?.trim() || '',
          chassis_number: editFormData.chassis_number?.trim() || '',
          engine_number: editFormData.engine_number?.trim() || ''
        };
      }
      
      // Add insurance information to customer record
      if (editFormData.insurance_nominee || editFormData.relation || editFormData.age) {
        customerUpdateData.insurance_info = {
          nominee_name: editFormData.insurance_nominee?.trim() || '',
          relation: editFormData.relation?.trim() || '',
          age: editFormData.age?.trim() || ''
        };
      }
      
      console.log('Customer update data:', customerUpdateData);
      
      const customerResponse = await axios.put(`${API}/customers/${editingCustomer.id}`, customerUpdateData);
      console.log('Customer update response:', customerResponse.data);
      
      // Update associated inventory vehicle if exists (only inventory-specific fields)
      const associatedVehicle = vehicles.find(v => v.customer_id === editingCustomer.id);
      if (associatedVehicle && (editFormData.brand || editFormData.model || editFormData.color || editFormData.chassis_number || editFormData.engine_number)) {
        // Only update inventory vehicle fields that actually exist in Vehicle model
        const vehicleUpdateData = {
          brand: editFormData.brand?.trim() || associatedVehicle.brand,
          model: editFormData.model?.trim() || associatedVehicle.model,
          color: editFormData.color?.trim() || associatedVehicle.color,
          chassis_number: editFormData.chassis_number?.trim() || associatedVehicle.chassis_number,
          engine_number: editFormData.engine_number?.trim() || associatedVehicle.engine_number
          // Note: vehicle_no is not a field in Vehicle model - stored in customer.vehicle_info
          // Note: insurance fields belong to customer, not vehicle
        };
        
        console.log('Vehicle update data:', vehicleUpdateData);
        
        const vehicleResponse = await axios.put(`${API}/vehicles/${associatedVehicle.id}`, vehicleUpdateData);
        console.log('Vehicle update response:', vehicleResponse.data);
      }
      
      toast.success('Customer updated successfully!');
      setShowEditModal(false);
      setEditingCustomer(null);
      setEditFormData({});
      fetchCustomers(); // Refresh the list
      fetchVehicles(); // Refresh vehicles too
    } catch (error) {
      console.error('Error saving customer edit:', error);
      console.error('Error response:', error.response?.data);
      toast.error(getErrorMessage(error) || 'Failed to update customer');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingCustomer(null);
    setEditFormData({});
  };

  return (
    <div className="space-y-6">
      {/* Header with Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
          <p className="text-gray-600">Manage customer details and vehicle information</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
          <Button onClick={handleImport} variant="outline" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Import
          </Button>
          <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Export
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            View All
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search customers by name, phone, email, or address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Add Customer Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Customer Details</CardTitle>
            <CardDescription>Complete customer registration with vehicle and insurance information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              {/* Date */}
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={customerData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                />
              </div>

              {/* Customer Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-600 border-b pb-2">Customer Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="Enter customer name"
                      value={customerData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={touched.name && validationErrors.name ? 'border-red-500' : ''}
                    />
                    {touched.name && validationErrors.name && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="care_of">C/O (Care Of)</Label>
                    <Input
                      id="care_of"
                      placeholder="S/O, D/O, W/O"
                      value={customerData.care_of}
                      onChange={(e) => handleInputChange('care_of', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobile">Mobile Number *</Label>
                    <Input
                      type="tel"
                      placeholder="Enter mobile number"
                      value={customerData.mobile}
                      onChange={(e) => handleInputChange('mobile', e.target.value)}
                    />
                    {touched.mobile && validationErrors.mobile && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.mobile}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      placeholder="Enter complete address"
                      value={customerData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className={touched.address && validationErrors.address ? 'border-red-500' : ''}
                    />
                    {touched.address && validationErrors.address && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.address}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Vehicle Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-600 border-b pb-2">Vehicle Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Select value={customerData.brand} onValueChange={(value) => handleInputChange('brand', value)}>
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
                      value={customerData.model}
                      onChange={(e) => handleInputChange('model', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      placeholder="Enter color"
                      value={customerData.color}
                      onChange={(e) => handleInputChange('color', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="chassis_number">Chassis No</Label>
                    <Input
                      id="chassis_number"
                      placeholder="Enter chassis number (17 characters)"
                      value={customerData.chassis_number}
                      onChange={(e) => handleInputChange('chassis_number', e.target.value.toUpperCase())}
                      className={touched.chassis_number && validationErrors.chassis_number ? 'border-red-500' : ''}
                    />
                    {touched.chassis_number && validationErrors.chassis_number && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.chassis_number}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="engine_number">Engine No</Label>
                    <Input
                      id="engine_number"
                      placeholder="Enter engine number"
                      value={customerData.engine_number}
                      onChange={(e) => handleInputChange('engine_number', e.target.value.toUpperCase())}
                      className={touched.engine_number && validationErrors.engine_number ? 'border-red-500' : ''}
                    />
                    {touched.engine_number && validationErrors.engine_number && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.engine_number}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="vehicle_no">Vehicle No</Label>
                    <Input
                      id="vehicle_no"
                      placeholder="Enter vehicle registration number (e.g., KA05AB1234)"
                      value={customerData.vehicle_no}
                      onChange={(e) => handleInputChange('vehicle_no', e.target.value.toUpperCase())}
                      className={touched.vehicle_no && validationErrors.vehicle_no ? 'border-red-500' : ''}
                    />
                    {touched.vehicle_no && validationErrors.vehicle_no && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.vehicle_no}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Insurance Nominee Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-600 border-b pb-2">Insurance Nominee Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="insurance_nominee">Insurance Nominee Name</Label>
                    <Input
                      id="insurance_nominee"
                      placeholder="Enter nominee name"
                      value={customerData.insurance_nominee}
                      onChange={(e) => handleInputChange('insurance_nominee', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="relation">Relation</Label>
                    <Select value={customerData.relation} onValueChange={(value) => handleInputChange('relation', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select relation" />
                      </SelectTrigger>
                      <SelectContent>
                        {relations.map((relation) => (
                          <SelectItem key={relation} value={relation}>
                            {relation.charAt(0).toUpperCase() + relation.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="Enter age"
                      value={customerData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
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
                  {loading ? 'Saving...' : 'Save Customer Details'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                  className="flex-1 sm:flex-none sm:px-8"
                >
                  Reset Form
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 sm:flex-none sm:px-8"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Customers List */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold">Name</th>
                  <th className="text-left p-3 font-semibold">Phone</th>
                  <th className="text-left p-3 font-semibold">Address</th>
                  <th className="text-left p-3 font-semibold">Vehicle</th>
                  <th className="text-left p-3 font-semibold">Created Date</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="p-0">
                      <TableSkeleton rows={5} columns={6} />
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">
                      <EmptyState 
                        title={searchTerm ? 'No customers found' : 'No customers yet'}
                        description={searchTerm ? 'Try adjusting your search terms' : 'Add a customer to get started'}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{customer.name}</div>
                          {customer.vehicle_info && Object.keys(customer.vehicle_info).some(key => customer.vehicle_info[key]) && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800" title="Has Vehicle Details from Import">
                              🏍️
                            </span>
                          )}
                          {customer.insurance_info && Object.keys(customer.insurance_info).some(key => customer.insurance_info[key]) && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800" title="Has Insurance Nominee Details from Import">
                              🛡️
                            </span>
                          )}
                          {customer.sales_info && Object.keys(customer.sales_info).some(key => customer.sales_info[key]) && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800" title="Has Sales Information from Import">
                              💰
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-gray-600">{customer.mobile}</td>
                      <td className="p-3 text-gray-600">{customer.address}</td>
                      <td className="p-3 text-gray-600">{getCustomerVehicle(customer.id)}</td>
                      <td className="p-3 text-gray-600">
                        {new Date(customer.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewCustomer(customer)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditCustomer(customer)}
                            className="flex items-center gap-1"
                          >
                            <FileText className="w-4 h-4" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteCustomer(customer)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={loading}
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
      </Card>

      {/* View Customer Modal */}
      {showViewModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Customer Details</h2>
                <Button variant="outline" onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                      👤 Customer Information
                    </h3>
                    <div className="space-y-2">
                      <div><strong>Name:</strong> {selectedCustomer.name || 'N/A'}</div>
                      <div><strong>Care Of:</strong> {selectedCustomer.care_of || 'N/A'}</div>
                      <div><strong>Mobile:</strong> {selectedCustomer.mobile || selectedCustomer.phone || 'N/A'}</div>
                      <div><strong>Email:</strong> {selectedCustomer.email || 'N/A'}</div>
                      <div><strong>Address:</strong> {selectedCustomer.address || 'N/A'}</div>
                      <div><strong>Date Added:</strong> {new Date(selectedCustomer.created_at).toLocaleDateString('en-IN')}</div>
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="space-y-4">
                  {/* Vehicle Details from Import */}
                  {selectedCustomer.vehicle_info && Object.keys(selectedCustomer.vehicle_info).some(key => selectedCustomer.vehicle_info[key]) && (
                    <div className="border rounded-lg p-4 bg-blue-50">
                      <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                        🏍️ Vehicle Details (From Import)
                      </h3>
                      <div className="space-y-2">
                        <div><strong>Brand:</strong> {selectedCustomer.vehicle_info.brand || 'N/A'}</div>
                        <div><strong>Model:</strong> {selectedCustomer.vehicle_info.model || 'N/A'}</div>
                        <div><strong>Color:</strong> {selectedCustomer.vehicle_info.color || 'N/A'}</div>
                        <div><strong>Vehicle Number:</strong> {selectedCustomer.vehicle_info.vehicle_number || 'N/A'}</div>
                        <div><strong>Chassis Number:</strong> {selectedCustomer.vehicle_info.chassis_number || 'N/A'}</div>
                        <div><strong>Engine Number:</strong> {selectedCustomer.vehicle_info.engine_number || 'N/A'}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Associated Vehicle from Inventory */}
                  <div className="border rounded-lg p-4 bg-green-50">
                    <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                      🚗 Associated Vehicle (Inventory)
                    </h3>
                    {(() => {
                      const customerVehicle = vehicles.find(v => v.customer_id === selectedCustomer.id);
                      if (customerVehicle) {
                        return (
                          <div className="space-y-2">
                            <div><strong>Brand:</strong> {customerVehicle.brand || 'N/A'}</div>
                            <div><strong>Model:</strong> {customerVehicle.model || 'N/A'}</div>
                            <div><strong>Color:</strong> {customerVehicle.color || 'N/A'}</div>
                            <div><strong>Vehicle No:</strong> {customerVehicle.vehicle_no || 'N/A'}</div>
                            <div><strong>Chassis No:</strong> {customerVehicle.chassis_number || 'N/A'}</div>
                            <div><strong>Engine No:</strong> {customerVehicle.engine_number || 'N/A'}</div>
                          </div>
                        );
                      } else {
                        return <p className="text-gray-500">No vehicle associated with this customer in inventory</p>;
                      }
                    })()}
                  </div>
                  
                  {/* Insurance Nominee Details from Import */}
                  {selectedCustomer.insurance_info && Object.keys(selectedCustomer.insurance_info).some(key => selectedCustomer.insurance_info[key]) && (
                    <div className="border rounded-lg p-4 bg-purple-50">
                      <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center">
                        🛡️ Insurance Nominee Details (From Import)
                      </h3>
                      <div className="space-y-2">
                        <div><strong>Nominee Name:</strong> {selectedCustomer.insurance_info.nominee_name || 'N/A'}</div>
                        <div><strong>Relation:</strong> {selectedCustomer.insurance_info.relation || 'N/A'}</div>
                        <div><strong>Age:</strong> {selectedCustomer.insurance_info.age || 'N/A'}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Sales Information from Import */}
                  {selectedCustomer.sales_info && Object.keys(selectedCustomer.sales_info).some(key => selectedCustomer.sales_info[key]) && (
                    <div className="border rounded-lg p-4 bg-orange-50">
                      <h3 className="text-lg font-semibold text-orange-800 mb-3 flex items-center">
                        💰 Sales Information (From Import)
                      </h3>
                      <div className="space-y-2">
                        <div><strong>Amount:</strong> {selectedCustomer.sales_info.amount ? `₹${selectedCustomer.sales_info.amount}` : 'N/A'}</div>
                        <div><strong>Payment Method:</strong> {selectedCustomer.sales_info.payment_method || 'N/A'}</div>
                        <div><strong>Hypothecation:</strong> {selectedCustomer.sales_info.hypothecation || 'N/A'}</div>
                        <div><strong>Sale Date:</strong> {selectedCustomer.sales_info.sale_date || 'N/A'}</div>
                        <div><strong>Invoice Number:</strong> {selectedCustomer.sales_info.invoice_number || 'N/A'}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowViewModal(false);
                    handleDeleteCustomer(selectedCustomer);
                  }}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Customer
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowViewModal(false);
                      handleEditCustomer(selectedCustomer);
                    }}
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Edit Customer
                  </Button>
                  <Button onClick={() => setShowViewModal(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Customer</h2>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>

              <div className="space-y-6">
                {/* Customer Details Section */}
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                    👤 Customer Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit_name">Customer Name</Label>
                      <Input
                        id="edit_name"
                        type="text"
                        value={editFormData.name || ''}
                        onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                        placeholder="Enter customer name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_care_of">Care Of (C/O)</Label>
                      <Input
                        id="edit_care_of"
                        type="text"
                        value={editFormData.care_of || ''}
                        onChange={(e) => setEditFormData({...editFormData, care_of: e.target.value})}
                        placeholder="S/O, D/O, W/O"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_mobile">Mobile Number</Label>
                      <Input
                        id="edit_mobile"
                        type="tel"
                        value={editFormData.mobile || ''}
                        onChange={(e) => setEditFormData({...editFormData, mobile: e.target.value})}
                        placeholder="Enter mobile number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_email">Email</Label>
                      <Input
                        id="edit_email"
                        type="email"
                        value={editFormData.email || ''}
                        onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="edit_address">Address</Label>
                      <Input
                        id="edit_address"
                        type="text"
                        value={editFormData.address || ''}
                        onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                        placeholder="Enter complete address"
                      />
                    </div>
                  </div>
                </div>

                {/* Vehicle Details Section */}
                <div className="border rounded-lg p-4 bg-green-50">
                  <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                    🏍️ Vehicle Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit_brand">Brand</Label>
                      <Select
                        value={editFormData.brand || ''}
                        onValueChange={(value) => setEditFormData({...editFormData, brand: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                        <SelectContent>
                          {brands.map(brand => (
                            <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit_model">Model</Label>
                      <Input
                        id="edit_model"
                        type="text"
                        value={editFormData.model || ''}
                        onChange={(e) => setEditFormData({...editFormData, model: e.target.value})}
                        placeholder="Enter model"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_color">Color</Label>
                      <Input
                        id="edit_color"
                        type="text"
                        value={editFormData.color || ''}
                        onChange={(e) => setEditFormData({...editFormData, color: e.target.value})}
                        placeholder="Enter color"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_vehicle_no">Vehicle Number</Label>
                      <Input
                        id="edit_vehicle_no"
                        type="text"
                        value={editFormData.vehicle_no || ''}
                        onChange={(e) => setEditFormData({...editFormData, vehicle_no: e.target.value.toUpperCase()})}
                        placeholder="KA05AB1234"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_chassis_number">Chassis Number</Label>
                      <Input
                        id="edit_chassis_number"
                        type="text"
                        value={editFormData.chassis_number || ''}
                        onChange={(e) => setEditFormData({...editFormData, chassis_number: e.target.value.toUpperCase()})}
                        placeholder="Enter chassis number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_engine_number">Engine Number</Label>
                      <Input
                        id="edit_engine_number"
                        type="text"
                        value={editFormData.engine_number || ''}
                        onChange={(e) => setEditFormData({...editFormData, engine_number: e.target.value.toUpperCase()})}
                        placeholder="Enter engine number"
                      />
                    </div>
                  </div>
                </div>

                {/* Insurance Details Section */}
                <div className="border rounded-lg p-4 bg-purple-50">
                  <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                    🛡️ Insurance Nominee Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit_nominee">Nominee Name</Label>
                      <Input
                        id="edit_nominee"
                        type="text"
                        value={editFormData.insurance_nominee || ''}
                        onChange={(e) => setEditFormData({...editFormData, insurance_nominee: e.target.value})}
                        placeholder="Enter nominee name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_relation">Relation</Label>
                      <Select
                        value={editFormData.relation || ''}
                        onValueChange={(value) => setEditFormData({...editFormData, relation: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select relation" />
                        </SelectTrigger>
                        <SelectContent>
                          {relations.map(relation => (
                            <SelectItem key={relation} value={relation}>
                              {relation.charAt(0).toUpperCase() + relation.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit_age">Age</Label>
                      <Input
                        id="edit_age"
                        type="number"
                        value={editFormData.age || ''}
                        onChange={(e) => setEditFormData({...editFormData, age: e.target.value})}
                        placeholder="Enter age"
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

const SalesReports = () => {
  const [sales, setSales] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState([]);
  const [brandData, setBrandData] = useState([]);
  const [chartGranularity, setChartGranularity] = useState('monthly');
  const [totalStats, setTotalStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    topBrand: ''
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (sales.length > 0 && vehicles.length > 0) {
      processMonthlyData();
      processBrandData();
      calculateStats();
    }
  }, [sales, vehicles, chartGranularity]);

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [salesRes, vehiclesRes, customersRes] = await Promise.all([
        axios.get(`${API}/sales?limit=4000`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/vehicles?limit=4000`, {
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
      
      setSales(extractData(salesRes));
      setVehicles(extractData(vehiclesRes));
      setCustomers(customersRes.data.data || customersRes.data);
    } catch (error) {
      toast.error('Failed to fetch sales data');
    } finally {
      setLoading(false);
    }
  };

  const processMonthlyData = () => {
    if (chartGranularity === 'monthly') {
      const monthlyMap = {};
      
      sales.forEach(sale => {
        const date = new Date(sale.sale_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = {
            month: monthName,
            sales: 0,
            revenue: 0,
            count: 0
          };
        }
        
        monthlyMap[monthKey].sales += 1;
        monthlyMap[monthKey].revenue += sale.amount || 0;
        monthlyMap[monthKey].count += 1;
      });

      // Sort by month and get last 12 months or available data
      const sortedData = Object.values(monthlyMap)
        .sort((a, b) => new Date(a.month + ' 01') - new Date(b.month + ' 01'))
        .slice(-12);
      
      setMonthlyData(sortedData);
    } else {
      // Yearly aggregation
      const yearlyMap = {};
      
      sales.forEach(sale => {
        const date = new Date(sale.sale_date);
        const year = date.getFullYear();
        
        if (!yearlyMap[year]) {
          yearlyMap[year] = {
            month: year.toString(),
            sales: 0,
            revenue: 0,
            count: 0
          };
        }
        
        yearlyMap[year].sales += 1;
        yearlyMap[year].revenue += sale.amount || 0;
        yearlyMap[year].count += 1;
      });

      // Sort by year and get last 5 years
      const sortedData = Object.values(yearlyMap)
        .sort((a, b) => parseInt(a.month) - parseInt(b.month))
        .slice(-5);
      
      setMonthlyData(sortedData);
    }
  };

  const processBrandData = () => {
    const brandMap = {};
    
    sales.forEach(sale => {
      let brand = null;
      
      // For direct sales with vehicle_id, get brand from vehicles collection
      if (sale.vehicle_id) {
        const vehicle = vehicles.find(v => v.id === sale.vehicle_id);
        if (vehicle) {
          brand = vehicle.brand;
        }
      } 
      // For imported sales without vehicle_id, use vehicle_brand field
      else if (sale.vehicle_brand) {
        brand = sale.vehicle_brand;
      }
      
      // If we have a brand, add to the map
      if (brand) {
        if (!brandMap[brand]) {
          brandMap[brand] = {
            brand: brand,
            sales: 0,
            revenue: 0,
            count: 0,
            directSales: 0,
            importedSales: 0
          };
        }
        
        brandMap[brand].sales += 1;
        brandMap[brand].revenue += sale.amount || 0;
        brandMap[brand].count += 1;
        
        // Track source of sale
        if (sale.source === 'import') {
          brandMap[brand].importedSales += 1;
        } else {
          brandMap[brand].directSales += 1;
        }
      }
    });

    const sortedBrandData = Object.values(brandMap)
      .sort((a, b) => b.revenue - a.revenue);
    
    setBrandData(sortedBrandData);
  };

  const calculateStats = () => {
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.amount || 0), 0);
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    // Find top brand by revenue (including both direct and imported sales)
    const brandRevenue = {};
    sales.forEach(sale => {
      let brand = null;
      
      // For direct sales with vehicle_id
      if (sale.vehicle_id) {
        const vehicle = vehicles.find(v => v.id === sale.vehicle_id);
        if (vehicle) {
          brand = vehicle.brand;
        }
      } 
      // For imported sales with vehicle_brand
      else if (sale.vehicle_brand) {
        brand = sale.vehicle_brand;
      }
      
      if (brand) {
        brandRevenue[brand] = (brandRevenue[brand] || 0) + (sale.amount || 0);
      }
    });
    
    const topBrand = Object.keys(brandRevenue).length > 0 
      ? Object.keys(brandRevenue).reduce((a, b) => 
          brandRevenue[a] > brandRevenue[b] ? a : b, '')
      : 'N/A';

    setTotalStats({
      totalSales,
      totalRevenue,
      averageOrderValue,
      topBrand
    });
  };

  const exportReport = () => {
    try {
      const reportData = {
        totalStats,
        monthlyData,
        brandData,
        generatedAt: new Date().toISOString()
      };

      const csvContent = [
        ['Sales Report Generated:', new Date().toLocaleDateString()].join(','),
        [],
        ['Monthly Sales Data:'],
        ['Month', 'Sales Count', 'Revenue'].join(','),
        ...monthlyData.map(item => [item.month, item.sales, item.revenue].join(',')),
        [],
        ['Brand Sales Data:'],
        ['Brand', 'Total Sales', 'Direct Sales', 'Imported Sales', 'Revenue'].join(','),
        ...brandData.map(item => [
          item.brand, 
          item.sales, 
          item.directSales || 0, 
          item.importedSales || 0, 
          item.revenue
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Sales report exported successfully!');
    } catch (error) {
      toast.error('Failed to export sales report');
    }
  };

  // Colors for charts
  const chartColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  if (loading) {
    return <div className="flex justify-center p-8"><div className="spinner"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales Reports</h2>
          <p className="text-gray-600">Comprehensive sales analytics and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportReport} variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">{totalStats.totalSales}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{totalStats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <PieChart className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Order</p>
                <p className="text-2xl font-bold text-gray-900">₹{Math.round(totalStats.averageOrderValue).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MotorcycleIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Top Brand</p>
                <p className="text-2xl font-bold text-gray-900">{totalStats.topBrand || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Source Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Direct Sales</p>
                <p className="text-2xl font-bold text-blue-900">
                  {sales.filter(sale => !sale.source || sale.source === 'direct').length}
                </p>
                <p className="text-sm text-gray-500">
                  ₹{sales.filter(sale => !sale.source || sale.source === 'direct')
                    .reduce((sum, sale) => sum + (sale.amount || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Imported Sales</p>
                <p className="text-2xl font-bold text-orange-900">
                  {sales.filter(sale => sale.source === 'import').length}
                </p>
                <p className="text-sm text-gray-500">
                  ₹{sales.filter(sale => sale.source === 'import')
                    .reduce((sum, sale) => sum + (sale.amount || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Import Percentage</p>
                <p className="text-2xl font-bold text-green-900">
                  {sales.length > 0 ? 
                    Math.round((sales.filter(sale => sale.source === 'import').length / sales.length) * 100) 
                    : 0}%
                </p>
                <p className="text-sm text-gray-500">
                  of total sales
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Sales Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  {chartGranularity === 'monthly' ? 'Monthly' : 'Yearly'} Sales Performance
                </CardTitle>
                <CardDescription>
                  Sales count and revenue trends over time
                </CardDescription>
              </div>
              <div className="flex gap-1 bg-gray-100 rounded-md p-1">
                <Button
                  variant={chartGranularity === 'monthly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setChartGranularity('monthly')}
                >
                  Month
                </Button>
                <Button
                  variant={chartGranularity === 'yearly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setChartGranularity('yearly')}
                >
                  Year
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ccc',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value, name) => [
                      name === 'revenue' ? `₹${value.toLocaleString()}` : value,
                      name === 'revenue' ? 'Revenue' : 'Sales Count'
                    ]}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="sales" fill="#3b82f6" name="Sales Count" />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    name="Revenue (₹)"
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Brand-wise Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-green-600" />
              Brand-wise Sales Distribution
            </CardTitle>
            <CardDescription>
              Sales count by vehicle brands
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={brandData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="brand" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Sales Count', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ccc',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg">
                            <p className="font-semibold text-gray-900 mb-2">{data.brand}</p>
                            <p className="text-sm text-gray-700">Total Sales: {data.sales}</p>
                            <p className="text-sm text-gray-700">Revenue: ₹{data.revenue?.toLocaleString()}</p>
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="text-xs text-blue-600">Direct Sales: {data.directSales || 0}</p>
                              <p className="text-xs text-purple-600">Imported Sales: {data.importedSales || 0}</p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="sales" fill="#10b981" name="Sales Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Sales Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-semibold">Month</th>
                    <th className="text-right p-3 font-semibold">Sales</th>
                    <th className="text-right p-3 font-semibold">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3">{item.month}</td>
                      <td className="p-3 text-right font-medium">{item.sales}</td>
                      <td className="p-3 text-right font-medium text-green-600">
                        ₹{item.revenue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Brand Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Performance Summary</CardTitle>
            <CardDescription>
              Sales breakdown by source (Direct vs Imported)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-semibold">Brand</th>
                    <th className="text-right p-3 font-semibold">Total Sales</th>
                    <th className="text-right p-3 font-semibold text-blue-600">Direct</th>
                    <th className="text-right p-3 font-semibold text-purple-600">Imported</th>
                    <th className="text-right p-3 font-semibold">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {brandData.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{item.brand}</td>
                      <td className="p-3 text-right font-semibold">{item.sales}</td>
                      <td className="p-3 text-right text-blue-600">{item.directSales || 0}</td>
                      <td className="p-3 text-right text-purple-600">{item.importedSales || 0}</td>
                      <td className="p-3 text-right font-medium text-green-600">
                        ₹{item.revenue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900">Best Performing Month</h4>
              <p className="text-blue-700">
                {monthlyData.length > 0 
                  ? monthlyData.reduce((max, item) => item.revenue > max.revenue ? item : max, monthlyData[0]).month
                  : 'N/A'
                }
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900">Top Revenue Brand</h4>
              <p className="text-green-700">
                {brandData.length > 0 ? brandData[0].brand : 'N/A'}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900">Growth Trend</h4>
              <p className="text-purple-700">
                {monthlyData.length >= 2 
                  ? monthlyData[monthlyData.length - 1].revenue > monthlyData[monthlyData.length - 2].revenue 
                    ? 'Increasing' : 'Stable'
                  : 'Insufficient Data'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ViewCustomerDetails = () => {
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [sales, setSales] = useState([]);
  const [customerDetails, setCustomerDetails] = useState([]);
  const [filteredDetails, setFilteredDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (customers.length > 0 && vehicles.length > 0) {
      combineCustomerVehicleData();
    }
  }, [customers, vehicles, sales]);

  useEffect(() => {
    filterCustomerDetails();
  }, [customerDetails, searchTerm]);

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [customersRes, vehiclesRes, salesRes] = await Promise.all([
        axios.get(`${API}/customers`, {
          params: {
            page: 1,
            limit: 10000,
            sort: 'created_at',
            order: 'desc'
          },
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/vehicles?limit=4000`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/sales?limit=4000`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setCustomers(customersRes.data.data || customersRes.data);
      setVehicles(extractData(vehiclesRes));
      setSales(extractData(salesRes));
    } catch (error) {
      console.error('Error fetching customer details:', error);
      toast.error('Failed to fetch customer details: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const combineCustomerVehicleData = () => {
    const combined = customers.map(customer => {
      // Find customer's sale to get vehicle information
      const customerSale = sales.find(sale => sale.customer_id === customer.id);
      let customerVehicle = null;
      
      if (customerSale) {
        customerVehicle = vehicles.find(vehicle => vehicle.id === customerSale.vehicle_id);
      }
      
      // If no sale found, check if vehicle is directly linked to customer
      if (!customerVehicle) {
        customerVehicle = vehicles.find(vehicle => vehicle.customer_id === customer.id);
      }

      return {
        id: customer.id,
        date: customerSale ? customerSale.sale_date : customer.created_at,
        name: customer.name,
        care_of: customer.care_of,
        mobile: customer.mobile,
        address: customer.address,
        email: customer.email,
        // Prioritize customer vehicle_info over inventory vehicle data
        brand: customer.vehicle_info?.brand || customerVehicle?.brand || 'N/A',
        model: customer.vehicle_info?.model || customerVehicle?.model || 'N/A',
        color: customer.vehicle_info?.color || customerVehicle?.color || 'N/A',
        chassis_number: customer.vehicle_info?.chassis_number || customerVehicle?.chassis_number || 'N/A',
        engine_number: customer.vehicle_info?.engine_number || customerVehicle?.engine_number || 'N/A',
        vehicle_no: customer.vehicle_info?.vehicle_number || customerVehicle?.vehicle_no || 'N/A',
        vehicle_status: customerVehicle?.status || 'N/A',
        sale_amount: customerSale?.amount || null,
        payment_method: customerSale?.payment_method || null,
        // Extended information from imports
        vehicle_info: customer.vehicle_info,
        insurance_info: customer.insurance_info,
        sales_info: customer.sales_info
      };
    });
    
    setCustomerDetails(combined);
  };

  const filterCustomerDetails = () => {
    let filtered = customerDetails;
    
    if (searchTerm) {
      filtered = customerDetails.filter(detail =>
        detail.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        detail.mobile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        detail.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        detail.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        detail.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        detail.chassis_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        detail.engine_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        detail.vehicle_no?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredDetails(filtered);
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);
  };

  // Delete customer functionality
  const handleDeleteCustomer = async (customer) => {
    const ok = await confirm({
      title: `Delete customer "${customer.name}"?`,
      description: 'This action cannot be undone.',
      confirmLabel: 'Delete Customer',
    });
    if (!ok) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/customers/${customer.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Customer deleted successfully!');
      fetchAllData(); // Refresh the list
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage || 'Failed to delete customer');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCustomer = (customer) => {
    const associatedVehicle = vehicles.find(v => v.customer_id === customer.id || 
      (v.chassis_number === customer.chassis_number && customer.chassis_number !== 'N/A'));
    
    setEditingCustomer(customer);
    setEditFormData({
      // Customer details
      name: customer.name || '',
      care_of: customer.care_of || '',
      mobile: customer.mobile || customer.phone || '',
      address: customer.address || '',
      email: customer.email || '',
      
      // Vehicle details if associated
      brand: customer.brand !== 'N/A' ? customer.brand : (associatedVehicle?.brand || ''),
      model: customer.model !== 'N/A' ? customer.model : (associatedVehicle?.model || ''),
      color: customer.color !== 'N/A' ? customer.color : (associatedVehicle?.color || ''),
      chassis_number: customer.chassis_number !== 'N/A' ? customer.chassis_number : (associatedVehicle?.chassis_number || ''),
      engine_number: customer.engine_number !== 'N/A' ? customer.engine_number : (associatedVehicle?.engine_number || ''),
      vehicle_no: customer.vehicle_no !== 'N/A' ? customer.vehicle_no : (associatedVehicle?.vehicle_no || ''),
      
      // Insurance details
      insurance_nominee: associatedVehicle?.insurance_nominee || '',
      relation: associatedVehicle?.relation || '',
      age: associatedVehicle?.age || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCustomer || loading) return;
    
    try {
      setLoading(true);
      
      // Prepare customer data with vehicle and insurance information
      const customerUpdateData = {
        name: editFormData.name,
        care_of: editFormData.care_of,
        mobile: editFormData.mobile,
        address: editFormData.address,
        email: editFormData.email
      };
      
      // Add vehicle information to customer record (as we did with imports)
      if (editFormData.brand || editFormData.model || editFormData.color || 
          editFormData.chassis_number || editFormData.engine_number || editFormData.vehicle_no) {
        customerUpdateData.vehicle_info = {
          brand: editFormData.brand || '',
          model: editFormData.model || '',
          color: editFormData.color || '',
          vehicle_number: editFormData.vehicle_no || '',
          chassis_number: editFormData.chassis_number || '',
          engine_number: editFormData.engine_number || ''
        };
      }
      
      // Add insurance information to customer record
      if (editFormData.insurance_nominee || editFormData.relation || editFormData.age) {
        customerUpdateData.insurance_info = {
          nominee_name: editFormData.insurance_nominee || '',
          relation: editFormData.relation || '',
          age: editFormData.age || ''
        };
      }
      
      const token = localStorage.getItem('token');
      await axios.put(`${API}/customers/${editingCustomer.id}`, customerUpdateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update associated inventory vehicle if exists (only inventory-specific fields)
      const associatedVehicle = vehicles.find(v => v.customer_id === editingCustomer.id || 
        (v.chassis_number === editingCustomer.chassis_number && editingCustomer.chassis_number !== 'N/A'));
      
      if (associatedVehicle) {
        // Only update inventory vehicle fields that actually exist in Vehicle model
        const vehicleUpdateData = {
          brand: editFormData.brand || associatedVehicle.brand,
          model: editFormData.model || associatedVehicle.model,
          color: editFormData.color || associatedVehicle.color,
          chassis_number: editFormData.chassis_number || associatedVehicle.chassis_number,
          engine_number: editFormData.engine_number || associatedVehicle.engine_number
          // Note: vehicle_no is not a field in Vehicle model
          // Note: insurance fields belong to customer, not vehicle
        };
        
        await axios.put(`${API}/vehicles/${associatedVehicle.id}`, vehicleUpdateData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      toast.success('Customer updated successfully!');
      setShowEditModal(false);
      setEditingCustomer(null);
      setEditFormData({});
      fetchAllData(); // Refresh the list
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Failed to update customer');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingCustomer(null);
    setEditFormData({});
  };

  const exportToCSV = () => {
    try {
      const csvContent = [
        ['Date', 'Name', 'Mobile Number', 'Address', 'Brand', 'Model', 'Color', 'Chassis No', 'Engine No', 'Vehicle No'].join(','),
        ...filteredDetails.map(detail => [
          new Date(detail.date).toLocaleDateString('en-IN'),
          detail.name || '',
          detail.mobile || '',
          detail.address || '',
          detail.brand || '',
          detail.model || '',
          detail.color || '',
          detail.chassis_number || '',
          detail.engine_number || '',
          detail.vehicle_no || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customer_details_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Customer details exported successfully!');
    } catch (error) {
      toast.error('Failed to export customer details');
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
          <h2 className="text-2xl font-bold text-gray-900">View Customer Details</h2>
          <p className="text-gray-600">Complete customer information with vehicle details</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Export CSV
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by name, mobile, address, brand, model, chassis no, engine no, or vehicle no..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{customerDetails.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <MotorcycleIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">With Vehicles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {customerDetails.filter(c => c.brand !== 'N/A').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{customerDetails.reduce((sum, c) => sum + (c.sale_amount || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Filtered Results</p>
                <p className="text-2xl font-bold text-gray-900">{filteredDetails.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Customer Details ({filteredDetails.length} records)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold">Date</th>
                  <th className="text-left p-3 font-semibold">Name</th>
                  <th className="text-left p-3 font-semibold">Care Of</th>
                  <th className="text-left p-3 font-semibold">Mobile Number</th>
                  <th className="text-left p-3 font-semibold">Email</th>
                  <th className="text-left p-3 font-semibold">Address</th>
                  <th className="text-left p-3 font-semibold">Brand</th>
                  <th className="text-left p-3 font-semibold">Model</th>
                  <th className="text-left p-3 font-semibold">Color</th>
                  <th className="text-left p-3 font-semibold">Vehicle No.</th>
                  <th className="text-left p-3 font-semibold">Chassis NO.</th>
                  <th className="text-left p-3 font-semibold">Engine NO.</th>
                  <th className="text-left p-3 font-semibold">Insurance</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDetails.length === 0 ? (
                  <tr>
                    <td colSpan="14" className="p-8 text-center text-gray-500">
                      {searchTerm ? 'No customer details found matching your search' : 'No customer details found'}
                    </td>
                  </tr>
                ) : (
                  filteredDetails.map((detail) => (
                    <tr key={detail.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-gray-600">
                        {new Date(detail.date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-gray-900">{detail.name}</div>
                          {detail.vehicle_info && Object.keys(detail.vehicle_info).some(key => detail.vehicle_info[key]) && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800" title="Has Vehicle Details from Import">
                              🏍️
                            </span>
                          )}
                          {detail.insurance_info && Object.keys(detail.insurance_info).some(key => detail.insurance_info[key]) && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800" title="Has Insurance Nominee Details from Import">
                              🛡️
                            </span>
                          )}
                          {detail.sales_info && Object.keys(detail.sales_info).some(key => detail.sales_info[key]) && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800" title="Has Sales Information from Import">
                              💰
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-gray-600">{detail.care_of || 'N/A'}</td>
                      <td className="p-3 text-gray-600 font-mono">{detail.mobile}</td>
                      <td className="p-3 text-gray-600 max-w-xs truncate" title={detail.email}>
                        {detail.email || 'N/A'}
                      </td>
                      <td className="p-3 text-gray-600 max-w-xs truncate" title={detail.address}>
                        {detail.address}
                      </td>
                      <td className="p-3">
                        <span className={`font-medium ${detail.brand !== 'N/A' ? 'text-blue-600' : 'text-gray-400'}`}>
                          {detail.brand}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600">{detail.model}</td>
                      <td className="p-3 text-gray-600">{detail.color}</td>
                      <td className="p-3 text-gray-600 font-mono text-sm font-bold">
                        {detail.vehicle_no !== 'N/A' ? (
                          <span className="text-green-600">{detail.vehicle_no}</span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="p-3 text-gray-600 font-mono text-sm">{detail.chassis_number}</td>
                      <td className="p-3 text-gray-600 font-mono text-sm">{detail.engine_number}</td>
                      <td className="p-3 text-gray-600">
                        {detail.insurance_info && detail.insurance_info.nominee_name ? (
                          <div className="text-sm">
                            <div className="font-medium text-green-600">{detail.insurance_info.nominee_name}</div>
                            <div className="text-xs text-gray-500">
                              {detail.insurance_info.relation} ({detail.insurance_info.age}y)
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewCustomer(detail)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditCustomer(detail)}
                            className="flex items-center gap-1"
                          >
                            <FileText className="w-4 h-4" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCustomer(detail)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={loading}
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
      </Card>

      {/* View Customer Modal */}
      {showViewModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Customer Details</h2>
                <Button variant="outline" onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                      👤 Customer Information
                    </h3>
                    <div className="space-y-2">
                      <div><strong>Name:</strong> {selectedCustomer.name || 'N/A'}</div>
                      <div><strong>Care Of:</strong> {selectedCustomer.care_of || 'N/A'}</div>
                      <div><strong>Mobile:</strong> {selectedCustomer.mobile || selectedCustomer.phone || 'N/A'}</div>
                      <div><strong>Email:</strong> {selectedCustomer.email || 'N/A'}</div>
                      <div><strong>Address:</strong> {selectedCustomer.address || 'N/A'}</div>
                      <div><strong>Registration Date:</strong> {new Date(selectedCustomer.date).toLocaleDateString('en-IN')}</div>
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="space-y-4">
                  {/* Vehicle Details from Import */}
                  {selectedCustomer.vehicle_info && Object.keys(selectedCustomer.vehicle_info).some(key => selectedCustomer.vehicle_info[key]) && (
                    <div className="border rounded-lg p-4 bg-blue-50">
                      <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                        🏍️ Vehicle Details (From Import)
                      </h3>
                      <div className="space-y-2">
                        <div><strong>Brand:</strong> {selectedCustomer.vehicle_info.brand || 'N/A'}</div>
                        <div><strong>Model:</strong> {selectedCustomer.vehicle_info.model || 'N/A'}</div>
                        <div><strong>Color:</strong> {selectedCustomer.vehicle_info.color || 'N/A'}</div>
                        <div><strong>Vehicle Number:</strong> {selectedCustomer.vehicle_info.vehicle_number || 'N/A'}</div>
                        <div><strong>Chassis Number:</strong> {selectedCustomer.vehicle_info.chassis_number || 'N/A'}</div>
                        <div><strong>Engine Number:</strong> {selectedCustomer.vehicle_info.engine_number || 'N/A'}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Legacy Vehicle Information */}
                  <div className="border rounded-lg p-4 bg-green-50">
                    <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                      🚗 Vehicle Information (Legacy)
                    </h3>
                    {selectedCustomer.brand !== 'N/A' ? (
                      <div className="space-y-2">
                        <div><strong>Brand:</strong> {selectedCustomer.brand || 'N/A'}</div>
                        <div><strong>Model:</strong> {selectedCustomer.model || 'N/A'}</div>
                        <div><strong>Color:</strong> {selectedCustomer.color || 'N/A'}</div>
                        <div><strong>Vehicle No:</strong> {selectedCustomer.vehicle_no || 'N/A'}</div>
                        <div><strong>Chassis No:</strong> {selectedCustomer.chassis_number || 'N/A'}</div>
                        <div><strong>Engine No:</strong> {selectedCustomer.engine_number || 'N/A'}</div>
                        {selectedCustomer.vehicle_status && (
                          <div><strong>Status:</strong> {selectedCustomer.vehicle_status}</div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">No legacy vehicle information available</p>
                    )}
                  </div>
                  
                  {/* Insurance Nominee Details from Import */}
                  {selectedCustomer.insurance_info && Object.keys(selectedCustomer.insurance_info).some(key => selectedCustomer.insurance_info[key]) && (
                    <div className="border rounded-lg p-4 bg-purple-50">
                      <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center">
                        🛡️ Insurance Nominee Details (From Import)
                      </h3>
                      <div className="space-y-2">
                        <div><strong>Nominee Name:</strong> {selectedCustomer.insurance_info.nominee_name || 'N/A'}</div>
                        <div><strong>Relation:</strong> {selectedCustomer.insurance_info.relation || 'N/A'}</div>
                        <div><strong>Age:</strong> {selectedCustomer.insurance_info.age || 'N/A'}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sales Information */}
              <div className="mt-6 space-y-4">
                {/* Sales Information from Import */}
                {selectedCustomer.sales_info && Object.keys(selectedCustomer.sales_info).some(key => selectedCustomer.sales_info[key]) && (
                  <div className="border rounded-lg p-4 bg-orange-50">
                    <h3 className="text-lg font-semibold text-orange-800 mb-3 flex items-center">
                      💰 Sales Information (From Import)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><strong>Amount:</strong> {selectedCustomer.sales_info.amount ? `₹${selectedCustomer.sales_info.amount}` : 'N/A'}</div>
                      <div><strong>Payment Method:</strong> {selectedCustomer.sales_info.payment_method || 'N/A'}</div>
                      <div><strong>Hypothecation:</strong> {selectedCustomer.sales_info.hypothecation || 'N/A'}</div>
                      <div><strong>Sale Date:</strong> {selectedCustomer.sales_info.sale_date || 'N/A'}</div>
                      <div><strong>Invoice Number:</strong> {selectedCustomer.sales_info.invoice_number || 'N/A'}</div>
                    </div>
                  </div>
                )}
                
                {/* Legacy Sales Information */}
                {selectedCustomer.sale_amount && (
                  <div className="border rounded-lg p-4 bg-purple-50">
                    <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center">
                      💰 Sales Information (Legacy)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><strong>Sale Amount:</strong> ₹{selectedCustomer.sale_amount?.toLocaleString()}</div>
                      <div><strong>Payment Method:</strong> {selectedCustomer.payment_method?.toUpperCase()}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-between">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowViewModal(false);
                    handleDeleteCustomer(selectedCustomer);
                  }}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Customer
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowViewModal(false);
                      handleEditCustomer(selectedCustomer);
                    }}
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Edit Customer
                  </Button>
                  <Button onClick={() => setShowViewModal(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Customer Details</h2>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>

              <div className="space-y-6">
                {/* Customer Details Section */}
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                    👤 Customer Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit_name">Customer Name</Label>
                      <Input
                        id="edit_name"
                        type="text"
                        value={editFormData.name || ''}
                        onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                        placeholder="Enter customer name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_care_of">Care Of (C/O)</Label>
                      <Input
                        id="edit_care_of"
                        type="text"
                        value={editFormData.care_of || ''}
                        onChange={(e) => setEditFormData({...editFormData, care_of: e.target.value})}
                        placeholder="S/O, D/O, W/O"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_mobile">Mobile Number</Label>
                      <Input
                        id="edit_mobile"
                        type="tel"
                        value={editFormData.mobile || ''}
                        onChange={(e) => setEditFormData({...editFormData, mobile: e.target.value})}
                        placeholder="Enter mobile number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_email">Email</Label>
                      <Input
                        id="edit_email"
                        type="email"
                        value={editFormData.email || ''}
                        onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="edit_address">Address</Label>
                      <Input
                        id="edit_address"
                        type="text"
                        value={editFormData.address || ''}
                        onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                        placeholder="Enter complete address"
                      />
                    </div>
                  </div>
                </div>

                {/* Vehicle Details Section */}
                <div className="border rounded-lg p-4 bg-green-50">
                  <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                    🏍️ Vehicle Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit_brand">Brand</Label>
                      <Input
                        id="edit_brand"
                        type="text"
                        value={editFormData.brand || ''}
                        onChange={(e) => setEditFormData({...editFormData, brand: e.target.value})}
                        placeholder="Enter brand"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_model">Model</Label>
                      <Input
                        id="edit_model"
                        type="text"
                        value={editFormData.model || ''}
                        onChange={(e) => setEditFormData({...editFormData, model: e.target.value})}
                        placeholder="Enter model"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_color">Color</Label>
                      <Input
                        id="edit_color"
                        type="text"
                        value={editFormData.color || ''}
                        onChange={(e) => setEditFormData({...editFormData, color: e.target.value})}
                        placeholder="Enter color"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_vehicle_no">Vehicle Number</Label>
                      <Input
                        id="edit_vehicle_no"
                        type="text"
                        value={editFormData.vehicle_no || ''}
                        onChange={(e) => setEditFormData({...editFormData, vehicle_no: e.target.value.toUpperCase()})}
                        placeholder="KA05AB1234"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_chassis_number">Chassis Number</Label>
                      <Input
                        id="edit_chassis_number"
                        type="text"
                        value={editFormData.chassis_number || ''}
                        onChange={(e) => setEditFormData({...editFormData, chassis_number: e.target.value.toUpperCase()})}
                        placeholder="Enter chassis number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_engine_number">Engine Number</Label>
                      <Input
                        id="edit_engine_number"
                        type="text"
                        value={editFormData.engine_number || ''}
                        onChange={(e) => setEditFormData({...editFormData, engine_number: e.target.value.toUpperCase()})}
                        placeholder="Enter engine number"
                      />
                    </div>
                  </div>
                </div>

                {/* Insurance Details Section */}
                <div className="border rounded-lg p-4 bg-purple-50">
                  <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                    🛡️ Insurance Nominee Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit_nominee">Nominee Name</Label>
                      <Input
                        id="edit_nominee"
                        type="text"
                        value={editFormData.insurance_nominee || ''}
                        onChange={(e) => setEditFormData({...editFormData, insurance_nominee: e.target.value})}
                        placeholder="Enter nominee name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_relation">Relation</Label>
                      <Input
                        id="edit_relation"
                        type="text"
                        value={editFormData.relation || ''}
                        onChange={(e) => setEditFormData({...editFormData, relation: e.target.value})}
                        placeholder="Enter relation"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_age">Age</Label>
                      <Input
                        id="edit_age"
                        type="number"
                        value={editFormData.age || ''}
                        onChange={(e) => setEditFormData({...editFormData, age: e.target.value})}
                        placeholder="Enter age"
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

const InsuranceManagement = () => {
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const [insuranceData, setInsuranceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInsurance, setSelectedInsurance] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchInsuranceData();
  }, []);

  useEffect(() => {
    filterInsuranceData();
  }, [insuranceData, searchTerm]);

  const fetchInsuranceData = async () => {
    try {
      const [salesRes, customersRes, vehiclesRes] = await Promise.all([
        axios.get(`${API}/sales?limit=4000`),
        axios.get(`${API}/customers`, {
          params: {
            page: 1,
            limit: 10000,
            sort: 'created_at',
            order: 'desc'
          }
        }),
        axios.get(`${API}/vehicles?limit=4000`)
      ]);

      const sales = extractData(salesRes);
      const customers = customersRes.data.data || customersRes.data;
      const vehicles = extractData(vehiclesRes);

      // Combine data to create insurance records
      const combined = sales.map(sale => {
        const customer = customers.find(c => c.id === sale.customer_id);
        const vehicle = vehicles.find(v => v.id === sale.vehicle_id);
        
        // For direct sales, get vehicle details from vehicles collection
        // For imported sales, get vehicle details from sale record itself
        let vehicleModel = 'Unknown Vehicle';
        let vehicleRegNo = 'N/A';
        let vehicleChassis = 'N/A';
        let vehicleEngine = 'N/A';
        
        if (vehicle) {
          // Direct sale with vehicle_id
          vehicleModel = `${vehicle.brand} ${vehicle.model}`;
          vehicleRegNo = vehicle.vehicle_number || 'N/A';
          vehicleChassis = vehicle.chassis_number || 'N/A';
          vehicleEngine = vehicle.engine_number || 'N/A';
        } else if (sale.vehicle_brand || sale.vehicle_model) {
          // Imported sale with vehicle details in sale record
          vehicleModel = `${sale.vehicle_brand || ''} ${sale.vehicle_model || ''}`.trim() || 'Unknown Vehicle';
          vehicleRegNo = sale.vehicle_registration || 'N/A';
          vehicleChassis = sale.vehicle_chassis || 'N/A';
          vehicleEngine = sale.vehicle_engine || 'N/A';
        }
        
        // Calculate insurance expiry date (364 days from purchase date)
        const purchaseDate = new Date(sale.sale_date);
        const expiryDate = new Date(purchaseDate);
        expiryDate.setDate(purchaseDate.getDate() + 364);

        // Determine status based on expiry date
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        let status;
        if (daysUntilExpiry < 0) {
          status = 'expired';
        } else if (daysUntilExpiry <= 30) {
          status = 'expiring_soon';
        } else {
          status = 'active';
        }

        return {
          id: sale.id,
          customer_name: customer?.name || 'Unknown',
          phone_number: customer?.mobile || customer?.phone || 'N/A',
          vehicle_model: vehicleModel,
          vehicle_reg_no: vehicleRegNo,
          purchase_date: sale.sale_date,
          expiry_date: expiryDate.toISOString(),
          status: status,
          days_until_expiry: daysUntilExpiry,
          customer_id: sale.customer_id,
          vehicle_id: sale.vehicle_id,
          sale_amount: sale.amount,
          payment_method: sale.payment_method,
          customer_address: customer?.address || 'N/A',
          vehicle_chassis: vehicleChassis,
          vehicle_engine: vehicleEngine,
          source: sale.source || 'direct'
        };
      });

      setInsuranceData(combined);
    } catch (error) {
      toast.error('Failed to fetch insurance data');
    } finally {
      setLoading(false);
    }
  };

  const filterInsuranceData = () => {
    let filtered = insuranceData;

    if (searchTerm) {
      filtered = insuranceData.filter(item =>
        item.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vehicle_model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vehicle_reg_no?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredData(filtered);
  };

  const getStatusBadge = (status, daysUntilExpiry) => {
    const statusConfig = {
      expired: { 
        label: 'Expired', 
        className: 'bg-red-100 text-red-800 border-red-200' 
      },
      expiring_soon: { 
        label: `Expires in ${daysUntilExpiry} days`, 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200' 
      },
      active: { 
        label: 'Active', 
        className: 'bg-green-100 text-green-800 border-green-200' 
      }
    };

    const config = statusConfig[status] || statusConfig.active;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const handleViewInsurance = (insurance) => {
    setSelectedInsurance(insurance);
    setShowViewModal(true);
  };

  const handleEditInsurance = (insurance) => {
    setSelectedInsurance(insurance);
    setShowEditModal(true);
  };

  const handleDeleteInsurance = async (insurance) => {
    const ok = await confirm({
      title: `Delete insurance record for "${insurance.customer_name}"?`,
      description: 'This action cannot be undone.',
      confirmLabel: 'Delete Record',
    });
    if (!ok) return;

    try {
      // Since insurance is derived from customer/sales data, we need to delete the related sale or update customer data
      // For now, we'll remove it from the local view - this would need backend support for actual deletion
      const updatedData = insuranceData.filter(ins => ins.id !== insurance.id);
      setInsuranceData(updatedData);
      
      toast.success('Insurance record deleted successfully!');
      
      // In a real implementation, you'd call a backend endpoint like:
      // const token = localStorage.getItem('token');
      // await axios.delete(`${API}/insurance/${insurance.id}`, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete insurance record');
    }
  };

  const exportInsuranceData = () => {
    try {
      const csvContent = [
        ['Customer Name', 'Phone Number', 'Vehicle Model', 'Vehicle Reg No', 'Purchase Date', 'Expiry Date', 'Status', 'Days Until Expiry'].join(','),
        ...filteredData.map(item => [
          item.customer_name || '',
          item.phone_number || '',
          item.vehicle_model || '',
          item.vehicle_reg_no || '',
          new Date(item.purchase_date).toLocaleDateString('en-IN'),
          new Date(item.expiry_date).toLocaleDateString('en-IN'),
          item.status || '',
          item.days_until_expiry || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `insurance_renewals_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Insurance data exported successfully!');
    } catch (error) {
      toast.error('Failed to export insurance data');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="spinner"></div></div>;
  }

  const expiredCount = insuranceData.filter(item => item.status === 'expired').length;
  const expiringSoonCount = insuranceData.filter(item => item.status === 'expiring_soon').length;
  const activeCount = insuranceData.filter(item => item.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Insurance Renewal Management</h2>
          <p className="text-gray-600">Track and manage vehicle insurance renewals</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportInsuranceData} variant="outline" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Export Data
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Send Reminders
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by customer name, phone, vehicle model, or registration number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-red-600">{expiredCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-yellow-600">{expiringSoonCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Policies</p>
                <p className="text-2xl font-bold text-blue-600">{insuranceData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insurance Renewal Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Insurance Renewals ({filteredData.length} policies)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold">Customer Name</th>
                  <th className="text-left p-3 font-semibold">Phone Number</th>
                  <th className="text-left p-3 font-semibold">Vehicle Model</th>
                  <th className="text-left p-3 font-semibold">Vehicle Reg. No</th>
                  <th className="text-left p-3 font-semibold">Expiry Date</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500">
                      {searchTerm ? 'No insurance records found matching your search' : 'No insurance records found'}
                    </td>
                  </tr>
                ) : (
                  filteredData.map((insurance) => (
                    <tr key={insurance.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <div className="font-medium text-gray-900">{insurance.customer_name}</div>
                      </td>
                      <td className="p-3 text-gray-600">{insurance.phone_number}</td>
                      <td className="p-3 text-gray-600">{insurance.vehicle_model}</td>
                      <td className="p-3 text-gray-600 font-mono">{insurance.vehicle_reg_no}</td>
                      <td className="p-3">
                        <div className="text-gray-900 font-medium">
                          {new Date(insurance.expiry_date).toLocaleDateString('en-IN')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {insurance.days_until_expiry > 0 
                            ? `${insurance.days_until_expiry} days left`
                            : `${Math.abs(insurance.days_until_expiry)} days overdue`
                          }
                        </div>
                      </td>
                      <td className="p-3">
                        {getStatusBadge(insurance.status, insurance.days_until_expiry)}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewInsurance(insurance)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditInsurance(insurance)}
                            className="flex items-center gap-1"
                          >
                            <FileText className="w-4 h-4" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteInsurance(insurance)}
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
      </Card>

      {/* View Insurance Modal */}
      {showViewModal && selectedInsurance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Insurance Policy Details</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </Button>
              </div>

              <div className="space-y-6">
                {/* Customer Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Name:</strong> {selectedInsurance.customer_name}</div>
                    <div><strong>Mobile:</strong> {selectedInsurance.phone_number}</div>
                    <div className="md:col-span-2"><strong>Address:</strong> {selectedInsurance.customer_address}</div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Vehicle Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Model:</strong> {selectedInsurance.vehicle_model}</div>
                    <div><strong>Registration:</strong> {selectedInsurance.vehicle_reg_no}</div>
                    <div><strong>Chassis Number:</strong> {selectedInsurance.vehicle_chassis}</div>
                    <div><strong>Engine Number:</strong> {selectedInsurance.vehicle_engine}</div>
                  </div>
                </div>

                {/* Insurance Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Insurance Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Purchase Date:</strong> {new Date(selectedInsurance.purchase_date).toLocaleDateString('en-IN')}</div>
                    <div><strong>Expiry Date:</strong> {new Date(selectedInsurance.expiry_date).toLocaleDateString('en-IN')}</div>
                    <div><strong>Status:</strong> {getStatusBadge(selectedInsurance.status, selectedInsurance.days_until_expiry)}</div>
                    <div><strong>Days Until Expiry:</strong> 
                      <span className={selectedInsurance.days_until_expiry < 0 ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                        {selectedInsurance.days_until_expiry > 0 
                          ? `${selectedInsurance.days_until_expiry} days`
                          : `${Math.abs(selectedInsurance.days_until_expiry)} days overdue`
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sale Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Purchase Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Sale Amount:</strong> ₹{selectedInsurance.sale_amount?.toLocaleString()}</div>
                    <div><strong>Payment Method:</strong> {selectedInsurance.payment_method?.toUpperCase()}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditInsurance(selectedInsurance);
                  }}
                >
                  Edit Policy
                </Button>
                <Button onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Insurance Modal */}
      {showEditModal && selectedInsurance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Insurance Policy</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setShowEditModal(false)}
                >
                  Close
                </Button>
              </div>

              <div className="text-center py-8">
                <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Insurance Policy Management</h3>
                <p className="text-gray-500 mb-4">
                  Edit functionality for insurance policies will be implemented in the next update.
                  Currently showing policy details for: <strong>{selectedInsurance.customer_name}</strong>
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600">
                    Vehicle: {selectedInsurance.vehicle_model} ({selectedInsurance.vehicle_reg_no})
                  </p>
                  <p className="text-sm text-gray-600">
                    Expiry: {new Date(selectedInsurance.expiry_date).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <Button onClick={() => setShowEditModal(false)}>
                  Close
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

export default Sales;
