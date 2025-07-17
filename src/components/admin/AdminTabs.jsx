import { useState } from 'react';
import { 
  Eye, CheckCircle, Clock, Trash2, MapPin, ExternalLink, 
  MoreHorizontal, AlertTriangle, Calendar, User
} from 'lucide-react';
import moment from 'moment';
import AdminIssueMap from './AdminIssueMap';

// Issues Management Tab Component
export const IssuesTab = ({ issues, updating, onStatusUpdate, onDelete, users }) => {
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');

  const sortedIssues = [...issues].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (sortBy === 'timestamp') {
      return sortOrder === 'desc' 
        ? new Date(bValue) - new Date(aValue)
        : new Date(aValue) - new Date(bValue);
    }
    
    if (sortOrder === 'desc') {
      return bValue > aValue ? 1 : -1;
    }
    return aValue > bValue ? 1 : -1;
  });

  const getSeverityColor = (severity) => {
    const colors = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-yellow-100 text-yellow-800',
      3: 'bg-orange-100 text-orange-800',
      4: 'bg-red-100 text-red-800',
      5: 'bg-purple-100 text-purple-800'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Open': 'bg-red-100 text-red-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Resolved': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const openInMaps = (lat, lng) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Issues Management</h2>
        <div className="flex items-center gap-4">
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="timestamp-desc">Newest First</option>
            <option value="timestamp-asc">Oldest First</option>
            <option value="severity-desc">Highest Severity</option>
            <option value="severity-asc">Lowest Severity</option>
            <option value="upvotes-desc">Most Upvoted</option>
            <option value="category-asc">Category A-Z</option>
          </select>
        </div>
      </div>

      {/* Issues Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Upvotes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reported
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedIssues.map((issue) => {
                const reporter = users.find(u => u.uid === issue.reportedBy);
                return (
                  <tr key={issue.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        {issue.imageURL && (
                          <img
                            src={issue.imageURL}
                            alt="Issue"
                            className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {issue.title}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {issue.description}
                          </p>
                          {reporter && (
                            <p className="text-xs text-gray-400 mt-1">
                              by {reporter.displayName || reporter.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {issue.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {issue.location?.address || 'No address'}
                      </div>
                      {issue.location?.lat && issue.location?.lng && (
                        <button
                          onClick={() => openInMaps(issue.location.lat, issue.location.lng)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                        >
                          <MapPin size={12} />
                          View on Map
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                        Level {issue.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                        {issue.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {issue.upvotes || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {moment(issue.timestamp).fromNow()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedIssue(issue)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        
                        {issue.status !== 'Resolved' && (
                          <button
                            onClick={() => onStatusUpdate(issue.id, issue.status === 'Open' ? 'In Progress' : 'Resolved')}
                            disabled={updating === issue.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            title={issue.status === 'Open' ? 'Mark In Progress' : 'Mark Resolved'}
                          >
                            {issue.status === 'Open' ? <Clock size={16} /> : <CheckCircle size={16} />}
                          </button>
                        )}
                        
                        <button
                          onClick={() => onDelete(issue.id)}
                          disabled={updating === issue.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Delete Issue"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Detail Modal */}
      {selectedIssue && (
        <IssueDetailModal 
          issue={selectedIssue} 
          users={users}
          onClose={() => setSelectedIssue(null)}
          onStatusUpdate={onStatusUpdate}
        />
      )}
    </div>
  );
};

