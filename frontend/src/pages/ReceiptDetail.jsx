import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft,
  LogOut,
  FileText,
  Calendar,
  DollarSign,
  Receipt as ReceiptIcon,
  Edit,
  Trash2,
  Download,
  AlertCircle,
} from 'lucide-react';
import api from '../services/api';

export default function ReceiptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    fetchReceipt();
  }, [id]);

  useEffect(() => {
    if (receipt?.file_path) {
      fetchImage();
    }

    // Cleanup blob URL on unmount
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [receipt]);

  const fetchReceipt = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/receipts/${id}`);
      console.log('Receipt data:', response.data);
      console.log('Total:', response.data.total, 'Type:', typeof response.data.total);
      console.log('Tax:', response.data.tax, 'Type:', typeof response.data.tax);
      console.log('All keys:', Object.keys(response.data));
      setReceipt(response.data);
    } catch (err) {
      console.error('Failed to fetch receipt:', err);
      setError(err.response?.data?.message || 'Failed to load receipt');
    } finally {
      setLoading(false);
    }
  };

  const fetchImage = async () => {
    try {
      setImageLoading(true);
      setImageError(false);

      // Fetch the image with authentication
      const response = await api.get(`/receipts/${id}/image`, {
        responseType: 'blob',
      });

      // Create a blob URL
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
    } catch (err) {
      console.error('Failed to fetch image:', err);
      setImageError(true);
    } finally {
      setImageLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/receipts/${id}`);
      navigate('/receipts', { state: { message: 'Receipt deleted successfully' } });
    } catch (err) {
      console.error('Failed to delete receipt:', err);
      alert(err.response?.data?.message || 'Failed to delete receipt');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-sm text-gray-500">Loading receipt...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Receipt</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <Link
              to="/receipts"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Receipts
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
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

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-6">
            <Link
              to="/receipts"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to all receipts
            </Link>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Receipt Details</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Receipt ID: {receipt.id}
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate(`/receipts/${id}/edit`)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Receipt</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to delete this receipt? This action cannot be undone.
                </p>
                <div className="flex space-x-3 justify-end">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Receipt Information */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Receipt Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Status
                    </label>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
                        receipt.status
                      )}`}
                    >
                      {receipt.status}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Vendor
                    </label>
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-base text-gray-900">
                        {receipt.vendor || 'Processing...'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Date
                    </label>
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-base text-gray-900">
                        {receipt.date
                          ? new Date(receipt.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : 'Pending'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Uploaded
                    </label>
                    <span className="text-base text-gray-900">
                      {new Date(receipt.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Subtotal
                    </label>
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-gray-400 mr-1" />
                      <span className="text-base text-gray-900">
                        {receipt.total && receipt.tax
                          ? `$${(parseFloat(receipt.total || 0) - parseFloat(receipt.tax || 0)).toFixed(2)}`
                          : receipt.total && !receipt.tax
                          ? `$${parseFloat(receipt.total || 0).toFixed(2)}`
                          : '-'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Tax
                    </label>
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-gray-400 mr-1" />
                      <span className="text-base text-gray-900">
                        {receipt.tax != null && receipt.tax !== '' ? `$${parseFloat(receipt.tax).toFixed(2)}` : '$0.00'}
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Total
                    </label>
                    <div className="flex items-center">
                      <DollarSign className="h-6 w-6 text-gray-400 mr-1" />
                      <span className="text-2xl font-bold text-gray-900">
                        {(() => {
                          console.log('Total in render:', receipt.total, 'Parsed:', parseFloat(receipt.total));
                          return receipt.total != null && receipt.total !== '' ? `$${parseFloat(receipt.total).toFixed(2)}` : '-';
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              {receipt.line_items && receipt.line_items.length > 0 && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Line Items</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit Price
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {receipt.line_items.map((item, index) => (
                          <tr key={item.id || index}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {item.description}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                              ${parseFloat(item.unit_price || 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                              ${parseFloat(item.amount || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Receipt Image */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Original Receipt</h3>
                {receipt.file_path ? (
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      {imageLoading ? (
                        <div className="flex items-center justify-center p-8 bg-gray-50" style={{ minHeight: '200px' }}>
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-sm text-gray-500">Loading image...</p>
                          </div>
                        </div>
                      ) : imageError ? (
                        <div className="flex flex-col items-center justify-center p-8 bg-gray-50" style={{ minHeight: '200px' }}>
                          <ReceiptIcon className="h-12 w-12 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-500">Image not available</p>
                        </div>
                      ) : imageUrl ? (
                        <img
                          src={imageUrl}
                          alt="Receipt"
                          className="w-full h-auto"
                        />
                      ) : null}
                    </div>
                    {imageUrl && (
                      <a
                        href={imageUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-full px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Original
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ReceiptIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No image available</p>
                  </div>
                )}
              </div>

              {/* Extraction Status */}
              {receipt.status === 'failed' && receipt.extraction_logs && receipt.extraction_logs.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-red-900 mb-2">Extraction Failed</h3>
                  <p className="text-sm text-red-700">
                    {receipt.extraction_logs[0].error_message || 'An error occurred during processing'}
                  </p>
                </div>
              )}

              {receipt.status === 'processing' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-blue-900 mb-2">Processing</h3>
                  <p className="text-sm text-blue-700">
                    This receipt is currently being processed. Please check back in a moment.
                  </p>
                </div>
              )}

              {/* AI Usage Information */}
              {receipt.extraction_logs && receipt.extraction_logs.length > 0 && receipt.extraction_logs[0].cost && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">AI Processing Details</h3>
                  <dl className="grid grid-cols-1 gap-4">
                    {receipt.extraction_logs[0].model && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Model</dt>
                        <dd className="mt-1 text-sm text-gray-900">{receipt.extraction_logs[0].model}</dd>
                      </div>
                    )}
                    {receipt.extraction_logs[0].input_tokens && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Input Tokens</dt>
                        <dd className="mt-1 text-sm text-gray-900">{receipt.extraction_logs[0].input_tokens.toLocaleString()}</dd>
                      </div>
                    )}
                    {receipt.extraction_logs[0].output_tokens && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Output Tokens</dt>
                        <dd className="mt-1 text-sm text-gray-900">{receipt.extraction_logs[0].output_tokens.toLocaleString()}</dd>
                      </div>
                    )}
                    {receipt.extraction_logs[0].processing_time && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Processing Time</dt>
                        <dd className="mt-1 text-sm text-gray-900">{(receipt.extraction_logs[0].processing_time / 1000).toFixed(2)}s</dd>
                      </div>
                    )}
                    <div className="pt-4 border-t border-gray-200">
                      <dt className="text-sm font-medium text-gray-500">AI Processing Cost</dt>
                      <dd className="mt-1 text-lg font-semibold text-gray-900">
                        ${parseFloat(receipt.extraction_logs[0].cost).toFixed(4)}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
