import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Upload, 
  Download, 
  FileText, 
  Users, 
  Car, 
  Wrench, 
  Package,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
  Eye,
  RefreshCw
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DataImport = () => {
  const [selectedDataType, setSelectedDataType] = useState('customers');
  const [dragOver, setDragOver] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importJobs, setImportJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobDetails, setShowJobDetails] = useState(false);

  const dataTypes = [
    { 
      value: 'customers', 
      label: 'Customers', 
      icon: Users, 
      description: 'Import comprehensive customer information including personal details, vehicle data, insurance, and sales records. Auto-links to existing vehicles by chassis number.',
      fields: [
        // Basic customer details
        'name', 
        'care_of', 
        'mobile', 
        'phone', 
        'email', 
        'address',
        // Vehicle details
        'brand',
        'model', 
        'color',
        'vehicle_number',
        'chassis_number',
        'engine_number',
        // Insurance details
        'nominee_name',
        'relation',
        'age',
        // Sales details
        'sale_amount',
        'payment_method',
        'hypothecation',
        'sale_date',
        'invoice_number'
      ]
    },
    { 
      value: 'vehicles', 
      label: 'Vehicles', 
      icon: Car, 
      description: 'Import vehicle stock data. Auto-links to customers by mobile number and creates sales records.',
      fields: ['date_received', 'brand', 'model', 'chassis_number', 'engine_number', 'color', 'vehicle_number', 'key_number', 'inbound_location', 'page_number', 'status', 'customer_mobile', 'customer_name', 'sale_amount', 'payment_method']
    },
    { 
      value: 'spare_parts', 
      label: 'Spare Parts', 
      icon: Package, 
      description: 'Import spare parts inventory with compatible vehicle models',
      fields: ['name', 'part_number', 'brand', 'quantity', 'unit', 'unit_price', 'hsn_sac', 'gst_percentage', 'supplier', 'compatible_models']
    },
    { 
      value: 'services', 
      label: 'Services', 
      icon: Wrench, 
      description: 'Import service records. Auto-links to customers and vehicles using mobile number or chassis number. Manually specify vehicle details if not in inventory.',
      fields: ['registration_date', 'customer_name', 'customer_mobile', 'vehicle_number', 'chassis_number', 'vehicle_brand', 'vehicle_model', 'vehicle_year', 'service_type', 'description', 'amount']
    }
  ];

  useEffect(() => {
    fetchImportJobs();
  }, []);

  const fetchImportJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/import/jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setImportJobs(response.data);
    } catch (error) {
      toast.error('Failed to fetch import jobs');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    
    // Validate file type
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validTypes.includes(fileExtension)) {
      toast.error('Please select a CSV or Excel file');
      return;
    }

    setUploadingFile(file);
  };

  const handleImport = async () => {
    if (!uploadingFile || !selectedDataType) {
      toast.error('Please select a file and data type');
      return;
    }

    setImporting(true);
    
    try {
      const formData = new FormData();
      formData.append('file', uploadingFile);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/import/upload?data_type=${selectedDataType}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.status === 'completed') {
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }

      // Refresh import jobs
      await fetchImportJobs();
      
      // Clear upload
      setUploadingFile(null);
      
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = async (dataType) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/import/template/${dataType}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dataType}_template.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Template downloaded successfully');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedDataTypeInfo = dataTypes.find(dt => dt.value === selectedDataType);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Data Import</h1>
          <p className="text-gray-600">Import your existing data into the system</p>
        </div>
        <Button onClick={fetchImportJobs} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import">Import Data</TabsTrigger>
          <TabsTrigger value="history">Import History</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          {/* Data Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Data Type</CardTitle>
              <CardDescription>Choose the type of data you want to import</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {dataTypes.map((dataType) => {
                  const Icon = dataType.icon;
                  return (
                    <Card 
                      key={dataType.value}
                      className={`cursor-pointer transition-all ${
                        selectedDataType === dataType.value 
                          ? 'ring-2 ring-blue-500 bg-blue-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedDataType(dataType.value)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <Icon className="w-8 h-8 text-blue-600" />
                          <div>
                            <h3 className="font-semibold">{dataType.label}</h3>
                            <p className="text-sm text-gray-600">{dataType.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Template Download */}
          {selectedDataTypeInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Download Template</CardTitle>
                <CardDescription>
                  Download the CSV template for {selectedDataTypeInfo.label.toLowerCase()} data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">Template Fields:</h4>
                    
                    {selectedDataType === 'customers' ? (
                      <div className="space-y-3 mb-4">
                        <div>
                          <h5 className="text-sm font-medium text-blue-600 mb-1">Customer Details:</h5>
                          <div className="flex flex-wrap gap-1">
                            {['name', 'care_of', 'mobile', 'phone', 'email', 'address'].map((field) => (
                              <Badge key={field} variant="outline" className="text-xs">
                                {field.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="text-sm font-medium text-green-600 mb-1">Vehicle Details:</h5>
                          <div className="flex flex-wrap gap-1">
                            {[
                              'vehicle_brand (Brand)', 
                              'vehicle_model (Model)', 
                              'vehicle_color (Color)', 
                              'vehicle_no (Vehicle Number)', 
                              'chassis_no (Chassis Number)', 
                              'engine_no (Engine Number)'
                            ].map((field) => (
                              <Badge key={field} variant="outline" className="text-xs">
                                {field}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="text-sm font-medium text-purple-600 mb-1">Insurance Nominee Details:</h5>
                          <div className="flex flex-wrap gap-1">
                            {[
                              'insurance_nominee (Nominee Name)', 
                              'insurance_relation (Relation)', 
                              'insurance_age (Age)'
                            ].map((field) => (
                              <Badge key={field} variant="outline" className="text-xs">
                                {field}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="text-sm font-medium text-red-600 mb-1">Sales Details:</h5>
                          <div className="flex flex-wrap gap-1">
                            {['sale_amount', 'payment_method', 'hypothecation', 'sale_date', 'invoice_number'].map((field) => (
                              <Badge key={field} variant="outline" className="text-xs">
                                {field.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {selectedDataTypeInfo.fields.map((field) => (
                          <Badge key={field} variant="outline">
                            {field.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-600">
                      Download the comprehensive CSV template with all invoice-related fields. Fields can be left empty if not available.
                    </p>
                  </div>
                  <Button 
                    onClick={() => handleDownloadTemplate(selectedDataType)}
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
              <CardDescription>
                Upload your CSV or Excel file containing {selectedDataTypeInfo?.label.toLowerCase()} data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver
                    ? 'border-blue-500 bg-blue-50'
                    : uploadingFile
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {uploadingFile ? (
                  <div className="space-y-4">
                    <FileText className="w-12 h-12 text-green-600 mx-auto" />
                    <div>
                      <p className="font-medium text-green-800">{uploadingFile.name}</p>
                      <p className="text-sm text-green-600">
                        {(uploadingFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <div className="flex justify-center gap-2">
                      <Button onClick={handleImport} disabled={importing}>
                        {importing ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Import Data
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setUploadingFile(null)}
                        disabled={importing}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-gray-700">
                        Drag & drop your file here, or click to browse
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports CSV and Excel files
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => handleFileSelect(e.target.files[0])}
                      className="hidden"
                      id="file-upload"
                    />
                    <label 
                      htmlFor="file-upload"
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer"
                    >
                      Choose File
                    </label>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {/* Import History */}
          <Card>
            <CardHeader>
              <CardTitle>Import History</CardTitle>
              <CardDescription>View your previous import jobs and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {importJobs.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No import jobs found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {importJobs.map((job) => (
                    <div
                      key={job.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {getStatusIcon(job.status)}
                          <div>
                            <h4 className="font-medium">{job.file_name}</h4>
                            <p className="text-sm text-gray-600">
                              {job.data_type.replace('_', ' ')} • {new Date(job.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={getStatusColor(job.status)}>
                            {job.status}
                          </Badge>
                          {job.status === 'completed' && (
                            <div className="text-sm text-gray-600">
                              {job.successful_records}/{job.total_records} successful
                            </div>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedJob(job);
                              setShowJobDetails(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {job.status === 'processing' && (
                        <div className="mt-3">
                          <Progress 
                            value={(job.processed_records / job.total_records) * 100} 
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Job Details Modal */}
      {showJobDetails && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Import Job Details</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setShowJobDetails(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Job Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-700">File Name</h4>
                    <p>{selectedJob.file_name}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700">Data Type</h4>
                    <p>{selectedJob.data_type.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700">Status</h4>
                    <Badge className={getStatusColor(selectedJob.status)}>
                      {selectedJob.status}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700">Created At</h4>
                    <p>{new Date(selectedJob.created_at).toLocaleString()}</p>
                  </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-5 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{selectedJob.total_records}</div>
                    <div className="text-sm text-blue-800">Total Records</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{selectedJob.successful_records}</div>
                    <div className="text-sm text-green-800">Successful</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{selectedJob.skipped_records || 0}</div>
                    <div className="text-sm text-orange-800">Skipped</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{selectedJob.failed_records}</div>
                    <div className="text-sm text-red-800">Failed</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">{selectedJob.processed_records}</div>
                    <div className="text-sm text-gray-800">Processed</div>
                  </div>
                </div>

                {/* Skipped Records Info */}
                {selectedJob.skipped_records > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Duplicate Records Skipped ({selectedJob.skipped_records})
                    </h4>
                    <p className="text-sm text-orange-700">
                      {selectedJob.skipped_records} record(s) were skipped because they already exist in the database. 
                      Duplicates are detected by unique identifiers (mobile for customers, chassis_number for vehicles, part_number for spare parts).
                    </p>
                  </div>
                )}

                {/* Cross-Reference Statistics */}
                {selectedJob.cross_reference_stats && Object.keys(selectedJob.cross_reference_stats).length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                      <RefreshCw className="w-5 h-5" />
                      Cross-Reference Statistics
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      {selectedJob.cross_reference_stats.customers_linked > 0 && (
                        <div className="text-center p-3 bg-white rounded">
                          <div className="text-lg font-bold text-purple-600">{selectedJob.cross_reference_stats.customers_linked}</div>
                          <div className="text-xs text-purple-800">Customers Linked</div>
                        </div>
                      )}
                      {selectedJob.cross_reference_stats.customers_created > 0 && (
                        <div className="text-center p-3 bg-white rounded">
                          <div className="text-lg font-bold text-purple-600">{selectedJob.cross_reference_stats.customers_created}</div>
                          <div className="text-xs text-purple-800">Customers Created</div>
                        </div>
                      )}
                      {selectedJob.cross_reference_stats.vehicles_linked > 0 && (
                        <div className="text-center p-3 bg-white rounded">
                          <div className="text-lg font-bold text-purple-600">{selectedJob.cross_reference_stats.vehicles_linked}</div>
                          <div className="text-xs text-purple-800">Vehicles Linked</div>
                        </div>
                      )}
                      {selectedJob.cross_reference_stats.vehicles_created > 0 && (
                        <div className="text-center p-3 bg-white rounded">
                          <div className="text-lg font-bold text-purple-600">{selectedJob.cross_reference_stats.vehicles_created}</div>
                          <div className="text-xs text-purple-800">Vehicles Created</div>
                        </div>
                      )}
                      {selectedJob.cross_reference_stats.sales_created > 0 && (
                        <div className="text-center p-3 bg-white rounded">
                          <div className="text-lg font-bold text-purple-600">{selectedJob.cross_reference_stats.sales_created}</div>
                          <div className="text-xs text-purple-800">Sales Created</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Incomplete Records */}
                {selectedJob.incomplete_records && selectedJob.incomplete_records.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Incomplete Records ({selectedJob.incomplete_records.length})
                    </h4>
                    <p className="text-sm text-yellow-700 mb-3">
                      These records were imported but are missing some information. You can complete them later in their respective management pages.
                    </p>
                    <div className="max-h-48 overflow-y-auto">
                      {selectedJob.incomplete_records.slice(0, 10).map((record, index) => (
                        <div key={index} className="bg-white border border-yellow-200 rounded p-3 mb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-yellow-800">Row {record.row}</p>
                              <p className="text-yellow-600 text-sm">Missing: {record.missing_fields.join(', ')}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {selectedJob.incomplete_records.length > 10 && (
                        <div className="text-center text-sm text-yellow-600 mt-2">
                          And {selectedJob.incomplete_records.length - 10} more...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Errors */}
                {selectedJob.errors && selectedJob.errors.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-red-700 mb-3">Errors ({selectedJob.errors.length})</h4>
                    <div className="max-h-64 overflow-y-auto">
                      {selectedJob.errors.map((error, index) => (
                        <div key={index} className="bg-red-50 border border-red-200 rounded p-3 mb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-red-800">Row {error.row}</p>
                              <p className="text-red-600 text-sm">{error.error}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={() => setShowJobDetails(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataImport;