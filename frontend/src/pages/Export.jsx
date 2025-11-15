import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Download, FileSpreadsheet, FileText, Calendar } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Export() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [format, setFormat] = useState('csv');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleExport = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      setExporting(true);

      const params = new URLSearchParams({
        format,
      });

      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await api.get(`/receipts/export?${params}`, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Set filename based on format and date range
      const timestamp = new Date().toISOString().split('T')[0];
      const extension = format === 'csv' ? 'csv' : 'xlsx';
      let filename = `receipts_export_${timestamp}.${extension}`;

      if (dateFrom && dateTo) {
        filename = `receipts_${dateFrom}_to_${dateTo}.${extension}`;
      } else if (dateFrom) {
        filename = `receipts_from_${dateFrom}.${extension}`;
      } else if (dateTo) {
        filename = `receipts_until_${dateTo}.${extension}`;
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export receipts:', err);
      setError(err.response?.data?.message || 'Failed to export receipts. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const setPresetDateRange = (preset) => {
    const today = new Date();
    const from = new Date();

    switch (preset) {
      case 'today':
        setDateFrom(today.toISOString().split('T')[0]);
        setDateTo(today.toISOString().split('T')[0]);
        break;
      case 'this_week':
        from.setDate(today.getDate() - today.getDay());
        setDateFrom(from.toISOString().split('T')[0]);
        setDateTo(today.toISOString().split('T')[0]);
        break;
      case 'this_month':
        from.setDate(1);
        setDateFrom(from.toISOString().split('T')[0]);
        setDateTo(today.toISOString().split('T')[0]);
        break;
      case 'last_month':
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        setDateFrom(lastMonthStart.toISOString().split('T')[0]);
        setDateTo(lastMonthEnd.toISOString().split('T')[0]);
        break;
      case 'this_year':
        from.setMonth(0, 1);
        setDateFrom(from.toISOString().split('T')[0]);
        setDateTo(today.toISOString().split('T')[0]);
        break;
      case 'all_time':
        setDateFrom('');
        setDateTo('');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900">Receipt Extractor</h1>
              <div className="hidden md:flex space-x-4">
                <Link
                  to="/"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/receipts"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
                >
                  All Receipts
                </Link>
                <Link
                  to="/export"
                  className="text-gray-900 hover:text-gray-700 px-3 py-2 text-sm font-medium"
                >
                  Export
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Export Receipts</h2>
            <p className="mt-1 text-sm text-gray-600">
              Export your receipt data to CSV or Excel format
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleExport} className="space-y-6">
            {/* Export Format */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Export Format</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label
                  className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    format === 'csv'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value="csv"
                    checked={format === 'csv'}
                    onChange={(e) => setFormat(e.target.value)}
                    className="sr-only"
                  />
                  <FileText className="h-8 w-8 text-gray-400 mr-4" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">CSV</div>
                    <div className="text-xs text-gray-500">
                      Simple spreadsheet format, compatible with Excel and Google Sheets
                    </div>
                  </div>
                  {format === 'csv' && (
                    <div className="absolute top-2 right-2">
                      <div className="h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                          <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" />
                        </svg>
                      </div>
                    </div>
                  )}
                </label>

                <label
                  className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    format === 'excel'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value="excel"
                    checked={format === 'excel'}
                    onChange={(e) => setFormat(e.target.value)}
                    className="sr-only"
                  />
                  <FileSpreadsheet className="h-8 w-8 text-gray-400 mr-4" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Excel</div>
                    <div className="text-xs text-gray-500">
                      Advanced format with multiple sheets and formatting
                    </div>
                  </div>
                  {format === 'excel' && (
                    <div className="absolute top-2 right-2">
                      <div className="h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                          <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" />
                        </svg>
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Date Range */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Date Range</h3>

              {/* Quick Presets */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Select
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'today', label: 'Today' },
                    { value: 'this_week', label: 'This Week' },
                    { value: 'this_month', label: 'This Month' },
                    { value: 'last_month', label: 'Last Month' },
                    { value: 'this_year', label: 'This Year' },
                    { value: 'all_time', label: 'All Time' },
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setPresetDateRange(preset.value)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="date_from" className="block text-sm font-medium text-gray-700 mb-1">
                    From Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      id="date_from"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="date_to" className="block text-sm font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      id="date_to"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo) && (
                <p className="mt-2 text-sm text-red-600">
                  "From" date must be before "To" date
                </p>
              )}
            </div>

            {/* Filters */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Receipt Status
                </label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Receipts</option>
                  <option value="completed">Completed Only</option>
                  <option value="pending">Pending Only</option>
                  <option value="processing">Processing Only</option>
                  <option value="failed">Failed Only</option>
                </select>
              </div>
            </div>

            {/* Export Button */}
            <div className="bg-white shadow rounded-lg p-6">
              <button
                type="submit"
                disabled={exporting || (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo))}
                className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-5 w-5 mr-2" />
                {exporting ? 'Exporting...' : `Export to ${format.toUpperCase()}`}
              </button>
              <p className="mt-3 text-xs text-center text-gray-500">
                {format === 'excel'
                  ? 'Excel file will include a summary sheet and a detailed line items sheet'
                  : 'CSV file will include all receipt information in a single sheet'}
              </p>
            </div>
          </form>

          {/* Info Section */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Export Information</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• CSV exports include: Vendor, Date, Total, Tax, Status</li>
              <li>• Excel exports include two sheets: Summary and Line Items Detail</li>
              <li>• All monetary values are formatted as currency</li>
              <li>• Empty date filters will export all receipts regardless of date</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
