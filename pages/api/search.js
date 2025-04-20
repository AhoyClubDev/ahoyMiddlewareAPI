import axios from "axios";

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
  // Allow specific origins including localhost
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:8000',
    'http://localhost',
    'https://localhost',
    'http://127.0.0.1',
    'https://127.0.0.1'
  ];
  
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.includes(origin) || origin.includes('localhost'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
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
    // Get access token
    let accessToken = tokenCache.get();
    if (!accessToken) {
      const tokenResponse = await fetch(
        `${process.env.BASE_URL}/api/token`,
        { method: "POST" }
      ).then(res => res.json());
      
      accessToken = tokenResponse.accessToken;
      if (!accessToken) throw new Error("Failed to retrieve access token");
      tokenCache.set(accessToken);
    }

    // First, register the company if needed
    try {
      const registerResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_ANKOR_API_URL}/website/register/${process.env.NEXT_PUBLIC_COMPANY_URI}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            link: `${process.env.BASE_URL}/yacht-search`
          })
        }
      );
      
      if (!registerResponse.ok) {
        const registerError = await registerResponse.json().catch(() => ({}));
        console.warn('Company registration warning:', {
          status: registerResponse.status,
          message: registerError.message || 'Unknown error',
          company: process.env.NEXT_PUBLIC_COMPANY_URI
        });
      } else {
        console.log('Company registered successfully');
      }
    } catch (registerError) {
      console.warn('Company registration error:', registerError.message);
    }

    // Build search URL with query parameters
    const searchUrl = new URL(`${process.env.NEXT_PUBLIC_BASE_ANKOR_API_URL}/website/search`);
    
    // Map frontend parameters to Ankor API parameters
    const parameterMapping = {
      name: 'name',
      charterType: 'charterType',
      minLength: 'minLength',
      maxLength: 'maxLength',
      sleeps: 'sleeps',
      yachtType: 'yachtType',
      currency: 'currency',
      priceMin: 'priceMin',
      priceMax: 'priceMax',
      region: 'region'
    };

    // Define allowed values for enum parameters
    const allowedValues = {
      charterType: ['Bareboat', 'Crewed'],
      yachtType: ['Gulet', 'Sailing', 'Catamaran', 'Motor', 'Power Catamaran', 'Classic', 'Expedition', 'Sport fishing'],
      currency: ['USD', 'EUR', 'GBP', 'AUD', 'AED', 'SGD', 'HKD', 'JPY', 'CAD', 'CHF', 'BTC', 'ETH'],
      region: [
        'Africa',
        'Antarctica',
        'Arabian Gulf',
        'Australasia & South Pacific',
        'Bahamas',
        'Caribbean',
        'Indian Ocean & South East Asia',
        'North America',
        'Northern Europe',
        'East Mediterranean',
        'West Mediterranean',
        'South & Central America'
      ]
    };

    // Add query parameters with validation
    Object.entries(req.query).forEach(([key, value]) => {
      if (value && parameterMapping[key]) {
        const mappedKey = parameterMapping[key];
        
        // Validate enum values
        if (allowedValues[mappedKey] && !allowedValues[mappedKey].includes(value)) {
          console.warn(`Invalid value for ${mappedKey}: ${value}`);
          return;
        }

        // Convert numeric strings to numbers where needed
        if (['minLength', 'maxLength', 'sleeps', 'priceMin', 'priceMax'].includes(mappedKey)) {
          const numValue = parseFloat(value);
          if (isNaN(numValue)) {
            console.warn(`Invalid numeric value for ${mappedKey}: ${value}`);
            return;
          }
          searchUrl.searchParams.append(mappedKey, numValue.toString());
        } else {
          // Don't encode the value here, let URLSearchParams handle it
          searchUrl.searchParams.append(mappedKey, value);
        }
      }
    });

    // Add required parameters
    searchUrl.searchParams.append('company', process.env.NEXT_PUBLIC_COMPANY_URI);
    if (!searchUrl.searchParams.has('currency')) {
      searchUrl.searchParams.append('currency', 'USD');
    }

    // Add default price range if not provided
    if (!searchUrl.searchParams.has('priceMin') && !searchUrl.searchParams.has('priceMax')) {
      searchUrl.searchParams.append('priceMin', '0');
      searchUrl.searchParams.append('priceMax', '1000000'); // Set a reasonable high default
    }

    // Add default parameters
    searchUrl.searchParams.append('limit', req.query.limit || '50');
    searchUrl.searchParams.append('offset', req.query.offset || '0');

    console.log('Search parameters:', {
      company: process.env.NEXT_PUBLIC_COMPANY_URI,
      url: searchUrl.toString(),
      query: Object.fromEntries(searchUrl.searchParams.entries())
    });

    // Make request to Ankor API
    const response = await fetch(searchUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    let errorData = {};
    if (!response.ok) {
      try {
        const text = await response.text();
        console.error('Raw error response:', text);
        try {
          errorData = JSON.parse(text);
        } catch (e) {
          errorData = { message: text };
        }
      } catch (e) {
        console.warn('Failed to parse error response:', e);
      }
      
      console.error('Ankor API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        url: searchUrl.toString(),
        headers: Object.fromEntries(response.headers.entries())
      });
      
      // Handle specific error cases
      if (response.status === 400) {
        throw new Error(errorData.message || 'Invalid search parameters. Please check your filters and try again.');
      } else if (response.status === 401) {
        throw new Error('Authentication failed. Please try again.');
      } else if (response.status === 403) {
        throw new Error('Company not authorized. Please check your company registration.');
      } else {
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
      }
    }

    const data = await response.json();
    
    console.log('Search results:', {
      totalHits: data.estHits,
      numberOfResults: data.hits?.length,
      sampleResult: data.hits?.[0]
    });

    // Transform response if needed
    const transformedData = {
      total: data.estHits || 0,
      hits: (data.hits || []).map(yacht => ({
        uri: yacht.uri,
        name: yacht.name || 'Unnamed Yacht',
        hero: yacht.hero,
        length: yacht.length,
        cabins: yacht.cabins,
        sleeps: yacht.sleeps,
        builtYear: yacht.builtYear,
        make: yacht.make,
        yachtType: yacht.yachtType,
        region: yacht.region,
        charterType: yacht.charterType,
        pricing: yacht.pricing || {
          currency: req.query.currency || 'USD',
          day: { from: null },
          week: { from: null }
        }
      }))
    };

    res.status(200).json(transformedData);
  } catch (error) {
    console.error('Search API Error:', {
      message: error.message,
      stack: error.stack
    });

    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.message || error.message || 'Internal server error';

    res.status(statusCode).json({
      error: errorMessage
    });
  }
} 