import { useState, useEffect } from 'react';
import { 
  Phone, 
  History, 
  Settings, 
  AlertTriangle, 
  Ambulance, 
  FireExtinguisher, 
  Shield, 
  MapPin, 
  Timer,
  Bell
} from 'lucide-react';

// Helper components
const Card = ({ children, onClick, className }) => (
  <div 
    className={`bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ${className || ''}`}
    onClick={onClick}
  >
    {children}
  </div>
);

const EmergencyTypeButton = ({ icon: Icon, label, color, onClick, selected }) => (
  <button 
    className={`flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 w-full
      ${selected ? 'bg-opacity-20 ring-2 scale-105' : 'bg-opacity-10 hover:bg-opacity-15'}`}
    style={{ backgroundColor: selected ? color : undefined, ringColor: color }}
    onClick={onClick}
  >
    <Icon size={32} color={color} strokeWidth={2} />
    <span className="mt-2 font-medium text-gray-800">{label}</span>
  </button>
);

const RecentRequestCard = ({ request }) => {
  const statusColors = {
    'Waiting': 'bg-yellow-100 text-yellow-800',
    'Assigned': 'bg-blue-100 text-blue-800',
    'En Route': 'bg-purple-100 text-purple-800',
    'Resolved': 'bg-green-100 text-green-800'
  };

  const typeIcons = {
    'Ambulance': <Ambulance size={16} className="mr-1" />,
    'Fire': <FireExtinguisher size={16} className="mr-1" />,
    'Police': <Shield size={16} className="mr-1" />
  };

  return (
    <Card className="mb-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          {typeIcons[request.type]}
          <span className="font-medium">{request.type}</span>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[request.status]}`}>
          {request.status}
        </span>
      </div>
      <div className="mt-2 text-sm text-gray-600 flex items-center">
        <Timer size={14} className="mr-1" /> {request.time}
      </div>
      <div className="mt-2 text-sm text-gray-600 flex items-center">
        <MapPin size={14} className="mr-1" /> {request.location}
      </div>
      <div className="mt-3 flex justify-between">
        <button className="text-blue-600 text-sm font-medium flex items-center">
          View Details
        </button>
        {request.status !== 'Resolved' && (
          <button className="text-blue-600 text-sm font-medium flex items-center">
            Track
          </button>
        )}
      </div>
    </Card>
  );
};

// Main Component
export default function EmergencyHomePage() {
  const [selectedType, setSelectedType] = useState(null);
  const [userName, setUserName] = useState('Alex');
  const [recentRequests, setRecentRequests] = useState([
    {
      id: '1012',
      type: 'Ambulance',
      time: '12:40 PM Today',
      location: '123 Main St',
      status: 'En Route'
    },
    {
      id: '1011',
      type: 'Fire',
      time: '01:20 PM Yesterday',
      location: '456 Oak Ave',
      status: 'Resolved'
    },
    {
      id: '1010',
      type: 'Police',
      time: '09:15 AM May 16',
      location: '789 Pine Blvd',
      status: 'Assigned'
    }
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* App Header */}
      <header className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">EmergencyConnect</h1>
          <div className="flex items-center space-x-4">
            <Bell size={20} />
            <div className="h-8 w-8 bg-blue-400 rounded-full flex items-center justify-center">
              {userName.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        {/* Welcome Section */}
        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Hello, {userName}</h2>
          <p className="text-gray-600">How can we help you today?</p>
        </section>

        {/* Emergency Request Section */}
        <section className="mb-8">
          <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <AlertTriangle size={20} className="mr-2 text-red-500" />
              Request Emergency Services
            </h3>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              <EmergencyTypeButton 
                icon={Ambulance} 
                label="Ambulance" 
                color="#dc2626" 
                selected={selectedType === 'Ambulance'}
                onClick={() => setSelectedType('Ambulance')}
              />
              <EmergencyTypeButton 
                icon={FireExtinguisher} 
                label="Fire" 
                color="#ea580c"
                selected={selectedType === 'Fire'}
                onClick={() => setSelectedType('Fire')}
              />
              <EmergencyTypeButton 
                icon={Shield} 
                label="Police" 
                color="#2563eb"
                selected={selectedType === 'Police'}
                onClick={() => setSelectedType('Police')}
              />
            </div>

            <button 
              className={`w-full py-3 rounded-lg text-white font-medium flex items-center justify-center
                ${selectedType ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'}`}
              disabled={!selectedType}
            >
              <Phone size={18} className="mr-2" />
              Request {selectedType || 'Emergency Service'}
            </button>
          </div>
        </section>

        {/* Quick Access Section */}
        <section className="mb-8 grid grid-cols-2 gap-4">
          <Card className="flex items-center">
            <History size={24} className="mr-3 text-blue-500" />
            <div>
              <h3 className="font-medium">Request History</h3>
              <p className="text-sm text-gray-600">View your past requests</p>
            </div>
          </Card>
          <Card className="flex items-center">
            <Settings size={24} className="mr-3 text-blue-500" />
            <div>
              <h3 className="font-medium">Settings</h3>
              <p className="text-sm text-gray-600">Update your profile</p>
            </div>
          </Card>
        </section>

        {/* Recent Requests Section */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Recent Requests</h3>
          <div>
            {recentRequests.map((request) => (
              <RecentRequestCard key={request.id} request={request} />
            ))}
          </div>
          <button className="text-blue-600 font-medium flex items-center mt-2">
            View all history
          </button>
        </section>
      </main>

      {/* Navigation Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2">
        <div className="flex justify-around">
          <button className="flex flex-col items-center p-2 text-blue-600">
            <AlertTriangle size={20} />
            <span className="text-xs mt-1">Emergency</span>
          </button>
          <button className="flex flex-col items-center p-2 text-gray-600">
            <History size={20} />
            <span className="text-xs mt-1">History</span>
          </button>
          <button className="flex flex-col items-center p-2 text-gray-600">
            <MapPin size={20} />
            <span className="text-xs mt-1">Track</span>
          </button>
          <button className="flex flex-col items-center p-2 text-gray-600">
            <Settings size={20} />
            <span className="text-xs mt-1">Settings</span>
          </button>
        </div>
      </footer>
    </div>
  );
}