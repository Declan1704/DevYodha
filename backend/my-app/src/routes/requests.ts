import { Hono } from "hono";
import { getPrisma } from "../db/db";
import { authMiddleware } from "../middleware/authmiddleware.";
import { WebSocketServer } from "./ws";

interface Bindings {
  DATABASE_URL: string;
  DIRECT_URL: string;
  JWT_SECRET: string;
}

interface Variables {
  wsServer: WebSocketServer;
  user: { userId: number; name: string };
}

const requests = new Hono<{ Bindings: Bindings; Variables: Variables }>();

requests.post("/", authMiddleware, async (c) => {
  const user = c.get("user");
  const { emergencyType, location } = await c.req.json();
  const prisma = getPrisma(c.env);

  const request = await prisma.request.create({
    data: {
      userId: user.userId,
      emergencyType,
      latitude: location.latitude,
      longitude: location.longitude,
    },
    include: { user: true },
  });

  c.get("wsServer")?.broadcast(
    JSON.stringify({ event: "newRequest", data: request })
  );
  return c.json(request, 201);
});

requests.get("/", authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const requests = await prisma.request.findMany({
    include: { user: true },
  });
  return c.json(requests);
});

requests.patch("/:id", authMiddleware, async (c) => {
  const { id } = c.req.param();
  const { status, ambulanceId } = await c.req.json();
  const prisma = getPrisma(c.env);

  const request = await prisma.request.update({
    where: { id: Number(id) },
    data: { status, ambulanceId },
    include: { user: true },
  });

  c.get("wsServer")?.broadcast(
    JSON.stringify({ event: "requestStatus", data: { id, status } })
  );
  return c.json(request);
});

requests.post("/simulate-ambulance/:id", authMiddleware, async (c) => {
  const { id } = c.req.param();
  const { latitude, longitude } = await c.req.json();
  const prisma = getPrisma(c.env);

  const ambulance = await prisma.ambulance.update({
    where: { id },
    data: { latitude, longitude },
  });

  c.get("wsServer")?.broadcast(
    JSON.stringify({
      event: "ambulanceLocation",
      data: { id, latitude, longitude },
    })
  );
  return c.json(ambulance);
});

requests.post("/start-simulation/:requestId", authMiddleware, async (c) => {
  const { requestId } = c.req.param();
  const prisma = getPrisma(c.env);

  const request = await prisma.request.findUnique({
    where: { id: Number(requestId) },
  });
  if (!request) return c.json({ error: "Request not found" }, 404);

  const ambulance = await prisma.ambulance.findFirst({
    where: { available: true },
  });
  if (!ambulance) return c.json({ error: "No available ambulance" }, 404);

  await prisma.request.update({
    where: { id: Number(requestId) },
    data: { ambulanceId: ambulance.id, status: "Dispatched" },
  });

  const newLat =
    ambulance.latitude + (request.latitude - ambulance.latitude) / 2;
  const newLon =
    ambulance.longitude + (request.longitude - ambulance.longitude) / 2;

  const updatedAmbulance = await prisma.ambulance.update({
    where: { id: ambulance.id },
    data: { latitude: newLat, longitude: newLon, available: false },
  });

  c.get("wsServer")?.broadcast(
    JSON.stringify({
      event: "ambulanceLocation",
      data: { id: ambulance.id, latitude: newLat, longitude: newLon },
    })
  );
  c.get("wsServer")?.broadcast(
    JSON.stringify({
      event: "requestStatus",
      data: { id: requestId, status: "Dispatched" },
    })
  );
  return c.json(updatedAmbulance);
});

export default requests;
