export interface StreetViewImage {
  id: string;
  driveId: string;
  name: string;
  category: string;
  description: string;
  location: string;
  protocolA_Url: string; // Stitched panorama
  protocolB_Urls: {      // Four directional slices
    North: string;
    East: string;
    South: string;
    West: string;
  };
}

export const mockImages: StreetViewImage[] = [
  {
    id: "VLSAP-I1",
    driveId: "1ENECfT_ETGATB4533yAEKRZ-HugbI1_dense_market",
    name: "I1 Dense Market - Bangkok Commercial",
    category: "Dense commercial-informal",
    description: "High-density commercial street with informal food kiosks, merchandise racks, and parked motorbikes fully encroaching the pedestrian path.",
    location: "Bangkok, Thailand (Phra Nakhon)",
    protocolA_Url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200",
    protocolB_Urls: {
      North: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=600",
      East: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=600",
      South: "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?auto=format&fit=crop&q=80&w=600",
      West: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&q=80&w=600"
    }
  },
  {
    id: "VLSAP-I2",
    driveId: "1ENECfT_ETGATB4533yAEKRZ-HugbI2_mixed_junction",
    name: "I2 Mixed Junction - Shibuya Crossing",
    category: "Mixed junction",
    description: "Complex urban intersection with heavy vehicle volumes, high traffic threat, prominent zebra crossing, and wide, highly-maintained sidewalks.",
    location: "Tokyo, Japan (Shibuya)",
    protocolA_Url: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&q=80&w=1200",
    protocolB_Urls: {
      North: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&q=80&w=600",
      East: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=600",
      South: "https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&q=80&w=600",
      West: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=600"
    }
  },
  {
    id: "VLSAP-I3",
    driveId: "1ENECfT_ETGATB4533yAEKRZ-HugbI3_residential_informal",
    name: "I3 Residential Informal - Hanoi Alleyway",
    category: "Residential-informal",
    description: "Narrow, shared alleyway with unsegregated pedestrian and scooter traffic, surface potholes, and light domestic/vending encroachment.",
    location: "Hanoi, Vietnam (Old Quarter)",
    protocolA_Url: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=1200",
    protocolB_Urls: {
      North: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=600",
      East: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=600",
      South: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600",
      West: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&q=80&w=600"
    }
  },
  {
    id: "VLSAP-I4",
    driveId: "1ENECfT_ETGATB4533yAEKRZ-HugbI4_formal_green",
    name: "I4 Formal Green Arterial - Singapore Walkway",
    category: "Formal green arterial",
    description: "Wide, modern paved footway shaded by a continuous canopy of mature rain trees, separated from the multi-lane road by a physical landscaped buffer.",
    location: "Singapore (Orchard Boulevard)",
    protocolA_Url: "https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&q=80&w=1200",
    protocolB_Urls: {
      North: "https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&q=80&w=600",
      East: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&q=80&w=600",
      South: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=600",
      West: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600"
    }
  },
  {
    id: "VLSAP-I5",
    driveId: "1ENECfT_ETGATB4533yAEKRZ-HugbI5_leaf_covered",
    name: "I5 Leaf-covered Footway - Boston Common Edge",
    category: "Formal park-edge",
    description: "Brick sidewalk adjacent to a public park. The path is almost completely obscured by a thick blanket of wet autumn leaves, complicating surface inspection.",
    location: "Boston, USA (Beacon Street)",
    protocolA_Url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=1200",
    protocolB_Urls: {
      North: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=600",
      East: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=600",
      South: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=600",
      West: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=600"
    }
  },
  {
    id: "VLSAP-I6",
    driveId: "1ENECfT_ETGATB4533yAEKRZ-HugbI6_dense_encroachment2",
    name: "I6 Street Vendor Alley - Mumbai Bazar",
    category: "Dense commercial-informal",
    description: "Intense street level activity with temporary stalls and pedestrians sharing a congested road corridor; sidewalk completely absent/blocked.",
    location: "Mumbai, India (Crawford Market)",
    protocolA_Url: "https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&q=80&w=1200",
    protocolB_Urls: {
      North: "https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&q=80&w=600",
      East: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=600",
      South: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=600",
      West: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=600"
    }
  },
  {
    id: "VLSAP-I7",
    driveId: "1ENECfT_ETGATB4533yAEKRZ-HugbI7_dense_encroachment3",
    name: "I7 Active Market Frontage - Cairo Bazaar",
    category: "Dense commercial-informal",
    description: "Active market frontage with goods stacked on sidewalk, clothes hanging, and intense commercial spillover.",
    location: "Cairo, Egypt (Khan el-Khalili)",
    protocolA_Url: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&q=80&w=1200",
    protocolB_Urls: {
      North: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&q=80&w=600",
      East: "https://images.unsplash.com/photo-1545231027-63b3f16260d7?auto=format&fit=crop&q=80&w=600",
      South: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=600",
      West: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=600"
    }
  },
  {
    id: "VLSAP-I8",
    driveId: "1ENECfT_ETGATB4533yAEKRZ-HugbI8_park_edge",
    name: "I8 Royal Park Boundary - London Walkway",
    category: "Formal park-edge",
    description: "Wide, flagstone sidewalk alongside decorative wrought iron gates. Unobstructed clear width of over 3 meters with excellent surface quality.",
    location: "London, United Kingdom",
    protocolA_Url: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=1200",
    protocolB_Urls: {
      North: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=600",
      East: "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?auto=format&fit=crop&q=80&w=600",
      South: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=600",
      West: "https://images.unsplash.com/photo-1473091534298-04dcbce3278c?auto=format&fit=crop&q=80&w=600"
    }
  },
  {
    id: "VLSAP-I9",
    driveId: "1ENECfT_ETGATB4533yAEKRZ-HugbI9_arterial",
    name: "I9 Outer Ring Highway Sidewalk - Seoul",
    category: "Formal green arterial",
    description: "A wide, segregated modern sidewalk with bicycle path markings, well-separated from the Seoul ring freeway by steel barriers and trees.",
    location: "Seoul, South Korea",
    protocolA_Url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200",
    protocolB_Urls: {
      North: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600",
      East: "https://images.unsplash.com/photo-1491904768633-2b7e3e7f9f72?auto=format&fit=crop&q=80&w=600",
      South: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=600",
      West: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&q=80&w=600"
    }
  },
  {
    id: "VLSAP-I10",
    driveId: "1ENECfT_ETGATB4533yAEKRZ-HugbI10_dense_encroachment4",
    name: "I10 Souk Al-Mubarakiya Encroachment",
    category: "Dense commercial-informal",
    description: "Traditional market corridor with massive street tables, awnings, and water-misters occupying the pedestrian way.",
    location: "Kuwait City, Kuwait",
    protocolA_Url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200",
    protocolB_Urls: {
      North: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=600",
      East: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=600",
      South: "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?auto=format&fit=crop&q=80&w=600",
      West: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=600"
    }
  }
];

