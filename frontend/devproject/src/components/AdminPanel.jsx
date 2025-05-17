import { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Bell, 
  Calendar, 
  Clock, 
  User, 
  Menu, 
  MapPin, 
  Ambulance, 
  Phone,
  Search,
  Flame,
  Shield,
  ChevronDown,
  Check,
  X,
  RefreshCw
} from 'lucide-react';
import "./AdminPanel.css"

// Mock data for emergency requests
const mockEmergencies = [
  {
    id: 'ER-2025-001',
    type: 'Medical',
    status: 'Active',
    requestTime: '2025-05-17T08:23:45',
    location: {
      address: '123 Main St, Downtown',
      lat: 37.7749,
      lng: -122.4194
    },
    requester: {
      name: 'John Smith',
      phone: '555-123-4567'
    },
    responders: [
      { id: 'AMB-104', name: 'Ambulance 104', eta: '4 mins' }
    ],
    priority: 'High'
  },
  {
    id: 'ER-2025-002',
    type: 'Fire',
    status: 'Dispatched',
    requestTime: '2025-05-17T08:15:22',
    location: {
      address: '456 Park Ave, Westside',
      lat: 37.7833,
      lng: -122.4167
    },
    requester: {
      name: 'Maria Garcia',
      phone: '555-987-6543'
    },
    responders: [
      { id: 'FR-23', name: 'Fire Response 23', eta: '2 mins' }
    ],
    priority: 'Critical'
  },
  {
    id: 'ER-2025-003',
    type: 'Security',
    status: 'Pending',
    requestTime: '2025-05-17T08:30:10',
    location: {
      address: '789 Broadway, Eastside',
      lat: 37.7833,
      lng: -122.4294
    },
    requester: {
      name: 'Alex Johnson',
      phone: '555-456-7890'
    },
    responders: [],
    priority: 'Medium'
  },
  {
    id: 'ER-2025-004',
    type: 'Medical',
    status: 'Completed',
    requestTime: '2025-05-17T07:45:30',
    location: {
      address: '101 River Rd, Southside',
      lat: 37.7463,
      lng: -122.4194
    },
    requester: {
      name: 'Sarah Williams',
      phone: '555-222-3333'
    },
    responders: [
      { id: 'AMB-109', name: 'Ambulance 109', eta: 'Arrived' }
    ],
    priority: 'Medium'
  }
];

// Emergency status badges with appropriate colors
const StatusBadge = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'Active':
        return 'bg-red-100 text-red-800';
      case 'Dispatched':
        return 'bg-orange-100 text-orange-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor()}`}>
      {status}
    </span>
  );
};

