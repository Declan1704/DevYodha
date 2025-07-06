import { Hono } from "hono";
import { getPrisma } from "../db/db";
import { authMiddleware } from "../middleware/authmiddleware.";
import { WebSocketServer } from "./ws"; // Corrected path assuming ws.ts is in the same routes folder

interface Bindings {
  DATABASE_URL: string;
  JWT_SECRET: string;
}

interface Variables {
  wsServer: WebSocketServer;
  user: { userId: number; name: string }; // Ensure userId is number
}

const requests = new Hono<{ Bindings: Bindings; Variables: Variables }>();

function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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
}

// POST /api/requests - Create a new emergency request
requests.post("/", authMiddleware, async (c) => {
  const user = c.get("user");
  const { emergencyType, location } = await c.req.json(); // User's location for the emergency
  const prisma = getPrisma(c.env);
  const ws = c.get("wsServer");

  if (
    !location ||
    typeof location.latitude !== "number" ||
    typeof location.longitude !== "number"
  ) {
    return c.json({ error: "Invalid location data provided" }, 400);
  }
  if (!emergencyType || typeof emergencyType !== "string") {
    return c.json({ error: "Emergency type is required" }, 400);
  }

  try {
    // --- 1. Find or Create/Assign Ambulance (existing logic) ---
    let ambulance = await prisma.ambulance.findFirst({
      where: { available: true },
      orderBy: { updatedAt: "asc" },
    });
    if (!ambulance) {
      const DEFAULT_AMBULANCE_LAT = 15.85; // Example fixed depot Lat
      const DEFAULT_AMBULANCE_LON = 74.5; // Example fixed depot Lon
      ambulance = await prisma.ambulance.create({
        data: {
          latitude: DEFAULT_AMBULANCE_LAT,
          longitude: DEFAULT_AMBULANCE_LON,
          available: false,
        },
      });
    } else {
      await prisma.ambulance.update({
        where: { id: ambulance.id },
        data: { available: false },
      });
    }

    // --- 2. Find Nearby Hospitals using Overpass API ---
    const userLat = location.latitude;
    const userLon = location.longitude;
    const searchRadiusMeters = 5000; // 5km

    const overpassQuery = `
      [out:json][timeout:25];
      (
        node(around:${searchRadiusMeters},${userLat},${userLon})["amenity"="hospital"];
        way(around:${searchRadiusMeters},${userLat},${userLon})["amenity"="hospital"];
        relation(around:${searchRadiusMeters},${userLat},${userLon})["amenity"="hospital"];
      );
      out center;
    `;
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
      overpassQuery
    )}`;

    let nearestHospitalRecord = null;

    try {
      console.log(
        `Querying Overpass API for hospitals near ${userLat}, ${userLon}`
      );
      const response = await fetch(overpassUrl);
      if (!response.ok) {
        console.error(
          "Overpass API request failed:",
          response.status,
          await response.text()
        );
        // Continue without hospital if API fails, or handle error differently
      } else {
        const hospitalData = await response.json();
        const foundOsmHospitals = hospitalData.elements
          .map((el: any) => {
            const name = el.tags?.name || "Unknown Hospital";
            // For ways/relations, Overpass `out center;` gives a representative point
            const lat = el.center?.lat || el.lat;
            const lon = el.center?.lon || el.lon;
            return {
              osm_id: el.id.toString(),
              name,
              latitude: lat,
              longitude: lon,
            };
          })
          .filter(
            (h: { latitude: any; longitude: any }) => h.latitude && h.longitude
          ); // Ensure they have coordinates

        console.log(
          `Found ${foundOsmHospitals.length} hospitals from Overpass.`
        );

        if (foundOsmHospitals.length > 0) {
          // Upsert these hospitals into your DB to keep a local copy and get your own IDs
          for (const hosp of foundOsmHospitals) {
            await prisma.hospital.upsert({
              where: { osm_id: hosp.osm_id }, // Assumes you add osm_id to your Hospital model
              update: {
                name: hosp.name,
                latitude: hosp.latitude,
                longitude: hosp.longitude,
              },
              create: {
                osm_id: hosp.osm_id,
                name: hosp.name,
                latitude: hosp.latitude,
                longitude: hosp.longitude,
              },
            });
          }

          // Find the closest one from your DB records (which are now updated)
          const allLocalHospitals = await prisma.hospital.findMany(); // Potentially filter this further
          let minDistance = Infinity;

          for (const localHosp of allLocalHospitals) {
            const dist = calculateHaversineDistance(
              userLat,
              userLon,
              localHosp.latitude,
              localHosp.longitude
            );
            if (dist < minDistance && dist * 1000 <= searchRadiusMeters) {
              // Check if within original search radius
              minDistance = dist;
              nearestHospitalRecord = localHosp;
            }
          }
          if (nearestHospitalRecord) {
            console.log(
              `Nearest hospital found in DB: ${
                nearestHospitalRecord.name
              } (ID: ${nearestHospitalRecord.id}) at ${minDistance.toFixed(
                2
              )} km`
            );
          } else {
            console.log(
              "No hospitals from Overpass results were within search radius after DB check, or DB is empty."
            );
          }
        }
      }
    } catch (apiError) {
      console.error("Error during Overpass API call or processing:", apiError);
      // Proceed without assigning a hospital
    }

    // --- 3. Create the Emergency Request ---
    // Include hospitalId if one was found and assigned
    const requestData: any = {
      userId: user.userId,
      emergencyType,
      latitude: userLat,
      longitude: userLon,
      status: "Dispatched", // Or "Pending" then update to "Dispatched"
      ambulanceId: ambulance.id,
    };
    if (nearestHospitalRecord) {
      requestData.assignedHospitalId = nearestHospitalRecord.id; // NEW: Add a field to Request model
    }

    const request = await prisma.request.create({
      data: requestData,
      include: { user: true, ambulance: true, assignedHospital: true }, // NEW: include assignedHospital
    });

    // --- 4. Broadcast Updates (existing logic + hospital info) ---
    if (ws) {
      ws.broadcast(
        JSON.stringify({
          event: "update",
          data: { event: "newRequest", data: request },
        })
      );
      ws.broadcast(
        JSON.stringify({
          event: "update",
          data: {
            event: "requestStatus",
            data: {
              id: request.id,
              status: request.status,
              ambulanceId: request.ambulanceId,
              assignedHospitalId: request.assignedHospitalId,
            },
          },
        })
      );
      ws.broadcast(
        JSON.stringify({
          event: "update",
          data: {
            event: "ambulanceLocation",
            data: {
              id: ambulance.id,
              latitude: ambulance.latitude,
              longitude: ambulance.longitude,
              available: ambulance.available,
            },
          },
        })
      );
    }
    return c.json(request, 201);
  } catch (error) {
    console.error("Request creation process error:", error);
    return c.json(
      { error: "Failed to create request", details: (error as Error).message },
      500
    );
  }
});

// GET /api/requests - Get all requests
requests.get("/", authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  try {
    const allRequests = await prisma.request.findMany({
      include: { user: true, ambulance: true },
      orderBy: { createdAt: "desc" },
    });
    return c.json(allRequests);
  } catch (error) {
    console.error("Request fetch error:", error);
    return c.json({ error: "Failed to fetch requests" }, 500);
  }
});

// GET /api/requests/ambulances - Get all ambulances
requests.get("/ambulances", authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  try {
    const allAmbulances = await prisma.ambulance.findMany({
      orderBy: { id: "asc" },
    });
    return c.json(allAmbulances);
  } catch (error) {
    console.error("Ambulance fetch error:", error);
    return c.json({ error: "Failed to fetch ambulances" }, 500);
  }
});

// PATCH /api/requests/:id - Update request status (and potentially assigned ambulance)
requests.patch("/:id", authMiddleware, async (c) => {
  const requestId = parseInt(c.req.param("id"));
  if (isNaN(requestId)) {
    return c.json({ error: "Invalid request ID" }, 400);
  }
  const { status, ambulanceId } = await c.req.json();
  const prisma = getPrisma(c.env);

  try {
    const currentRequest = await prisma.request.findUnique({
      where: { id: requestId },
    });
    if (!currentRequest) {
      return c.json({ error: "Request not found" }, 404);
    }

    const updateData: { status?: string; ambulanceId?: number | null } = {};
    if (status) updateData.status = status;
    if (ambulanceId !== undefined)
      updateData.ambulanceId = ambulanceId ? parseInt(ambulanceId) : null;

    const updatedRequest = await prisma.request.update({
      where: { id: requestId },
      data: updateData,
      include: { user: true, ambulance: true },
    });

    // If status changes to 'Completed' or 'Cancelled', make the ambulance available
    if (
      updatedRequest.ambulanceId &&
      (status === "Completed" || status === "Cancelled")
    ) {
      await prisma.ambulance.update({
        where: { id: updatedRequest.ambulanceId },
        data: { available: true },
      });
      c.get("wsServer")?.broadcast(
        JSON.stringify({
          event: "update",
          data: {
            event: "ambulanceLocation", // Send as location update with new availability
            data: {
              id: updatedRequest.ambulanceId,
              available: true,
              latitude: updatedRequest.ambulance?.latitude,
              longitude: updatedRequest.ambulance?.longitude,
            },
          },
        })
      );
    }

    c.get("wsServer")?.broadcast(
      JSON.stringify({
        event: "update",
        data: {
          event: "requestStatus",
          data: {
            id: updatedRequest.id,
            status: updatedRequest.status,
            ambulanceId: updatedRequest.ambulanceId,
          },
        },
      })
    );
    return c.json(updatedRequest);
  } catch (error) {
    console.error("Request update error:", error);
    return c.json({ error: "Failed to update request" }, 500);
  }
});

// POST /api/requests/simulate-ambulance/:ambulanceId - Manually update an ambulance's location
requests.post("/simulate-ambulance/:ambulanceId", authMiddleware, async (c) => {
  const ambulanceId = parseInt(c.req.param("ambulanceId"));
  if (isNaN(ambulanceId)) {
    return c.json({ error: "Invalid ambulance ID" }, 400);
  }
  const { latitude, longitude, available } = await c.req.json(); // Allow updating availability
  const prisma = getPrisma(c.env);

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return c.json({ error: "Invalid latitude or longitude" }, 400);
  }

  try {
    const ambulanceExists = await prisma.ambulance.findUnique({
      where: { id: ambulanceId },
    });
    if (!ambulanceExists) {
      return c.json({ error: "Ambulance not found" }, 404);
    }

    const updateData: {
      latitude: number;
      longitude: number;
      available?: boolean;
    } = { latitude, longitude };
    if (typeof available === "boolean") {
      updateData.available = available;
    }

    const updatedAmbulance = await prisma.ambulance.update({
      where: { id: ambulanceId },
      data: updateData,
    });

    c.get("wsServer")?.broadcast(
      JSON.stringify({
        event: "update",
        data: {
          event: "ambulanceLocation",
          data: {
            id: updatedAmbulance.id,
            latitude: updatedAmbulance.latitude,
            longitude: updatedAmbulance.longitude,
            available: updatedAmbulance.available,
          },
        },
      })
    );
    return c.json(updatedAmbulance);
  } catch (error) {
    console.error("Ambulance simulation error:", error);
    return c.json({ error: "Failed to simulate ambulance movement" }, 500);
  }
});

// POST /api/requests/start-simulation/:requestId - Simplified simulation start
// This is a very basic simulation. For real-time, you'd use a loop or intervals.
requests.post("/start-simulation/:requestId", authMiddleware, async (c) => {
  const requestId = parseInt(c.req.param("requestId"));
  const prisma = getPrisma(c.env);

  if (isNaN(requestId)) {
    return c.json({ error: "Invalid request ID" }, 400);
  }

  try {
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: { ambulance: true },
    });

    if (!request) {
      return c.json({ error: "Request not found" }, 404);
    }
    if (!request.ambulanceId || !request.ambulance) {
      return c.json(
        { error: "No ambulance assigned to this request for simulation" },
        400
      );
    }
    if (request.status === "Completed" || request.status === "Cancelled") {
      return c.json(
        { error: "Cannot simulate for a completed or cancelled request" },
        400
      );
    }

    // Simulate one step: ambulance moves halfway to the request destination
    const amb = request.ambulance;
    const newLat = amb.latitude + (request.latitude - amb.latitude) * 0.25; // Move 25% of the way
    const newLon = amb.longitude + (request.longitude - amb.longitude) * 0.25;

    const updatedAmbulance = await prisma.ambulance.update({
      where: { id: request.ambulanceId },
      data: { latitude: newLat, longitude: newLon, available: false }, // Ensure it's marked as not available
    });

    // Update request status to Dispatched if it's Pending
    let finalStatus = request.status;
    if (request.status === "Pending") {
      await prisma.request.update({
        where: { id: requestId },
        data: { status: "Dispatched" },
      });
      finalStatus = "Dispatched";
    }

    const ws = c.get("wsServer");
    if (ws) {
      ws.broadcast(
        JSON.stringify({
          event: "update",
          data: {
            event: "ambulanceLocation",
            data: {
              id: updatedAmbulance.id,
              latitude: newLat,
              longitude: newLon,
              available: updatedAmbulance.available,
            },
          },
        })
      );
      if (request.status === "Pending") {
        // Only broadcast status change if it actually changed
        ws.broadcast(
          JSON.stringify({
            event: "update",
            data: {
              event: "requestStatus",
              data: {
                id: requestId,
                status: finalStatus,
                ambulanceId: request.ambulanceId,
              },
            },
          })
        );
      }
    }
    console.log(
      `Simulated movement for ambulance ${updatedAmbulance.id} towards request ${requestId}`
    );
    return c.json({
      message: "Simulation step processed",
      ambulance: updatedAmbulance,
    });
  } catch (error) {
    console.error(`Simulation start error for request ${requestId}:`, error);
    return c.json({ error: "Failed to start simulation step" }, 500);
  }
});

export default requests;