// Helper to generate a full pilot study dataset of 45 images by expanding on the seed list
export function getFullPilotImages(): StreetViewImage[] {
  const list: StreetViewImage[] = [...mockImages];
  
  // Synthesize remaining to reach 45 items with varied categories and locations
  const categories = ["Dense commercial-informal", "Mixed junction", "Residential-informal", "Formal green arterial", "Formal park-edge"];
  const cities = ["Nairobi, Kenya", "Mexico City, Mexico", "Hanoi, Vietnam", "Istanbul, Turkey", "Bogota, Colombia", "Jakarta, Indonesia", "New York, USA", "Berlin, Germany", "Sydney, Australia", "Tokyo, Japan", "Bangkok, Thailand", "London, UK", "New Delhi, India"];
  
  const baseUnsplash = [
    "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=1200"
  ];

  for (let i = mockImages.length + 1; i <= 45; i++) {
    const cat = categories[i % categories.length];
    const city = cities[i % cities.length];
    const imgUrl = baseUnsplash[i % baseUnsplash.length];

    // Make sure we have plenty of dense commercial-informal (I1 style) to fulfill the oversampling rule
    let targetCat = cat;
    let desc = `Pilot street segment under evaluation for pedestrian infrastructure and space utilization.`;
    if (i % 3 === 0) {
      targetCat = "Dense commercial-informal";
      desc = `Highly congested market frontage in ${city} with temporary vendor tents and parked motorbikes obstructing the walking path.`;
    }

    list.push({
      id: `VLSAP-Pilot-${i}`,
      driveId: `1ENECfT_ETGATB4533yAEKRZ-HugbPilot_${i}`,
      name: `Pilot Location ${i} - ${city}`,
      category: targetCat,
      description: desc,
      location: city,
      protocolA_Url: imgUrl,
      protocolB_Urls: {
        North: imgUrl,
        East: baseUnsplash[(i + 1) % baseUnsplash.length],
        South: baseUnsplash[(i + 2) % baseUnsplash.length],
        West: baseUnsplash[(i + 3) % baseUnsplash.length]
      }
    });
  }

  return list;
}
