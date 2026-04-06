import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { LoadingSpinner } from '../ui/loading';
import { Users, Search, Car, Wrench, CheckCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const vehicleBrands = ['TVS', 'BAJAJ', 'HERO', 'HONDA', 'TRIUMPH', 'KTM', 'SUZUKI', 'APRILIA', 'YAMAHA', 'PIAGGIO', 'ROYAL ENFIELD'];
const serviceTypes = [
  { value: 'free_service', label: 'Free Service' },
  { value: 'paid_service', label: 'Paid Service' },
  { value: 'running_repair', label: 'Running Repair' },
  { value: 'accidental', label: 'Accidental Repair' },
  { value: 'warranty', label: 'Warranty Claims' },
  { value: 'pdi', label: 'PDI / First check' }
];

const JobCardSchema = z.object({
  customer_id: z.string().optional(),
  customer_name: z.string().optional(),
  customer_mobile: z.string().optional(),
  vehicle_number: z.string().min(1, 'Vehicle registration number is required'),
  vehicle_brand: z.string().optional(),
  vehicle_model: z.string().optional(),
  vehicle_year: z.coerce.number().min(1990).max(2030).optional().or(z.literal('')),
  kms_driven: z.coerce.number().optional().or(z.literal('')),
  service_number: z.string().optional(),
  service_date: z.string().optional(),
  service_type: z.string().min(1, 'Service type is required'),
  estimated_amount: z.coerce.number().optional().or(z.literal('')),
  complaint: z.string().min(1, 'Complaint/Issue is required')
}).superRefine((data, ctx) => {
  if (!data.customer_id && !data.customer_name) {
    ctx.addIssue({
      path: ['customer_name'],
      message: 'Please select a customer or provide a customer name',
      code: z.ZodIssueCode.custom
    });
  }
});

export const CreateJobCardForm = ({ onSuccess, onCancel, customers = [] }) => {
  const [loading, setLoading] = useState(false);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

  const form = useForm({
    resolver: zodResolver(JobCardSchema),
    defaultValues: {
      customer_id: '',
      customer_name: '',
      customer_mobile: '',
      vehicle_number: '',
      vehicle_brand: '',
      vehicle_model: '',
      vehicle_year: '',
      kms_driven: '',
      service_number: '',
      service_date: new Date().toISOString().split('T')[0],
      service_type: '',
      estimated_amount: '',
      complaint: ''
    }
  });

  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = form;
  const customerIdWatch = watch('customer_id');

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const searchCustomers = (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setCustomerSuggestions([]);
      return;
    }
    
    setSearchingCustomers(true);
    const lowercaseSearch = searchTerm.toLowerCase();
    
    const matchingCustomers = customers.filter(customer => 
      (customer.name && customer.name.toLowerCase().includes(lowercaseSearch)) ||
      (customer.mobile && customer.mobile.includes(searchTerm)) ||
      (customer.phone && customer.phone.includes(searchTerm))
    );
    
    setCustomerSuggestions(matchingCustomers.slice(0, 10));
    setShowCustomerSuggestions(matchingCustomers.length > 0);
    setSearchingCustomers(false);
  };

  const debouncedCustomerSearch = useCallback(debounce(searchCustomers, 300), [customers]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('#customer_search') && !event.target.closest('.customer-dropdown')) {
        setShowCustomerSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCustomerSelect = async (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    setCustomerSearchTerm(customer.name);
    setShowCustomerSuggestions(false);

    setValue('customer_id', customer.id, { shouldValidate: true });
    setValue('customer_name', customer.name || '', { shouldValidate: true });
    setValue('customer_mobile', customer.mobile || customer.phone || '', { shouldValidate: true });

    try {
      const token = localStorage.getItem('token');
      const salesResponse = await axios.get(`${API}/sales`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const customerSales = salesResponse.data.filter(sale => sale.customer_id === customer.id);
      
      if (customerSales.length > 0) {
        const latestSale = customerSales.sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date))[0];
        
        try {
          const vehicleResponse = await axios.get(`${API}/vehicles/${latestSale.vehicle_id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (vehicleResponse.data) {
            const vehicle = vehicleResponse.data;
            setValue('vehicle_number', vehicle.vehicle_number || vehicle.vehicle_no || '', { shouldValidate: true });
            setValue('vehicle_brand', vehicle.brand || '', { shouldValidate: true });
            setValue('vehicle_model', vehicle.model || '', { shouldValidate: true });
            toast.success('Vehicle info auto-loaded!');
          }
        } catch (error) {
          console.error("Could not fetch vehicle", error);
        }
      }
    } catch (error) {
      console.error('Error fetching vehicle details for customer:', error);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      let customerId = data.customer_id;
      if (!customerId && data.customer_name) {
        const existingCustomer = customers.find(c => c.mobile === data.customer_mobile || c.phone === data.customer_mobile);
        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          const customerResponse = await axios.post(`${API}/customers`, {
            name: data.customer_name,
            mobile: data.customer_mobile,
            address: ''
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          customerId = customerResponse.data.id;
        }
      }

      const jobCardData = {
        customer_id: customerId,
        vehicle_number: data.vehicle_number,
        vehicle_brand: data.vehicle_brand,
        vehicle_model: data.vehicle_model,
        vehicle_year: data.vehicle_year?.toString() || '',
        service_type: data.service_type,
        description: data.complaint,
        amount: data.estimated_amount || 0,
        service_number: data.service_number,
        kms_driven: data.kms_driven || null,
        service_date: data.service_date ? new Date(data.service_date).toISOString() : null
      };

      await axios.post(`${API}/services`, jobCardData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Job card created successfully!');
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create job card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Customer Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-blue-600 border-b pb-2 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Customer Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative md:col-span-2">
            <Label htmlFor="customer_search">Search Existing Customer</Label>
            <div className="relative">
              <Input
                id="customer_search"
                placeholder="Search by name or mobile number..."
                value={customerSearchTerm}
                onChange={(e) => {
                  const value = e.target.value;
                  setCustomerSearchTerm(value);
                  debouncedCustomerSearch(value);
                  if (customerIdWatch && value !== watch('customer_name')) {
                    setValue('customer_id', '');
                    setValue('customer_name', '');
                    setValue('customer_mobile', '');
                    setValue('vehicle_number', '');
                    setValue('vehicle_brand', '');
                    setValue('vehicle_model', '');
                  }
                }}
                onFocus={() => customerSuggestions.length > 0 && setShowCustomerSuggestions(true)}
                className={searchingCustomers ? "border-blue-300 pr-10" : "pr-10"}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {searchingCustomers ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-200 border-t-blue-600"></div>
                ) : (
                  <Search className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>
            
            {showCustomerSuggestions && customerSuggestions.length > 0 && (
              <div className="customer-dropdown absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto mt-1">
                <div className="p-2 text-xs text-blue-600 font-medium border-b bg-blue-50">
                  Select a customer to auto-fill vehicle info
                </div>
                {customerSuggestions.map((customer) => (
                  <div key={customer.id} className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0" onClick={() => handleCustomerSelect(customer.id)}>
                    <div className="font-medium text-sm">{customer.name}</div>
                    <div className="text-xs text-gray-500">📱 {customer.mobile || customer.phone || 'No phone'}</div>
                  </div>
                ))}
              </div>
            )}
            
            {customerIdWatch && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>Customer selected - vehicle info will be loaded</span>
              </div>
            )}
          </div>
          <div className="md:col-span-2 flex items-center text-gray-500 text-sm">
            <span className="bg-gray-100 px-3 py-2 rounded">OR enter new customer details below</span>
          </div>
          <div>
            <Label htmlFor="customer_name">Customer Name *</Label>
            <Input id="customer_name" placeholder="Enter customer name" {...register('customer_name')} />
            {errors.customer_name && <p className="text-red-500 text-xs mt-1">{errors.customer_name.message}</p>}
          </div>
          <div>
            <Label htmlFor="customer_mobile">Mobile Number</Label>
            <Input id="customer_mobile" placeholder="Enter mobile number" {...register('customer_mobile')} />
          </div>
        </div>
      </div>

      {/* Vehicle Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-green-600 border-b pb-2 flex items-center gap-2">
          <Car className="w-5 h-5" />
          Vehicle Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="vehicle_number">Vehicle Registration Number *</Label>
            <Input id="vehicle_number" placeholder="e.g., KA01AB1234" {...register('vehicle_number', { onChange: (e) => e.target.value = e.target.value.toUpperCase() })} />
            {errors.vehicle_number && <p className="text-red-500 text-xs mt-1">{errors.vehicle_number.message}</p>}
          </div>
          <div>
            <Label htmlFor="vehicle_brand">Vehicle Brand</Label>
            <Controller name="vehicle_brand" control={control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Select brand..." /></SelectTrigger>
                <SelectContent>{vehicleBrands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            )} />
          </div>
          <div>
            <Label htmlFor="vehicle_model">Vehicle Model</Label>
            <Input id="vehicle_model" placeholder="e.g., Apache RTR 160" {...register('vehicle_model')} />
          </div>
          <div>
            <Label htmlFor="vehicle_year">Vehicle Year</Label>
            <Input id="vehicle_year" type="number" placeholder="e.g., 2024" min="1990" max="2030" {...register('vehicle_year')} />
          </div>
          <div>
            <Label htmlFor="kms_driven">Kilometers Driven</Label>
            <Input id="kms_driven" type="number" placeholder="e.g., 15000" min="0" {...register('kms_driven')} />
          </div>
        </div>
      </div>

      {/* Service Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-purple-600 border-b pb-2 flex items-center gap-2">
          <Wrench className="w-5 h-5" />
          Service Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="service_number">Service Number</Label>
            <Input id="service_number" placeholder="e.g., SRV-001" {...register('service_number')} />
          </div>
          <div>
            <Label htmlFor="service_date">Service Date</Label>
            <Input id="service_date" type="date" {...register('service_date')} />
          </div>
          <div>
            <Label htmlFor="service_type">Service Type *</Label>
            <Controller name="service_type" control={control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Select service type..." /></SelectTrigger>
                <SelectContent>
                  {serviceTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
            {errors.service_type && <p className="text-red-500 text-xs mt-1">{errors.service_type.message}</p>}
          </div>
          <div>
            <Label htmlFor="estimated_amount">Estimated Amount (₹)</Label>
            <Input id="estimated_amount" type="number" step="0.01" placeholder="Enter estimated amount" {...register('estimated_amount')} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="complaint">Complaint / Issue Description *</Label>
            <Textarea id="complaint" placeholder="Describe the customer's complaint..." rows={4} {...register('complaint')} />
            {errors.complaint && <p className="text-red-500 text-xs mt-1">{errors.complaint.message}</p>}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2 border-t pt-4">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          {loading ? <><LoadingSpinner size="sm" className="mr-2" /> Creating...</> : 'Create Job Card'}
        </Button>
      </div>
    </form>
  );
};
