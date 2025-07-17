import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const AdminIssueMap = ({ 
  issues = [], 
  center = [28.6139, 77.2090], 
  zoom = 11, 
  onMarkerClick, 
  onMapClick,
  showHeatmap = false,
  showClusters = true,
  filters = {}
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const clusterGroupRef = useRef(null);
  const heatLayerRef = useRef(null);
  const [mapMode, setMapMode] = useState('markers');

  // Create custom icons for different categories and severities
  const createCustomIcon = (issue) => {
    const categoryColors = {
      'Pothole': '#FF6B6B',
      'Broken Streetlight': '#FFE066',
      'Garbage Dumping': '#4ECDC4',
      'Waterlogging': '#45B7D1',
      'Broken Road': '#96CEB4',
      'Traffic Signal Issue': '#FFEAA7',
      'Illegal Parking': '#DDA0DD',
      'Noise Pollution': '#98D8C8',
      'Water Leakage': '#6C5CE7',
      'Other': '#A0A0A0'
    };

    const severitySize = {
      1: 20,
      2: 25,
      3: 30,
      4: 35,
      5: 40
    };

    const color = categoryColors[issue.category] || categoryColors['Other'];
    const size = severitySize[issue.severity] || 25;

    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: ${size > 30 ? '14px' : '12px'};
        ">
          ${issue.severity}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2],
      popupAnchor: [0, -size/2]
    });
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    // Create map
    mapInstanceRef.current = L.map(mapRef.current).setView(center, zoom);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstanceRef.current);

    // Add click event listener
    if (onMapClick) {
      mapInstanceRef.current.on('click', (e) => {
        onMapClick(e.latlng);
      });
    }

    // Initialize marker cluster group
    if (window.L && window.L.markerClusterGroup) {
      clusterGroupRef.current = L.markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 60,
        iconCreateFunction: function(cluster) {
          const count = cluster.getChildCount();
          let c = ' marker-cluster-';
          if (count < 10) {
            c += 'small';
          } else if (count < 100) {
            c += 'medium';
          } else {
            c += 'large';
          }
          
          return new L.DivIcon({
            html: `<div><span>${count}</span></div>`,
            className: 'marker-cluster' + c,
            iconSize: new L.Point(40, 40)
          });
        }
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, [center, zoom, onMapClick]);

  // Update markers when issues change
  useEffect(() => {
    if (!mapInstanceRef.current || !issues.length) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    if (clusterGroupRef.current) {
      clusterGroupRef.current.clearLayers();
      mapInstanceRef.current.removeLayer(clusterGroupRef.current);
    }

    if (heatLayerRef.current) {
      mapInstanceRef.current.removeLayer(heatLayerRef.current);
    }

    // Filter issues based on current filters
    const filteredIssues = issues.filter(issue => {
      if (filters.category && filters.category !== 'all' && issue.category !== filters.category) return false;
      if (filters.status && filters.status !== 'all' && issue.status !== filters.status) return false;
      if (filters.severity && filters.severity !== 'all' && issue.severity.toString() !== filters.severity) return false;
      return true;
    });

    if (mapMode === 'heatmap' && window.L && window.L.heatLayer) {
      // Create heatmap
      const heatData = filteredIssues
        .filter(issue => issue.location?.lat && issue.location?.lng)
        .map(issue => [
          issue.location.lat,
          issue.location.lng,
          issue.severity / 5 // Normalize severity to 0-1 range
        ]);

      if (heatData.length > 0) {
        heatLayerRef.current = L.heatLayer(heatData, {
          radius: 25,
          blur: 15,
          maxZoom: 17,
          gradient: {
            0.0: 'blue',
            0.2: 'cyan',
            0.4: 'lime',
            0.6: 'yellow',
            0.8: 'orange',
            1.0: 'red'
          }
        }).addTo(mapInstanceRef.current);
      }
    } else {
      // Create markers
      const markers = filteredIssues
        .filter(issue => issue.location?.lat && issue.location?.lng)
        .map(issue => {
          const marker = L.marker(
            [issue.location.lat, issue.location.lng],
            { icon: createCustomIcon(issue) }
          );

          // Create popup content
          const popupContent = `
            <div class="issue-popup" style="min-width: 200px;">
              <div class="font-semibold text-lg mb-2">${issue.title}</div>
              <div class="text-sm text-gray-600 mb-2">${issue.description}</div>
              <div class="flex justify-between items-center text-xs mb-2">
                <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded">${issue.category}</span>
                <span class="bg-gray-100 text-gray-800 px-2 py-1 rounded">Severity ${issue.severity}</span>
              </div>
              <div class="flex justify-between items-center text-xs mb-2">
                <span class="text-gray-600">Status: ${issue.status}</span>
                <span class="text-gray-600">Upvotes: ${issue.upvotes || 0}</span>
              </div>
              ${issue.imageURL ? `<img src="${issue.imageURL}" alt="Issue" class="w-full h-24 object-cover rounded mt-2" />` : ''}
              <button 
                onclick="window.viewIssueDetails('${issue.id}')"
                class="w-full mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                View Details
              </button>
            </div>
          `;

          marker.bindPopup(popupContent);

          // Add click event
          marker.on('click', () => {
            if (onMarkerClick) {
              onMarkerClick(issue);
            }
          });

          return marker;
        });

      markersRef.current = markers;

      if (showClusters && clusterGroupRef.current) {
        // Add markers to cluster group
        clusterGroupRef.current.addLayers(markers);
        mapInstanceRef.current.addLayer(clusterGroupRef.current);
      } else {
        // Add markers individually
        markers.forEach(marker => {
          marker.addTo(mapInstanceRef.current);
        });
      }
    }

    // Fit map to show all markers
    if (filteredIssues.length > 0) {
      const group = new L.featureGroup(markersRef.current);
      if (group.getBounds().isValid()) {
        mapInstanceRef.current.fitBounds(group.getBounds(), { padding: [20, 20] });
      }
    }
  }, [issues, mapMode, showClusters, filters, onMarkerClick]);

  // Global function for popup buttons
  useEffect(() => {
    window.viewIssueDetails = (issueId) => {
      const issue = issues.find(i => i.id === issueId);
      if (issue && onMarkerClick) {
        onMarkerClick(issue);
      }
    };

    return () => {
      delete window.viewIssueDetails;
    };
  }, [issues, onMarkerClick]);

  return (
    <div className="relative w-full h-full">
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-2 space-y-2">
        <div className="flex flex-col space-y-1">
          <button
            onClick={() => setMapMode('markers')}
            className={`px-3 py-1 text-xs rounded ${
              mapMode === 'markers'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Markers
          </button>
          <button
            onClick={() => setMapMode('heatmap')}
            className={`px-3 py-1 text-xs rounded ${
              mapMode === 'heatmap'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Heatmap
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-3">
        <h4 className="text-sm font-semibold mb-2">Severity Levels</h4>
        <div className="space-y-1">
          {[1, 2, 3, 4, 5].map(level => (
            <div key={level} className="flex items-center space-x-2 text-xs">
              <div 
                className="w-4 h-4 rounded-full border-2 border-white shadow"
                style={{ 
                  backgroundColor: level <= 2 ? '#4ECDC4' : level <= 3 ? '#FFE066' : '#FF6B6B',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                {level}
              </div>
              <span className="text-gray-600">
                {level === 1 ? 'Low' : level === 2 ? 'Minor' : level === 3 ? 'Moderate' : level === 4 ? 'High' : 'Critical'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full rounded-lg" />

      {/* Custom Styles */}
      <style jsx>{`
        .marker-cluster-small {
          background-color: rgba(181, 226, 140, 0.6);
        }
        .marker-cluster-small div {
          background-color: rgba(110, 204, 57, 0.6);
        }
        .marker-cluster-medium {
          background-color: rgba(241, 211, 87, 0.6);
        }
        .marker-cluster-medium div {
          background-color: rgba(240, 194, 12, 0.6);
        }
        .marker-cluster-large {
          background-color: rgba(253, 156, 115, 0.6);
        }
        .marker-cluster-large div {
          background-color: rgba(241, 128, 23, 0.6);
        }
        .marker-cluster {
          background-clip: padding-box;
          border-radius: 20px;
        }
        .marker-cluster div {
          width: 30px;
          height: 30px;
          margin-left: 5px;
          margin-top: 5px;
          text-align: center;
          border-radius: 15px;
          font: 12px "Helvetica Neue", Arial, Helvetica, sans-serif;
        }
        .marker-cluster span {
          line-height: 30px;
          color: #fff;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default AdminIssueMap;
