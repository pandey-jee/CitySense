import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getIssues, updateIssue, deleteIssue, getUsers } from '../services/database';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Dashboard = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [issuesData, usersData] = await Promise.all([
        getIssues(),
        getUsers()
      ]);
      setIssues(issuesData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (issueId, newStatus) => {
    setUpdating(issueId);
    try {
      await updateIssue(issueId, { status: newStatus });
      setIssues(prev => 
        prev.map(issue => 
          issue.id === issueId ? { ...issue, status: newStatus } : issue
        )
      );
    } catch (error) {
      console.error('Error updating issue:', error);
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteIssue = async (issueId) => {
    if (window.confirm('Are you sure you want to delete this issue?')) {
      setUpdating(issueId);
      try {
        await deleteIssue(issueId);
        setIssues(prev => prev.filter(issue => issue.id !== issueId));
      } catch (error) {
        console.error('Error deleting issue:', error);
      } finally {
        setUpdating(null);
      }
    }
  };

  const exportData = async () => {
    try {
      const response = await fetch('/api/export', {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'issues_export.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Export failed');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const getFilteredIssues = () => {
    if (filter === 'all') return issues;
    return issues.filter(issue => issue.status === filter);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-red-100 text-red-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 1:
        return 'bg-green-100 text-green-800';
      case 2:
        return 'bg-yellow-100 text-yellow-800';
      case 3:
        return 'bg-orange-100 text-orange-800';
      case 4:
        return 'bg-red-100 text-red-800';
      case 5:
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Chart data
  const statusData = {
    labels: ['Open', 'In Progress', 'Resolved'],
    datasets: [{
      data: [
        issues.filter(i => i.status === 'Open').length,
        issues.filter(i => i.status === 'In Progress').length,
        issues.filter(i => i.status === 'Resolved').length
      ],
      backgroundColor: ['#ef4444', '#f59e0b', '#10b981']
    }]
  };

  const categoryData = {
    labels: ['Roads', 'Water', 'Waste', 'Lighting', 'Traffic', 'Parks', 'Other'],
    datasets: [{
      label: 'Issues by Category',
      data: [
        issues.filter(i => i.category === 'Roads').length,
        issues.filter(i => i.category === 'Water').length,
        issues.filter(i => i.category === 'Waste').length,
        issues.filter(i => i.category === 'Lighting').length,
        issues.filter(i => i.category === 'Traffic').length,
        issues.filter(i => i.category === 'Parks').length,
        issues.filter(i => i.category === 'Other').length
      ],
      backgroundColor: '#3b82f6'
    }]
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user?.isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h2 className="text-lg font-semibold text-red-800">Access Denied</h2>
          <p className="text-red-600">You don't have permission to access this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage issues and view analytics</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900">Total Issues</h3>
          <p className="text-3xl font-bold text-primary-600">{issues.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900">Open Issues</h3>
          <p className="text-3xl font-bold text-red-600">
            {issues.filter(issue => issue.status === 'Open').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900">In Progress</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {issues.filter(issue => issue.status === 'In Progress').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900">Resolved</h3>
          <p className="text-3xl font-bold text-green-600">
            {issues.filter(issue => issue.status === 'Resolved').length}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Issues by Status</h3>
          <Pie data={statusData} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Issues by Category</h3>
          <Bar data={categoryData} />
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Issues Management</h2>
          <div className="flex space-x-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Issues</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
            <button
              onClick={exportData}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              📥 Export CSV
            </button>
          </div>
        </div>

        {/* Issues Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Title</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Category</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Status</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Severity</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Upvotes</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {getFilteredIssues().map((issue) => (
                <tr key={issue.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{issue.title}</p>
                      <p className="text-sm text-gray-500">{issue.location}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {issue.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-sm ${getStatusColor(issue.status)}`}>
                      {issue.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-sm ${getSeverityColor(issue.severity)}`}>
                      {issue.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">👍 {issue.upvotes || 0}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-2">
                      <select
                        value={issue.status}
                        onChange={(e) => handleStatusUpdate(issue.id, e.target.value)}
                        disabled={updating === issue.id}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                      <button
                        onClick={() => setSelectedIssue(issue)}
                        className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDeleteIssue(issue.id)}
                        disabled={updating === issue.id}
                        className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Details Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">{selectedIssue.title}</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">Description:</h4>
                <p className="text-gray-600">{selectedIssue.description}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Location:</h4>
                <p className="text-gray-600">{selectedIssue.location}</p>
                <p className="text-sm text-gray-500">
                  {selectedIssue.latitude}, {selectedIssue.longitude}
                </p>
              </div>
              <div className="flex space-x-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded">
                  {selectedIssue.category}
                </span>
                <span className={`px-3 py-1 rounded ${getStatusColor(selectedIssue.status)}`}>
                  {selectedIssue.status}
                </span>
                <span className={`px-3 py-1 rounded ${getSeverityColor(selectedIssue.severity)}`}>
                  Severity: {selectedIssue.severity}
                </span>
              </div>
              {selectedIssue.imageURL && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Image:</h4>
                  <img
                    src={selectedIssue.imageURL}
                    alt="Issue"
                    className="w-full max-w-md h-64 object-cover rounded-md"
                  />
                </div>
              )}
              <div>
                <h4 className="font-semibold text-gray-900">Created:</h4>
                <p className="text-gray-600">
                  {new Date(selectedIssue.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedIssue(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
