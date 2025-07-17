import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  Eye, CheckCircle, Clock, Trash2, MapPin, Filter, Download, 
  Users, AlertTriangle, TrendingUp, Calendar, Search,
  ExternalLink, MoreHorizontal, RefreshCw, Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getIssues, updateIssue, deleteIssue, getUsers } from '../services/database';
import LoadingSpinner from '../components/common/LoadingSpinner';
import IssueMap from '../components/map/IssueMap';
import { IssuesTab, MapTab, AnalyticsTab, UsersTab } from '../components/admin/AdminTabs';
import { ExportModal, AdminSettings, exportToCSV } from '../components/admin/AdminUtils';
import moment from 'moment';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AdminDashboard = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showExportModal, setShowExportModal] = useState(false);
  const [escalatedIssues, setEscalatedIssues] = useState([]);
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    severity: 'all',
    dateRange: '30',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
    checkEscalatedIssues();
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

  // Check for escalated issues (multiple reports in same area within 24 hours)
  const checkEscalatedIssues = () => {
    const escalated = [];
    const locationGroups = {};
    
    issues.forEach(issue => {
      if (!issue.location?.lat || !issue.location?.lng) return;
      
      const key = `${Math.round(issue.location.lat * 1000)}-${Math.round(issue.location.lng * 1000)}`;
      if (!locationGroups[key]) {
        locationGroups[key] = [];
      }
      locationGroups[key].push(issue);
    });

    Object.values(locationGroups).forEach(group => {
      if (group.length >= 5) { // 5 or more reports in same area
        const recent = group.filter(issue => 
          moment(issue.timestamp).isAfter(moment().subtract(24, 'hours'))
        );
        if (recent.length >= 3) {
          escalated.push({
            location: group[0].location,
            issues: recent,
            count: recent.length
          });
        }
      }
    });

    setEscalatedIssues(escalated);
  };

  const handleStatusUpdate = async (issueId, newStatus) => {
    setUpdating(issueId);
    try {
      await updateIssue(issueId, { 
        status: newStatus,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid
      });
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
    if (!window.confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
      return;
    }
    
    setUpdating(issueId);
    try {
      await deleteIssue(issueId);
      setIssues(prev => prev.filter(issue => issue.id !== issueId));
    } catch (error) {
      console.error('Error deleting issue:', error);
    } finally {
      setUpdating(null);
    }
  };

  // Filter issues based on current filters
  const filteredIssues = issues.filter(issue => {
    const matchesCategory = filters.category === 'all' || issue.category === filters.category;
    const matchesStatus = filters.status === 'all' || issue.status === filters.status;
    const matchesSeverity = filters.severity === 'all' || issue.severity.toString() === filters.severity;
    const matchesSearch = !filters.search || 
      issue.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      issue.description.toLowerCase().includes(filters.search.toLowerCase()) ||
      issue.location?.address?.toLowerCase().includes(filters.search.toLowerCase());
    
    const issueDate = moment(issue.timestamp);
    const daysAgo = parseInt(filters.dateRange);
    const matchesDate = filters.dateRange === 'all' || 
      issueDate.isAfter(moment().subtract(daysAgo, 'days'));

    return matchesCategory && matchesStatus && matchesSeverity && matchesSearch && matchesDate;
  });

  // Analytics calculations
  const analytics = {
    totalIssues: issues.length,
    resolvedIssues: issues.filter(i => i.status === 'Resolved').length,
    inProgressIssues: issues.filter(i => i.status === 'In Progress').length,
    openIssues: issues.filter(i => i.status === 'Open').length,
    thisWeekIssues: issues.filter(i => moment(i.timestamp).isAfter(moment().subtract(7, 'days'))).length,
    thisMonthIssues: issues.filter(i => moment(i.timestamp).isAfter(moment().subtract(30, 'days'))).length,
    averageResolutionTime: calculateAverageResolutionTime(),
    topCategories: getTopCategories(),
    severityDistribution: getSeverityDistribution(),
    weeklyTrend: getWeeklyTrend(),
    mostActiveUsers: getMostActiveUsers()
  };

  function calculateAverageResolutionTime() {
    const resolvedIssues = issues.filter(i => i.status === 'Resolved' && i.resolvedAt);
    if (resolvedIssues.length === 0) return 0;
    
    const totalTime = resolvedIssues.reduce((sum, issue) => {
      const created = moment(issue.timestamp);
      const resolved = moment(issue.resolvedAt);
      return sum + resolved.diff(created, 'hours');
    }, 0);
    
    return Math.round(totalTime / resolvedIssues.length);
  }

  function getTopCategories() {
    const categoryCount = {};
    issues.forEach(issue => {
      categoryCount[issue.category] = (categoryCount[issue.category] || 0) + 1;
    });
    
    return Object.entries(categoryCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }

  function getSeverityDistribution() {
    const severityCount = {};
    issues.forEach(issue => {
      const severity = `Severity ${issue.severity}`;
      severityCount[severity] = (severityCount[severity] || 0) + 1;
    });
    
    return Object.entries(severityCount)
      .map(([name, value]) => ({ name, value }));
  }

  function getWeeklyTrend() {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = moment().subtract(i, 'days');
      const count = issues.filter(issue => 
        moment(issue.timestamp).isSame(date, 'day')
      ).length;
      
      last7Days.push({
        day: date.format('MMM DD'),
        issues: count
      });
    }
    return last7Days;
  }

  function getMostActiveUsers() {
    const userCount = {};
    issues.forEach(issue => {
      userCount[issue.reportedBy] = (userCount[issue.reportedBy] || 0) + 1;
    });
    
    return Object.entries(userCount)
      .map(([userId, count]) => {
        const user = users.find(u => u.uid === userId);
        return {
          name: user?.displayName || 'Unknown User',
          email: user?.email || '',
          count
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  const handleExportCSV = () => {
    exportToCSV(filteredIssues, users, filters);
  };

  const handleSaveSettings = async (settings) => {
    // Save settings to localStorage or backend
    localStorage.setItem('adminSettings', JSON.stringify(settings));
    console.log('Settings saved:', settings);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Monitor and manage city issues</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Filter size={16} />
                Filters
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download size={16} />
                Export
              </button>
              <button
                onClick={fetchData}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search issues..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="Pothole">Pothole</option>
                  <option value="Broken Streetlight">Broken Streetlight</option>
                  <option value="Garbage Dumping">Garbage Dumping</option>
                  <option value="Waterlogging">Waterlogging</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <select
                  value={filters.severity}
                  onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Severity</option>
                  <option value="1">Severity 1</option>
                  <option value="2">Severity 2</option>
                  <option value="3">Severity 3</option>
                  <option value="4">Severity 4</option>
                  <option value="5">Severity 5</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last 90 Days</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart },
              { id: 'issues', label: 'Issues Management', icon: AlertTriangle },
              { id: 'map', label: 'Map View', icon: MapPin },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Escalation Alerts */}
        {escalatedIssues.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800 font-semibold mb-2">
              <AlertTriangle className="h-5 w-5" />
              Escalation Alert: {escalatedIssues.length} area(s) need urgent attention
            </div>
            <div className="space-y-2">
              {escalatedIssues.map((escalation, index) => (
                <div key={index} className="text-sm text-red-700">
                  {escalation.count} reports in {escalation.location.address || 'unknown location'} 
                  within the last 24 hours
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <OverviewTab analytics={analytics} />
        )}
        
        {activeTab === 'issues' && (
          <IssuesTab 
            issues={filteredIssues} 
            updating={updating}
            onStatusUpdate={handleStatusUpdate}
            onDelete={handleDeleteIssue}
            users={users}
          />
        )}
        
        {activeTab === 'map' && (
          <MapTab issues={filteredIssues} />
        )}
        
        {activeTab === 'analytics' && (
          <AnalyticsTab analytics={analytics} />
        )}
        
        {activeTab === 'users' && (
          <UsersTab users={users} issues={issues} />
        )}

        {activeTab === 'settings' && (
          <AdminSettings onSave={handleSaveSettings} />
        )}
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        issues={issues}
        analytics={analytics}
        users={users}
      />
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ analytics }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center">
        <div className="p-2 bg-blue-100 rounded-lg">
          <AlertTriangle className="h-6 w-6 text-blue-600" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">Total Issues</p>
          <p className="text-2xl font-bold text-gray-900">{analytics.totalIssues}</p>
        </div>
      </div>
    </div>

    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center">
        <div className="p-2 bg-green-100 rounded-lg">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">Resolved</p>
          <p className="text-2xl font-bold text-gray-900">{analytics.resolvedIssues}</p>
        </div>
      </div>
    </div>

    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center">
        <div className="p-2 bg-yellow-100 rounded-lg">
          <Clock className="h-6 w-6 text-yellow-600" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">In Progress</p>
          <p className="text-2xl font-bold text-gray-900">{analytics.inProgressIssues}</p>
        </div>
      </div>
    </div>

    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center">
        <div className="p-2 bg-red-100 rounded-lg">
          <TrendingUp className="h-6 w-6 text-red-600" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">This Week</p>
          <p className="text-2xl font-bold text-gray-900">{analytics.thisWeekIssues}</p>
        </div>
      </div>
    </div>

    {/* Charts */}
    <div className="col-span-full grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Weekly Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={analytics.weeklyTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="issues" stroke="#3B82F6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Top Categories</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={analytics.topCategories}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {analytics.topCategories.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

export default AdminDashboard;
