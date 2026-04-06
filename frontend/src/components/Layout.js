import React, { useContext, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import NotificationDropdown from './NotificationDropdown';
import { 
  Bike, 
  LayoutDashboard, 
  ShoppingCart, 
  Wrench, 
  Package, 
  LogOut, 
  Menu,
  User,
  Bell,
  ChevronLeft,
  ChevronRight,
  Zap,
  Fuel,
  Database,
  Upload
} from 'lucide-react';

// Custom Motorcycle Icon Component
import { toast } from 'sonner';
import MotorcycleIcon from './ui/MotorcycleIcon';

const Layout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard
    },
    {
      name: 'Sales',
      path: '/sales',
      icon: ShoppingCart
    },
    {
      name: 'Services',
      path: '/services',
      icon: Wrench
    },
    {
      name: 'Vehicle Stock',
      path: '/vehicles',
      icon: MotorcycleIcon
    },
    {
      name: 'Spare Parts',
      path: '/spare-parts',
      icon: Package
    },
    {
      name: 'Backup',
      path: '/backup',
      icon: Database
    },
    {
      name: 'Data Import',
      path: '/data-import',
      icon: Upload
    }
  ];

  const isCurrentPath = (path) => {
    return location.pathname.startsWith(path);
  };

  const SidebarContent = ({ collapsed = false }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center p-6 border-b border-gray-200 ${collapsed ? 'justify-center' : 'space-x-3'}`}>
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 16c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2zm12 0c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2zm1.5-9H16l-3-3h-2v2h1.5l1.5 1.5H8L6 5.5H4.5C3.7 5.5 3 6.2 3 7s.7 1.5 1.5 1.5H6l2 2.5h8l2-2.5h.5c.8 0 1.5-.7 1.5-1.5s-.7-1.5-1.5-1.5z"/>
            <circle cx="7" cy="16" r="1"/>
            <circle cx="19" cy="16" r="1"/>
            <path d="M8.5 12l1.5-1.5h4L15.5 12H8.5z"/>
          </svg>
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-xl font-bold text-gray-800">M M Motors</h1>
            <p className="text-xs text-gray-500">Business System</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = isCurrentPath(item.path);
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center rounded-lg transition-colors ${
                    collapsed ? 'justify-center px-3 py-3' : 'space-x-3 px-3 py-2.5'
                  } ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  title={collapsed ? item.name : ''}
                >
                  <Icon className="w-5 h-5" />
                  {!collapsed && <span className="font-medium">{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info */}
      <div className="border-t border-gray-200 p-4">
        {!collapsed && (
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        )}
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className={`text-red-600 border-red-200 hover:bg-red-50 ${
            collapsed ? 'w-10 h-10 p-0' : 'w-full justify-start'
          }`}
          title={collapsed ? 'Logout' : ''}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className={`flex flex-col bg-white shadow-sm transition-all duration-300 ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}>
          <SidebarContent collapsed={isSidebarCollapsed} />
          
          {/* Toggle Button */}
          <div className="border-t border-gray-200 p-2">
            <Button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              variant="ghost"
              size="sm"
              className="w-full justify-center hover:bg-gray-100"
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden"
                    onClick={() => setIsMobileMenuOpen(true)}
                  >
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
              </Sheet>

              {/* Desktop sidebar toggle button */}
              <Button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                variant="ghost"
                size="sm"
                className="hidden lg:flex"
                title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                <Menu className="w-5 h-5" />
              </Button>

              {/* Page Title */}
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {navigationItems.find(item => isCurrentPath(item.path))?.name || 'Dashboard'}
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <NotificationDropdown />

              {/* User menu for mobile */}
              <div className="lg:hidden">
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="text-red-600"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
