import { useState, useEffect } from "react";
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
  Bell,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// --- Enhanced Helper Components ---

// Enhanced Card with glassmorphism and hover effects
const Card = ({ children, onClick, className }) => (
  <div
    className={`bg-white/5 backdrop-blur-lg p-5 rounded-2xl shadow-lg border border-white/10 
      hover:border-white/20 hover:shadow-cyan-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer ${
        className || ""
      }`}
    onClick={onClick}
  >
    {children}
  </div>
);

// Enhanced Emergency Button with glow effect for selection
const EmergencyTypeButton = ({
  icon: Icon,
  label,
  color,
  onClick,
  selected,
}) => (
  <button
    className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 w-full relative group
      ${
        selected
          ? "scale-105"
          : "bg-white/5 border border-white/10 hover:bg-white/15"
      }`}
    style={{
      boxShadow: selected
        ? `0 0 15px -2px ${color}, 0 0 30px -10px ${color}`
        : "none",
      backgroundColor: selected ? `${color}20` : undefined, // 20 is hex for ~12% opacity
      border: selected ? `1px solid ${color}` : undefined,
    }}
    onClick={onClick}
    aria-label={`Request ${label} emergency service`}
    role="button"
  >
    <Icon
      size={36}
      color={color}
      strokeWidth={2.5}
      className="drop-shadow-lg"
    />
    <span className="mt-2 font-semibold text-gray-100">{label}</span>
  </button>
);

// Enhanced Recent Request Card for the dark theme
const RecentRequestCard = ({ request }) => {
  const statusStyles = {
    Waiting: "border-yellow-400 text-yellow-400 bg-yellow-400/10",
    Assigned: "border-blue-400 text-blue-400 bg-blue-400/10",
    "En Route": "border-purple-400 text-purple-400 bg-purple-400/10",
    Resolved: "border-green-400 text-green-400 bg-green-400/10",
  };

  const typeIcons = {
    Ambulance: <Ambulance size={20} className="mr-2 text-red-400" />,
    Fire: <FireExtinguisher size={20} className="mr-2 text-orange-400" />,
    Police: <Shield size={20} className="mr-2 text-blue-400" />,
  };

  return (
    <div className="bg-gray-800/50 p-4 rounded-xl mb-3 border border-gray-700 hover:border-gray-600 transition-colors duration-200">
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          {typeIcons[request.type]}
          <span className="font-semibold text-lg text-gray-100">
            {request.type}
          </span>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold border ${
            statusStyles[request.status]
          }`}
        >
          {request.status}
        </span>
      </div>
      <div className="mt-3 text-sm text-gray-400 flex items-center">
        <Timer size={14} className="mr-2" /> {request.time}
      </div>
      <div className="mt-2 text-sm text-gray-400 flex items-center">
        <MapPin size={14} className="mr-2" /> {request.location}
      </div>
      <div className="mt-4 pt-3 border-t border-gray-700 flex justify-end space-x-4">
        <button
          className="text-cyan-400 text-sm font-medium hover:text-cyan-300 transition-colors"
          onClick={() => console.log(`View details for request ${request.id}`)}
        >
          View Details
        </button>
        {request.status !== "Resolved" && (
          <button
            className="bg-cyan-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-cyan-400 transition-colors flex items-center"
            onClick={() => console.log(`Track request ${request.id}`)}
          >
            Track
          </button>
        )}
      </div>
    </div>
  );
};

