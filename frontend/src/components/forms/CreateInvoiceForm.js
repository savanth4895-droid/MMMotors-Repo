import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { LoadingSpinner } from '../ui/loading';
import { extractData } from '../../lib/api';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const brands = ['TVS', 'BAJAJ', 'HERO', 'HONDA', 'TRIUMPH', 'KTM', 'SUZUKI', 'APRILIA', 'YAMAHA', 'PIAGGIO', 'ROYAL ENFIELD'];

// Utility function to convert number to words
export const numberToWords = (num) => {
  if (!num) return 'Zero';
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
      return result.trim();
    }
    if (n > 0) {
      result += ones[n] + ' ';
    }
    return result.trim();
  };

  if (num < 1000) {
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
      }
    }
    return result;
  }
};

const SaleSchema = z.object({
  date: z.string(),
  name: z.string().min(1, 'Customer name is required'),
  care_of: z.string().optional(),
  mobile: z.string().regex(/^\d{10}$/, 'Mobile number must be exactly 10 digits'),
  address: z.string().optional(),
  brand: z.string().min(1, 'Vehicle brand is required'),
  model: z.string().min(1, 'Vehicle model is required'),
  color: z.string().optional(),
  chassis_number: z.string().min(5, 'Chassis number must be at least 5 characters'),
  engine_number: z.string().min(5, 'Engine number must be at least 5 characters'),
  vehicle_no: z.string().optional(),
  amount: z.coerce.number().min(1, 'Amount must be greater than zero'),
  payment_method: z.string().min(1, 'Payment method is required'),
  hypothecation: z.string().optional(),
  insurance_nominee: z.string().optional(),
  relation: z.string().optional(),
  age: z.coerce.number().optional().or(z.literal(''))
}).superRefine((data, ctx) => {
  const hasNominee = !!data.insurance_nominee;
  const hasRelation = !!data.relation;
  const hasAge = !!data.age;

  if (hasNominee || hasRelation || hasAge) {
    if (!hasNominee) {
      ctx.addIssue({ path: ['insurance_nominee'], message: 'Insurance nominee name is required', code: z.ZodIssueCode.custom });
    }
    if (!hasRelation) {
      ctx.addIssue({ path: ['relation'], message: 'Relation is required', code: z.ZodIssueCode.custom });
    }
    if (!hasAge) {
      ctx.addIssue({ path: ['age'], message: 'Age is required', code: z.ZodIssueCode.custom });
    }
  }
});

