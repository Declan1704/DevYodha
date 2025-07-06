import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";
import "./mapcomponent.css"; // Your custom CSS
import {
  AlertTriangle,
  MapPin,
  Clock,
  Navigation,
  Activity,
  Shield,
  Truck,
  Loader,
  AlertCircle,
  Target,
  Home,
} from "lucide-react";

// --- ICON DEFINITIONS ---
const AvailableAmbulanceIcon = L.icon({
  iconUrl: "https://img.icons8.com/plasticine/100/ambulance.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});
const UserLocationIcon = L.icon({
  iconUrl: "https://img.icons8.com/office/80/marker.png",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  className: "user-location-marker",
});
const AssignedAmbulanceIcon = L.icon({
  iconUrl: "https://img.icons8.com/pulsar-color/96/ambulance.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  className: "assigned-ambulance-pulse",
});
const UnavailableAmbulanceIcon = L.icon({
  iconUrl: "https://img.icons8.com/officel/80/ambulance.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  className: "pulse",
});
const MyRequestIcon = L.icon({
  iconUrl: "https://img.icons8.com/fluency/96/error.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  className: "my-request-pulse",
});
const GeneralRequestIcon = L.icon({
  iconUrl: "https://img.icons8.com/ios/100/box-important--v1.png",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});
const HospitalIcon = L.icon({
  iconUrl:
    "https://img.icons8.com/external-flatart-icons-flat-flatarticons/128/external-hospital-health-and-medical-flatart-icons-flat-flatarticons.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});
L.Marker.prototype.options.icon = AvailableAmbulanceIcon;

const MapComponent = () => {
  const [ambulances, setAmbulances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [mapReady, setMapReady] = useState(false); // New state for map instance readiness
  const [locationPermission, setLocationPermission] = useState("prompt");
  const mapRef = useRef(null);
  const routingControlRef = useRef(null);
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);
  const wsRef = useRef(null);
  const [wsStatus, setWsStatus] = useState("connecting");
  const watchIdRef = useRef(null);
  const token = localStorage.getItem("token");
  const defaultFallbackLocation = useMemo(() => [15.8629888, 74.514432], []);

  // 1. Get user's current location
  useEffect(() => {
    setLocationLoading(true);
    const getCurrentLocation = () => {
      if (!navigator.geolocation) {
        setLocationError("Geolocation is not supported.");
        setUserLocation(defaultFallbackLocation);
        setLocationLoading(false);
        return;
      }
      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      };
      const onSuccess = (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setLocationError(null);
        setLocationLoading(false);
        // setView will be handled by mapReady & userLocation effect
      };
      const onError = (error) => {
        console.error("Geolocation error:", error.code, error.message);
        let msg = `Geolocation error: ${error.message}. Using fallback.`;
        if (error.code === error.PERMISSION_DENIED)
          msg = "Location access denied. Using fallback.";
        setLocationError(msg);
        setUserLocation(defaultFallbackLocation);
        setLocationLoading(false);
      };
      navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
      if (navigator.geolocation.watchPosition) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          onSuccess,
          onError,
          options
        );
      }
    };
    getCurrentLocation();
    return () => {
      if (watchIdRef.current)
        navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [defaultFallbackLocation]);

  // Effect to center map when userLocation changes and map is ready
  useEffect(() => {
    if (mapReady && userLocation && mapRef.current) {
      // console.log("Setting map view to userLocation:", userLocation);
      mapRef.current.setView(userLocation, 14);
    }
  }, [userLocation, mapReady]);

  // Request location permission explicitly
  useEffect(() => {
    // ... (no changes from previous version)
    const requestLocPermission = async () => {
      if ("permissions" in navigator) {
        try {
          const permission = await navigator.permissions.query({
            name: "geolocation",
          });
          setLocationPermission(permission.state);
          permission.onchange = () => {
            setLocationPermission(permission.state); /* ... */
          };
        } catch (error) {
          console.error("Permission query error:", error.message);
        }
      }
    };
    requestLocPermission();
  }, []);

  const myActiveRequest = useMemo(() => {
    if (!userLocation || !requests || requests.length === 0) return null;
    const threshold = 0.0007;
    const activeReq = requests.find(
      (req) =>
        req.status !== "Completed" &&
        req.status !== "Cancelled" &&
        Math.abs(req.latitude - userLocation[0]) < threshold &&
        Math.abs(req.longitude - userLocation[1]) < threshold
    );
    // if(activeReq) console.log("myActiveRequest updated:", activeReq);
    return activeReq;
  }, [requests, userLocation]);

  const updateRoute = useCallback(
    (ambulanceId, ambLat, ambLon) => {
      const requestForRoute = myActiveRequest;
      if (
        !mapRef.current ||
        !requestForRoute ||
        requestForRoute.ambulanceId !== ambulanceId ||
        requestForRoute.status !== "Dispatched"
      ) {
        if (routingControlRef.current) {
          try {
            mapRef.current.removeControl(routingControlRef.current);
          } catch (e) {
            /* empty */
          }
          routingControlRef.current = null;
        }
        setDistance(null);
        setEta(null);
        return;
      }
      if (routingControlRef.current) {
        try {
          mapRef.current.removeControl(routingControlRef.current);
        } catch (e) {
          /* empty */
        }
      }
      routingControlRef.current = L.Routing.control({
        waypoints: [
          L.latLng(ambLat, ambLon),
          L.latLng(requestForRoute.latitude, requestForRoute.longitude),
        ],
        router: L.Routing.osrmv1({
          serviceUrl: "https://router.project-osrm.org/route/v1",
        }),
        lineOptions: {
          styles: [{ color: "#ef4444", weight: 6, opacity: 0.9 }],
        },
        show: false,
        addWaypoints: false,
        fitSelectedRoutes: false,
      }).addTo(mapRef.current);
      routingControlRef.current.on("routesfound", (e) => {
        /* ... */
        const route = e.routes[0];
        if (route?.summary) {
          const distKm = route.summary.totalDistance / 1000;
          setDistance(distKm);
          const avgSpeed = 40;
          setEta((distKm / avgSpeed) * 60);
        } else {
          setDistance(null);
          setEta(null);
        }
      });
      routingControlRef.current.on("routingerror", (e) => {
        /* ... */ console.error("Routing error:", e.error);
        setDistance(null);
        setEta(null);
      });
    },
    [myActiveRequest] // myActiveRequest is the key dependency
  );

  useEffect(() => {
    if (!token) {
      setInitialDataLoaded(true);
      return;
    }
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const fetchAllData = async () => {
      setInitialDataLoaded(false); // Reset for re-fetches if userLocation changes significantly
      try {
        let hospitalApiUrl = "http://localhost:34869/api/hospitals";
        // Only add lat/lon if userLocation is truly available and not the fallback initially,
        // or if the fallback is considered a valid "current" view.
        if (
          userLocation &&
          (userLocation[0] !== defaultFallbackLocation[0] ||
            userLocation[1] !== defaultFallbackLocation[1])
        ) {
          hospitalApiUrl += `?lat=${userLocation[0]}&lon=${userLocation[1]}&radius=15`;
        } else {
          // console.log("Fetching all hospitals or default set as userLocation is fallback or null");
        }

        const [ambulanceRes, requestRes, hospitalRes] = await Promise.all([
          fetch("http://localhost:34869/api/requests/ambulances", { headers }),
          fetch("http://localhost:34869/api/requests", { headers }),
          fetch(hospitalApiUrl, { headers }),
        ]);
        const ambulanceData = ambulanceRes.ok ? await ambulanceRes.json() : [];
        const requestData = requestRes.ok ? await requestRes.json() : [];
        const hospitalData = hospitalRes.ok ? await hospitalRes.json() : [];
        setAmbulances(ambulanceData);
        setRequests(requestData);
        setHospitals(hospitalData);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setLocationError("Failed to load map data.");
      } finally {
        setInitialDataLoaded(true);
      }
    };
    // Trigger fetch if location is resolved (not loading OR a location is set)
    if (!locationLoading || userLocation) {
      fetchAllData();
    }
  }, [token, userLocation, locationLoading, defaultFallbackLocation]);

  useEffect(() => {
    if (!token) return;
    let reconnectAttempts = 0;
    const maxAttempts = 10;
    const reconnectDelay = 3000;
    const connectWebSocket = () => {
      if (
        wsRef.current &&
        (wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING)
      )
        return;
      const wsUrl =
        (window.location.protocol === "https:" ? "wss://" : "ws://") +
        window.location.host.replace(/:\d+$/, "") +
        (window.location.host.includes("localhost") ? ":34869" : "") +
        "/ws";
      wsRef.current = new WebSocket(wsUrl);
      setWsStatus("connecting");
      wsRef.current.onopen = () => {
        setWsStatus("connected");
        reconnectAttempts = 0;
      };
      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.event === "update" && message.data) {
            const update = message.data;
            if (update.event === "ambulanceLocation") {
              setAmbulances((prevAmbs) =>
                prevAmbs.map((amb) =>
                  amb.id === update.data.id ? { ...amb, ...update.data } : amb
                )
              );
              // Use the `myActiveRequest` from the component's current state (closure)
              // The WebSocket effect's dependencies will ensure this closure is updated when `myActiveRequest` changes.
              if (
                myActiveRequest &&
                myActiveRequest.ambulanceId === update.data.id &&
                myActiveRequest.status === "Dispatched"
              ) {
                updateRoute(
                  update.data.id,
                  update.data.latitude,
                  update.data.longitude
                );
              }
            } else if (update.event === "requestStatus") {
              setRequests((prevReqs) =>
                prevReqs.map((req) =>
                  req.id === update.data.id ? { ...req, ...update.data } : req
                )
              );
            } else if (update.event === "newRequest") {
              setRequests((prevReqs) => {
                if (prevReqs.some((r) => r.id === update.data.id))
                  return prevReqs;
                return [...prevReqs, update.data];
              });
            }
          }
        } catch (error) {
          console.error(
            "WS message parse error:",
            error.message,
            "Data:",
            event.data
          );
        }
      };
      wsRef.current.onclose = (event) => {
        /* ... */ setWsStatus("disconnected");
        if (!event.wasClean && reconnectAttempts < maxAttempts) {
          reconnectAttempts++;
          setTimeout(
            connectWebSocket,
            reconnectDelay * Math.min(reconnectAttempts, 5)
          );
        }
      };
      wsRef.current.onerror = (errorEvent) => {
        console.error("WS error:", errorEvent);
      };
    };
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounting");
        wsRef.current = null;
      }
    };
  }, [token, myActiveRequest, updateRoute]); // Key dependencies for WebSocket re-setup

  useEffect(() => {
    if (
      myActiveRequest &&
      myActiveRequest.status === "Dispatched" &&
      myActiveRequest.ambulanceId
    ) {
      const assignedAmbulance = ambulances.find(
        (amb) => amb.id === myActiveRequest.ambulanceId
      );
      if (assignedAmbulance) {
        updateRoute(
          assignedAmbulance.id,
          assignedAmbulance.latitude,
          assignedAmbulance.longitude
        );
      }
    } else {
      if (mapRef.current && routingControlRef.current) {
        try {
          mapRef.current.removeControl(routingControlRef.current);
        } catch (e) {
          /* empty */
        }
        routingControlRef.current = null;
      }
      setDistance(null);
      setEta(null);
    }
  }, [myActiveRequest, ambulances, updateRoute]);

  const handleSubmitRequest = async () => {
    /* ... (no changes from previous if logic is sound) ... */
    if (!userLocation) {
      alert("User location not available.");
      return;
    }
    if (myActiveRequest) {
      alert("You already have an active request.");
      return;
    }
    if (!token) {
      alert("Please log in.");
      return;
    }
    try {
      const res = await fetch("http://localhost:34869/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          emergencyType: "Medical Emergency",
          location: { latitude: userLocation[0], longitude: userLocation[1] },
        }),
      });
      if (!res.ok) {
        const errData = await res
          .json()
          .catch(() => ({ message: "Request submission failed" }));
        throw new Error(errData.message || `Error: ${res.status}`);
      }
      // Let WS update state. Optionally setView to user's location
      if (mapRef.current && userLocation)
        mapRef.current.setView(userLocation, 15); // Zoom in more
    } catch (error) {
      console.error("Error submitting request:", error);
      alert(`Request Error: ${error.message}`);
    }
  };

  const calculateDistanceHaversine = useCallback((lat1, lon1, lat2, lon2) => {
    /* ... */
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null)
      return Infinity;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const getNearbyObjects = useCallback(
    (objectsArray, radiusKm = 10) => {
      /* ... */
      if (!userLocation || !objectsArray || objectsArray.length === 0)
        return [];
      return objectsArray
        .map((obj) => ({
          ...obj,
          distance: calculateDistanceHaversine(
            userLocation[0],
            userLocation[1],
            obj.latitude,
            obj.longitude
          ),
        }))
        .filter((obj) => obj.distance <= radiusKm && obj.distance !== Infinity)
        .sort((a, b) => a.distance - b.distance);
    },
    [userLocation, calculateDistanceHaversine]
  );

  const nearestAmbulancesForSidebar = useMemo(
    () => getNearbyObjects(ambulances, 10).slice(0, 5),
    [ambulances, getNearbyObjects]
  );
  const allNearbyAmbulancesForMap = useMemo(
    () => getNearbyObjects(ambulances, 15),
    [ambulances, getNearbyObjects]
  );
  const hospitalsWithDistance = useMemo(
    () => getNearbyObjects(hospitals, 10),
    [hospitals, getNearbyObjects]
  );
  const availableAmbulancesCount = useMemo(
    () => ambulances.filter((amb) => amb.available).length,
    [ambulances]
  );
  const activeRequestsCount = useMemo(
    () =>
      requests.filter(
        (req) => req.status !== "Completed" && req.status !== "Cancelled"
      ).length,
    [requests]
  );

  const retryLocation = useCallback(() => {
    /* ... (no change from previous) ... */
    setLocationError(null);
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setLocationError(null);
        setLocationLoading(false);
        if (mapRef.current)
          mapRef.current.setView(
            [position.coords.latitude, position.coords.longitude],
            14
          );
      },
      (error) => {
        let msg = `Geolocation error: ${error.message}.`;
        if (error.code === error.PERMISSION_DENIED)
          msg = "Location access denied.";
        setLocationError(msg);
        setUserLocation(defaultFallbackLocation);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, [defaultFallbackLocation]);

  if (locationLoading || (!initialDataLoaded && token)) {
    // Show loader if geo is loading OR if logged in and initial data hasn't been attempted
    return (
      /* ... Main Loader ... */
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <Loader className="h-16 w-16 text-blue-400 animate-spin" />
        <h2 className="text-2xl font-bold text-white ml-4">
          {locationLoading ? "Acquiring Location..." : "Loading Map Data..."}
        </h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-slate-100">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-md border-b border-white/10 shadow-lg sticky top-0 z-[1001]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-10 w-10 text-red-500" />
              <div>
                <h1 className="text-xl font-bold">Emergency Center</h1>
                <p className="text-xs text-slate-400">Real-time Dispatch</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 text-xs px-2 py-1 bg-slate-700/50 rounded">
                {locationError ? (
                  <AlertCircle className="h-3 w-3 text-yellow-400" />
                ) : userLocation ? (
                  <Target className="h-3 w-3 text-green-400" />
                ) : (
                  <Loader className="h-3 w-3 text-blue-400 animate-spin" />
                )}
                <span>
                  {locationError
                    ? "Loc Issue"
                    : userLocation
                    ? "Loc Active"
                    : "Loc Pending"}
                </span>
                {locationError && (
                  <button
                    onClick={retryLocation}
                    className="ml-1 text-blue-400 hover:underline"
                  >
                    Retry
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-1 text-xs px-2 py-1 bg-slate-700/50 rounded">
                <span
                  className={`${
                    wsStatus === "connected"
                      ? "text-green-400"
                      : wsStatus === "connecting"
                      ? "text-yellow-400"
                      : "text-red-400"
                  } text-lg leading-none`}
                >
                  ●
                </span>
                <span className="capitalize">{wsStatus}</span>
              </div>
              <button
                onClick={handleSubmitRequest}
                disabled={
                  !userLocation ||
                  !!myActiveRequest ||
                  !token ||
                  locationLoading
                }
                title={
                  !token
                    ? "Login to request help"
                    : !userLocation || locationLoading
                    ? "Location not ready"
                    : myActiveRequest
                    ? "Active request exists"
                    : "Request Help"
                }
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm flex items-center space-x-2"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Request Help</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {locationError && (
        <div className="bg-yellow-500/90 text-black p-3 text-center text-sm font-medium shadow-md">
          <AlertCircle className="inline h-5 w-5 mr-2" />
          {locationError} Map view may be inaccurate.
        </div>
      )}

      <div className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            {/* Stats, Active Request, Hospitals, Ambulances Lists - JSX as in previous correct version */}
            <div className="bg-slate-800/70 p-4 rounded-xl shadow-lg border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Available Units</p>
                  <p className="text-2xl font-bold">
                    {availableAmbulancesCount}
                  </p>
                </div>
                <Truck className="h-10 w-10 text-green-500 opacity-70" />
              </div>
            </div>
            <div className="bg-slate-800/70 p-4 rounded-xl shadow-lg border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Active Incidents</p>
                  <p className="text-2xl font-bold">{activeRequestsCount}</p>
                </div>
                <Activity className="h-10 w-10 text-orange-500 opacity-70" />
              </div>
            </div>

            {myActiveRequest && (
              <div className="bg-red-700/30 p-4 rounded-xl border border-red-600/50 space-y-1 text-sm">
                <div className="flex items-center space-x-2 mb-1">
                  <AlertTriangle className="h-5 w-5 text-red-300 animate-pulse" />
                  <h3 className="font-semibold text-red-200">
                    Your Active Request
                  </h3>
                </div>
                <p>
                  <span className="text-slate-400">ID:</span> #
                  {myActiveRequest.id.toString().slice(-6)}
                </p>
                <p>
                  <span className="text-slate-400">Status:</span>{" "}
                  <span className="font-medium text-yellow-300">
                    {myActiveRequest.status.toUpperCase()}
                  </span>
                </p>
                {myActiveRequest.ambulanceId && (
                  <p>
                    <span className="text-slate-400">Unit:</span> #
                    {myActiveRequest.ambulanceId}
                  </p>
                )}
                {myActiveRequest.assignedHospitalId &&
                  myActiveRequest.assignedHospital && (
                    <p>
                      <span className="text-slate-400">To Hospital:</span>{" "}
                      {myActiveRequest.assignedHospital.name}
                    </p>
                  )}
                {myActiveRequest.status === "Dispatched" &&
                  distance !== null &&
                  eta !== null && (
                    <>
                      <p>
                        <span className="text-slate-400">Dist:</span>{" "}
                        {distance.toFixed(1)} km
                      </p>
                      <p>
                        <span className="text-slate-400">ETA:</span>{" "}
                        {eta.toFixed(0)} min
                      </p>
                    </>
                  )}
              </div>
            )}
            {hospitalsWithDistance.length > 0 && (
              <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700">
                <div className="flex items-center space-x-2 mb-3">
                  <Home className="h-5 w-5 text-blue-400" />
                  <h3 className="font-semibold text-slate-300">
                    Nearby Hospitals (10km)
                  </h3>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto text-xs custom-scrollbar">
                  {hospitalsWithDistance.map((h) => (
                    <div
                      key={h.id}
                      className="p-2 bg-slate-700/50 rounded-md hover:bg-slate-700 transition-colors"
                    >
                      <p className="font-medium text-slate-200">{h.name}</p>
                      <p className="text-slate-400">
                        {h.distance.toFixed(1)} km away
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {hospitalsWithDistance.length === 0 &&
              userLocation &&
              initialDataLoaded && (
                <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700 text-center text-slate-400 text-sm">
                  No hospitals found within 10km.
                </div>
              )}

            {!myActiveRequest &&
            nearestAmbulancesForSidebar.length >
              0 /* ... JSX for nearest ambulances ... */ ? (
              <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700">
                <div className="flex items-center space-x-2 mb-3">
                  <MapPin className="h-5 w-5 text-green-400" />
                  <h3 className="font-semibold text-slate-300">
                    Nearest Units
                  </h3>
                </div>
                <div className="space-y-2 text-xs custom-scrollbar max-h-48 overflow-y-auto">
                  {nearestAmbulancesForSidebar.map((amb) => (
                    <div
                      key={amb.id}
                      className={`p-2 rounded-md hover:bg-slate-700 transition-colors ${
                        amb.available ? "bg-green-700/30" : "bg-orange-700/30"
                      }`}
                    >
                      <p className="font-medium">
                        Unit {amb.id} - {amb.available ? "Available" : "Busy"}
                      </p>
                      <p className="text-slate-400">
                        {amb.distance?.toFixed(1)} km
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              myActiveRequest &&
              allNearbyAmbulancesForMap.length >
                0 /* ... JSX for ambulances near request ... */ && (
                <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700">
                  <div className="flex items-center space-x-2 mb-3">
                    <MapPin className="h-5 w-5 text-blue-400" />
                    <h3 className="font-semibold text-slate-300">
                      Units Near Request
                    </h3>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto text-xs custom-scrollbar">
                    {allNearbyAmbulancesForMap.map((amb) => (
                      <div
                        key={amb.id}
                        className={`p-2 rounded-md hover:bg-slate-700 transition-colors ${
                          amb.id === myActiveRequest.ambulanceId
                            ? "bg-blue-700/50 border border-blue-500"
                            : amb.available
                            ? "bg-green-700/30"
                            : "bg-orange-700/30"
                        }`}
                      >
                        <p className="font-medium">
                          Unit {amb.id}{" "}
                          {amb.id === myActiveRequest.ambulanceId
                            ? "(ASSIGNED)"
                            : amb.available
                            ? "(Avail.)"
                            : "(Busy)"}
                        </p>
                        <p className="text-slate-400">
                          {amb.distance?.toFixed(1)} km
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
            {allNearbyAmbulancesForMap.length === 0 &&
              nearestAmbulancesForSidebar.length === 0 &&
              initialDataLoaded &&
              userLocation && (
                <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700 text-center text-slate-400 text-sm">
                  No ambulances currently in range.
                </div>
              )}
          </div>

          {/* Map Container */}
          <div className="lg:col-span-3 bg-slate-800/70 backdrop-blur-sm p-1 rounded-xl shadow-lg border border-slate-700">
            <div
              className="rounded-lg overflow-hidden"
              style={{ height: "calc(100vh - 180px)", minHeight: "500px" }}
            >
              <MapContainer
                center={userLocation || defaultFallbackLocation}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                whenCreated={(mapInstance) => {
                  mapRef.current = mapInstance;
                  setMapReady(true); /* console.log("Map instance ready."); */
                }}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution="© OSM © CARTO"
                />
                {userLocation && (
                  <Marker position={userLocation} icon={UserLocationIcon}>
                    <Popup>
                      Your current location.
                      <br />
                      Lat: {userLocation[0].toFixed(5)}, Lon:{" "}
                      {userLocation[1].toFixed(5)}
                    </Popup>
                  </Marker>
                )}
                {(myActiveRequest
                  ? allNearbyAmbulancesForMap
                  : nearestAmbulancesForSidebar
                ).map((amb) => (
                  <Marker
                    key={`amb-${amb.id}`}
                    position={[amb.latitude, amb.longitude]}
                    icon={
                      amb.id === myActiveRequest?.ambulanceId
                        ? AssignedAmbulanceIcon
                        : amb.available
                        ? AvailableAmbulanceIcon
                        : UnavailableAmbulanceIcon
                    }
                  >
                    <Popup>
                      <strong>Ambulance Unit {amb.id}</strong>
                      <br />
                      Status:{" "}
                      {amb.id === myActiveRequest?.ambulanceId
                        ? "Assigned to You"
                        : amb.available
                        ? "Available"
                        : "Busy"}
                      <br />
                      {amb.distance?.toFixed(1)} km away
                    </Popup>
                  </Marker>
                ))}
                {requests
                  .filter(
                    (req) =>
                      req.status !== "Completed" && req.status !== "Cancelled"
                  )
                  .map((req) => {
                    const isMyReqMarker = myActiveRequest?.id === req.id;
                    return (
                      <Marker
                        key={`req-${req.id}`}
                        position={[req.latitude, req.longitude]}
                        icon={
                          isMyReqMarker ? MyRequestIcon : GeneralRequestIcon
                        }
                      >
                        <Popup>
                          <strong>Req #{req.id.toString().slice(-4)}</strong>
                          {isMyReqMarker ? " (Yours)" : ""}
                          <br />
                          Status: {req.status}
                          <br />
                          Type: {req.emergencyType}
                          {req.ambulanceId && (
                            <>
                              <br />
                              Unit: #{req.ambulanceId}
                            </>
                          )}
                          {req.assignedHospitalId && req.assignedHospital && (
                            <>
                              <br />
                              To: {req.assignedHospital.name}
                            </>
                          )}
                        </Popup>
                      </Marker>
                    );
                  })}
                {hospitalsWithDistance.map((hosp) => (
                  <Marker
                    key={`hosp-${hosp.id}`}
                    position={[hosp.latitude, hosp.longitude]}
                    icon={HospitalIcon}
                  >
                    <Popup>
                      <strong>{hosp.name}</strong>
                      <br />
                      Hospital Facility
                      <br />
                      {hosp.distance?.toFixed(1)} km away
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
