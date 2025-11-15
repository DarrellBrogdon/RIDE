import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Receipt, FileText } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import FileUploader from '../components/FileUploader';
import api from '../services/api';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [recentReceipts, setRecentReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentReceipts = async () => {
    try {
      const response = await api.get('/receipts?per_page=5');
      setRecentReceipts(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentReceipts();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleUploadSuccess = () => {
    // Refresh the receipts list after successful upload
    fetchRecentReceipts();
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
                  className="text-gray-900 hover:text-gray-700 px-3 py-2 text-sm font-medium"
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
        <div className="px-4 py-6 sm:px-0 space-y-8">
          {/* Upload Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Upload Receipt
            </h2>
            <FileUploader onUploadSuccess={handleUploadSuccess} />
          </div>

          {/* Recent Receipts Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Recent Receipts
              </h2>
              <Link
                to="/receipts"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                View all
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : recentReceipts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-200">
                <Receipt className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  No receipts yet. Upload your first receipt above!
                </p>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden rounded-lg">
                <ul className="divide-y divide-gray-200">
                  {recentReceipts.map((receipt) => (
                    <li key={receipt.id}>
                      <Link
                        to={`/receipts/${receipt.id}`}
                        className="block hover:bg-gray-50 transition"
                      >
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <FileText className="h-5 w-5 text-gray-400 mr-3" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {receipt.vendor || 'Processing...'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {receipt.date
                                    ? new Date(receipt.date).toLocaleDateString()
                                    : 'Date pending'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              {receipt.total && (
                                <span className="text-sm font-medium text-gray-900">
                                  ${parseFloat(receipt.total).toFixed(2)}
                                </span>
                              )}
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                                  receipt.status
                                )}`}
                              >
                                {receipt.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