// Priority indicator component
const PriorityIndicator = ({ priority }) => {
  const getPriorityColor = () => {
    switch (priority) {
      case 'Critical':
        return 'text-red-600';
      case 'High': 
        return 'text-orange-500';
      case 'Medium':
        return 'text-yellow-500';
      case 'Low':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className={`flex items-center ${getPriorityColor()}`}>
      <AlertCircle size={14} className="mr-1" />
      <span className="text-sm font-medium">{priority}</span>
    </div>
  );
};

// Get icon based on emergency type
const EmergencyTypeIcon = ({ type }) => {
  switch (type) {
    case 'Medical':
      return <Ambulance size={18} className="text-red-500" />;
    case 'Fire':
      return <Flame size={18} className="text-orange-500" />;
    case 'Security':
      return <Shield size={18} className="text-blue-500" />;
    default:
      return <AlertCircle size={18} className="text-gray-500" />;
  }
};

// Format date to readable format
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export default function EmergencyResponseAdminPanel() {
  const [emergencies, setEmergencies] = useState(mockEmergencies);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {

    setEmergencies(mockEmergencies);
    
    // Set first emergency as selected by default
    if (mockEmergencies.length > 0 && !selectedEmergency) {
      setSelectedEmergency(mockEmergencies[0]);
    }
  }, []);

  // Filter emergencies based on active tab and search query
  const filteredEmergencies = emergencies.filter(emergency => {
    const matchesTab = activeTab === 'all' || emergency.status.toLowerCase() === activeTab.toLowerCase();
    const matchesSearch = emergency.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         emergency.requester.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         emergency.location.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Handle emergency selection
  const handleSelectEmergency = (emergency) => {
    setSelectedEmergency(emergency);
  };

  // Map component placeholder (in a real app, this would be an actual map integration)
  const MapPlaceholder = () => (
    <div className="bg-gray-100 rounded-lg flex items-center justify-center p-4 h-64">
      <div className="text-center">
        <MapPin size={32} className="mx-auto mb-2 text-gray-400" />
        <p className="text-gray-500 text-sm">Interactive map would be displayed here</p>
        <p className="text-gray-400 text-xs mt-1">Integration with Google Maps or Mapbox</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`bg-indigo-800 text-white ${isSidebarOpen ? 'w-64' : 'w-20'} flex flex-col transition-all duration-300`}>
        <div className="p-4 flex items-center justify-between">
          {isSidebarOpen ? (
            <h1 className="font-bold text-xl">Emergency Response</h1>
          ) : (
            <span className="mx-auto">
              <AlertCircle size={24} />
            </span>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 rounded-full hover:bg-indigo-700 focus:outline-none"
          >
            <Menu size={20} />
          </button>
        </div>
        
        <nav className="mt-6 flex-1">
          <div className={`px-4 py-2 ${activeTab === 'all' ? 'bg-indigo-900' : ''}`}>
            <button 
              onClick={() => setActiveTab('all')} 
              className="flex items-center w-full"
            >
              {isSidebarOpen ? (
                <>
                  <AlertCircle size={20} className="mr-3" />
                  <span>All Emergencies</span>
                </>
              ) : (
                <AlertCircle size={20} className="mx-auto" />
              )}
            </button>
          </div>
          <div className={`px-4 py-2 ${activeTab === 'active' ? 'bg-indigo-900' : ''}`}>
            <button 
              onClick={() => setActiveTab('active')} 
              className="flex items-center w-full"
            >
              {isSidebarOpen ? (
                <>
                  <AlertCircle size={20} className="mr-3 text-red-400" />
                  <span>Active</span>
                </>
              ) : (
                <AlertCircle size={20} className="mx-auto text-red-400" />
              )}
            </button>
          </div>
          <div className={`px-4 py-2 ${activeTab === 'dispatched' ? 'bg-indigo-900' : ''}`}>
            <button 
              onClick={() => setActiveTab('dispatched')} 
              className="flex items-center w-full"
            >
              {isSidebarOpen ? (
                <>
                  <Ambulance size={20} className="mr-3 text-orange-400" />
                  <span>Dispatched</span>
                </>
              ) : (
                <Ambulance size={20} className="mx-auto text-orange-400" />
              )}
            </button>
          </div>
          <div className={`px-4 py-2 ${activeTab === 'pending' ? 'bg-indigo-900' : ''}`}>
            <button 
              onClick={() => setActiveTab('pending')} 
              className="flex items-center w-full"
            >
              {isSidebarOpen ? (
                <>
                  <Clock size={20} className="mr-3 text-yellow-400" />
                  <span>Pending</span>
                </>
              ) : (
                <Clock size={20} className="mx-auto text-yellow-400" />
              )}
            </button>
          </div>
          <div className={`px-4 py-2 ${activeTab === 'completed' ? 'bg-indigo-900' : ''}`}>
            <button 
              onClick={() => setActiveTab('completed')} 
              className="flex items-center w-full"
            >
              {isSidebarOpen ? (
                <>
                  <Check size={20} className="mr-3 text-green-400" />
                  <span>Completed</span>
                </>
              ) : (
                <Check size={20} className="mx-auto text-green-400" />
              )}
            </button>
          </div>
        </nav>
        
        <div className="p-4 mt-auto">
          {isSidebarOpen ? (
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                <User size={16} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">Admin User</p>
                <p className="text-xs text-indigo-300">Online</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto rounded-full bg-indigo-600 flex items-center justify-center">
              <User size={16} />
            </div>
          )}
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation */}
        <header className="bg-white shadow-sm z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <h2 className="text-xl font-semibold text-gray-800">Emergency Dashboard</h2>
              <div className="ml-6 text-sm text-gray-600">
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full text-gray-600 hover:bg-gray-100 relative">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="px-3 py-1 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
                New Response
              </button>
            </div>
          </div>
          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 flex">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by ID, name, or location..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            </div>
            <div className="ml-4 flex items-center">
              <span className="text-sm text-gray-500 mr-2">Filter by:</span>
              <select className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option>All Types</option>
                <option>Medical</option>
                <option>Fire</option>
                <option>Security</option>
              </select>
            </div>
            <div className="ml-4 flex items-center">
              <span className="text-sm text-gray-500 mr-2">Sort by:</span>
              <select className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option>Newest First</option>
                <option>Priority (High-Low)</option>
                <option>Status</option>
              </select>
            </div>
          </div>
        </header>
        
        {/* Content area */}
        <main className="flex-1 overflow-auto p-4">
          <div className="flex h-full space-x-4">
            {/* Emergency list */}
            <div className="w-2/5 overflow-auto bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-700">Emergency Requests</h3>
                <div className="text-sm text-gray-500 mt-1">
                  {filteredEmergencies.length} requests found
                </div>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(100% - 72px)' }}>
                {filteredEmergencies.map(emergency => (
                  <div
                    key={emergency.id}
                    onClick={() => handleSelectEmergency(emergency)}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${selectedEmergency?.id === emergency.id ? 'bg-indigo-50' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <EmergencyTypeIcon type={emergency.type} />
                        <span className="ml-2 font-medium text-gray-800">{emergency.type}</span>
                      </div>
                      <StatusBadge status={emergency.status} />
                    </div>
                    
                    <div className="mt-2">
                      <div className="text-sm text-gray-800 font-medium">{emergency.id}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        <div className="flex items-center">
                          <MapPin size={14} className="mr-1 text-gray-400" />
                          {emergency.location.address}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-2 flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        <Clock size={12} className="inline mr-1" />
                        {formatDate(emergency.requestTime)}
                      </div>
                      <PriorityIndicator priority={emergency.priority} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Emergency details */}
            <div className="w-3/5 bg-white rounded-lg shadow overflow-auto">
              {selectedEmergency ? (
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-800 flex items-center">
                        <EmergencyTypeIcon type={selectedEmergency.type} />
                        <span className="ml-2">{selectedEmergency.type} Emergency - {selectedEmergency.id}</span>
                      </h3>
                      <div className="text-sm text-gray-500 mt-1">
                        <Clock size={12} className="inline mr-1" />
                        Reported {formatDate(selectedEmergency.requestTime)}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <StatusBadge status={selectedEmergency.status} />
                      <button className="p-1 rounded-full hover:bg-gray-100">
                        <RefreshCw size={16} className="text-gray-500" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4 grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Requester Information</h4>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="flex items-center mb-2">
                          <User size={16} className="text-gray-500 mr-2" />
                          <span className="text-sm text-gray-800">{selectedEmergency.requester.name}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone size={16} className="text-gray-500 mr-2" />
                          <span className="text-sm text-gray-800">{selectedEmergency.requester.phone}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Priority</h4>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="text-sm text-gray-800">
                          <PriorityIndicator priority={selectedEmergency.priority} />
                        </div>
                        <div className="mt-2 text-sm">
                          <button className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs hover:bg-indigo-200">
                            Change Priority
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Location</h4>
                    <div className="mb-2 text-sm text-gray-800 flex items-center">
                      <MapPin size={16} className="text-gray-500 mr-2" />
                      {selectedEmergency.location.address}
                    </div>
                    <MapPlaceholder />
                  </div>
                  
                  <div className="p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Assigned Responders</h4>
                    {selectedEmergency.responders.length > 0 ? (
                      <div className="bg-gray-50 rounded-md">
                        {selectedEmergency.responders.map((responder, index) => (
                          <div key={responder.id} className="p-3 flex justify-between items-center border-b border-gray-100 last:border-b-0">
                            <div>
                              <div className="text-sm font-medium text-gray-800">{responder.id}: {responder.name}</div>
                              <div className="text-xs text-gray-500">ETA: {responder.eta}</div>
                            </div>
                            <div>
                              <button className="px-2 py-1 bg-gray-200 text-gray-700 rounded-md text-xs hover:bg-gray-300">
                                Contact
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md text-sm">
                        No responders assigned yet
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-auto p-4 border-t border-gray-200">
                    <div className="flex justify-between">
                      <div>
                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 mr-2">
                          Assign Responder
                        </button>
                        <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50">
                          Update Status
                        </button>
                      </div>
                      {selectedEmergency.status !== 'Completed' && (
                        <button className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700">
                          Mark as Completed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Select an emergency to view details
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}