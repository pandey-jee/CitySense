// Map Modal component to show issue location
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const IssueMapModal = ({ issue, isOpen, onClose }) => {
  if (!isOpen || !issue) return null;

  const position = [issue.latitude || 0, issue.longitude || 0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{issue.title}</h2>
            <p className="text-gray-600 mt-1">{issue.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Issue Details */}
        <div className="p-6 border-b">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {issue.category}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(issue.status)}`}>
              {issue.status}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm ${getSeverityColor(issue.severity)}`}>
              Severity {issue.severity}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Location Details</h3>
              <p className="text-sm text-gray-600">
                📍 Coordinates: {position[0].toFixed(6)}, {position[1].toFixed(6)}
              </p>
              <p className="text-sm text-gray-600">
                📝 Reported by: {issue.userName || 'Anonymous'}
              </p>
              <p className="text-sm text-gray-600">
                📅 Date: {new Date(issue.createdAt).toLocaleDateString()}
              </p>
            </div>

            {issue.imageURL && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Issue Photo</h3>
                <img
                  src={issue.imageURL}
                  alt="Issue"
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="h-96">
          <MapContainer
            center={position}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={position}>
              <Popup>
                <div className="text-center">
                  <strong>{issue.title}</strong>
                  <br />
                  <span className="text-sm text-gray-600">{issue.category}</span>
                  <br />
                  <span className="text-xs text-gray-500">
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const getStatusColor = (status) => {
  switch (status) {
    case 'Open': return 'bg-red-100 text-red-800';
    case 'In Progress': return 'bg-yellow-100 text-yellow-800';
    case 'Resolved': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getSeverityColor = (severity) => {
  switch (severity) {
    case 1: return 'bg-blue-100 text-blue-800';
    case 2: return 'bg-yellow-100 text-yellow-800';
    case 3: return 'bg-orange-100 text-orange-800';
    case 4: return 'bg-red-100 text-red-800';
    case 5: return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default IssueMapModal;