// --- Main Enhanced Component ---
export default function EmergencyHomePage() {
  const [selectedType, setSelectedType] = useState(null);
  const [userName, setUserName] = useState("Alex");
  const [recentRequests, setRecentRequests] = useState([]);
  const navigation = useNavigate();
  useEffect(() => {
    // Logic remains the same
    const fetchData = async () => {
      try {
        const userResponse = { name: "Alex" };
        const requestsResponse = [
          {
            id: "1012",
            type: "Ambulance",
            time: "12:40 PM Today",
            location: "123 Main St",
            status: "En Route",
          },
          {
            id: "1011",
            type: "Fire",
            time: "01:20 PM Yesterday",
            location: "456 Oak Ave",
            status: "Resolved",
          },
          {
            id: "1010",
            type: "Police",
            time: "09:15 AM May 16",
            location: "789 Pine Blvd",
            status: "Assigned",
          },
        ];
        setUserName(userResponse.name);
        setRecentRequests(requestsResponse);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white font-sans overflow-x-hidden">
      {/* App Header */}
      <header className="sticky top-0 z-50 bg-gray-900/50 backdrop-blur-lg p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            EmergencyConnect
          </h1>
          <div className="flex items-center space-x-4">
            <Bell
              size={22}
              className="text-gray-400 hover:text-white transition-colors"
            />
            <div className="h-9 w-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center font-bold text-lg ring-2 ring-white/20">
              {userName.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with adjusted padding for the floating footer */}
      <main className="container mx-auto p-4 pb-32">
        {/* Welcome Section */}
        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-1">Hello, {userName}</h2>
          <p className="text-gray-400">Ready to assist. Stay safe.</p>
        </section>

        {/* Emergency Request Section */}
        <section className="mb-10">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/10">
            <h3 className="text-xl font-semibold mb-5 flex items-center text-gray-100">
              <AlertTriangle
                size={22}
                className="mr-3 text-red-500 drop-shadow-lg"
              />
              Request Immediate Assistance
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <EmergencyTypeButton
                icon={Ambulance}
                label="Ambulance"
                color="#f87171" // Tailwind red-400
                selected={selectedType === "Ambulance"}
                onClick={() => {
                  setSelectedType("Ambulance");
                  navigation("/mapping");
                }}
              />
              <EmergencyTypeButton
                icon={FireExtinguisher}
                label="Fire"
                color="#fb923c" // Tailwind orange-400
                selected={selectedType === "Fire"}
                onClick={() => setSelectedType("Fire")}
              />
              <EmergencyTypeButton
                icon={Shield}
                label="Police"
                color="#60a5fa" // Tailwind blue-400
                selected={selectedType === "Police"}
                onClick={() => setSelectedType("Police")}
              />
            </div>

            <button
              className={`w-full py-4 rounded-xl text-white text-lg font-bold flex items-center justify-center transition-all duration-300
                ${
                  selectedType
                    ? "bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 shadow-lg shadow-red-500/30 animate-pulse"
                    : "bg-gray-700/50 text-gray-400 cursor-not-allowed"
                }`}
              disabled={!selectedType}
            >
              <Phone size={20} className="mr-3" />
              Confirm & Request {selectedType || "Service"}
            </button>
          </div>
        </section>

        {/* Quick Access Section */}
        <section className="mb-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="flex justify-between items-center">
            <div className="flex items-center">
              <History size={28} className="mr-4 text-cyan-400" />
              <div>
                <h3 className="font-semibold text-lg text-gray-100">
                  Request History
                </h3>
                <p className="text-sm text-gray-400">View past requests</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-500" />
          </Card>
          <Card className="flex justify-between items-center">
            <div className="flex items-center">
              <Settings size={28} className="mr-4 text-cyan-400" />
              <div>
                <h3 className="font-semibold text-lg text-gray-100">
                  Settings
                </h3>
                <p className="text-sm text-gray-400">Manage your profile</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-500" />
          </Card>
        </section>

        {/* Recent Requests Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-100">
              Recent Activity
            </h3>
            <button
              className="text-cyan-400 font-medium text-sm hover:text-cyan-300 transition-colors"
              onClick={() => console.log("View all history")}
            >
              View All
            </button>
          </div>
          <div>
            {recentRequests.map((request) => (
              <RecentRequestCard key={request.id} request={request} />
            ))}
          </div>
        </section>
      </main>

      {/* Floating Navigation Footer */}
      <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-md mx-auto bg-gray-900/60 backdrop-blur-lg border border-white/10 rounded-full p-2 shadow-2xl z-50">
        <div className="flex justify-around items-center">
          {[
            { label: "Emergency", icon: AlertTriangle, active: true },
            { label: "History", icon: History, active: false },
            { label: "Track", icon: MapPin, active: false },
            { label: "Settings", icon: Settings, active: false },
          ].map(({ label, icon: Icon, active }) => (
            <button
              key={label}
              className={`flex flex-col items-center justify-center p-2 h-14 w-16 rounded-full transition-all duration-300
                ${
                  active
                    ? "text-cyan-400 bg-cyan-500/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              aria-label={label}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className="text-xs mt-1 font-medium">{label}</span>
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}
