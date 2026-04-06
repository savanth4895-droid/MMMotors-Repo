import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { 
  Users, 
  ShoppingCart, 
  Wrench, 
  Package, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Database,
  RefreshCw,
  MessageCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import MotorcycleIcon from './ui/MotorcycleIcon';
import { extractData } from '../lib/api';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Chart color palette
const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#14b8a6', '#6366f1', '#84cc16'];

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_customers: 0,
    total_vehicles: 0,
    vehicles_in_stock: 0,
    vehicles_sold: 0,
    pending_services: 0,
    low_stock_parts: 0,
    completed_today: 0,
    sales_stats: {
      total_sales: 0,
      direct_sales: 0,
      imported_sales: 0,
      total_revenue: 0,
      direct_revenue: 0,
      imported_revenue: 0
    }
  });
  const [backupStats, setBackupStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [salesChartData, setSalesChartData] = useState([]);
  const [brandChartData, setBrandChartData] = useState([]);
  const [serviceStatusData, setServiceStatusData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [chartGranularity, setChartGranularity] = useState('monthly');

  useEffect(() => {
    fetchAllData();
    
    const refreshInterval = setInterval(() => {
      fetchAllData();
    }, 60000); // Refresh every 60 seconds
    
    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    fetchSalesChart();
  }, [chartGranularity]);

  const fetchAllData = async () => {
    await Promise.all([
      fetchStats(),
      fetchRecentActivities(),
      fetchSalesChart(),
      fetchBrandData(),
      fetchServiceData()
    ]);
  };

  const fetchStats = async () => {
    try {
      const [dashboardRes, backupRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/backup/stats`).catch(() => ({ data: null }))
      ]);
      
      setStats(dashboardRes.data);
      setBackupStats(backupRes.data);
      setLastUpdate(new Date());
    } catch (error) {
      if (loading) {
        toast.error('Failed to fetch dashboard statistics');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const response = await axios.get(`${API}/activities?limit=5`);
      setRecentActivities(response.data.activities || []);
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
    }
  };

  const fetchSalesChart = async () => {
    try {
      const response = await axios.get(`${API}/sales/summary/chart?granularity=${chartGranularity}`);
      const data = (response.data.labels || []).map((label, index) => ({
        name: label,
        revenue: response.data.values?.[index] || 0,
      }));
      setSalesChartData(data);
    } catch (error) {
      console.error('Failed to fetch sales chart:', error);
    }
  };

  const fetchBrandData = async () => {
    try {
      const response = await axios.get(`${API}/vehicles?limit=4000`);
      const vehicles = extractData(response);
      
      // Group by brand
      const brandMap = {};
      vehicles.forEach(v => {
        const brand = v.brand || 'Unknown';
        if (!brandMap[brand]) {
          brandMap[brand] = { name: brand, inStock: 0, sold: 0, returned: 0 };
        }
        if (v.status === 'in_stock') brandMap[brand].inStock++;
        else if (v.status === 'sold') brandMap[brand].sold++;
        else if (v.status === 'returned') brandMap[brand].returned++;
      });
      
      setBrandChartData(Object.values(brandMap).sort((a, b) => (b.inStock + b.sold) - (a.inStock + a.sold)));
    } catch (error) {
      console.error('Failed to fetch brand data:', error);
    }
  };

  const fetchServiceData = async () => {
    try {
      const response = await axios.get(`${API}/services?limit=4000`);
      const services = extractData(response);
      
      const statusMap = { pending: 0, in_progress: 0, completed: 0 };
      services.forEach(s => {
        if (statusMap[s.status] !== undefined) statusMap[s.status]++;
      });
      
      setServiceStatusData([
        { name: 'Pending', value: statusMap.pending, color: '#f59e0b' },
        { name: 'In Progress', value: statusMap.in_progress, color: '#3b82f6' },
        { name: 'Completed', value: statusMap.completed, color: '#10b981' },
      ].filter(d => d.value > 0));
    } catch (error) {
      console.error('Failed to fetch service data:', error);
    }
  };

  const getActivityIcon = (type, icon) => {
    const iconClasses = "w-4 h-4";
    const colorMap = {
      success: { bg: 'bg-green-100', text: 'text-green-600', icon: CheckCircle },
      warning: { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: AlertTriangle },
      error: { bg: 'bg-red-100', text: 'text-red-600', icon: AlertTriangle },
      info: { bg: 'bg-blue-100', text: 'text-blue-600', icon: Database }
    };

    const typeIconMap = {
      sale_created: ShoppingCart,
      service_completed: Wrench,
      service_created: Wrench,
      vehicle_added: MotorcycleIcon,
      vehicle_sold: ShoppingCart,
      low_stock: AlertTriangle,
      customer_added: Users,
      backup_created: Database
    };

    const color = colorMap[icon] || colorMap.info;
    const IconComponent = typeIconMap[type] || color.icon;

    return (
      <div className={`w-8 h-8 ${color.bg} rounded-full flex items-center justify-center`}>
        <IconComponent className={`${iconClasses} ${color.text}`} />
      </div>
    );
  };

  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const formatCurrency = (value) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white shadow-lg border rounded-lg p-3">
          <p className="text-sm font-semibold text-gray-800">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: ₹{parseFloat(entry.value).toLocaleString('en-IN')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const mainModules = [
    {
      title: 'Sales',
      description: 'Manage invoices, customers, and insurance',
      icon: ShoppingCart,
      color: 'from-blue-500 to-cyan-500',
      link: '/sales',
      stats: [
        { label: 'Total Customers', value: stats.total_customers },
        { label: 'Vehicles Sold', value: stats.vehicles_sold }
      ]
    },
    {
      title: 'Services',
      description: 'Job cards, registrations, and service management',
      icon: Wrench,
      color: 'from-green-500 to-teal-500',
      link: '/services',
      stats: [
        { label: 'Pending Services', value: stats.pending_services },
        { label: 'Active Jobs', value: stats.pending_services }
      ]
    },
    {
      title: 'Vehicle Stock',
      description: 'Track inventory across all brands',
      icon: MotorcycleIcon,
      color: 'from-purple-500 to-pink-500',
      link: '/vehicles',
      stats: [
        { label: 'In Stock', value: stats.vehicles_in_stock },
        { label: 'Total Vehicles', value: stats.total_vehicles }
      ]
    },
    {
      title: 'Spare Parts',
      description: 'Inventory management and billing',
      icon: Package,
      color: 'from-orange-500 to-red-500',
      link: '/spare-parts',
      stats: [
        { label: 'Low Stock Items', value: stats.low_stock_parts },
        { label: 'Active Parts', value: '—' }
      ]
    }
  ];

  const quickStats = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.sales_stats?.total_revenue || 0),
      subtitle: `${stats.sales_stats?.total_sales || 0} transactions`,
      icon: TrendingUp,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      title: 'Pending Services',
      value: stats.pending_services,
      subtitle: stats.pending_services > 5 ? '⚠️ Needs attention' : 'All good',
      icon: Wrench,
      iconBg: stats.pending_services > 5 ? 'bg-red-100' : 'bg-blue-100',
      iconColor: stats.pending_services > 5 ? 'text-red-600' : 'text-blue-600'
    },
    {
      title: 'Vehicles In Stock',
      value: stats.vehicles_in_stock,
      subtitle: `${stats.total_vehicles} total vehicles`,
      icon: MotorcycleIcon,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Active Customers',
      value: stats.total_customers,
      subtitle: `${stats.vehicles_sold} vehicles sold`,
      icon: Users,
      iconBg: 'bg-cyan-100',
      iconColor: 'text-cyan-600'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">M M Motors Dashboard</h1>
            <p className="text-blue-100 text-sm">
              Real-time overview of your two-wheeler business
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchAllData}
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <p className="text-xs text-blue-200">
              Updated: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="card-hover border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{stat.subtitle}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Revenue Trend</CardTitle>
                <CardDescription>Sales performance over time</CardDescription>
              </div>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setChartGranularity('monthly')}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                    chartGranularity === 'monthly' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setChartGranularity('yearly')}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                    chartGranularity === 'yearly' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {salesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} tickFormatter={formatCurrency} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fill="url(#colorRevenue)"
                    name="Revenue"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-gray-400">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No sales data yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Status Pie Chart */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Service Status</CardTitle>
            <CardDescription>Current service breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {serviceStatusData.length > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={serviceStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {serviceStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {serviceStatusData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-xs text-gray-600">{entry.name} ({entry.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[240px] text-gray-400">
                <div className="text-center">
                  <Wrench className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No service data yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Brand Inventory Chart */}
      {brandChartData.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Inventory by Brand</CardTitle>
                <CardDescription>Vehicle stock across all brands</CardDescription>
              </div>
              <Link to="/vehicles">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={brandChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, angle: -30, textAnchor: 'end' }} height={50} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="inStock" name="In Stock" fill="#10b981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="sold" name="Sold" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                <Bar dataKey="returned" name="Returned" fill="#6366f1" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Main Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mainModules.map((module, index) => {
          const Icon = module.icon;
          return (
            <Card key={index} className="card-hover overflow-hidden shadow-sm">
              <div className={`h-1.5 bg-gradient-to-r ${module.color}`}></div>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 bg-gradient-to-r ${module.color} rounded-lg flex items-center justify-center shadow-sm`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    <CardDescription className="text-xs">{module.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {module.stats.map((stat, statIndex) => (
                    <div key={statIndex} className="text-center p-2.5 bg-gray-50 rounded-lg">
                      <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <Link to={module.link}>
                  <Button className="w-full btn-hover" size="sm">
                    Access {module.title}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sales Overview */}
      <Card className="border-l-4 border-l-green-500 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-base">Sales Breakdown</CardTitle>
                <CardDescription className="text-xs">Direct vs imported sales analysis</CardDescription>
              </div>
            </div>
            <Link to="/sales">
              <Button variant="outline" size="sm">View Sales</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(stats.sales_stats?.total_revenue || 0)}
              </p>
              <p className="text-xs text-gray-600">Total Revenue</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(stats.sales_stats?.direct_revenue || 0)}
              </p>
              <p className="text-xs text-gray-600">Direct Sales</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-xl font-bold text-orange-600">
                {formatCurrency(stats.sales_stats?.imported_revenue || 0)}
              </p>
              <p className="text-xs text-gray-600">Imported Sales</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-xl font-bold text-purple-600">
                {stats.sales_stats?.total_sales || 0}
              </p>
              <p className="text-xs text-gray-600">Total Transactions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Row: Backup & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backup Status */}
        {backupStats && (
          <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Database className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Backup Status</CardTitle>
                    <CardDescription className="text-xs">Data protection overview</CardDescription>
                  </div>
                </div>
                <Link to="/backup">
                  <Button variant="outline" size="sm">Manage</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xl font-bold text-blue-600">{backupStats.total_backups}</p>
                  <p className="text-xs text-gray-600">Total Backups</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center space-x-1">
                    {backupStats.last_backup_date ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-bold text-green-600">Active</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-bold text-red-600">None</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">Status</p>
                </div>
              </div>
              {backupStats.last_backup_date && (
                <p className="text-xs text-gray-500 text-center mt-3">
                  Last: {new Date(backupStats.last_backup_date).toLocaleString('en-IN', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata'
                  })} IST
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription className="text-xs">Latest updates from your business</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <Database className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div 
                    key={activity.id} 
                    className={`flex items-center space-x-3 p-2.5 rounded-lg ${
                      activity.icon === 'success' ? 'bg-green-50' :
                      activity.icon === 'warning' ? 'bg-yellow-50' :
                      activity.icon === 'error' ? 'bg-red-50' : 'bg-blue-50'
                    }`}
                  >
                    {getActivityIcon(activity.type, activity.icon)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      <p className="text-xs text-gray-500 truncate">{activity.description}</p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {formatTimeAgo(activity.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
