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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center py-16 mb-12 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 rounded-3xl opacity-50 blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6 animate-fade-in">
            Welcome to CitySense
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-10 max-w-3xl mx-auto">
            🏙️ Real-time community-powered urban issue reporting and tracking
          </p>
          <Link
            to="/report"
            className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            🚨 Report an Issue
          </Link>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Issues</h3>
            <span className="text-3xl">📊</span>
          </div>
          <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{issues.length}</p>
          <p className="text-xs text-gray-500 mt-2">All reported issues</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-red-100 transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Open Issues</h3>
            <span className="text-3xl">🔴</span>
          </div>
          <p className="text-4xl font-bold text-red-600">
            {issues.filter(issue => issue.status === 'Open').length}
          </p>
          <p className="text-xs text-gray-500 mt-2">Needs attention</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-yellow-100 transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">In Progress</h3>
            <span className="text-3xl">⚙️</span>
          </div>
          <p className="text-4xl font-bold text-yellow-600">
            {issues.filter(issue => issue.status === 'In Progress').length}
          </p>
          <p className="text-xs text-gray-500 mt-2">Being worked on</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-green-100 transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Resolved</h3>
            <span className="text-3xl">✅</span>
          </div>
          <p className="text-4xl font-bold text-green-600">
            {issues.filter(issue => issue.status === 'Resolved').length}
          </p>
          <p className="text-xs text-gray-500 mt-2">Successfully fixed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-8 rounded-2xl shadow-lg mb-12 border border-gray-100">
        <div className="flex items-center mb-6">
          <span className="text-2xl mr-3">🔍</span>
          <h2 className="text-2xl font-bold text-gray-900">Filter Issues</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              📁 Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
            >
              <option value="">All Categories</option>
              {ISSUE_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              🏷️ Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
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
      <div className="bg-white p-8 rounded-2xl shadow-lg mb-12 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🗺️</span>
            <h2 className="text-2xl font-bold text-gray-900">
              Issues Map
            </h2>
          </div>
          <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
            {filteredIssues.length} issues
          </span>
        </div>
        <div className="rounded-xl overflow-hidden shadow-md">
          <IssueMap
            issues={filteredIssues}
            onMarkerClick={handleMarkerClick}
            center={[28.6139, 77.2090]} // Default to Delhi, India
            zoom={11}
          />
        </div>
      </div>

      {/* Recent Issues */}
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <div className="flex items-center mb-6">
          <span className="text-2xl mr-3">📋</span>
          <h2 className="text-2xl font-bold text-gray-900">Recent Issues</h2>
        </div>
        <div className="space-y-6">
          {filteredIssues.slice(0, 10).map((issue) => (
            <IssueCard 
              key={issue.id} 
              issue={issue} 
              onUpdate={fetchIssues}
            />
          ))}
          {filteredIssues.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-xl text-gray-500 mb-6">No issues found matching your filters.</p>
              <Link 
                to="/report"
                className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
              >
                Report the first issue
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Selected Issue Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white p-8 rounded-2xl max-w-lg w-full mx-4 shadow-2xl transform transition-all duration-300 animate-slide-up">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">{selectedIssue.title}</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">{selectedIssue.description}</p>
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {selectedIssue.category}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedIssue.status)}`}>
                {selectedIssue.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(selectedIssue.severity)}`}>
                Severity: {selectedIssue.severity}
              </span>
            </div>
            {selectedIssue.imageURL && (
              <img
                src={selectedIssue.imageURL}
                alt="Issue"
                className="w-full h-64 object-cover rounded-xl mb-6 shadow-md"
              />
            )}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600 flex items-center">
                <span className="text-xl mr-2">👍</span>
                <span className="font-semibold">{selectedIssue.upvotes || 0}</span> upvotes
              </span>
              <button
                onClick={() => setSelectedIssue(null)}
                className="px-6 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 font-medium transition-all duration-200"
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
