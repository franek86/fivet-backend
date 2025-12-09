import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1️⃣ Seed ship types
  const shipTypesData = [
    { name: "Cargo", description: "Ships designed to carry goods." },
    { name: "Battleship", description: "Large armored warship." },
    { name: "Cruiser", description: "Fast naval ship for combat." },
    { name: "Destroyer", description: "Small, fast, and maneuverable warship." },
    { name: "Submarine", description: "Underwater military vessel." },
  ];

  const shipTypes = await Promise.all(
    shipTypesData.map((type) =>
      prisma.shipType.upsert({
        where: { name: type.name },
        update: {},
        create: type,
      })
    )
  );

  console.log(
    "Ship types seeded:",
    shipTypes.map((t) => t.name)
  );

  // 2️⃣ Users
  const userIds = ["375e0384-a561-4f50-b66a-354a418dddbe", "5c427000-7760-474e-9294-9cef051707bb", "a2c55358-af24-4f86-863d-35352ab59118"];

  // 3️⃣ Generate ships for each user
  const shipsPerUser = 5;
  let imoCounter = 1000000; // starting IMO number

  for (const userId of userIds) {
    for (let i = 0; i < shipsPerUser; i++) {
      const shipType = shipTypes[Math.floor(Math.random() * shipTypes.length)];

      await prisma.ship.upsert({
        where: { imo: imoCounter },
        update: {},
        create: {
          shipName: `${shipType.name} Ship ${i + 1}`,
          typeId: shipType.id,
          imo: imoCounter++,
          refitYear: 2010 + Math.floor(Math.random() * 10),
          buildYear: 2000 + Math.floor(Math.random() * 20),
          price: parseFloat((10_000_000 + Math.random() * 50_000_000).toFixed(2)),
          location: "Port Example",
          latitude: 10 + Math.random() * 80,
          longitude: -80 + Math.random() * 160,
          mainEngine: "Diesel Engine",
          lengthOverall: parseFloat((150 + Math.random() * 200).toFixed(2)),
          beam: parseFloat((20 + Math.random() * 40).toFixed(2)),
          length: parseFloat((140 + Math.random() * 180).toFixed(2)),
          depth: parseFloat((10 + Math.random() * 20).toFixed(2)),
          draft: parseFloat((5 + Math.random() * 15).toFixed(2)),
          tonnage: parseFloat((5000 + Math.random() * 20000).toFixed(2)),
          cargoCapacity: `${500 + Math.floor(Math.random() * 1500)} TEU`,
          buildCountry: "Country Example",
          remarks: "No remarks",
          description: `This is a ${shipType.name.toLowerCase()} ship.`,
          userId: userId,
        },
      });
    }
  }

  console.log("Ships seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