// Issue Detail Modal
const IssueDetailModal = ({ issue, users, onClose, onStatusUpdate }) => {
  const reporter = users.find(u => u.uid === issue.reportedBy);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Issue Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          {issue.imageURL && (
            <img
              src={issue.imageURL}
              alt="Issue"
              className="w-full h-64 object-cover rounded-lg mb-4"
            />
          )}

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">{issue.title}</h4>
              <p className="text-gray-600 mt-1">{issue.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Category</label>
                <p className="text-gray-900">{issue.category}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Severity</label>
                <p className="text-gray-900">Level {issue.severity}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="text-gray-900">{issue.status}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Upvotes</label>
                <p className="text-gray-900">{issue.upvotes || 0}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Location</label>
              <p className="text-gray-900">{issue.location?.address || 'No address provided'}</p>
              {issue.location?.lat && issue.location?.lng && (
                <p className="text-sm text-gray-500">
                  Coordinates: {issue.location.lat.toFixed(6)}, {issue.location.lng.toFixed(6)}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Reported By</label>
              <p className="text-gray-900">
                {reporter?.displayName || 'Unknown User'}
                {reporter?.email && (
                  <span className="text-gray-500 ml-2">({reporter.email})</span>
                )}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Reported Date</label>
              <p className="text-gray-900">{moment(issue.timestamp).format('MMMM DD, YYYY at HH:mm')}</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
            {issue.status !== 'Resolved' && (
              <button
                onClick={() => {
                  onStatusUpdate(issue.id, issue.status === 'Open' ? 'In Progress' : 'Resolved');
                  onClose();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {issue.status === 'Open' ? 'Mark In Progress' : 'Mark Resolved'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Map Tab Component
export const MapTab = ({ issues }) => {
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [mapFilters, setMapFilters] = useState({
    category: 'all',
    status: 'all',
    severity: 'all'
  });
  
  const mapCenter = issues.length > 0 
    ? [
        issues.reduce((sum, issue) => sum + (issue.location?.lat || 0), 0) / issues.length,
        issues.reduce((sum, issue) => sum + (issue.location?.lng || 0), 0) / issues.length
      ]
    : [28.6139, 77.2090]; // Default to Delhi

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Interactive Map View</h2>
        <div className="flex items-center gap-4">
          <select
            value={mapFilters.category}
            onChange={(e) => setMapFilters(prev => ({ ...prev, category: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Categories</option>
            <option value="Pothole">Pothole</option>
            <option value="Broken Streetlight">Broken Streetlight</option>
            <option value="Garbage Dumping">Garbage Dumping</option>
            <option value="Waterlogging">Waterlogging</option>
            <option value="Other">Other</option>
          </select>
          <select
            value={mapFilters.status}
            onChange={(e) => setMapFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
          <div className="text-sm text-gray-600">
            Showing {issues.length} issues
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="h-96">
          <AdminIssueMap
            issues={issues}
            center={mapCenter}
            zoom={11}
            onMarkerClick={setSelectedIssue}
            filters={mapFilters}
            showClusters={true}
          />
        </div>
      </div>

      {selectedIssue && (
        <IssueDetailModal 
          issue={selectedIssue} 
          users={[]}
          onClose={() => setSelectedIssue(null)}
          onStatusUpdate={() => {}}
        />
      )}
    </div>
  );
};

// Analytics Tab Component
export const AnalyticsTab = ({ analytics }) => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold">Analytics & Reports</h2>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Resolution Performance</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Resolution Rate</span>
            <span className="font-semibold">
              {analytics.totalIssues > 0 
                ? Math.round((analytics.resolvedIssues / analytics.totalIssues) * 100)
                : 0}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Average Resolution Time</span>
            <span className="font-semibold">{analytics.averageResolutionTime}h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Issues This Month</span>
            <span className="font-semibold">{analytics.thisMonthIssues}</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Most Active Users</h3>
        <div className="space-y-3">
          {analytics.mostActiveUsers.map((user, index) => (
            <div key={index} className="flex justify-between items-center">
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </div>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                {user.count} reports
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Users Tab Component
export const UsersTab = ({ users, issues }) => {
  const [sortBy, setSortBy] = useState('displayName');
  const [sortOrder, setSortOrder] = useState('asc');

  const usersWithStats = users.map(user => {
    const userIssues = issues.filter(issue => issue.reportedBy === user.uid);
    return {
      ...user,
      totalReports: userIssues.length,
      resolvedReports: userIssues.filter(issue => issue.status === 'Resolved').length,
      lastReportDate: userIssues.length > 0 
        ? Math.max(...userIssues.map(issue => new Date(issue.timestamp).getTime()))
        : null
    };
  });

  const sortedUsers = [...usersWithStats].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (sortOrder === 'desc') {
      return bValue > aValue ? 1 : -1;
    }
    return aValue > bValue ? 1 : -1;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">User Management</h2>
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split('-');
            setSortBy(field);
            setSortOrder(order);
          }}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="displayName-asc">Name A-Z</option>
          <option value="displayName-desc">Name Z-A</option>
          <option value="totalReports-desc">Most Reports</option>
          <option value="totalReports-asc">Least Reports</option>
          <option value="lastReportDate-desc">Recent Activity</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Reports
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resolved
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.displayName || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.totalReports}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.resolvedReports}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastReportDate 
                      ? moment(user.lastReportDate).fromNow()
                      : 'No reports'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role || 'citizen'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
