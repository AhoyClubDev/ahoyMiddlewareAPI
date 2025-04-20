import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';

export default function ShipDetails() {
  const router = useRouter();
  const [yacht, setYacht] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Use useEffect for client-side image loading to prevent hydration issues
  useEffect(() => {
    setImagesLoaded(true);
  }, []);

  // Fetch yacht details when the URI is available
  useEffect(() => {
    async function fetchYachtDetails() {
      if (!router.query.uri) return;

      try {
        setLoading(true);
        const response = await axios.get(`/api/yacht?uri=${encodeURIComponent(router.query.uri)}`);
        console.log('Yacht details:', response.data);
        setYacht(response.data);
      } catch (err) {
        console.error('Error fetching yacht details:', err);
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchYachtDetails();
  }, [router.query.uri]);
  
  // Helper function to format price
  const formatPrice = (price, currency = "USD") => {
    if (!price && price !== 0) return "Price on request";
    
    // Use currency symbol based on the currency
    const currencySymbol = 
      currency === "EUR" ? "€" : 
      currency === "GBP" ? "£" : 
      currency === "AUD" ? "A$" : "$";
    
    return `${currencySymbol}${price.toLocaleString()}`;
  };
  
  // Helper function to format dates consistently between server and client
  const formatDateString = (dateString) => {
    if (!dateString) return "N/A";
    // Use YYYY-MM-DD format to ensure consistency between server and client
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      return dateString; // Fallback to original string if parsing fails
    }
  };
  
  // Helper function to properly format yacht image URLs
  const getYachtImageUrl = (imagePath) => {
    if (!imagePath) return '/default-yacht.jpg';
    
    // Check if the path already has a protocol
    if (imagePath.startsWith('http')) {
      try {
        const url = new URL(imagePath);
        if (url.pathname.includes('{imageVariant}')) {
          url.pathname = url.pathname.replace('{imageVariant}', '1280x');
        }
        return url.toString();
      } catch (e) {
        console.error('Invalid image URL:', imagePath);
        return '/default-yacht.jpg';
      }
    }
    
    // Use environment variable with fallback
    const baseUrl = process.env.NEXT_PUBLIC_BASE_ANKOR_API_URL || '';
    const formattedBasePath = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const formattedImagePath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    
    // Replace image variant placeholder
    const sizedPath = formattedImagePath.replace('{imageVariant}', '1280x');
    
    return `${formattedBasePath}${sizedPath}`;
  }
  
  // Render loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="w-full h-96 bg-gray-200 animate-pulse rounded-lg mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>Error: {error}</p>
        </div>
        <Link href="/yacht">
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
            Back to Yacht List
          </button>
        </Link>
      </div>
    );
  }

  // Render no yacht data state
  if (!yacht) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p>No yacht data available.</p>
        </div>
        <Link href="/yacht">
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
            Back to Yacht List
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/yacht">
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-6">
          Back to Yacht List
        </button>
      </Link>

      {/* Hero Section */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
        <div className="relative h-96">
          {imagesLoaded ? (
            <Image 
              src={yacht.hero ? getYachtImageUrl(yacht.hero) : '/default-yacht.jpg'} 
              alt={yacht.name || 'Yacht'}
              width={1280}
              height={720}
              className="object-cover w-full h-full"
              priority
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = '/default-yacht.jpg';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200"></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70 flex items-end">
            <div className="p-6 text-white">
              <h1 className="text-3xl md:text-4xl font-bold">{yacht.name || 'Unnamed Yacht'}</h1>
              <p className="text-xl opacity-90">{yacht.make || 'Unknown Make'}</p>
            </div>
          </div>
        </div>

        {/* Detailed Specifications */}
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">Detailed Specifications</h2>
          
          {/* Main Specifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-500 mb-1">Length</h3>
              <p className="text-xl font-bold">{yacht.length || 'N/A'}m</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-500 mb-1">Year Built</h3>
              <p className="text-xl font-bold">{yacht.builtYear || 'N/A'}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-500 mb-1">Make</h3>
              <p className="text-xl font-bold">{yacht.make || 'N/A'}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-500 mb-1">Cabins</h3>
              <p className="text-xl font-bold">{yacht.cabins || 'N/A'}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-500 mb-1">Sleeps</h3>
              <p className="text-xl font-bold">{yacht.sleeps || 'N/A'}</p>
            </div>
            
            {yacht.blueprint?.bathrooms && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-500 mb-1">Bathrooms</h3>
                <p className="text-xl font-bold">{yacht.blueprint.bathrooms}</p>
              </div>
            )}
          </div>
          
          {/* Pricing Information */}
          <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">Pricing Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {yacht.pricing?.day?.from && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-500 mb-1">Daily Charter</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {formatPrice(yacht.pricing.day.from, yacht.pricing.currency)}
                </p>
                {yacht.pricing.estimated && (
                  <p className="text-sm text-gray-500 mt-1">* Estimated from weekly price</p>
                )}
              </div>
            )}
            
            {yacht.pricing?.week?.from && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-500 mb-1">Weekly Charter</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {formatPrice(yacht.pricing.week.from, yacht.pricing.currency)}
                </p>
              </div>
            )}
          </div>
          
          {/* Additional Details */}
          {yacht.description && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">Description</h2>
              <p className="text-gray-700 leading-relaxed">{yacht.description}</p>
            </div>
          )}
          
          {/* Additional specifications if available */}
          {yacht.specifications && Object.keys(yacht.specifications).length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">Additional Specifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(yacht.specifications).map(([key, value]) => (
                  value && (
                    <div key={key} className="bg-gray-50 p-3 rounded">
                      <h3 className="font-semibold text-gray-500 text-sm">{key.replace(/([A-Z])/g, ' $1').trim()}</h3>
                      <p className="font-medium">{value}</p>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 