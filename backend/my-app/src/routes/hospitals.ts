import { Hono } from "hono";
import { getPrisma } from "../db/db";
import { authMiddleware } from "../middleware/authmiddleware."; // If you want to protect this route

// Define Bindings and Variables if not already global
interface Bindings {
  DATABASE_URL: string;
  JWT_SECRET: string; // Needed if using authMiddleware
}
interface Variables {
  // Needed if using authMiddleware
  user: { userId: number; name: string };
}

const hospitals = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET /api/hospitals - Fetches hospitals, optionally filters by proximity
// Example: /api/hospitals?lat=40.71&lon=-74.00&radius=10 (radius in km)
hospitals.get("/", authMiddleware, async (c) => {
  // Added authMiddleware, remove if public
  const prisma = getPrisma(c.env);
  const { lat, lon, radius } = c.req.query();

  try {
    let allHospitals = await prisma.hospital.findMany({
      orderBy: { name: "asc" }, // Optional sorting
    });

    if (lat && lon && radius) {
      const userLat = parseFloat(lat);
      const userLon = parseFloat(lon);
      const searchRadiusKm = parseFloat(radius);

      if (isNaN(userLat) || isNaN(userLon) || isNaN(searchRadiusKm)) {
        return c.json(
          { error: "Invalid latitude, longitude, or radius parameters" },
          400
        );
      }

      allHospitals = allHospitals.filter((hospital) => {
        const distance = calculateHaversineDistance(
          userLat,
          userLon,
          hospital.latitude,
          hospital.longitude
        );
        return distance <= searchRadiusKm;
      });
    }

    return c.json(allHospitals);
  } catch (error) {
    console.error("Hospital fetch error:", error);
    return c.json({ error: "Failed to fetch hospitals" }, 500);
  }
});

// Haversine distance calculation (can be moved to a utils file)
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

export default hospitals;
