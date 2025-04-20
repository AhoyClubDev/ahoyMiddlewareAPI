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
    const cacheKey = `yacht-details-${uri}`;
    const cachedResponse = cache.get(cacheKey);
    
    // Return cached response if available
    if (cachedResponse) {
      console.log("Returning cached yacht details for", uri);
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
    
    // First, try to register the yacht
    try {
      console.log(`Attempting to register yacht with URI: ${uri}`);
      const registerResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_ANKOR_API_URL}/website/register/${uri}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            link: `${process.env.BASE_URL}/yacht?uri=${uri}`
          })
        }
      );
      
      if (!registerResponse.ok) {
        const registerError = await registerResponse.json().catch(() => ({}));
        console.warn('Yacht registration warning:', {
          status: registerResponse.status,
          message: registerError.message || 'Unknown error',
          uri: uri
        });
      } else {
        console.log('Yacht registered successfully');
      }
    } catch (registerError) {
      console.warn('Yacht registration error:', registerError.message);
    }
    
    // Now fetch yacht details from the entity API
    const yachtDetailsData = await fetchWithRetry(
      `${process.env.NEXT_PUBLIC_BASE_ANKOR_API_URL}/website/entity/${uri}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );
    
    // Process the response to structure the data in a more useful way
    const processedDetails = processYachtDetails(yachtDetailsData);
    
    // Cache the yacht details
    cache.set(cacheKey, processedDetails);
    
    // Return the detailed yacht data
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

// Helper function to process yacht details
function processYachtDetails(yachtData) {
  // Format the crew information
  const crewInfo = yachtData.crew ? yachtData.crew.map(member => ({
    name: member.name,
    avatar: member.avatar,
    bio: member.bio,
    roles: member.role || []
  })) : [];
  
  // Format vessel specifications
  const specifications = {
    make: yachtData.blueprint?.make || "N/A",
    model: yachtData.blueprint?.model || "N/A",
    builtYear: yachtData.blueprint?.builtYear || "N/A",
    refitYear: yachtData.blueprint?.refitYear || "N/A",
    length: yachtData.blueprint?.length || "N/A",
    beam: yachtData.blueprint?.beam || "N/A",
    draft: yachtData.blueprint?.draft || "N/A",
    cabins: yachtData.blueprint?.cabins || "N/A",
    sleeps: yachtData.blueprint?.sleeps || "N/A",
    bathrooms: yachtData.blueprint?.bathrooms || "N/A",
    maxCrew: yachtData.blueprint?.maxCrew || "N/A",
    cruisingCapacity: yachtData.blueprint?.cruisingCapacity || "N/A",
    staticCapacity: yachtData.blueprint?.staticCapacity || "N/A",
    hullType: yachtData.blueprint?.hullType || "N/A",
    hullConstruction: yachtData.blueprint?.hullConstruction || "N/A",
    superStructure: yachtData.blueprint?.superStructure || [],
    tonnage: yachtData.blueprint?.tonnage || "N/A",
    decks: yachtData.blueprint?.decks || "N/A",
    architect: yachtData.blueprint?.architect || "N/A",
    interiorDesigner: yachtData.blueprint?.interiorDesigner || "N/A",
  };
  
  // Format performance information
  const performance = {
    topSpeed: yachtData.blueprint?.topSpeed || "N/A",
    cruiseSpeed: yachtData.blueprint?.cruiseSpeed || "N/A",
    fuelCapacity: yachtData.blueprint?.fuelCapacity || "N/A",
    engines: yachtData.blueprint?.engines || "N/A"
  };
  
  // Format amenities and features
  const amenities = {
    amenities: yachtData.blueprint?.amenities?.map(a => 
      typeof a === 'object' ? { ...a } : { label: a, quantity: 1 }
    ) || [],
    entertainment: yachtData.blueprint?.entertainment || "N/A",
    toys: yachtData.blueprint?.toys || [],
    tenders: yachtData.blueprint?.tenders || []
  };
  
  // Format cabin layout information
  const cabinLayout = yachtData.blueprint?.cabinLayout?.map(cabin => ({
    label: cabin.label,
    quantity: cabin.quantity
  })) || [];
  
  // Format pricing information
  const pricing = {
    day: {
      from: yachtData.pricing?.dayPricingFrom?.displayPrice ? yachtData.pricing.dayPricingFrom.displayPrice / 100 : null,
      to: yachtData.pricing?.dayPricingTo?.displayPrice ? yachtData.pricing.dayPricingTo.displayPrice / 100 : null,
      currency: yachtData.pricing?.dayPricingFrom?.displayCurrency || "USD",
    },
    week: {
      from: yachtData.pricing?.weekPricingFrom?.displayPrice ? yachtData.pricing.weekPricingFrom.displayPrice / 100 : null,
      to: yachtData.pricing?.weekPricingTo?.displayPrice ? yachtData.pricing.weekPricingTo.displayPrice / 100 : null,
      currency: yachtData.pricing?.weekPricingFrom?.displayCurrency || "USD",
    },
    pricingInfo: yachtData.pricing?.pricingInfo?.map(info => ({
      name: info.name,
      effectiveDates: info.effectiveDates,
      pricing: info.pricing,
      inclusionZones: info.inclusionZones,
      exclusionZones: info.exclusionZones,
      petsAllowed: info.petsAllowed
    })) || []
  };
  
  // Format images
  const images = yachtData.blueprint?.images?.map(img => ({
    url: img,
    variant: img.includes("{imageVariant}") ? img.replace("{imageVariant}", "1280x") : img
  })) || [];
  
  // Create the processed yacht details object
  return {
    uri: yachtData.uri,
    name: yachtData.blueprint?.name || "Unnamed Yacht",
    yachtType: yachtData.yachtType || [],
    description: yachtData.description || "No description available",
    specifications,
    performance,
    amenities,
    cabinLayout,
    crew: crewInfo,
    pricing,
    images,
    // Include the original data as a reference
    rawData: yachtData,
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