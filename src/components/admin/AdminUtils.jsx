import { useState } from 'react';
import { Download, FileText, Calendar, Filter, Settings, Save } from 'lucide-react';
import moment from 'moment';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Export utilities
export const exportToCSV = (issues, users, filters = {}) => {
  // Filter issues based on provided filters
  const filteredIssues = issues.filter(issue => {
    if (filters.category && filters.category !== 'all' && issue.category !== filters.category) return false;
    if (filters.status && filters.status !== 'all' && issue.status !== filters.status) return false;
    if (filters.severity && filters.severity !== 'all' && issue.severity.toString() !== filters.severity) return false;
    if (filters.dateRange && filters.dateRange !== 'all') {
      const issueDate = moment(issue.timestamp);
      const daysAgo = parseInt(filters.dateRange);
      if (!issueDate.isAfter(moment().subtract(daysAgo, 'days'))) return false;
    }
    return true;
  });

  const csvData = filteredIssues.map(issue => {
    const reporter = users.find(u => u.uid === issue.reportedBy);
    return {
      'Issue ID': issue.id,
      'Title': issue.title,
      'Description': issue.description,
      'Category': issue.category,
      'Status': issue.status,
      'Severity': issue.severity,
      'Location Address': issue.location?.address || 'N/A',
      'Latitude': issue.location?.lat || '',
      'Longitude': issue.location?.lng || '',
      'Upvotes': issue.upvotes || 0,
      'Reported Date': moment(issue.timestamp).format('YYYY-MM-DD HH:mm:ss'),
      'Reporter Name': reporter?.displayName || 'Unknown',
      'Reporter Email': reporter?.email || 'Unknown',
      'Image URL': issue.imageURL || 'N/A',
      'Created Date': moment(issue.timestamp).format('YYYY-MM-DD'),
      'Updated Date': issue.updatedAt ? moment(issue.updatedAt).format('YYYY-MM-DD') : 'N/A',
      'Resolution Date': issue.resolvedAt ? moment(issue.resolvedAt).format('YYYY-MM-DD') : 'N/A'
    };
  });

  const csvContent = [
    Object.keys(csvData[0] || {}).join(','),
    ...csvData.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `citysense-issues-${moment().format('YYYY-MM-DD-HH-mm')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export to PDF
export const exportToPDF = async (issues, analytics, users) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 20;

  // Title
  pdf.setFontSize(20);
  pdf.setFont(undefined, 'bold');
  pdf.text('CitySense Issues Report', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Date
  pdf.setFontSize(12);
  pdf.setFont(undefined, 'normal');
  pdf.text(`Generated on: ${moment().format('MMMM DD, YYYY HH:mm')}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;

  // Summary Statistics
  pdf.setFontSize(16);
  pdf.setFont(undefined, 'bold');
  pdf.text('Summary Statistics', 20, yPosition);
  yPosition += 10;

  pdf.setFontSize(12);
  pdf.setFont(undefined, 'normal');
  const stats = [
    `Total Issues: ${analytics.totalIssues}`,
    `Resolved Issues: ${analytics.resolvedIssues}`,
    `In Progress: ${analytics.inProgressIssues}`,
    `Open Issues: ${analytics.openIssues}`,
    `Issues This Week: ${analytics.thisWeekIssues}`,
    `Issues This Month: ${analytics.thisMonthIssues}`,
    `Average Resolution Time: ${analytics.averageResolutionTime} hours`
  ];

  stats.forEach(stat => {
    pdf.text(stat, 20, yPosition);
    yPosition += 8;
  });

  yPosition += 15;

  // Top Categories
  if (analytics.topCategories.length > 0) {
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('Top Categories', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    analytics.topCategories.forEach((category, index) => {
      pdf.text(`${index + 1}. ${category.name}: ${category.value} issues`, 25, yPosition);
      yPosition += 8;
    });
    yPosition += 15;
  }

  // Recent Issues
  pdf.setFontSize(16);
  pdf.setFont(undefined, 'bold');
  pdf.text('Recent Issues (Last 10)', 20, yPosition);
  yPosition += 10;

  const recentIssues = issues
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);

  pdf.setFontSize(10);
  pdf.setFont(undefined, 'normal');

  recentIssues.forEach((issue, index) => {
    if (yPosition > pageHeight - 30) {
      pdf.addPage();
      yPosition = 20;
    }

    const reporter = users.find(u => u.uid === issue.reportedBy);
    const issueText = [
      `${index + 1}. ${issue.title}`,
      `   Category: ${issue.category} | Severity: ${issue.severity} | Status: ${issue.status}`,
      `   Location: ${issue.location?.address || 'N/A'}`,
      `   Reporter: ${reporter?.displayName || 'Unknown'} (${reporter?.email || 'N/A'})`,
      `   Date: ${moment(issue.timestamp).format('MMM DD, YYYY HH:mm')}`
    ];

    issueText.forEach(line => {
      pdf.text(line, 20, yPosition);
      yPosition += 5;
    });
    yPosition += 5;
  });

  // Save the PDF
  pdf.save(`citysense-report-${moment().format('YYYY-MM-DD')}.pdf`);
};

// Export Modal Component
export const ExportModal = ({ isOpen, onClose, issues, analytics, users }) => {
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportFilters, setExportFilters] = useState({
    category: 'all',
    status: 'all',
    severity: 'all',
    dateRange: '30'
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (exportFormat === 'csv') {
        exportToCSV(issues, users, exportFilters);
      } else if (exportFormat === 'pdf') {
        await exportToPDF(issues, analytics, users);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Export Issues</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Format
              </label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="csv">CSV (Excel Compatible)</option>
                <option value="pdf">PDF Report</option>
              </select>
            </div>

            {exportFormat === 'csv' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Filter
                  </label>
                  <select
                    value={exportFilters.category}
                    onChange={(e) => setExportFilters(prev => ({ ...prev, category: e.target.value }))}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status Filter
                  </label>
                  <select
                    value={exportFilters.status}
                    onChange={(e) => setExportFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Range
                  </label>
                  <select
                    value={exportFilters.dateRange}
                    onChange={(e) => setExportFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Time</option>
                    <option value="7">Last 7 Days</option>
                    <option value="30">Last 30 Days</option>
                    <option value="90">Last 90 Days</option>
                    <option value="365">Last Year</option>
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              disabled={isExporting}
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Export {exportFormat.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Admin Settings Component
export const AdminSettings = ({ onSave }) => {
  const [settings, setSettings] = useState({
    issueCategories: [
      'Pothole',
      'Broken Streetlight',
      'Garbage Dumping',
      'Waterlogging',
      'Broken Road',
      'Traffic Signal Issue',
      'Illegal Parking',
      'Noise Pollution',
      'Water Leakage',
      'Other'
    ],
    severityScale: 5,
    autoArchiveDays: 30,
    publicReporting: true,
    emailNotifications: true,
    escalationThreshold: 5,
    escalationTimeHours: 24
  });

  const [newCategory, setNewCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const addCategory = () => {
    if (newCategory.trim() && !settings.issueCategories.includes(newCategory.trim())) {
      setSettings(prev => ({
        ...prev,
        issueCategories: [...prev.issueCategories, newCategory.trim()]
      }));
      setNewCategory('');
    }
  };

  const removeCategory = (category) => {
    setSettings(prev => ({
      ...prev,
      issueCategories: prev.issueCategories.filter(cat => cat !== category)
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Admin Settings</h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Save size={16} />
          )}
          Save Settings
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issue Categories */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Issue Categories</h3>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Add new category"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && addCategory()}
              />
              <button
                onClick={addCategory}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {settings.issueCategories.map((category, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>{category}</span>
                  <button
                    onClick={() => removeCategory(category)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* General Settings */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">General Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity Scale (1 to X)
              </label>
              <select
                value={settings.severityScale}
                onChange={(e) => setSettings(prev => ({ ...prev, severityScale: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={3}>1-3 Scale</option>
                <option value={5}>1-5 Scale</option>
                <option value={10}>1-10 Scale</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto-Archive After (Days)
              </label>
              <input
                type="number"
                value={settings.autoArchiveDays}
                onChange={(e) => setSettings(prev => ({ ...prev, autoArchiveDays: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="365"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="publicReporting"
                checked={settings.publicReporting}
                onChange={(e) => setSettings(prev => ({ ...prev, publicReporting: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="publicReporting" className="ml-2 text-sm text-gray-700">
                Allow Public Reporting
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="emailNotifications"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="emailNotifications" className="ml-2 text-sm text-gray-700">
                Email Notifications
              </label>
            </div>
          </div>
        </div>

        {/* Escalation Settings */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Escalation Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escalation Threshold (Reports in Same Area)
              </label>
              <input
                type="number"
                value={settings.escalationThreshold}
                onChange={(e) => setSettings(prev => ({ ...prev, escalationThreshold: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="2"
                max="20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escalation Time Window (Hours)
              </label>
              <input
                type="number"
                value={settings.escalationTimeHours}
                onChange={(e) => setSettings(prev => ({ ...prev, escalationTimeHours: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="168"
              />
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Escalation Mode:</strong> When {settings.escalationThreshold} or more reports 
                appear in a 20m radius within {settings.escalationTimeHours} hours, 
                they will be flagged for urgent attention.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
