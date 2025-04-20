import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from 'next/router';
import Image from 'next/image';

// YachtDetail component for better separation of concerns
const YachtDetail = ({ yacht, onBackClick, imagesLoaded }) => {
  // Exit early if no yacht data
  if (!yacht) {
    console.log("YachtDetail: No yacht data provided to component");
    return null;
  }
  
  console.log("YachtDetail RENDER: Received yacht data with keys:", Object.keys(yacht));
  console.log("YachtDetail RENDER: Yacht name:", yacht.name || yacht.vesselName || yacht.title);
  console.log("YachtDetail RENDER: Yacht has hero image?", !!yacht.hero);
  console.log("YachtDetail RENDER: Yacht has featuredImage?", !!yacht.featuredImage);
  console.log("YachtDetail RENDER: Yacht has image?", !!yacht.image);
  
  // Extract additional information from description if available
  const extractedInfo = extractInfoFromDescription(yacht.description || "");
  
  // Combine data from API and extracted from description
  const combinedData = {
    ...yacht,
    ...extractedInfo
  };

  // Ensure we have a base URL for images
  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      console.log("getImageUrl: No image path provided, using default");
      return "/default-yacht.jpg";
    }
    
    // Check if the path already has a protocol (http/https)
    if (imagePath.startsWith('http')) {
      console.log("getImageUrl: Path already has protocol", imagePath.substring(0, 30) + "...");
      // For external URLs, ensure proper formatting
      try {
        // Use URL constructor to validate and normalize the URL
        const url = new URL(imagePath);
        // For URLs with specific size parameters, ensure proper formatting
        if (url.pathname.includes("{imageVariant}")) {
          url.pathname = url.pathname.replace("{imageVariant}", "1280x");
        }
        return url.toString();
      } catch (e) {
        console.error("Invalid image URL:", imagePath, e);
        return "/default-yacht.jpg";
      }
    }
    
    // Use environment variable with fallback
    const baseUrl = process.env.NEXT_PUBLIC_BASE_ANKOR_API_URL || '';
    console.log("getImageUrl: Using base URL:", baseUrl || "[empty string]");
    
    // Make sure we don't double up on slashes
    const formattedBasePath = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const formattedImagePath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    
    // Replace the image variant placeholder with the actual size
    const sizedPath = formattedImagePath.replace("{imageVariant}", "1280x");
    
    // Log the constructed image URL for debugging
    const fullUrl = `${formattedBasePath}${sizedPath}`;
    console.log("getImageUrl: Constructed image URL:", fullUrl);
    
    return fullUrl;
  };
  
  // Get yacht name with fallback
  const yachtName = yacht.name || yacht.vesselName || yacht.title || 'Unnamed Yacht';
  console.log("YachtDetail RENDER: Final yacht name to be displayed:", yachtName);
  
  // Get image URL with fallbacks
  const imageUrl = getImageUrl(yacht.hero || yacht.featuredImage || yacht.image);
  console.log("YachtDetail RENDER: Final image URL to be displayed:", imageUrl);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        onClick={onBackClick}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
      >
        Back to Yacht List
      </button>
      
      <div className="mt-6 bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Hero image */}
        <div className="relative h-96">
          {imagesLoaded ? (
            <Image 
              src={imageUrl}
              alt={yachtName}
              width={1280}
              height={720}
              className="object-cover w-full h-full"
              priority
              onError={(e) => {
                console.error("Error loading yacht image, falling back to default");
                e.target.onerror = null; 
                e.target.src = "/default-yacht.jpg";
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200"></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
            <div className="p-8">
              <h1 className="text-4xl font-bold text-white">{yachtName}</h1>
              <div className="flex items-center space-x-4 mt-2">
                <div className="text-white">
                  <span className="mr-1">{yacht.length || combinedData.length || 'N/A'}m</span>
                  {yacht.builtYear && yacht.builtYear !== 'N/A' && (
                    <span className="opacity-75">• Built {yacht.builtYear}</span>
                  )}
                  {combinedData.refitYear && (
                    <span className="opacity-75">• Refit {combinedData.refitYear}</span>
                  )}
                </div>
                {yacht.pricing && yacht.pricing.day && yacht.pricing.day.from && (
                  <div className="text-white">
                    <span className="font-bold">
                      {formatPrice(yacht.pricing.day.from, yacht.pricing.currency)}
                    </span>
                    <span className="opacity-75"> / day</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-8">
          {/* Combined information in a comprehensive layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Basic Specifications */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Basic Specifications</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-700 font-medium">Year Built</p>
                  <p className="font-bold text-gray-900">{yacht.builtYear || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-700 font-medium">Length</p>
                  <p className="font-bold text-gray-900">{yacht.length || 'N/A'}m</p>
                </div>
                <div>
                  <p className="text-gray-700 font-medium">Sleeps</p>
                  <p className="font-bold text-gray-900">{yacht.sleeps || combinedData.sleeps || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-700 font-medium">Make</p>
                  <p className="font-bold text-gray-900">{yacht.make || combinedData.builder || 'N/A'}</p>
                </div>
                {(yacht.cabins || combinedData.cabinsCount) && (
                  <div>
                    <p className="text-gray-700 font-medium">Cabins</p>
                    <p className="font-bold text-gray-900">{yacht.cabins || combinedData.cabinsCount}</p>
                  </div>
                )}
                {yacht.blueprint?.bathrooms && (
                  <div>
                    <p className="text-gray-700 font-medium">Bathrooms</p>
                    <p className="font-bold text-gray-900">{yacht.blueprint.bathrooms}</p>
                  </div>
                )}
                {combinedData.crew && (
                  <div>
                    <p className="text-gray-700 font-medium">Crew</p>
                    <p className="font-bold text-gray-900">{combinedData.crew}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Pricing Info */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Pricing</h2>
              {yacht.pricing && (yacht.pricing.day?.from || yacht.pricing.week?.from) ? (
                <div className="space-y-4">
                  {yacht.pricing.day?.from && (
                    <div className="border rounded-lg p-4">
                      <p className="text-gray-700 font-medium">Daily Charter</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatPrice(yacht.pricing.day.from, yacht.pricing.currency)}
                      </p>
                      {yacht.pricing.estimated && (
                        <p className="text-sm text-gray-600 mt-1">* Estimateds from weekly price</p>
                      )}
                    </div>
                  )}
                  {yacht.pricing.week?.from && (
                    <div className="border rounded-lg p-4">
                      <p className="text-gray-700 font-medium">Weekly Charter</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatPrice(yacht.pricing.week.from, yacht.pricing.currency)}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-lg text-gray-700">Price on request</p>
              )}
            </div>
          </div>
          
          {/* Detailed Specifications Section */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Detailed Specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Technical Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-bold mb-3 text-gray-800">Technical Details</h3>
                <div className="space-y-2">
                  {yacht.draft && (
                    <div>
                      <p className="text-gray-700 font-medium">Draft</p>
                      <p className="font-bold text-gray-900">{yacht.draft}m</p>
                    </div>
                  )}
                  {yacht.beam && (
                    <div>
                      <p className="text-gray-700 font-medium">Beam</p>
                      <p className="font-bold text-gray-900">{yacht.beam}m</p>
                    </div>
                  )}
                  {yacht.grossTonnage && (
                    <div>
                      <p className="text-gray-700 font-medium">Gross Tonnage</p>
                      <p className="font-bold text-gray-900">{yacht.grossTonnage}</p>
                    </div>
                  )}
                  {yacht.enginePower && (
                    <div>
                      <p className="text-gray-700 font-medium">Engine Power</p>
                      <p className="font-bold text-gray-900">{yacht.enginePower}</p>
                    </div>
                  )}
                  {(yacht.maxSpeed || combinedData.maxSpeed) && (
                    <div>
                      <p className="text-gray-700 font-medium">Max Speed</p>
                      <p className="font-bold text-gray-900">{yacht.maxSpeed || combinedData.maxSpeed} knots</p>
                    </div>
                  )}
                  {(yacht.cruisingSpeed || combinedData.cruisingSpeed) && (
                    <div>
                      <p className="text-gray-700 font-medium">Cruising Speed</p>
                      <p className="font-bold text-gray-900">{yacht.cruisingSpeed || combinedData.cruisingSpeed} knots</p>
                    </div>
                  )}
                  {combinedData.homePort && (
                    <div>
                      <p className="text-gray-700 font-medium">Home Port</p>
                      <p className="font-bold text-gray-900">{combinedData.homePort}</p>
                    </div>
                  )}
                  {combinedData.operatingArea && (
                    <div>
                      <p className="text-gray-700 font-medium">Operating Area</p>
                      <p className="font-bold text-gray-900">{combinedData.operatingArea}</p>
                    </div>
                  )}
                  {combinedData.builder && (
                    <div>
                      <p className="text-gray-700 font-medium">Builder</p>
                      <p className="font-bold text-gray-900">{combinedData.builder}</p>
                    </div>
                  )}
                  {combinedData.designer && (
                    <div>
                      <p className="text-gray-700 font-medium">Interior Designer</p>
                      <p className="font-bold text-gray-900">{combinedData.designer}</p>
                    </div>
                  )}
                  {/* Fallback message if no technical details available */}
                  {!yacht.draft && !yacht.beam && !yacht.grossTonnage && 
                   !yacht.enginePower && !combinedData.maxSpeed && !combinedData.cruisingSpeed && 
                   !combinedData.homePort && !combinedData.operatingArea && !combinedData.builder && 
                   !combinedData.designer && (
                    <p className="text-gray-800 italic">Technical details not provided</p>
                  )}
                </div>
              </div>
              
              {/* Accommodation */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-bold mb-3 text-gray-800">Accommodation</h3>
                <div className="space-y-2">
                  {(yacht.cabins || combinedData.cabinsCount) && (
                    <div>
                      <p className="text-gray-700 font-medium">Cabins</p>
                      <p className="font-bold text-gray-900">{yacht.cabins || combinedData.cabinsCount}</p>
                    </div>
                  )}
                  {(yacht.blueprint?.masterCabins || combinedData.masterCabins) && (
                    <div>
                      <p className="text-gray-700 font-medium">Master Cabins</p>
                      <p className="font-bold text-gray-900">{yacht.blueprint?.masterCabins || combinedData.masterCabins}</p>
                    </div>
                  )}
                  {(yacht.blueprint?.vipCabins || combinedData.vipCabins) && (
                    <div>
                      <p className="text-gray-700 font-medium">VIP Cabins</p>
                      <p className="font-bold text-gray-900">{yacht.blueprint?.vipCabins || combinedData.vipCabins}</p>
                    </div>
                  )}
                  {(yacht.blueprint?.doubleCabins || combinedData.doubleCabins) && (
                    <div>
                      <p className="text-gray-700 font-medium">Double Cabins</p>
                      <p className="font-bold text-gray-900">{yacht.blueprint?.doubleCabins || combinedData.doubleCabins}</p>
                    </div>
                  )}
                  {(yacht.blueprint?.twinCabins || combinedData.twinCabins) && (
                    <div>
                      <p className="text-gray-700 font-medium">Twin Cabins</p>
                      <p className="font-bold text-gray-900">{yacht.blueprint?.twinCabins || combinedData.twinCabins}</p>
                    </div>
                  )}
                  {(yacht.blueprint?.crewCabins || combinedData.crewCabins) && (
                    <div>
                      <p className="text-gray-700 font-medium">Crew Cabins</p>
                      <p className="font-bold text-gray-900">{yacht.blueprint?.crewCabins || combinedData.crewCabins}</p>
                    </div>
                  )}
                  {(yacht.sleeps || combinedData.sleeps) && (
                    <div>
                      <p className="text-gray-700 font-medium">Sleeps</p>
                      <p className="font-bold text-gray-900">{yacht.sleeps || combinedData.sleeps}</p>
                    </div>
                  )}
                  {combinedData.crew && (
                    <div>
                      <p className="text-gray-700 font-medium">Crew Size</p>
                      <p className="font-bold text-gray-900">{combinedData.crew}</p>
                    </div>
                  )}
                  {combinedData.cabinConfiguration && (
                    <div>
                      <p className="text-gray-700 font-medium">Cabin Configuration</p>
                      <p className="font-bold text-gray-900">{combinedData.cabinConfiguration}</p>
                    </div>
                  )}
                  {/* Fallback message if no accommodation details available */}
                  {!yacht.cabins && !yacht.blueprint?.masterCabins && !combinedData.cabinConfiguration &&
                   !yacht.blueprint?.vipCabins && !yacht.blueprint?.doubleCabins && 
                   !yacht.blueprint?.twinCabins && !yacht.blueprint?.crewCabins && 
                   !yacht.sleeps && !combinedData.crew && !combinedData.cabinsCount && (
                    <p className="text-gray-800 italic">Accommodation details not provided</p>
                  )}
                </div>
              </div>
              
              {/* Amenities & Equipment */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-bold mb-3 text-gray-800">Amenities & Equipment</h3>
                <div className="space-y-2">
                  {yacht.amenities && yacht.amenities.length > 0 && (
                    <div>
                      <p className="text-gray-700 font-medium">Amenities</p>
                      <ul className="list-disc pl-5">
                        {yacht.amenities.map((amenity, index) => (
                          <li key={index} className="text-gray-900">{amenity}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {yacht.equipment && yacht.equipment.length > 0 && (
                    <div className="mt-3">
                      <p className="text-gray-700 font-medium">Water Toys & Equipment</p>
                      <ul className="list-disc pl-5">
                        {yacht.equipment.map((item, index) => (
                          <li key={index} className="text-gray-900">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {combinedData.yachtType && (
                    <div>
                      <p className="text-gray-700 font-medium">Yacht Type</p>
                      <p className="font-bold text-gray-900">{combinedData.yachtType}</p>
                    </div>
                  )}
                  {/* Fallback message if no amenities or equipment listed */}
                  {(!yacht.amenities || yacht.amenities.length === 0) && 
                   (!yacht.equipment || yacht.equipment.length === 0) && 
                   !combinedData.yachtType && (
                    <p className="text-gray-800 italic">Amenities and equipment details not provided</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional Information */}
          {yacht.description && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Description</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-900 leading-relaxed">{yacht.description}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to format price - moved outside component for reuse
const formatPrice = (price, currency = "USD") => {
  if (!price && price !== 0) return "Price on request";
  
  // Use currency symbol based on the currency
  const currencySymbol = 
    currency === "EUR" ? "€" : 
    currency === "GBP" ? "£" : 
    currency === "AUD" ? "A$" : "$";
  
  return `From ${currencySymbol}${price.toLocaleString()}`;
};

// Helper function to extract information from description - moved outside component for cleaner code
const extractInfoFromDescription = (description) => {
  if (!description) return {};
  
  const info = {};
  
  // Extract cruising speed with improved regex
  const cruisingMatch = description.match(/Cruising at (\d+\.?\d*)/);
  if (cruisingMatch && cruisingMatch[1]) {
    info.cruisingSpeed = parseFloat(cruisingMatch[1]);
  }
  
  // Extract top speed with improved regex
  const topSpeedMatch = description.match(/top speed of (\d+\.?\d*)/);
  if (topSpeedMatch && topSpeedMatch[1]) {
    info.maxSpeed = parseFloat(topSpeedMatch[1]);
  }
  
  // Extract crew count
  const crewMatch = description.match(/crew of (\d+)/);
  if (crewMatch && crewMatch[1]) {
    info.crew = parseInt(crewMatch[1]);
  }
  
  // Extract the number of guests it sleeps
  const sleepsMatch = description.match(/Sleeping (\d+) guests/);
  if (sleepsMatch && sleepsMatch[1]) {
    info.sleeps = parseInt(sleepsMatch[1]);
  }
  
  // Extract cabin count
  const cabinsMatch = description.match(/in (\d+) cabins/);
  if (cabinsMatch && cabinsMatch[1]) {
    info.cabinsCount = parseInt(cabinsMatch[1]);
  }
  
  // Extract operating areas - improved to avoid including other text
  const operatingAreaMatch = description.match(/Operating Area: ([^.]+)/);
  if (operatingAreaMatch && operatingAreaMatch[1]) {
    info.operatingArea = operatingAreaMatch[1].trim();
  }
  
  // Extract home port - improved to avoid including other text
  const homePortMatch = description.match(/Base \/ Home Port: ([^,]+)/);
  if (homePortMatch && homePortMatch[1]) {
    info.homePort = homePortMatch[1].trim();
  }
  
  // Extract yacht type
  const yachtTypeMatch = description.match(/(\w+) Megayacht/i) || description.match(/(\w+) Yacht/i);
  if (yachtTypeMatch && yachtTypeMatch[1]) {
    info.yachtType = yachtTypeMatch[1] + " Yacht";
  }
  
  // Extract builder
  const builderMatch = description.match(/built in \d{4} by ([^with]+)/);
  if (builderMatch && builderMatch[1]) {
    info.builder = builderMatch[1].trim();
  }
  
  // Extract interior designer
  const designerMatch = description.match(/interior design by ([^and]+)/);
  if (designerMatch && designerMatch[1]) {
    info.designer = designerMatch[1].trim();
  }
  
  // Extract refit year
  const refitMatch = description.match(/refit in (\d{4})/);
  if (refitMatch && refitMatch[1]) {
    info.refitYear = parseInt(refitMatch[1]);
  }
  
  // Extract cabin configuration
  const cabinConfigMatch = description.match(/guest cabins comprise ([^.]+)/);
  if (cabinConfigMatch && cabinConfigMatch[1]) {
    info.cabinConfiguration = cabinConfigMatch[1].trim();
  }
  
  return info;
};

export default function Yacht() {
  // All hooks must be declared at the top level
  const router = useRouter();
  const [yachts, setYachts] = useState([]); // Holds all yachts
  const [displayYachts, setDisplayYachts] = useState([]); // Shows initial 6
  const [loading, setLoading] = useState(true); // Skeleton loader for first 6
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false); // Loader for "View All"
  const [selectedYacht, setSelectedYacht] = useState(null); // For detailed view
  const [loadingDetail, setLoadingDetail] = useState(false); // Loading state for detailed view
  const [imagesLoaded, setImagesLoaded] = useState(false); // To prevent hydration mismatches
  const [yachtDetails, setYachtDetails] = useState({}); // Store detailed yacht information

  // Set imagesLoaded to true on client-side only
  useEffect(() => {
    setImagesLoaded(true);
  }, []);

  // Fetch yachts on mount
  useEffect(() => {
    fetchYachtsData();
  }, [router.query.uri]);

  // Separated fetch function to allow retrying
  const fetchYachtsData = async () => {
    try {
      setLoading(true);
      setError(""); // Clear any previous errors
      
      // If URI is in query params, fetch detailed information for that yacht
      if (router.query.uri) {
        setLoadingDetail(true);
        try {
          // Set a timeout for the request
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
          
          // Fetch both basic and detailed information in one request
          console.log("===== YACHT DETAIL DEBUGGING =====");
          console.log("Fetching yacht details for URI:", router.query.uri);
          
          // Try with original parameters
          let detailResponse = await axios.get(
            `/api/yacht?uri=${encodeURIComponent(router.query.uri)}&includeDetailedSpecs=true`,
            { signal: controller.signal }
          );
          
          // Clear the timeout
          clearTimeout(timeoutId);
          
          console.log("Yacht detail API response status:", detailResponse.status);
          
          // Enhanced logging of the raw response data
          console.log("===== RAW API RESPONSE DATA STRUCTURE =====");
          console.log("Response data type:", typeof detailResponse.data);
          
          // Log the top-level structure
          if (detailResponse.data) {
            console.log("Top-level keys:", Object.keys(detailResponse.data));
            
            // Log specific details about important structures
            // Look for common patterns in the API response
            if (detailResponse.data.yacht) {
              console.log("Found 'yacht' property with keys:", Object.keys(detailResponse.data.yacht));
            }
            
            if (detailResponse.data.vessel) {
              console.log("Found 'vessel' property with keys:", Object.keys(detailResponse.data.vessel));
            }
            
            if (detailResponse.data.data) {
              console.log("Found 'data' property with keys:", Object.keys(detailResponse.data.data));
            }
            
            if (detailResponse.data.hit) {
              console.log("Found 'hit' property with keys:", Object.keys(detailResponse.data.hit));
            }
            
            if (detailResponse.data.hits && Array.isArray(detailResponse.data.hits)) {
              console.log("Found 'hits' array with length:", detailResponse.data.hits.length);
              if (detailResponse.data.hits.length > 0) {
                console.log("First hit keys:", Object.keys(detailResponse.data.hits[0]));
              }
            }
            
            // Check for key yacht details that we need
            ['name', 'vesselName', 'title', 'hero', 'featuredImage', 'image', 'description'].forEach(key => {
              if (detailResponse.data[key]) {
                console.log(`Direct ${key} property:`, detailResponse.data[key]);
              }
            });
          }
          
          // Check if the API response has the expected format
          let yachtData = normalizeYachtData(detailResponse.data);
          
          // Log any potential issues with the normalized data
          if (!yachtData || Object.keys(yachtData).length === 0) {
            console.error("Failed to normalize yacht data - empty object returned");
          }
          
          if (!yachtData.name && !yachtData.vesselName && !yachtData.title) {
            console.warn("Normalized data missing yacht name - available keys:", Object.keys(yachtData));
          }
          
          if (!yachtData.hero && !yachtData.featuredImage && !yachtData.image) {
            console.warn("Normalized data missing image - available keys:", Object.keys(yachtData));
          }
          
          // We'll focus on data from the first endpoint since the second one is 404
          // No need to try the alternative endpoint that doesn't exist
          
          console.log("NORMALIZED YACHT DATA:", yachtData);
          console.log("Data has name property:", !!(yachtData.name || yachtData.vesselName || yachtData.title));
          console.log("Data has hero/image property:", !!(yachtData.hero || yachtData.featuredImage || yachtData.image));
          console.log("Available properties:", Object.keys(yachtData));
          
          if (yachtData.description) {
            console.log("Has description, extracting additional info");
            const extractedInfo = extractInfoFromDescription(yachtData.description || "");
            console.log("Extracted info from description:", extractedInfo);
          }
          
          setSelectedYacht(yachtData);
        } catch (detailError) {
          console.error("Error fetching yacht details:", detailError);
          
          // Check if it's a timeout error
          if (detailError.name === 'AbortError' || detailError.message?.includes('timeout')) {
            setError("The request timed out. The server may be busy. Please try again.");
          } else {
            setError(`Error fetching yacht details: ${detailError.message}`);
          }
        } finally {
          setLoadingDetail(false);
          setLoading(false);
        }
        return;
      }
      
      // Otherwise fetch the yacht list with some additional details
      try {
        // Set a timeout for the request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await axios.get(
          "/api/yacht?limit=50&includeBasicSpecs=true",
          { signal: controller.signal }
        );
        
        // Clear the timeout
        clearTimeout(timeoutId);
        
        // Log the response to debug
        console.log("Yacht list API Response received");
        console.log("First 2 yachts in list:", response.data.hits ? response.data.hits.slice(0, 2) : "No hits property");
        
        // Check if response.data itself is the object with hits property
        const data = response.data;
        const yachtList = data.hits || [];
        
        if (yachtList.length === 0) {
          console.warn("No yachts returned from API");
        } else {
          console.log(`Received ${yachtList.length} yachts from API`);
          // Log a sample yacht to see its structure
          if (yachtList[0]) {
            console.log("Sample yacht from list - available properties:", Object.keys(yachtList[0]));
            console.log("Sample yacht URI:", yachtList[0].uri);
            console.log("Sample yacht name:", yachtList[0].name || yachtList[0].vesselName || yachtList[0].title);
          }
        }
        
        setYachts(yachtList); // Store all yachts
        setDisplayYachts(yachtList.slice(0, 6)); // Show first 6
      } catch (listError) {
        console.error("Error fetching yacht list:", listError);
        
        // Check if it's a timeout error
        if (listError.name === 'AbortError' || listError.message?.includes('timeout')) {
          setError("The request timed out. The server may be busy. Please try again.");
        } else {
          setError(`Error fetching yacht list: ${listError.message}`);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      console.error("Error fetching yachts:", err);
    } finally {
      setLoading(false);
    }
  };

  // Log yacht data for debugging purposes
  useEffect(() => {
    if (yachts.length > 0) {
      console.log("First yacht pricing data:", yachts[0].pricing);
    }
    
    if (selectedYacht) {
      console.log("Selected yacht pricing data:", selectedYacht.pricing);
      // Log the entire yacht object to see all available properties
      console.log("Complete selected yacht data:", selectedYacht);
      
      // Log image URL to debug image loading issues
      if (selectedYacht.hero) {
        const imageUrl = `${process.env.NEXT_PUBLIC_BASE_ANKOR_API_URL || ''}${selectedYacht.hero.replace("{imageVariant}", "1280x")}`;
        console.log("Yacht image URL:", imageUrl);
      } else {
        console.log("No hero image available for this yacht");
      }
    }
  }, [yachts, selectedYacht]);

  // Load all yachts when "View All Yachts" is clicked
  const handleViewAllClick = () => {
    setShowAll(true);
    setLoadingAll(true);

    setTimeout(() => {
      setDisplayYachts(yachts); // Show all yachts
      setLoadingAll(false);
    }, 500); // Simulating API delay
  };
  
  // View detailed information for a yacht
  const viewYachtDetail = (uri) => {
    // Ensure we have a URI to navigate to
    if (!uri) {
      console.error("Missing URI for yacht detail view");
      return;
    }

    console.log(`Viewing details for yacht with URI: ${uri}`);
    console.log('CLICK DEBUG: Navigating to yacht detail page');
    router.push(`/yacht?uri=${encodeURIComponent(uri)}`);
  };
  
  // Go back to yacht list
  const handleBackToList = () => {
    setSelectedYacht(null);
    router.push('/yacht');
  };

  // Helper to get correct image URL with fallbacks
  const getImageUrl = (yacht, size = "320x") => {
    if (!yacht) return "/default-yacht.jpg";
    
    const imagePath = yacht.hero || yacht.featuredImage || yacht.image;
    if (!imagePath) return "/default-yacht.jpg";
    
    // Check if the path already has a protocol (http/https)
    if (imagePath.startsWith('http')) {
      // For external URLs, make sure they're properly encoded
      try {
        // Use URL constructor to validate and normalize the URL
        const url = new URL(imagePath);
        // For URLs with specific size parameters, ensure proper formatting
        if (url.pathname.includes("{imageVariant}")) {
          url.pathname = url.pathname.replace("{imageVariant}", size);
        }
        return url.toString();
      } catch (e) {
        console.error("Invalid image URL:", imagePath, e);
        return "/default-yacht.jpg";
      }
    }
    
    // For relative URLs from the API that need base URL and size substitution
    try {
      // Use environment variable with fallback
      const baseUrl = process.env.NEXT_PUBLIC_BASE_ANKOR_API_URL || '';
      // Make sure we don't double up on slashes
      const formattedBasePath = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      const formattedImagePath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
      
      // Replace the image variant placeholder with the actual size
      const sizedPath = formattedImagePath.replace("{imageVariant}", size);
      
      return `${formattedBasePath}${sizedPath}`;
    } catch (e) {
      console.error("Error formatting image URL:", e);
      return "/default-yacht.jpg";
    }
  };
  
  // Helper to get yacht name with fallbacks
  const getYachtName = (yacht) => {
    if (!yacht) return 'Unnamed Yacht';
    return yacht.name || yacht.vesselName || yacht.title || 'Unnamed Yacht';
  };

  // Render yacht detail view with all information
  const renderYachtDetail = () => {
    if (loadingDetail) {
      return (
        <div className="font-pp py-8 md:py-16 px-4 md:px-12">
          <div className="bg-stone-100 border-8 border-white rounded-2xl shadow-lg overflow-hidden w-full animate-pulse">
            <div className="w-full h-64 bg-gray-300" />
            <div className="p-4 flex flex-col gap-2">
              <div className="h-4 bg-gray-300 rounded w-1/3"></div>
              <div className="h-6 bg-gray-300 rounded w-2/3"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      );
    }
    
    // Use the new separate component for yacht details
    return <YachtDetail 
      yacht={selectedYacht} 
      onBackClick={handleBackToList} 
      imagesLoaded={imagesLoaded} 
    />;
  };

  // Render error state with retry button
  const renderErrorState = () => {
    return (
      <div className="text-center py-10">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={fetchYachtsData}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Retry
        </button>
      </div>
    );
  };

  // Render yacht listing (default view)
  const renderYachtListing = () => {
    return (
      <div className="font-pp py-8 md:py-16 px-4 md:px-12">
        {imagesLoaded && <hr />}
        <div className="flex flex-col gap-8">
          <div className="mt-[52px] flex flex-col lg:flex-row md:items-center items-start justify-between gap-5 lg:gap-24">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-center">
              Yachts for every occasion
            </h1>
            <p className="text-lg text-white-700 lg:w-1/3">
              From sailing yachts to catamarans, explore our global fleet of
              luxury yachts for your next unforgettable charter experience.
            </p>
          </div>
  
          <div className="grid grid-col-1 md:grid-cols-2 xl:grid-cols-3 gap-8 min-w-full">
            {loading
              ? // Show skeleton loaders while first 6 yachts load
                Array(6)
                  .fill(0)
                  .map((_, index) => (
                    <div
                      key={index}
                      className="bg-stone-100 border-8 border-white rounded-2xl shadow-lg overflow-hidden w-full animate-pulse"
                    >
                      <div className="w-full h-64 bg-gray-300" />
                      <div className="p-4 flex flex-col gap-2">
                        <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                        <div className="h-6 bg-gray-300 rounded w-2/3"></div>
                        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))
              : // Display actual yachts
                displayYachts.map((yacht, index) => (
                  <div
                    key={yacht.uri || index}
                    className="bg-white border-8 border-stone-100 rounded-2xl shadow-lg overflow-hidden w-full hover:shadow-xl transition-all cursor-pointer"
                    onClick={() => yacht.uri && viewYachtDetail(yacht.uri)}
                  >
                    <div className="relative">
                      {imagesLoaded ? (
                        <Image
                          src={getImageUrl(yacht)}
                          alt={getYachtName(yacht)}
                          width={640}
                          height={425}
                          className="w-full h-64 object-cover"
                          priority={index < 3} // Only prioritize the first few images
                          onError={(e) => {
                            console.log("Error loading yacht image in list, using fallback");
                            e.target.onerror = null; 
                            e.target.src = "/default-yacht.jpg";
                          }}
                        />
                      ) : (
                        <div className="w-full h-64 bg-gray-300"></div>
                      )}
                      {yacht.uri && (
                        <div className="absolute top-2 right-2 bg-black/50 text-xs px-2 py-1 rounded-full">
                          Click for details
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-black">{getYachtName(yacht)}</h3>
                      <div className="flex items-center justify-between mt-1">
                        <div className="text-sm text-gray-700">
                          <span>{yacht.length || 'N/A'}m</span>
                          {yacht.builtYear && yacht.builtYear !== 'N/A' && <span> • Built {yacht.builtYear}</span>}
                          {yacht.cabins && <span> • {yacht.cabins} cabins</span>}
                        </div>
                      </div>
                      <div className="mt-1">
                        {yacht.pricing && yacht.pricing.day && yacht.pricing.day.from ? (
                          <div className="font-bold text-black">
                            {formatPrice(yacht.pricing.day.from, yacht.pricing.currency)}
                            <span className="text-xs text-gray-700"> / day</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-700">Price on request</span>
                        )}
                      </div>
                      
                      {/* Single button to view all details */}
                      {yacht.uri && (
                        <div className="mt-3">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              viewYachtDetail(yacht.uri);
                            }}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-2 rounded"
                          >
                            View All Information
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
          </div>
  
          {!showAll && yachts.length > 6 && (
            <div className="flex justify-center mt-6 md:mt-14">
              <button
                className="px-6 py-3 font-medium bg-[--button] text-[--button-text] rounded-full text-lg hover:bg-[--button-sec]"
                onClick={handleViewAllClick}
              >
                {loadingAll ? "Loading..." : `View all yachts (${yachts.length})`}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render appropriate content based on the current state
  const renderContent = () => {
    if (error) {
      return renderErrorState();
    }
    
    if (selectedYacht) {
      return renderYachtDetail();
    }
    
    return renderYachtListing();
  };

  // Main render
  return renderContent();
}

// Function to normalize yacht data from various API response formats
const normalizeYachtData = (data) => {
  if (!data) {
    console.log("Normalizing data: Received null or undefined data");
    return {};
  }
  
  console.log("Normalizing data with type:", typeof data);
  
  // First, let's log ALL the top level properties to help with debugging
  console.log("All available top-level properties:", Object.keys(data));
  
  // Start with an empty result object
  let result = { ...data };
  
  // Special handling for blueprint - it contains most of the data in the detail view
  if (data.blueprint) {
    console.log("Found blueprint object with keys:", Object.keys(data.blueprint));
    
    // Extract name from blueprint
    if (data.blueprint.name) {
      result.name = data.blueprint.name;
      console.log("Using name from blueprint:", result.name);
    }
    
    // Extract first image from blueprint.images as hero image
    if (data.blueprint.images && data.blueprint.images.length > 0) {
      result.hero = data.blueprint.images[0];
      console.log("Using first image from blueprint.images as hero:", result.hero);
      
      // Also store all images for a gallery if needed
      result.allImages = data.blueprint.images;
    }
    
    // Map other important properties from blueprint to the top level
    const blueprintProps = ['make', 'model', 'sleeps', 'cabins', 'builtYear', 
                          'length', 'beam', 'draft', 'cruiseSpeed', 'topSpeed'];
                          
    blueprintProps.forEach(prop => {
      if (data.blueprint[prop] !== undefined) {
        result[prop] = data.blueprint[prop];
        console.log(`Mapped blueprint.${prop} to top level:`, result[prop]);
      }
    });
    
    // Extract amenities and convert to flat array if needed
    if (data.blueprint.amenities && Array.isArray(data.blueprint.amenities)) {
      if (typeof data.blueprint.amenities[0] === 'object') {
        // If amenities are objects with label/quantity, convert to strings
        result.amenities = data.blueprint.amenities.map(a => 
          a.quantity > 1 ? `${a.label} (${a.quantity})` : a.label
        );
        console.log("Converted amenities objects to strings");
      } else {
        // If already strings, use as is
        result.amenities = data.blueprint.amenities;
      }
    }
    
    // Extract toys and convert to equipment array if needed
    if (data.blueprint.toys && Array.isArray(data.blueprint.toys)) {
      if (typeof data.blueprint.toys[0] === 'object') {
        // If toys are objects with label/quantity, convert to strings
        result.equipment = data.blueprint.toys.map(t => 
          t.quantity > 1 ? `${t.label} (${t.quantity})` : t.label
        );
        console.log("Converted toys objects to equipment strings");
      } else {
        // If already strings, use as is
        result.equipment = data.blueprint.toys;
      }
    }
  }
  
  // Check for direct properties on the main data object
  const commonProps = ['name', 'vesselName', 'title', 'hero', 'featuredImage', 'image', 
                       'description', 'length', 'builtYear', 'sleeps', 'cabins', 'make',
                       'pricing', 'amenities', 'equipment'];
  
  // Only override with direct properties if they don't exist yet
  commonProps.forEach(prop => {
    if (data[prop] !== undefined && result[prop] === undefined) {
      result[prop] = data[prop];
      console.log(`Using direct property ${prop} from data`);
    }
  });
  
  // Check for nested objects that might contain yacht data
  const nestedLocations = ['yacht', 'vessel', 'data', 'hit', 'result'];
  
  for (const location of nestedLocations) {
    if (data[location] && Object.keys(result).length <= 1) {
      console.log(`Found data in nested '${location}' property`);
      return normalizeYachtData(data[location]); // Recursively normalize
    }
  }
  
  // For APIs returning an array, take the first item
  if (Array.isArray(data) && data.length > 0) {
    console.log("Data is an array with length:", data.length);
    console.log("Using first item from array");
    return normalizeYachtData(data[0]); // Recursively normalize
  }
  
  // Check if data has 'hits' that might contain yacht info
  if (data.hits && Array.isArray(data.hits) && data.hits.length > 0) {
    console.log("Found data in 'hits' array, using first item");
    return normalizeYachtData(data.hits[0]); // Recursively normalize
  }
  
  console.log("Normalized data result has keys:", Object.keys(result));
  return result;
}; 