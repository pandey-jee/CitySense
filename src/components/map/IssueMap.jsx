import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const IssueMap = ({ issues = [], center = [28.6139, 77.2090], zoom = 11, onMarkerClick, onMapClick }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    mapInstanceRef.current = L.map(mapRef.current).setView(center, zoom);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstanceRef.current);

    // Add click event listener
    if (onMapClick) {
      mapInstanceRef.current.on('click', (e) => {
        onMapClick(e.latlng);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, [center, zoom, onMapClick]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Add new markers
    issues.forEach(issue => {
      if (issue.location && issue.location.lat && issue.location.lng) {
        const marker = L.marker([issue.location.lat, issue.location.lng]);
        
        // Create popup content
        const popupContent = `
          <div class="p-2 min-w-[200px]">
            <h3 class="font-bold text-lg mb-2">${issue.title}</h3>
            <p class="text-sm text-gray-600 mb-2">${issue.description}</p>
            <div class="flex items-center justify-between text-xs">
              <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded">${issue.category}</span>
              <span class="px-2 py-1 bg-gray-100 text-gray-800 rounded">Severity: ${issue.severity}</span>
            </div>
            <div class="flex items-center justify-between text-xs mt-2">
              <span class="px-2 py-1 ${getStatusColor(issue.status)} rounded">${issue.status}</span>
              <span class="text-gray-500">👍 ${issue.upvotes || 0}</span>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        
        // Add click event
        if (onMarkerClick) {
          marker.on('click', () => {
            onMarkerClick(issue);
          });
        }

        marker.addTo(mapInstanceRef.current);
        markersRef.current.push(marker);
      }
    });
  }, [issues, onMarkerClick]);

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

  return (
    <div 
      ref={mapRef} 
      className="w-full h-96 rounded-lg border border-gray-300 shadow-md"
      style={{ minHeight: '400px' }}
    />
  );
};

export default IssueMap;
