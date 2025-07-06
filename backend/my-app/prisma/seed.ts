import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding ...");

  // Seed Users
  const hashedPassword = await bcrypt.hash("password123", 10);
  const user1 = await prisma.user.upsert({
    where: { email: "testuser@example.com" },
    update: {},
    create: {
      email: "testuser@example.com",
      name: "Test User",
      password: hashedPassword,
      phone: "1234567890",
    },
  });
  console.log(`Created user with id: ${user1.id}`);

  // Seed Ambulances
  const ambulance1 = await prisma.ambulance.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1, // Explicit ID for easier reference if needed
      latitude: 40.7128, // NYC as an example starting point
      longitude: -74.006,
      available: true,
    },
  });
  const ambulance2 = await prisma.ambulance.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      latitude: 40.758, // Another NYC point
      longitude: -73.9855,
      available: true,
    },
  });
  const ambulance3 = await prisma.ambulance.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      latitude: 40.6892, // Near Statue of Liberty
      longitude: -74.0445,
      available: false, // Example of a busy one
    },
  });
  console.log(
    `Created ambulances with ids: ${ambulance1.id}, ${ambulance2.id}, ${ambulance3.id}`
  );

  // Seed Hospitals
  const hospital1 = await prisma.hospital.upsert({
    where: { id: 1 }, // Using name as unique identifier for upsert might be better in real app
    update: {},
    create: {
      id: 1,
      name: "NYC Health + Hospitals/Bellevue",
      latitude: 40.7399,
      longitude: -73.9774,
    },
  });
  const hospital2 = await prisma.hospital.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: "Mount Sinai West",
      latitude: 40.7696,
      longitude: -73.9848,
    },
  });
  const hospital3 = await prisma.hospital.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: "NYU Langone Health",
      latitude: 40.7422,
      longitude: -73.9745,
    },
  });
  const hospital4 = await prisma.hospital.upsert({
    // Further away hospital
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      name: "Jamaica Hospital Medical Center",
      latitude: 40.69,
      longitude: -73.805, // Queens
    },
  });

  console.log(
    `Created hospitals: ${hospital1.name}, ${hospital2.name}, ${hospital3.name}, ${hospital4.name}`
  );

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
