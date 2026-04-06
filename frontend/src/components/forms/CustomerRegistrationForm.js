import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { LoadingSpinner } from '../ui/loading';
import { FileSearch } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const brands = ['TVS', 'BAJAJ', 'HERO', 'HONDA', 'TRIUMPH', 'KTM', 'SUZUKI', 'APRILIA', 'YAMAHA', 'PIAGGIO', 'ROYAL ENFIELD'];

const RegistrationSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  phone_number: z.string().regex(/^\d{10}$/, 'Mobile number must be exactly 10 digits'),
  customer_address: z.string().optional(),
  vehicle_reg_no: z.string().min(1, 'Vehicle registration number is required'),
  vehicle_brand: z.string().optional(),
  vehicle_model: z.string().optional(),
  vehicle_year: z.coerce.number().min(1990).max(2030).optional().or(z.literal('')),
  chassis_number: z.string().optional(),
  engine_number: z.string().optional()
});

export const CustomerRegistrationForm = () => {
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [chassisOptions, setChassisOptions] = useState([]);

  const form = useForm({
    resolver: zodResolver(RegistrationSchema),
    defaultValues: {
      customer_name: '',
      phone_number: '',
      customer_address: '',
      vehicle_reg_no: '',
      vehicle_brand: '',
      vehicle_model: '',
      vehicle_year: new Date().getFullYear().toString(),
      chassis_number: '',
      engine_number: ''
    }
  });

  const { register, handleSubmit, control, setValue, watch, formState: { errors }, reset } = form;

  const phoneNumberWatch = watch('phone_number');
  const chassisNumberWatch = watch('chassis_number');

  // Debounce helper
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const searchByPhone = async (phoneNumber) => {
    if (!phoneNumber || phoneNumber.length < 4) return;
    try {
      setSearchLoading(true);
      const token = localStorage.getItem('token');
      const [customersResponse, salesResponse] = await Promise.all([
        axios.get(`${API}/customers?limit=10000`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/sales`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const customers = customersResponse.data.data || customersResponse.data;
      const matchingCustomer = customers.find(c => c.mobile && c.mobile.includes(phoneNumber));

      if (matchingCustomer) {
        const customerSales = salesResponse.data.filter(sale => sale.customer_id === matchingCustomer.id);
        let vehicleInfo = null;
        if (customerSales.length > 0) {
          const latestSale = customerSales.sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date))[0];
          try {
            const vehicleResponse = await axios.get(`${API}/vehicles/${latestSale.vehicle_id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            vehicleInfo = vehicleResponse.data;
          } catch (e) {}
        }

        setValue('customer_name', matchingCustomer.name || '', { shouldValidate: true });
        setValue('customer_address', matchingCustomer.address || '', { shouldValidate: true });
        setValue('vehicle_brand', vehicleInfo?.brand || matchingCustomer.vehicle_info?.brand || '', { shouldValidate: true });
        setValue('vehicle_model', vehicleInfo?.model || matchingCustomer.vehicle_info?.model || '', { shouldValidate: true });
        setValue('vehicle_reg_no', vehicleInfo?.vehicle_number || matchingCustomer.vehicle_info?.vehicle_number || '', { shouldValidate: true });
        setValue('chassis_number', vehicleInfo?.chassis_number || matchingCustomer.vehicle_info?.chassis_number || '', { shouldValidate: true });
        setValue('engine_number', vehicleInfo?.engine_number || '', { shouldValidate: true });

        toast.success('Customer details found and populated!');
      }
    } catch (error) {
    } finally {
      setSearchLoading(false);
    }
  };

  const searchChassisNumbers = async (partialChassis) => {
    if (!partialChassis || partialChassis.length < 3) {
      setChassisOptions([]);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const vehiclesResponse = await axios.get(`${API}/vehicles`, { headers: { Authorization: `Bearer ${token}` } });
      const matchingVehicles = vehiclesResponse.data.filter(v => 
        v.chassis_number && v.chassis_number.toLowerCase().includes(partialChassis.toLowerCase())
      ).slice(0, 10);

      setChassisOptions(matchingVehicles.map(v => ({
        chassis_number: v.chassis_number,
        brand: v.brand,
        model: v.model,
        vehicle_id: v.id
      })));
    } catch (e) {
      setChassisOptions([]);
    }
  };

  const searchByChassisNumber = async (chassisNumber) => {
    if (!chassisNumber || chassisNumber.length < 4) return;
    try {
      setSearchLoading(true);
      const token = localStorage.getItem('token');
      const [vehiclesResponse, salesResponse, customersResponse] = await Promise.all([
        axios.get(`${API}/vehicles`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/sales`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/customers?limit=10000`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const customers = customersResponse.data.data || customersResponse.data;
      const matchingVehicle = vehiclesResponse.data.find(v => v.chassis_number && v.chassis_number.toLowerCase() === chassisNumber.toLowerCase());

      if (matchingVehicle) {
        const vehicleSale = salesResponse.data.find(sale => sale.vehicle_id === matchingVehicle.id);
        let customerInfo = null;
        if (vehicleSale) {
          customerInfo = customers.find(c => c.id === vehicleSale.customer_id);
        }

        setValue('customer_name', customerInfo?.name || '', { shouldValidate: true });
        setValue('phone_number', customerInfo?.mobile || '', { shouldValidate: true });
        setValue('customer_address', customerInfo?.address || '', { shouldValidate: true });
        setValue('vehicle_brand', matchingVehicle.brand || '', { shouldValidate: true });
        setValue('vehicle_model', matchingVehicle.model || '', { shouldValidate: true });
        setValue('vehicle_reg_no', matchingVehicle.vehicle_number || '', { shouldValidate: true });
        setValue('engine_number', matchingVehicle.engine_number || '', { shouldValidate: true });

        toast.success('Vehicle details found and populated!');
      }
    } catch (e) {
    } finally {
      setSearchLoading(false);
    }
  };

  const debouncedSearchByPhone = useCallback(debounce(searchByPhone, 1500), []);
  const debouncedSearchChassisNumbers = useCallback(debounce(searchChassisNumbers, 1300), []);
  const debouncedSearchByChassisNumber = useCallback(debounce(searchByChassisNumber, 1500), []);

  useEffect(() => {
    if (phoneNumberWatch) {
      debouncedSearchByPhone(phoneNumberWatch);
    }
  }, [phoneNumberWatch, debouncedSearchByPhone]);

  useEffect(() => {
    if (chassisNumberWatch) {
      debouncedSearchChassisNumbers(chassisNumberWatch);
      if (chassisNumberWatch.length >= 4) {
        debouncedSearchByChassisNumber(chassisNumberWatch);
      }
    }
  }, [chassisNumberWatch, debouncedSearchChassisNumbers, debouncedSearchByChassisNumber]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('#chassis_number') && !event.target.closest('.chassis-dropdown')) {
        setChassisOptions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChassisSelection = (selectedChassis) => {
    setValue('chassis_number', selectedChassis.chassis_number, { shouldValidate: true });
    setValue('vehicle_brand', selectedChassis.brand, { shouldValidate: true });
    setValue('vehicle_model', selectedChassis.model, { shouldValidate: true });
    setChassisOptions([]);
    debouncedSearchByChassisNumber(selectedChassis.chassis_number);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/registrations`, {
        customer_name: data.customer_name,
        customer_mobile: data.phone_number,
        customer_address: data.customer_address,
        vehicle_number: data.vehicle_reg_no,
        vehicle_brand: data.vehicle_brand,
        vehicle_model: data.vehicle_model,
        vehicle_year: data.vehicle_year,
        chassis_number: data.chassis_number,
        engine_number: data.engine_number
      }, { headers: { Authorization: `Bearer ${token}` } });

      toast.success('Customer & Vehicle registration completed successfully!');
      reset();
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <FileSearch className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">Auto-fill Feature</h4>
                <p className="text-xs text-blue-600">Enter mobile number or chassis number to automatically fill details from existing records.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-600 border-b pb-2">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input id="customer_name" placeholder="Enter customer name" {...register('customer_name')} />
                {errors.customer_name && <p className="text-red-500 text-xs mt-1">{errors.customer_name.message}</p>}
              </div>
              <div>
                <Label htmlFor="phone_number">
                  Mobile *
                  {searchLoading && <span className="ml-2 text-blue-600 text-sm">Searching...</span>}
                </Label>
                <Input id="phone_number" placeholder="Enter mobile number" {...register('phone_number')} className={searchLoading ? "border-blue-300" : ""} />
                {errors.phone_number && <p className="text-red-500 text-xs mt-1">{errors.phone_number.message}</p>}
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="customer_address">Address</Label>
                <Input id="customer_address" placeholder="Enter customer address" {...register('customer_address')} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-green-600 border-b pb-2">Vehicle Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicle_reg_no">Vehicle Registration No *</Label>
                <Input id="vehicle_reg_no" placeholder="Enter vehicle registration number" {...register('vehicle_reg_no')} />
                {errors.vehicle_reg_no && <p className="text-red-500 text-xs mt-1">{errors.vehicle_reg_no.message}</p>}
              </div>
              <div>
                <Label htmlFor="vehicle_brand">Vehicle Brand</Label>
                <Controller name="vehicle_brand" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select vehicle brand" /></SelectTrigger>
                    <SelectContent>
                      {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div>
                <Label htmlFor="vehicle_model">Vehicle Model</Label>
                <Input id="vehicle_model" placeholder="Enter vehicle model" {...register('vehicle_model')} />
              </div>
              <div>
                <Label htmlFor="vehicle_year">Vehicle Year</Label>
                <Input id="vehicle_year" placeholder="Enter vehicle year (e.g., 2024)" type="number" min="1990" max="2030" {...register('vehicle_year')} />
                {errors.vehicle_year && <p className="text-red-500 text-xs mt-1">{errors.vehicle_year.message}</p>}
              </div>
              <div className="relative">
                <Label htmlFor="chassis_number">Chassis Number {searchLoading && <span className="ml-2 text-blue-600 text-sm">Searching...</span>}</Label>
                <Input id="chassis_number" placeholder="Enter chassis number" {...register('chassis_number')} className={searchLoading ? "border-blue-300" : ""} />
                
                {chassisOptions.length > 0 && (
                  <div className="chassis-dropdown absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto mt-1">
                    {chassisOptions.map((option, index) => (
                      <div key={index} className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0" onClick={() => handleChassisSelection(option)}>
                        <div className="font-medium text-sm">{option.chassis_number}</div>
                        <div className="text-xs text-gray-600">{option.brand} {option.model}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="engine_number">Engine Number</Label>
                <Input id="engine_number" placeholder="Enter engine number" {...register('engine_number')} />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
            <Button type="submit" disabled={loading} className="flex-1 sm:flex-none sm:px-8">
              {loading ? <><LoadingSpinner size="sm" className="mr-2" /> Saving...</> : 'Save Registration'}
            </Button>
            <Button type="button" variant="outline" onClick={() => reset()} className="flex-1 sm:flex-none sm:px-8">
              Reset Form
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
