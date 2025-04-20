import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const YachtSearch = () => {
  const [searchParams, setSearchParams] = useState({
    name: '',
    yachtType: '',
    region: '',
    charterType: '',
    minLength: '',
    maxLength: '',
    sleeps: '',
    currency: 'USD',
    priceMin: '',
    priceMax: '',
    cabins: '',
    builtYearMin: '',
    builtYearMax: ''
  });

  const [searchResults, setSearchResults] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const yachtTypes = [
    'Gulet',
    'Sailing',
    'Catamaran',
    'Motor',
    'Power Catamaran',
    'Classic',
    'Expedition',
    'Sport fishing'
  ];

  const regions = [
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
  ];

  const charterTypes = [
    'Bareboat',
    'Crewed'
  ];

  const currencies = [
    'USD', 'EUR', 'GBP', 'AUD', 'AED', 'SGD', 
    'HKD', 'JPY', 'CAD', 'CHF', 'BTC', 'ETH'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate numeric inputs
      const numericFields = ['minLength', 'maxLength', 'sleeps', 'priceMin', 'priceMax'];
      const params = { ...searchParams };
      
      // Remove client-side only filters before sending to API
      const { cabins, builtYearMin, builtYearMax, ...apiParams } = params;
      
      numericFields.forEach(field => {
        if (apiParams[field]) {
          const num = parseInt(apiParams[field], 10);
          if (isNaN(num)) {
            delete apiParams[field];
          } else {
            apiParams[field] = num;
          }
        }
      });

      // Build query string from validated params
      const queryParams = new URLSearchParams();
      Object.entries(apiParams).forEach(([key, value]) => {
        if (value !== '' && value != null) {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(`/api/search?${queryParams.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch yachts');
      }
      
      setSearchResults(data);
      
      // Apply client-side filtering for cabins and builtYear
      let filteredResults = { ...data };
      
      if (cabins && !isNaN(parseInt(cabins))) {
        const cabinsFilter = parseInt(cabins);
        filteredResults = {
          ...filteredResults,
          hits: filteredResults.hits.filter(yacht => 
            yacht.cabins && parseInt(yacht.cabins) >= cabinsFilter
          ),
          total: filteredResults.hits.filter(yacht => 
            yacht.cabins && parseInt(yacht.cabins) >= cabinsFilter
          ).length
        };
      }
      
      // Filter by built year range
      if ((builtYearMin && !isNaN(parseInt(builtYearMin))) || 
          (builtYearMax && !isNaN(parseInt(builtYearMax)))) {
        
        const minYear = builtYearMin ? parseInt(builtYearMin) : 1900;
        const maxYear = builtYearMax ? parseInt(builtYearMax) : new Date().getFullYear();
        
        filteredResults = {
          ...filteredResults,
          hits: filteredResults.hits.filter(yacht => 
            yacht.builtYear && 
            parseInt(yacht.builtYear) >= minYear && 
            parseInt(yacht.builtYear) <= maxYear
          ),
          total: filteredResults.hits.filter(yacht => 
            yacht.builtYear && 
            parseInt(yacht.builtYear) >= minYear && 
            parseInt(yacht.builtYear) <= maxYear
          ).length
        };
      }
      
      if (!filteredResults.hits?.length) {
        setResults({
          total: 0,
          hits: []
        });
        setError('No yachts found matching your criteria. Try adjusting your filters.');
        return;
      }
      
      setResults(filteredResults);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Yacht Search - Ankor API</title>
        <meta name="description" content="Search for yachts using various filters" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mr-4">
            &larr; Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-800">Yacht Search</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Search Form */}
          <div className="md:col-span-1">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
              {/* Yacht Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Yacht Name</label>
                <input
                  type="text"
                  name="name"
                  value={searchParams.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Charter Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Charter Type</label>
                <select
                  name="charterType"
                  value={searchParams.charterType}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select charter type</option>
                  {charterTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Yacht Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Yacht Type</label>
                <select
                  name="yachtType"
                  value={searchParams.yachtType}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select type</option>
                  {yachtTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Region */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Region</label>
                <select
                  name="region"
                  value={searchParams.region}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select region</option>
                  {regions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              {/* Length Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Min Length (m)</label>
                  <input
                    type="number"
                    name="minLength"
                    value={searchParams.minLength}
                    onChange={handleInputChange}
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Length (m)</label>
                  <input
                    type="number"
                    name="maxLength"
                    value={searchParams.maxLength}
                    onChange={handleInputChange}
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Guests */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Number of Guests</label>
                <input
                  type="number"
                  name="sleeps"
                  value={searchParams.sleeps}
                  onChange={handleInputChange}
                  min="1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Cabins (client-side filter) */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Min Cabins</label>
                <input
                  type="number"
                  name="cabins"
                  value={searchParams.cabins}
                  onChange={handleInputChange}
                  min="1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Client-side filter</p>
              </div>
              
              {/* Built Year (client-side filter) */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Built Year Range</label>
                <div className="grid grid-cols-2 gap-4 mt-1">
                  <div>
                    <input
                      type="number"
                      name="builtYearMin"
                      placeholder="From Year"
                      value={searchParams.builtYearMin}
                      onChange={handleInputChange}
                      min="1900"
                      max={new Date().getFullYear()}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      name="builtYearMax"
                      placeholder="To Year"
                      value={searchParams.builtYearMax}
                      onChange={handleInputChange}
                      min="1900"
                      max={new Date().getFullYear()}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Client-side filter</p>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Currency</label>
                <select
                  name="currency"
                  value={searchParams.currency}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {currencies.map(currency => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Min Price</label>
                  <input
                    type="number"
                    name="priceMin"
                    value={searchParams.priceMin}
                    onChange={handleInputChange}
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Price</label>
                  <input
                    type="number"
                    name="priceMax"
                    value={searchParams.priceMax}
                    onChange={handleInputChange}
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search Yachts'}
              </button>
            </form>
          </div>

          {/* Results Section */}
          <div className="md:col-span-2">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                {error}
              </div>
            )}

            {results && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Found {results.total} yachts
                </h2>
                <div className="grid gap-6">
                  {results.hits.map(yacht => (
                    <div key={yacht.uri} className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{yacht.name}</h3>
                          <p className="text-gray-600">
                            {yacht.make} • {yacht.yachtType} • {yacht.length}m
                          </p>
                          <p className="text-gray-600">
                            {yacht.cabins} Cabins • Sleeps {yacht.sleeps}
                          </p>
                          <p className="text-gray-600">
                            Built {yacht.builtYear} • {yacht.region}
                          </p>
                          <p className="text-gray-600">
                            Charter Type: {yacht.charterType || 'Not specified'}
                          </p>
                        </div>
                        <div className="text-right">
                          {yacht.pricing && (
                            <>
                              <p className="text-lg font-semibold text-gray-900">
                                {yacht.pricing.day?.from && 
                                  `${yacht.pricing.currency || searchParams.currency} ${yacht.pricing.day.from}/day`}
                              </p>
                              <p className="text-gray-600">
                                {yacht.pricing.week?.from && 
                                  `${yacht.pricing.currency || searchParams.currency} ${yacht.pricing.week.from}/week`}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default YachtSearch; 