export const CreateInvoiceForm = () => {
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);
  const [vehicleSuggestions, setVehicleSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const form = useForm({
    resolver: zodResolver(SaleSchema),
    defaultValues: {
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
      amount: '',
      payment_method: 'Cash',
      hypothecation: '',
      insurance_nominee: '',
      relation: '',
      age: ''
    }
  });

  const { register, handleSubmit, control, watch, setValue, formState: { errors }, reset } = form;

  const chassisWatch = watch('chassis_number');

  // Vehicle search functionality
  const searchVehiclesByChassisNo = async (chassisQuery) => {
    if (chassisQuery.length < 3) {
      setVehicleSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const response = await axios.get(`${API}/vehicles?limit=4000`);
      const availableVehicles = extractData(response).filter(vehicle => 
        vehicle.status === 'in_stock' && 
        vehicle.chassis_number?.toLowerCase().includes(chassisQuery.toLowerCase())
      );
      setVehicleSuggestions(availableVehicles.slice(0, 10)); // Limit to 10 suggestions
      setShowSuggestions(availableVehicles.length > 0);
    } catch (error) {
      console.error('Error searching vehicles:', error);
      toast.error('Failed to search vehicles');
    }
  };

  // Debounced search to avoid excessive API calls
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  const debouncedVehicleSearch = React.useCallback(debounce(searchVehiclesByChassisNo, 300), []);

  React.useEffect(() => {
    if (chassisWatch) {
      debouncedVehicleSearch(chassisWatch);
    }
  }, [chassisWatch, debouncedVehicleSearch]);

  const selectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setValue('brand', vehicle.brand, { shouldValidate: true });
    setValue('model', vehicle.model, { shouldValidate: true });
    setValue('color', vehicle.color, { shouldValidate: true });
    setValue('chassis_number', vehicle.chassis_number, { shouldValidate: true });
    setValue('engine_number', vehicle.engine_number, { shouldValidate: true });
    setValue('vehicle_no', vehicle.vehicle_number || vehicle.vehicle_no || '', { shouldValidate: true });
    
    setShowSuggestions(false);
    setVehicleSuggestions([]);
    
    toast.success(`Vehicle details loaded: ${vehicle.brand} ${vehicle.model}`);
  };

  const generateInvoiceNumber = () => {
    const timestamp = Date.now();
    return `INV-${timestamp.toString().slice(-8)}`;
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const customerData = {
        name: data.name,
        mobile: data.mobile,
        care_of: data.care_of,
        email: null,
        address: data.address
      };

      if (data.insurance_nominee || data.relation || data.age) {
        customerData.insurance_info = {
          nominee_name: data.insurance_nominee || '',
          relation: data.relation || '',
          age: data.age || ''
        };
      }

      const customerResponse = await axios.post(`${API}/customers`, customerData);
      let vehicleResponse;
      
      if (selectedVehicle) {
        vehicleResponse = { data: selectedVehicle };
        await axios.put(`${API}/vehicles/${selectedVehicle.id}`, {
          ...selectedVehicle,
          customer_id: customerResponse.data.id,
          status: 'sold',
          date_sold: new Date().toISOString()
        });
      } else {
        vehicleResponse = await axios.post(`${API}/vehicles`, {
          brand: data.brand,
          model: data.model,
          chassis_number: data.chassis_number,
          engine_number: data.engine_number,
          color: data.color || '',
          vehicle_no: data.vehicle_no || '',
          key_number: 'N/A',
          inbound_location: 'Showroom',
          customer_id: customerResponse.data.id,
          status: 'sold',
          date_sold: new Date().toISOString()
        });
      }

      const saleResponse = await axios.post(`${API}/sales`, {
        customer_id: customerResponse.data.id,
        vehicle_id: vehicleResponse.data.id,
        amount: parseFloat(data.amount),
        payment_method: data.payment_method
      });

      const invoice = {
        ...saleResponse.data,
        invoice_number: generateInvoiceNumber(),
        customer: {
          name: data.name,
          care_of: data.care_of,
          mobile: data.mobile,
          address: data.address
        },
        vehicle: {
          brand: data.brand,
          model: data.model,
          color: data.color,
          chassis_number: data.chassis_number,
          engine_number: data.engine_number,
          vehicle_no: data.vehicle_no
        },
        insurance: {
          nominee: data.insurance_nominee,
          relation: data.relation,
          age: data.age
        },
        date: data.date,
        amount: parseFloat(data.amount),
        payment_method: data.payment_method,
        hypothecation: data.hypothecation
      };

      setGeneratedInvoice(invoice);
      setShowPreview(true);
      toast.success('Invoice generated successfully!');
    } catch (error) {
      toast.error('Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!generatedInvoice) return;
    const invoiceElement = document.getElementById('invoice-preview');
    if (invoiceElement) {
      const printWindow = window.open('', '_blank', 'width=900,height=800');
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice Preview - ${generatedInvoice.invoice_number}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
              .preview-container { max-width: 21cm; margin: 20px auto; background-color: white; padding: 20px; }
              .invoice-container { max-width: 100%; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 12px; border-bottom: 2px solid #333; padding-bottom: 10px; }
              .header h1 { margin: 0; font-size: 18px; color: #2563eb; }
              h1, h2, h3 { margin: 0; }
              .grid { display: flex; justify-content: space-between; gap: 1rem; }
              @media print { body { background-color: white; } }
            </style>
          </head>
          <body>
            <div class="preview-container">
              <div class="invoice-container">
                ${invoiceElement.innerHTML}
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  const handleDownloadPDF = async () => {
    const invoiceData = generatedInvoice;
    if (!invoiceData) return;
    try {
      const invoiceElement = document.getElementById('invoice-preview');
      if (!invoiceElement) return;
      const { default: html2pdf } = await import('html2pdf.js');
      const filename = `Invoice_${invoiceData.invoice_number}.pdf`;
      const opt = {
        margin: [0.3, 0.3, 0.3, 0.3],
        filename: filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 1.5, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(invoiceElement).save();
    } catch (error) {
      toast.error('Error generating PDF');
    }
  };

  if (showPreview && generatedInvoice) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center no-print">
          <h2 className="text-2xl font-bold">Invoice Preview</h2>
          <div className="flex gap-2">
            <Button onClick={() => setShowPreview(false)} variant="outline">Back to Form</Button>
            <Button onClick={handlePrint} variant="outline">Print</Button>
            <Button onClick={handleDownloadPDF}>Download PDF</Button>
            <Button onClick={() => { reset(); setShowPreview(false); setGeneratedInvoice(null); }}>New Invoice</Button>
          </div>
        </div>

        <Card id="invoice-preview" className="shadow-2xl max-w-[21cm] mx-auto">
          <CardContent className="p-4">
            <div className="text-center pb-4 border-b">
              <h1 className="text-2xl font-bold tracking-wide text-blue-600">M M MOTORS</h1>
              <p>Premium Two Wheeler Sales & Service</p>
              <p>Bengaluru main road, behind Ruchi Bakery, Malur, Karnataka 563130</p>
              <p>Phone: 7026263123 | Email: mmmotors3123@gmail.com</p>
            </div>
            
            <div className="flex justify-between mt-4">
              <div><span className="font-bold">Invoice No:</span> {generatedInvoice.invoice_number}</div>
              <div><span className="font-bold">Date:</span> {new Date(generatedInvoice.date).toLocaleDateString('en-IN')}</div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-3 border rounded">
                <h3 className="font-bold border-b pb-1 mb-2">CUSTOMER DETAILS</h3>
                <p><strong>Name:</strong> {generatedInvoice.customer.name}</p>
                <p><strong>C/O:</strong> {generatedInvoice.customer.care_of}</p>
                <p><strong>Mobile:</strong> {generatedInvoice.customer.mobile}</p>
                <p><strong>Address:</strong> {generatedInvoice.customer.address}</p>
              </div>
              <div className="p-3 border rounded">
                <h3 className="font-bold border-b pb-1 mb-2">VEHICLE DETAILS</h3>
                <p><strong>Brand/Model:</strong> {generatedInvoice.vehicle.brand} {generatedInvoice.vehicle.model}</p>
                <p><strong>Color:</strong> {generatedInvoice.vehicle.color}</p>
                <p><strong>Chassis No:</strong> {generatedInvoice.vehicle.chassis_number}</p>
                <p><strong>Engine No:</strong> {generatedInvoice.vehicle.engine_number}</p>
                <p><strong>Vehicle No:</strong> {generatedInvoice.vehicle.vehicle_no}</p>
              </div>
            </div>

            <div className="p-3 border rounded mt-4">
              <h3 className="font-bold border-b pb-1 mb-2">PAYMENT SUMMARY</h3>
              <p><strong>Payment Method:</strong> {generatedInvoice.payment_method}</p>
              <p><strong>Hypothecation:</strong> {generatedInvoice.hypothecation || 'CASH'}</p>
              <div className="mt-2 p-2 bg-gray-50 text-right">
                <span className="font-bold text-lg">TOTAL AMOUNT: ₹{generatedInvoice.amount.toLocaleString()}</span>
                <p className="italic text-sm text-gray-600">{numberToWords(generatedInvoice.amount)} Rupees Only</p>
              </div>
            </div>
            <div className="mt-8 text-center text-sm text-gray-500">
              <p>Thank You for Choosing M M Motors!</p>
              <p>This is a computer-generated invoice and does not require a signature.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Invoice</CardTitle>
        <CardDescription>Fill in all details to generate a comprehensive invoice</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" {...register('date')} />
          </div>

          {/* Customer Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-600">Customer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input id="name" placeholder="Enter customer name" {...register('name')} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="care_of">C/O (Care Of)</Label>
                <Input id="care_of" placeholder="S/O, D/O, W/O" {...register('care_of')} />
              </div>
              <div>
                <Label htmlFor="mobile">Mobile Number *</Label>
                <Input id="mobile" placeholder="Enter mobile number" {...register('mobile')} />
                {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile.message}</p>}
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" placeholder="Enter complete address" {...register('address')} />
              </div>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-600">Vehicle Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand">Brand *</Label>
                <Controller name="brand" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={selectedVehicle}>
                    <SelectTrigger className={selectedVehicle ? 'bg-green-50 border-green-200' : ''}>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>{brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
                {errors.brand && <p className="text-red-500 text-xs mt-1">{errors.brand.message}</p>}
              </div>
              <div>
                <Label htmlFor="model">Model *</Label>
                <Input id="model" placeholder="Enter model name" {...register('model')} disabled={selectedVehicle} className={selectedVehicle ? 'bg-green-50 border-green-200' : ''} />
                {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model.message}</p>}
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <Input id="color" placeholder="Enter color" {...register('color')} disabled={selectedVehicle} className={selectedVehicle ? 'bg-green-50 border-green-200' : ''} />
              </div>
              
              <div className="relative">
                <div className="flex justify-between mb-1">
                  <Label htmlFor="chassis_number">Chassis No *</Label>
                  {selectedVehicle && (
                    <button type="button" className="text-red-500 text-xs" onClick={() => {
                        setSelectedVehicle(null);
                        setValue('chassis_number', '');
                        setValue('engine_number', '');
                      }}>Clear selection</button>
                  )}
                </div>
                <Input id="chassis_number" placeholder="Enter chassis number" {...register('chassis_number')} disabled={selectedVehicle} className={selectedVehicle ? 'bg-green-50 border-green-200' : ''} />
                {errors.chassis_number && <p className="text-red-500 text-xs mt-1">{errors.chassis_number.message}</p>}

                {showSuggestions && vehicleSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-white border shadow-lg max-h-60 overflow-y-auto mt-1">
                    {vehicleSuggestions.map((vehicle) => (
                      <div key={vehicle.id} className="p-3 hover:bg-gray-50 cursor-pointer border-b" onClick={() => selectVehicle(vehicle)}>
                        <div className="font-medium text-gray-900">{vehicle.brand} {vehicle.model}</div>
                        <div className="text-sm text-gray-600">Chassis: {vehicle.chassis_number}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="engine_number">Engine No *</Label>
                <Input id="engine_number" placeholder="Enter engine number" {...register('engine_number')} disabled={selectedVehicle} className={selectedVehicle ? 'bg-green-50 border-green-200' : ''} />
                {errors.engine_number && <p className="text-red-500 text-xs mt-1">{errors.engine_number.message}</p>}
              </div>
              <div>
                <Label htmlFor="vehicle_no">Vehicle No</Label>
                <Input id="vehicle_no" placeholder="Enter vehicle registration number" {...register('vehicle_no')} disabled={selectedVehicle} className={selectedVehicle ? 'bg-green-50 border-green-200' : ''} />
              </div>
            </div>
          </div>

          {/* Insurance Nominee Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-600">Insurance Nominee Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="insurance_nominee">Nominee Name</Label>
                <Input id="insurance_nominee" placeholder="Enter nominee name" {...register('insurance_nominee')} />
                {errors.insurance_nominee && <p className="text-red-500 text-xs mt-1">{errors.insurance_nominee.message}</p>}
              </div>
              <div>
                <Label htmlFor="relation">Relation</Label>
                <Controller name="relation" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select relation" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="father">Father</SelectItem>
                      <SelectItem value="mother">Mother</SelectItem>
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="son">Son</SelectItem>
                      <SelectItem value="daughter">Daughter</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
                {errors.relation && <p className="text-red-500 text-xs mt-1">{errors.relation.message}</p>}
              </div>
              <div>
                <Label htmlFor="age">Age</Label>
                <Input id="age" type="number" placeholder="Enter age" {...register('age')} />
                {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age.message}</p>}
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-600">Payment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input id="amount" type="number" placeholder="Enter amount" {...register('amount')} />
                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
              </div>
              <div>
                <Label htmlFor="payment_method">Payment Method *</Label>
                <Controller name="payment_method" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Method" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
                {errors.payment_method && <p className="text-red-500 text-xs mt-1">{errors.payment_method.message}</p>}
              </div>
              <div>
                <Label htmlFor="hypothecation">Hypothecation</Label>
                <Input id="hypothecation" placeholder="Finance details (optional)" {...register('hypothecation')} />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? <><LoadingSpinner size="sm" className="mr-2" /> Generating...</> : 'Generate Invoice'}
            </Button>
            <Button type="button" variant="outline" onClick={() => reset()}>Reset Form</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
