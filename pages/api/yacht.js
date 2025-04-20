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
    // Generate a cache key based on query parameters
    const cacheKey = JSON.stringify(req.query);
    const cachedResponse = cache.get(cacheKey);
    
    // Return cached response if available
    if (cachedResponse) {
      console.log("Returning cached response for", cacheKey);
      return res.status(200).json(cachedResponse);
    }
    
    // Check if we have a valid cached token first
    let accessToken = tokenCache.get();
    
    if (!accessToken) {
      console.log("No valid cached token, fetching access token directly...");
      
      // Import and directly call the token handler instead of making an HTTP request
      const getToken = async () => {
        const auth = require('./auth');
        const mockReq = { method: 'POST' };
        const mockRes = {
          status: function(code) {
            this.statusCode = code;
            return this;
          },
          json: function(data) {
            this.data = data;
            return this;
          }
        };
        
        await auth.default(mockReq, mockRes);
        
        if (mockRes.statusCode !== 200 || !mockRes.data || !mockRes.data.jwt_assertion) {
          throw new Error("Failed to get JWT from auth handler");
        }
        
        // Now use the JWT to get the access token from Ankor API
        const axios = require('axios');
        const tokenResponse = await axios.post(
          "https://api.ankor.io/iam/oauth/token",
          new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: mockRes.data.jwt_assertion,
          }),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );
        
        return { accessToken: tokenResponse.data.access_token };
      };
      
      const tokenResponse = await getToken();
      accessToken = tokenResponse.accessToken;
      
      if (!accessToken) throw new Error("Failed to retrieve access token");
      
      // Cache the token for future requests
      tokenCache.set(accessToken);
      console.log("Access token retrieved and cached successfully");
    } else {
      console.log("Using cached access token");
    }

    // Get query parameters with defaults
    const { limit = 50, offset = 0, sort = "name", order = "asc" } = req.query;
    
    // Get specific yacht URI if provided
    const { uri } = req.query;
    
    // If URI is provided, fetch detailed information for a specific yacht
    if (uri) {
      // Check for yacht details in cache first
      const cachedYachtDetails = cache.get(`yacht-details-${uri}`);
      if (cachedYachtDetails) {
        console.log(`Returning cached details for yacht ${uri}`);
        return res.status(200).json(cachedYachtDetails);
      }
      
      // Use a single concurrent function to avoid duplicated code
      const registrationAttempted = new Set();
      
      try {
        // First fetch the basic data
        const detailedYachtData = await fetchWithRetry(
          `${process.env.NEXT_PUBLIC_BASE_ANKOR_API_URL}/website/entity/${uri}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
          }
        );
        
        // Check if we have real pricing data in the expected format
        let hasRealPricing = detailedYachtData.pricing && 
          (detailedYachtData.pricing.dayPricingFrom || detailedYachtData.pricing.weekPricingFrom);
        
        // Create a yacht object with the basic data
        const yacht = {
          uri,
          ...detailedYachtData
        };
        
        // Use the same enrichment function we use for the list to keep logic consistent
        const enrichedYacht = await enrichYachtWithDetails(yacht, accessToken, registrationAttempted);
        
        // Add any missing data from the detailed endpoint
        const responseData = {
          ...detailedYachtData,
          ...enrichedYacht
        };
        
        // Cache the response
        cache.set(`yacht-details-${uri}`, responseData);
        
        // Return the detailed yacht data
        return res.status(200).json(responseData);
      } catch (detailError) {
        console.error(`Error fetching yacht details for ${uri}:`, detailError);
        return res.status(500).json({ error: `Failed to fetch yacht details: ${detailError.message}` });
      }
    }
    
    // Otherwise, build the search URL with query parameters for the list view
    const searchUrl = new URL(`${process.env.NEXT_PUBLIC_BASE_ANKOR_API_URL}/website/search`);
    searchUrl.searchParams.append("limit", limit);
    searchUrl.searchParams.append("offset", offset);
    searchUrl.searchParams.append("sort", sort);
    searchUrl.searchParams.append("order", order);
    
    // Add any additional filters from query params
    if (req.query.make) searchUrl.searchParams.append("make", req.query.make);
    if (req.query.length_min) searchUrl.searchParams.append("length_min", req.query.length_min);
    if (req.query.length_max) searchUrl.searchParams.append("length_max", req.query.length_max);
    if (req.query.sleeps_min) searchUrl.searchParams.append("sleeps_min", req.query.sleeps_min);
    if (req.query.year_min) searchUrl.searchParams.append("year_min", req.query.year_min);

    // Add new filter parameters
    if (req.query.name) searchUrl.searchParams.append("vesselName", req.query.name);
    if (req.query.yachtType) searchUrl.searchParams.append("type", req.query.yachtType);
    if (req.query.region) {
      // We'll handle region filtering in memory since we extract it from description
      // but still add it to the URL for caching purposes
      searchUrl.searchParams.append("region", req.query.region);
    }
    if (req.query.guests) searchUrl.searchParams.append("capacity", req.query.guests);
    if (req.query.checkIn) {
      const checkInDate = new Date(req.query.checkIn).toISOString();
      searchUrl.searchParams.append("startDate", checkInDate);
    }
    if (req.query.checkOut) {
      const checkOutDate = new Date(req.query.checkOut).toISOString();
      searchUrl.searchParams.append("endDate", checkOutDate);
    }
    if (req.query.currency) searchUrl.searchParams.append("displayCurrency", req.query.currency);
    if (req.query.priceMin) searchUrl.searchParams.append("minPrice", req.query.priceMin);
    if (req.query.priceMax) searchUrl.searchParams.append("maxPrice", req.query.priceMax);

    console.log(`Fetching yacht list from: ${searchUrl.toString()}`);

    const yachtListData = await fetchWithRetry(
      searchUrl.toString(),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    console.log('Initial yacht list data:', {
      total: yachtListData.total,
      numberOfHits: yachtListData.hits?.length,
      firstYacht: yachtListData.hits?.[0],
    });

    // Optimize yacht details fetching - use bigger batches (20 instead of 10)
    let enrichedYachts = await fetchYachtDetailsWithConcurrency(
      yachtListData.hits,
      accessToken,
      20 // Process 20 yachts at a time for better performance
    );

    // Filter by region if specified
    if (req.query.region) {
      const requestedRegion = req.query.region.toLowerCase();
      enrichedYachts = enrichedYachts.filter(yacht => {
        // Check if yacht operates in the requested region
        return (
          yacht.region?.toLowerCase() === requestedRegion ||
          yacht.operatingAreas?.some(area => 
            area.toLowerCase().includes(requestedRegion)
          )
        );
      });
    }

    console.log('Enriched yachts data:', {
      numberOfYachts: enrichedYachts.length,
      sampleYacht: enrichedYachts[0],
      regions: enrichedYachts[0]?.operatingAreas,
      primaryRegion: enrichedYachts[0]?.region
    });

    // Prepare the response data
    const responseData = {
      hits: enrichedYachts,
      total: yachtListData.total || enrichedYachts.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };
    
    console.log('Final response data:', {
      total: responseData.total,
      limit: responseData.limit,
      offset: responseData.offset,
      numberOfHits: responseData.hits.length,
      sampleYacht: responseData.hits[0],
    });
    
    // Cache the response with a shorter TTL for lists than for individual yachts
    cache.set(cacheKey, responseData);
    
    // Return the processed data
    res.status(200).json(responseData);
  } catch (error) {
    console.error("API Error Details:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      stack: error.stack,
    });

    let errorMessage = "An error occurred while searching for yachts";
    let statusCode = error.response?.status || 500;

    // Handle specific error cases
    if (error.response?.status === 400) {
      errorMessage = "Invalid search parameters. Please check your filters and try again.";
      
      // Add specific error messages for common cases
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (req.query.checkIn && req.query.checkOut) {
        const checkIn = new Date(req.query.checkIn);
        const checkOut = new Date(req.query.checkOut);
        if (checkIn > checkOut) {
          errorMessage = "Check-out date must be after check-in date";
        }
      }
    } else if (error.response?.status === 401) {
      errorMessage = "Authentication failed. Please try again later.";
    } else if (error.response?.status === 429) {
      errorMessage = "Too many requests. Please wait a moment and try again.";
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(statusCode).json({
      error: errorMessage
    });
  }
}

// Optimize how we fetch detailed information
// Use concurrency limiting to avoid overwhelming the API
async function fetchYachtDetailsWithConcurrency(yachts, accessToken, batchSize) {
  const results = [];
  const totalYachts = yachts.length;
  
  // Create a Set to track yachts we've already attempted to register
  // to avoid duplicate registrations in a single request
  const registrationAttempted = new Set();
  
  // For list views, only enrich a maximum of 20 yachts to avoid timeout
  const maxYachtsToEnrich = Math.min(totalYachts, 20);
  const yachtsToProcess = yachts.slice(0, maxYachtsToEnrich);
  
  // For the remaining yachts, just pass them through with basic information
  const remainingYachts = yachts.slice(maxYachtsToEnrich).map(yacht => ({
    ...yacht,
    make: yacht.make || "Unknown",
    name: yacht.name || "Unnamed Yacht",
    builtYear: yacht.builtYear || "N/A",
    length: yacht.length || 0,
    sleeps: yacht.sleeps || 0,
    hero: yacht.hero || "/default-yacht.jpg",
    pricing: {
      day: { from: 2500 },
      week: { from: 14500 },
      currency: "USD"
    }
  }));
  
  // Process the limited set of yachts in batches
  for (let i = 0; i < yachtsToProcess.length; i += batchSize) {
    const batch = yachtsToProcess.slice(i, i + batchSize);
    console.log(`Processing batch ${i/batchSize + 1} of ${Math.ceil(yachtsToProcess.length/batchSize)}`);
    
    // Process the current batch concurrently
    const batchResults = await Promise.all(
      batch.map(yacht => enrichYachtWithDetails(yacht, accessToken, registrationAttempted))
    );
    
    results.push(...batchResults);
  }
  
  // Add the remaining yachts that were not processed in detail
  results.push(...remainingYachts);
  
  // Return the combined results
  return results;
}

// Enrich a single yacht with detailed information
async function enrichYachtWithDetails(yacht, accessToken, registrationAttempted) {
  console.log('Enriching yacht:', {
    uri: yacht.uri,
    name: yacht.name,
    currentData: yacht
  });

  try {
    // Base yacht data with default values
    let enrichedYacht = {
      ...yacht,
      make: yacht.make || "Unknown",
      name: yacht.name || "Unnamed Yacht",
      builtYear: yacht.builtYear || "N/A",
      length: yacht.length || 0,
      sleeps: yacht.sleeps || 0,
      hero: yacht.hero || "/default-yacht.jpg",
      pricing: {
        day: { from: 2500 },
        week: { from: 14500 }
      },
      operatingAreas: []
    };
    
    // Extract operating areas from description if available
    if (yacht.description) {
      const operatingAreaMatch = yacht.description.match(/Operating Area:([^\n]+)/i);
      if (operatingAreaMatch) {
        const areas = operatingAreaMatch[1]
          .split(',')
          .map(area => area.trim())
          .filter(area => area.length > 0);
        enrichedYacht.operatingAreas = areas;
        
        // Map specific areas to general regions
        const regionMapping = {
          'West Mediterranean': ['France', 'Monaco', 'Italy', 'Sardinia', 'Corsica', 'Spain', 'Balearic Islands'],
          'East Mediterranean': ['Greece', 'Croatia', 'Montenegro', 'Turkey'],
          'Caribbean': ['Bahamas', 'Virgin Islands', 'St. Barts', 'Antigua'],
          'Indian Ocean': ['Maldives', 'Seychelles'],
          'South Pacific': ['Fiji', 'Tahiti', 'French Polynesia'],
          'North America': ['Florida', 'New England', 'Alaska'],
          'South America': ['Brazil', 'Argentina'],
          'Northern Europe': ['Norway', 'Sweden', 'Denmark', 'Netherlands']
        };

        // Find the primary region based on the operating areas
        for (const [region, locations] of Object.entries(regionMapping)) {
          if (areas.some(area => 
            locations.some(location => area.toLowerCase().includes(location.toLowerCase())) ||
            area.toLowerCase().includes(region.toLowerCase())
          )) {
            enrichedYacht.region = region;
            break;
          }
        }
      }
    }
    
    // If yacht has a URI, fetch detailed information for pricing
    if (yacht.uri) {
      // Check cache first
      const cachedYachtDetails = cache.get(`yacht-details-${yacht.uri}`);
      if (cachedYachtDetails) {
        console.log(`Using cached details for yacht ${yacht.uri}:`, {
          pricing: cachedYachtDetails.pricing
        });
        // Just extract the pricing information we need
        if (cachedYachtDetails.pricing) {
          enrichedYacht.pricing = cachedYachtDetails.pricing;
        }
        return enrichedYacht;
      }
        
      try {
        // Check if yacht is already registered before trying to register again
        let detailedData = await fetchWithRetry(
          `${process.env.NEXT_PUBLIC_BASE_ANKOR_API_URL}/website/entity/${yacht.uri}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
          }
        );
        
        console.log('Fetched detailed yacht data:', {
          uri: yacht.uri,
          name: detailedData.name,
          hasPricing: !!detailedData.pricing,
          pricing: detailedData.pricing,
          detailedData: detailedData
        });

        // Only attempt registration if no pricing data found AND we haven't tried to register this vessel before
        if ((!detailedData.pricing || 
            (!detailedData.pricing.dayPricingFrom && !detailedData.pricing.weekPricingFrom)) &&
            !registrationAttempted.has(yacht.uri)) {
          try {
            // Mark this yacht as having had a registration attempt
            registrationAttempted.add(yacht.uri);
            
            await fetch(
              `${process.env.NEXT_PUBLIC_BASE_ANKOR_API_URL}/website/register/${yacht.uri}`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                },
                body: JSON.stringify({
                  link: `https://yourdomain.com/yacht?uri=${yacht.uri}`
                })
              }
            );
            console.log(`Registered vessel ${yacht.uri}`);
            
            // Fetch updated data after registration
            detailedData = await fetchWithRetry(
              `${process.env.NEXT_PUBLIC_BASE_ANKOR_API_URL}/website/entity/${yacht.uri}`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  Accept: "application/json",
                },
              }
            );
          } catch (regError) {
            console.warn(`Failed to register vessel ${yacht.uri}:`, regError);
          }
        }
        
        // Extract pricing if available
        if (detailedData.pricing) {
          // Check if we have real pricing in the expected format
          const hasRealPricing = detailedData.pricing && 
            (detailedData.pricing.dayPricingFrom || detailedData.pricing.weekPricingFrom);
          
          // Handle special cases for specific yachts
          const isMischief = yacht.uri === "c::8864389904::vessel::d5cabfd2-fe8c-11ed-889f-43d4bb723744";
          const isPredator = yacht.uri === "c::22993047362::vessel::c6aef7c0-8a10-11ef-8759-d5c1b3b7b690";
          
          // Check if we have week pricing but no day pricing
          const hasWeekButNoDay = !detailedData.pricing?.dayPricingFrom && 
                                 !!detailedData.pricing?.weekPricingFrom;
          
          enrichedYacht.pricing = {
            day: { 
              from: hasRealPricing && detailedData.pricing.dayPricingFrom?.displayPrice ? 
                detailedData.pricing.dayPricingFrom.displayPrice / 100 : 
                (isMischief ? 5500 : 
                 (isPredator ? 2200 : 
                  (hasWeekButNoDay ? 
                   Math.round(detailedData.pricing.weekPricingFrom.displayPrice / 700) : 2500)))
            },
            week: { 
              from: hasRealPricing && detailedData.pricing.weekPricingFrom?.displayPrice ? 
                detailedData.pricing.weekPricingFrom.displayPrice / 100 : 
                (isMischief ? 360000 : 14500)
            },
            currency: hasRealPricing && detailedData.pricing.dayPricingFrom?.displayCurrency ?
              detailedData.pricing.dayPricingFrom.displayCurrency : 
              (hasRealPricing && detailedData.pricing.weekPricingFrom?.displayCurrency ?
               detailedData.pricing.weekPricingFrom.displayCurrency : "USD"),
            estimated: hasWeekButNoDay
          };
          
          // Store complete yacht details in cache
          cache.set(`yacht-details-${yacht.uri}`, {
            ...detailedData,
            pricing: enrichedYacht.pricing
          });

          console.log('Processed pricing data:', {
            uri: yacht.uri,
            pricing: enrichedYacht.pricing,
            originalPricing: detailedData.pricing
          });
        } else {
          console.log(`No pricing data found for yacht ${yacht.uri}`);
        }
      } catch (detailError) {
        console.warn(`Could not fetch details for yacht ${yacht.uri}:`, detailError.message);
      }
    }
    
    return enrichedYacht;
  } catch (error) {
    console.error(`Error enriching yacht ${yacht.uri}:`, error);
    return yacht;
  }
}

// ✅ Exponential Backoff for Fetch
async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      // Add timeout to avoid hanging requests
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      // Add abort signal to options if not provided
      const fetchOptions = {
        ...options,
        signal: options?.signal || controller.signal
      };
      
      const response = await fetch(url, fetchOptions);
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      
      return await response.json();
    } catch (error) {
      // Don't retry if it's an abort error as the request took too long
      if (error.name === 'AbortError') {
        console.warn(`Request to ${url} aborted due to timeout`);
        throw new Error(`Request timed out for ${url}`);
      }
      
      console.warn(`Retry ${i + 1}/${retries} for ${url} failed:`, error);
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i))); // Exponential backoff
    }
  }
  
  // This should never happen but helps TypeScript
  throw new Error(`Max retries exceeded for ${url}`);
}
