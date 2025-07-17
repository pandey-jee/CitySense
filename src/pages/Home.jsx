import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getIssues, ISSUE_CATEGORIES } from '../services/database';
import IssueMap from '../components/map/IssueMap';
import IssueCard from '../components/common/IssueCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Home = () => {
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedIssue, setSelectedIssue] = useState(null);

  useEffect(() => {
    fetchIssues();
  }, []);

  useEffect(() => {
    filterIssues();
  }, [issues, selectedCategory, selectedStatus]);

  const fetchIssues = async () => {
    try {
      const fetchedIssues = await getIssues();
      setIssues(fetchedIssues);
      setFilteredIssues(fetchedIssues);
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterIssues = () => {
    let filtered = issues;

    if (selectedCategory) {
      filtered = filtered.filter(issue => issue.category === selectedCategory);
    }

    if (selectedStatus) {
      filtered = filtered.filter(issue => issue.status === selectedStatus);
    }

    setFilteredIssues(filtered);
  };

  const handleMarkerClick = (issue) => {
    setSelectedIssue(issue);
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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to CitySense
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Real-time community-powered urban issue reporting and tracking
        </p>
        <Link
          to="/report"
          className="bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary-700 transition-colors"
        >
          Report an Issue
        </Link>
      </div>

      {/* Statistics */}
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

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Filter Issues</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Categories</option>
              {ISSUE_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Issues Map ({filteredIssues.length} issues)
        </h2>
        <IssueMap
          issues={filteredIssues}
          onMarkerClick={handleMarkerClick}
          center={[28.6139, 77.2090]} // Default to Delhi, India
          zoom={11}
        />
      </div>

      {/* Recent Issues */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Issues</h2>
        <div className="space-y-6">
          {filteredIssues.slice(0, 10).map((issue) => (
            <IssueCard 
              key={issue.id} 
              issue={issue} 
              onUpdate={fetchIssues}
            />
          ))}
          {filteredIssues.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No issues found matching your filters.</p>
              <Link 
                to="/report"
                className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Report the first issue
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Selected Issue Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">{selectedIssue.title}</h3>
            <p className="text-gray-600 mb-4">{selectedIssue.description}</p>
            <div className="flex items-center space-x-2 mb-4">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                {selectedIssue.category}
              </span>
              <span className={`px-2 py-1 rounded text-sm ${getStatusColor(selectedIssue.status)}`}>
                {selectedIssue.status}
              </span>
              <span className={`px-2 py-1 rounded text-sm ${getSeverityColor(selectedIssue.severity)}`}>
                Severity: {selectedIssue.severity}
              </span>
            </div>
            {selectedIssue.imageURL && (
              <img
                src={selectedIssue.imageURL}
                alt="Issue"
                className="w-full h-48 object-cover rounded-md mb-4"
              />
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                👍 {selectedIssue.upvotes || 0} upvotes
              </span>
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

export default Home;
