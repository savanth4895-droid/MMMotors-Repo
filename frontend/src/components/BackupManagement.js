import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Download, 
  Play, 
  Settings, 
  Database, 
  Clock, 
  HardDrive, 
  CheckCircle, 
  XCircle, 
  Loader,
  Calendar,
  FileText,
  Trash2,
  RefreshCw
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BackupManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [backupConfig, setBackupConfig] = useState(null);
  const [backupStats, setBackupStats] = useState(null);
  const [backupJobs, setBackupJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');

  useEffect(() => {
    fetchBackupData();
  }, []);

  const fetchBackupData = async () => {
    try {
      setLoading(true);
      const [configRes, statsRes, jobsRes] = await Promise.all([
        axios.get(`${API}/backup/config`),
        axios.get(`${API}/backup/stats`),
        axios.get(`${API}/backup/jobs?limit=20`)
      ]);

      setBackupConfig(configRes.data);
      setBackupStats(statsRes.data);
      setBackupJobs(jobsRes.data);
    } catch (error) {
      console.error('Failed to fetch backup data:', error);
      toast.error('Failed to load backup information');
    } finally {
      setLoading(false);
    }
  };

  const updateBackupConfig = async (updates) => {
    try {
      const response = await axios.put(`${API}/backup/config`, updates);
      setBackupConfig(response.data);
      toast.success('Backup configuration updated successfully');
    } catch (error) {
      console.error('Failed to update config:', error);
      toast.error('Failed to update backup configuration');
    }
  };

  const createManualBackup = async (format = 'json') => {
    try {
      setCreating(true);
      const response = await axios.post(`${API}/backup/create`, {
        backup_type: 'manual',
        export_format: format
      });
      
      toast.success(`${format.toUpperCase()} backup started successfully`);
      
      // Refresh data after a short delay
      setTimeout(() => {
        fetchBackupData();
      }, 2000);
    } catch (error) {
      console.error('Failed to create backup:', error);
      toast.error('Failed to start backup');
    } finally {
      setCreating(false);
    }
  };

  const downloadBackup = async (jobId, jobData) => {
    try {
      const response = await axios.get(`${API}/backup/download/${jobId}`, {
        responseType: 'blob'
      });
      
      // Determine file extension based on backup content
      const isExcel = jobData.backup_file_path?.includes('_excel.zip') || 
                      jobData.backup_file_path?.includes('backup_data.xlsx');
      
      const fileExtension = isExcel ? 'xlsx.zip' : 'zip';
      const fileName = `backup_${jobData.start_time.split('T')[0]}.${fileExtension}`;
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`${isExcel ? 'Excel' : 'Standard'} backup download started`);
    } catch (error) {
      console.error('Failed to download backup:', error);
      toast.error('Failed to download backup file');
    }
  };

  const cleanupOldBackups = async () => {
    try {
      await axios.delete(`${API}/backup/cleanup?retention_days=${backupConfig?.retention_days || 30}`);
      toast.success('Old backups cleaned up successfully');
      fetchBackupData();
    } catch (error) {
      console.error('Failed to cleanup backups:', error);
      toast.error('Failed to cleanup old backups');
    }
  };

  const formatFileSize = (sizeInMB) => {
    if (sizeInMB < 1024) {
      return `${sizeInMB.toFixed(2)} MB`;
    } else {
      return `${(sizeInMB / 1024).toFixed(2)} GB`;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    // Format to 24-hour time with IST timezone (UTC+5:30)
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false, // Use 24-hour format
      timeZone: 'Asia/Kolkata' // India Standard Time (UTC+5:30)
    });
  };

  const formatDateShort = (dateString) => {
    const date = new Date(dateString);
    // Short format for compact display in IST
    const formatted = date.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata' // India Standard Time (UTC+5:30)
    });
    return `${formatted} IST`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      running: { color: 'bg-yellow-500', icon: Loader, text: 'Running' },
      completed: { color: 'bg-green-500', icon: CheckCircle, text: 'Completed' },
      failed: { color: 'bg-red-500', icon: XCircle, text: 'Failed' }
    };

    const config = statusConfig[status] || statusConfig.failed;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Backup Management</h1>
        <p className="text-gray-600">Manage your data backups and restore points</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: Database },
            { id: 'history', name: 'Backup History', icon: Clock },
            { id: 'settings', name: 'Settings', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Backups</p>
                    <p className="text-2xl font-bold text-gray-900">{backupStats?.total_backups || 0}</p>
                  </div>
                  <Database className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold text-green-600">
                      {backupStats?.total_backups > 0 
                        ? Math.round((backupStats.successful_backups / backupStats.total_backups) * 100)
                        : 0}%
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Storage Used</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatFileSize(backupStats?.total_storage_used_mb || 0)}
                    </p>
                  </div>
                  <HardDrive className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Last Backup</p>
                    <p className="text-sm font-bold text-gray-900">
                      {backupStats?.last_backup_date 
                        ? formatDate(backupStats.last_backup_date).split(',')[0]
                        : 'Never'}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Export Format Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Backup Format</label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white"
                  >
                    <option value="json">JSON + CSV (Standard)</option>
                    <option value="excel">Excel Workbook (.xlsx)</option>
                  </select>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4">
                  <Button
                    onClick={() => createManualBackup(exportFormat)}
                    disabled={creating}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {creating ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                    Create {exportFormat.toUpperCase()} Backup
                  </Button>
                  
                  <Button
                    onClick={fetchBackupData}
                    variant="outline"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Data
                  </Button>

                  <Button
                    onClick={cleanupOldBackups}
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Cleanup Old Backups
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Backups */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Recent Backups
              </CardTitle>
            </CardHeader>
            <CardContent>
              {backupJobs.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No backups created yet</p>
                  <div className="mt-4 space-y-2">
                    <div>
                      <select
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md bg-white"
                      >
                        <option value="json">JSON + CSV</option>
                        <option value="excel">Excel (.xlsx)</option>
                      </select>
                    </div>
                    <Button onClick={() => createManualBackup(exportFormat)}>
                      Create Your First {exportFormat.toUpperCase()} Backup
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {backupJobs.slice(0, 5).map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {getStatusBadge(job.status)}
                        <div>
                          <p className="font-medium">{formatDateShort(job.start_time)}</p>
                          <p className="text-sm text-gray-500">
                            {job.total_records} records • {formatFileSize(job.backup_size_mb)}
                          </p>
                        </div>
                      </div>
                      {job.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadBackup(job.id, job)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>Backup History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {backupJobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(job.status)}
                      <span className="font-medium">{formatDate(job.start_time)}</span>
                    </div>
                    {job.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadBackup(job.id, job)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Records:</span> {job.total_records}
                    </div>
                    <div>
                      <span className="font-medium">Size:</span> {formatFileSize(job.backup_size_mb)}
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span> 
                      {job.end_time ? 
                        ` ${Math.round((new Date(job.end_time) - new Date(job.start_time)) / 1000)}s` : 
                        ' Running...'}
                    </div>
                    <div>
                      <span className="font-medium">Created by:</span> {job.created_by || 'System'}
                    </div>
                  </div>

                  {job.error_message && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      <strong>Error:</strong> {job.error_message}
                    </div>
                  )}

                  {job.records_backed_up && Object.keys(job.records_backed_up).length > 0 && (
                    <div className="mt-2 text-sm">
                      <span className="font-medium">Collections:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(job.records_backed_up).map(([collection, count]) => (
                          <Badge key={collection} variant="secondary" className="text-xs">
                            {collection}: {count}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && backupConfig && (
        <Card>
          <CardHeader>
            <CardTitle>Backup Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Backup Enabled</label>
                <Switch
                  checked={backupConfig.backup_enabled}
                  onCheckedChange={(checked) => updateBackupConfig({ backup_enabled: checked })}
                />
                <p className="text-sm text-gray-500 mt-1">Enable or disable automatic backups</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Backup Time</label>
                <div className="space-y-2">
                  <Input
                    type="time"
                    value={backupConfig.backup_time}
                    onChange={(e) => updateBackupConfig({ backup_time: e.target.value })}
                  />
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Time for daily automatic backups</span>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        // Get current time in IST (UTC+5:30)
                        const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
                        const currentTime = istTime.toTimeString().slice(0, 5);
                        updateBackupConfig({ backup_time: currentTime });
                      }}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Use current time ({(() => {
                        const now = new Date();
                        const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
                        return istTime.toTimeString().slice(0, 5);
                      })()})
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Retention (Days)</label>
                <Input
                  type="number"
                  value={backupConfig.retention_days}
                  onChange={(e) => updateBackupConfig({ retention_days: parseInt(e.target.value) })}
                  min="1"
                  max="365"
                />
                <p className="text-sm text-gray-500 mt-1">Number of days to keep backups</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Compress Backups</label>
                <Switch
                  checked={backupConfig.compress_backups}
                  onCheckedChange={(checked) => updateBackupConfig({ compress_backups: checked })}
                />
                <p className="text-sm text-gray-500 mt-1">Compress backups to save storage space</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Backup Location</label>
              <Input
                value={backupConfig.backup_location}
                onChange={(e) => updateBackupConfig({ backup_location: e.target.value })}
                placeholder="./backups"
              />
              <p className="text-sm text-gray-500 mt-1">Directory where backups are stored</p>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-lg font-medium mb-4">Email Notifications</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Enable Email Notifications</label>
                  <Switch
                    checked={backupConfig.email_notifications}
                    onCheckedChange={(checked) => updateBackupConfig({ email_notifications: checked })}
                  />
                </div>

                {backupConfig.email_notifications && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Email Recipients</label>
                    <Input
                      value={backupConfig.email_recipients?.join(', ') || ''}
                      onChange={(e) => updateBackupConfig({ 
                        email_recipients: e.target.value.split(',').map(email => email.trim()).filter(email => email)
                      })}
                      placeholder="admin@company.com, backup@company.com"
                    />
                    <p className="text-sm text-gray-500 mt-1">Comma-separated email addresses</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BackupManagement;