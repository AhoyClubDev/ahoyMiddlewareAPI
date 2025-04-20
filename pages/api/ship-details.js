import axios from "axios";

// Simple in-memory cache implementation
const cache = {
  data: new Map(),
  ttl: 5 * 60 * 1000, // 5 minute cache TTL
  get(key) {
    const item = this.data.get(key);
    if (!item) return null;
    
    // Check if the cached item has expired
    if (Date.now() > item.expiry) {
      this.data.delete(key);
      return null;
    }
    
    return item.value;
  },
  set(key, value) {
    const expiry = Date.now() + this.ttl;
    this.data.set(key, { value, expiry });
  }
};

export default async function handler(req, res) {
  const allowedOrigins = [
    "https://yourfrontend.com",
    "https://staging.yourfrontend.com",
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Get the URI parameter
    const { uri } = req.query;
    
    if (!uri) {
      return res.status(400).json({ error: "URI parameter is required" });
    }
    
    // Generate a cache key
    const cacheKey = `ship-details-${uri}`;
    const cachedResponse = cache.get(cacheKey);
    
    // Return cached response if available
    if (cachedResponse) {
      console.log("Returning cached ship details for", uri);
      return res.status(200).json(cachedResponse);
    }
    
    console.log("Fetching access token from /api/token...");
    const tokenResponse = await fetchWithRetry(
      `${process.env.BASE_URL}/api/token`,
      { method: "POST" }
    );
    const { accessToken } = tokenResponse;

    if (!accessToken) throw new Error("Failed to retrieve access token");
    console.log("Access token retrieved successfully");
    
    // Fetch ship details from the entity API
    const shipDetailsData = await fetchWithRetry(
      `${process.env.NEXT_PUBLIC_BASE_ANKOR_API_URL}/website/entity/${uri}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );
    
    // Process the response to structure the data in a more useful way
    const processedDetails = processShipDetails(shipDetailsData);
    
    // Cache the ship details
    cache.set(cacheKey, processedDetails);
    
    // Return the detailed ship data
    return res.status(200).json(processedDetails);
  } catch (error) {
    console.error("API Error Details:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      stack: error.stack,
    });

    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || error.message || "Internal Server Error",
    });
  }
}

// Helper function to process ship details
function processShipDetails(shipData) {
  // Format the crew information
  const crewInfo = shipData.crew ? shipData.crew.map(member => ({
    name: member.name,
    avatar: member.avatar,
    bio: member.bio,
    roles: member.role || []
  })) : [];
  
  // Format vessel specifications
  const specifications = {
    make: shipData.blueprint?.make || "N/A",
    model: shipData.blueprint?.model || "N/A",
    builtYear: shipData.blueprint?.builtYear || "N/A",
    refitYear: shipData.blueprint?.refitYear || "N/A",
    length: shipData.blueprint?.length || "N/A",
    beam: shipData.blueprint?.beam || "N/A",
    draft: shipData.blueprint?.draft || "N/A",
    cabins: shipData.blueprint?.cabins || "N/A",
    sleeps: shipData.blueprint?.sleeps || "N/A",
    bathrooms: shipData.blueprint?.bathrooms || "N/A",
    maxCrew: shipData.blueprint?.maxCrew || "N/A",
    cruisingCapacity: shipData.blueprint?.cruisingCapacity || "N/A",
    staticCapacity: shipData.blueprint?.staticCapacity || "N/A",
    hullType: shipData.blueprint?.hullType || "N/A",
    hullConstruction: shipData.blueprint?.hullConstruction || "N/A",
    superStructure: shipData.blueprint?.superStructure || [],
    tonnage: shipData.blueprint?.tonnage || "N/A",
    decks: shipData.blueprint?.decks || "N/A",
    architect: shipData.blueprint?.architect || "N/A",
    interiorDesigner: shipData.blueprint?.interiorDesigner || "N/A",
  };
  
  // Format performance information
  const performance = {
    topSpeed: shipData.blueprint?.topSpeed || "N/A",
    cruiseSpeed: shipData.blueprint?.cruiseSpeed || "N/A",
    fuelCapacity: shipData.blueprint?.fuelCapacity || "N/A",
  };
  
  // Format amenities and features
  const amenities = {
    amenities: shipData.blueprint?.amenities || [],
    entertainment: shipData.blueprint?.entertainment || "N/A",
    toys: shipData.blueprint?.toys || "N/A",
    tenders: shipData.blueprint?.tenders || "N/A",
  };
  
  // Format cabin layout information
  const cabinLayout = shipData.blueprint?.cabinLayout || [];
  
  // Format pricing information
  const pricing = {
    day: {
      from: shipData.pricing?.dayPricingFrom?.displayPrice ? shipData.pricing.dayPricingFrom.displayPrice / 100 : null,
      to: shipData.pricing?.dayPricingTo?.displayPrice ? shipData.pricing.dayPricingTo.displayPrice / 100 : null,
      currency: shipData.pricing?.dayPricingFrom?.displayCurrency || "USD",
    },
    week: {
      from: shipData.pricing?.weekPricingFrom?.displayPrice ? shipData.pricing.weekPricingFrom.displayPrice / 100 : null,
      to: shipData.pricing?.weekPricingTo?.displayPrice ? shipData.pricing.weekPricingTo.displayPrice / 100 : null,
      currency: shipData.pricing?.weekPricingFrom?.displayCurrency || "USD",
    },
    pricingInfo: shipData.pricing?.pricingInfo || [],
  };
  
  // Format images
  const images = shipData.blueprint?.images || [];
  
  // Create the processed ship details object
  return {
    uri: shipData.uri,
    name: shipData.blueprint?.name || "Unnamed Vessel",
    type: shipData.yachtType || [],
    description: shipData.description || "No description available",
    specifications,
    performance,
    amenities,
    cabinLayout,
    crew: crewInfo,
    pricing,
    images,
    // Include the original data as a reference
    rawData: shipData,
  };
}

// Helper function to fetch with retry logic
async function fetchWithRetry(url, options, maxRetries = 3, delay = 1000) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios(url, options);
      return response.data;
    } catch (error) {
      console.error(`Attempt ${attempt + 1}/${maxRetries} failed:`, error.message);
      lastError = error;
      
      // If we've exhausted our retries, throw the error
      if (attempt === maxRetries - 1) {
        throw lastError;
      }
      
      // Wait before trying again
      await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
    }
  }
} 