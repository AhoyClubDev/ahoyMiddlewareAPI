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

// Token cache with specific TTL for access tokens
const tokenCache = {
  token: null,
  expiry: 0,
  ttl: 50 * 60 * 1000, // 50 minutes (tokens typically last 1 hour)
  isValid() {
    return this.token && Date.now() < this.expiry;
  },
  set(token) {
    this.token = token;
    this.expiry = Date.now() + this.ttl;
  },
  get() {
    return this.isValid() ? this.token : null;
  }
};

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Generate a cache key based on query parameters
    const cacheKey = `filtered-ships-${JSON.stringify(req.query)}`;
    const cachedResponse = cache.get(cacheKey);
    
    // Return cached response if available
    if (cachedResponse) {
      console.log("Returning cached filtered ships response");
      return res.status(200).json(cachedResponse);
    }

    // Get access token
    let accessToken = tokenCache.get();
    if (!accessToken) {
      console.log("Fetching access token from /api/token...");
      try {
        const tokenResponse = await fetchWithRetry(
          `${process.env.BASE_URL}/api/token`,
          { method: "POST" }
        );
        
        accessToken = tokenResponse.accessToken;
        
        if (!accessToken) {
          console.error("Token response did not contain accessToken:", tokenResponse);
          throw new Error("Failed to retrieve access token");
        }
        
        // Cache the token for future requests
        tokenCache.set(accessToken);
        console.log("Access token retrieved and cached successfully");
      } catch (tokenError) {
        console.error("Failed to retrieve access token:", tokenError);
        throw new Error(`Token retrieval failed: ${tokenError.message}`);
      }
    } else {
      console.log("Using cached access token");
    }

    // Build search URL with query parameters
    const searchUrl = new URL(`${process.env.NEXT_PUBLIC_BASE_ANKOR_API_URL}/website/search`);
    
    // We only care about ships from company c::8864389904
    const targetCompany = "c::8864389904";
    
    // Set a large limit for initial fetch but smaller batch size to avoid API limitations
    const queryLimit = 100; // Smaller batch size
    let currentOffset = 0;
    const maxPages = 20; // Allow more pagination attempts
    
    // Add parameters to the search URL
    searchUrl.searchParams.append("limit", queryLimit.toString());
    searchUrl.searchParams.append("offset", currentOffset.toString());
    searchUrl.searchParams.append("sort", req.query.sort || "name");
    searchUrl.searchParams.append("order", req.query.order || "asc");
    
    // First approach: Try to get all ships directly from the target company
    searchUrl.searchParams.set("company", targetCompany);
    
    // Collect all ships across multiple requests if needed
    let allShips = [];
    let hasMoreShips = true;
    let attempts = 0;
    
    console.log(`Directly querying ships from company: ${targetCompany}`);
    
    // Fetch ships for this company ID with pagination
    while (hasMoreShips && attempts < maxPages) {
      attempts++;
      // Update offset for pagination
      searchUrl.searchParams.set("offset", currentOffset.toString());
      
      console.log(`Fetching ships from: ${searchUrl.toString()}, offset: ${currentOffset}, attempt: ${attempts}`);

      // Fetch ships for current page
      try {
        const response = await fetchWithRetry(
          searchUrl.toString(),
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
          }
        );
        
        if (!response || typeof response !== 'object') {
          console.error("Invalid response from search API:", response);
          break;
        }

        const pageShips = response.hits || [];
        
        if (!Array.isArray(pageShips)) {
          console.error("Expected 'hits' to be an array, got:", pageShips);
          break;
        }

        // Add current page results to all ships (avoid duplicates by URI)
        const existingUris = new Set(allShips.map(ship => ship.uri));
        const newShips = pageShips.filter(ship => !existingUris.has(ship.uri));
        allShips = [...allShips, ...newShips];
        
        console.log(`Found ${newShips.length} new unique ships in this batch`);
        
        // Determine if we need to fetch more ships
        currentOffset += queryLimit;
        
        // If we got fewer results than requested, we've reached the end
        if (pageShips.length < queryLimit) {
          hasMoreShips = false;
        }
        
        console.log(`Fetched ${allShips.length} total unique ships so far`);
      } catch (error) {
        console.error("Error fetching ships:", error.message);
        break;
      }
    }
    
    // Second approach: Try to get vessels from the entity API
    console.log("Attempting to use entity API to get more vessels...");
    
    try {
      const entityUrl = new URL(`${process.env.NEXT_PUBLIC_BASE_ANKOR_API_URL}/entity/vessel/list`);
      entityUrl.searchParams.append("company", targetCompany);
      entityUrl.searchParams.append("limit", "300");
      
      console.log(`Fetching from entity API: ${entityUrl.toString()}`);
      
      const entityResponse = await fetchWithRetry(
        entityUrl.toString(),
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        }
      );
      
      if (entityResponse && Array.isArray(entityResponse.hits)) {
        const entityShips = entityResponse.hits;
        console.log(`Found ${entityShips.length} ships from entity API`);
        
        // Add to our collection avoiding duplicates
        const existingUris = new Set(allShips.map(ship => ship.uri));
        const newEntityShips = entityShips.filter(ship => !existingUris.has(ship.uri));
        
        console.log(`Adding ${newEntityShips.length} new unique ships from entity API`);
        allShips = [...allShips, ...newEntityShips];
      }
    } catch (entityError) {
      console.log("Entity API approach failed:", entityError.message);
    }
    
    // Third approach: Try to get vessels directly through website entities
    try {
      // Get a list of known vessel URIs from the target company 
      const knownURIPrefix = `${targetCompany}::vessel::`;
      const vessel1 = `${knownURIPrefix}d5cabfd2-fe8c-11ed-889f-43d4bb723744`; // Example from request
      
      // Try to get entities by known pattern
      for (let i = 0; i < 5; i++) {
        try {
          // Fetch entity details which might contain references to other vessels
          const entityUrl = `${process.env.NEXT_PUBLIC_BASE_ANKOR_API_URL}/website/entity/${vessel1}`;
          console.log(`Fetching entity details from: ${entityUrl}`);
          
          const entityResponse = await fetchWithRetry(
            entityUrl,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/json",
              },
            }
          );
          
          // If we have a related vessels field, add those
          if (entityResponse && entityResponse.relatedVessels && Array.isArray(entityResponse.relatedVessels)) {
            console.log(`Found ${entityResponse.relatedVessels.length} related vessels`);
            
            // Add to our collection avoiding duplicates
            const existingUris = new Set(allShips.map(ship => ship.uri));
            const relatedVessels = entityResponse.relatedVessels.map(v => ({
              uri: v.uri,
              name: v.name,
              hero: v.hero,
              length: v.length,
              cabins: v.cabins,
              sleeps: v.sleeps,
              builtYear: v.builtYear,
              make: v.make
            }));
            
            const newRelatedShips = relatedVessels.filter(ship => !existingUris.has(ship.uri));
            console.log(`Adding ${newRelatedShips.length} new vessels from related vessels`);
            allShips = [...allShips, ...newRelatedShips];
          }
          
          break; // If successful, no need to try more iterations
        } catch (error) {
          console.log(`Entity attempt ${i+1} failed:`, error.message);
        }
      }
    } catch (error) {
      console.log("Entity details approach failed:", error.message);
    }
    
    // Finally, find all URIs that start with our target company
    const filteredShips = allShips.filter(ship => 
      ship.uri && ship.uri.startsWith(targetCompany)
    );

    console.log(`Found ${filteredShips.length} ships with URI starting with ${targetCompany} out of ${allShips.length} total unique ships`);

    // Prepare the response
    const responseData = {
      estHits: filteredShips.length,
      hits: filteredShips,
      totalFetched: allShips.length
    };

    // Cache the response
    cache.set(cacheKey, responseData);

    // Return the filtered ships data
    return res.status(200).json(responseData);
    
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

// Helper function to fetch with retry logic
async function fetchWithRetry(url, options, maxRetries = 3, delay = 1000) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios(url, options);
      return response.data;
    } catch (error) {
      console.log(`Attempt ${attempt + 1} failed: ${error.message}`);
      lastError = error;

      // If we're out of retries, throw the error
      if (attempt === maxRetries - 1) throw lastError;

      // Otherwise, wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
    }
  }
  throw lastError; // Should never get here due to the check above, but just in case
} 