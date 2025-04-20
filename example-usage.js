/**
 * Example usage of the Yacht Search API in a separate project
 */

// Base URL of your deployment
const API_BASE_URL = 'https://your-deployment-url.com';

/**
 * Search for yachts using the API
 * @param {Object} searchParams - Search parameters
 * @returns {Promise<Object>} - Search results
 */
async function searchYachts(searchParams = {}) {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== '' && value != null) {
        queryParams.append(key, value);
      }
    });

    // Make API request
    const response = await fetch(`${API_BASE_URL}/api/search?${queryParams.toString()}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Yacht search error:', error);
    throw error;
  }
}

/**
 * Apply client-side filtering to yacht search results
 * @param {Array} yachts - Yacht search results
 * @param {Object} filters - Additional filters to apply
 * @returns {Array} - Filtered yacht results
 */
function applyClientSideFilters(yachts, filters = {}) {
  let filtered = [...yachts];
  
  // Filter by minimum cabins
  if (filters.minCabins) {
    const cabinsFilter = parseInt(filters.minCabins);
    filtered = filtered.filter(yacht => 
      yacht.cabins && parseInt(yacht.cabins) >= cabinsFilter
    );
  }
  
  // Filter by built year range
  if (filters.builtYearMin || filters.builtYearMax) {
    const minYear = filters.builtYearMin ? parseInt(filters.builtYearMin) : 1900;
    const maxYear = filters.builtYearMax ? parseInt(filters.builtYearMax) : new Date().getFullYear();
    
    filtered = filtered.filter(yacht => 
      yacht.builtYear && 
      parseInt(yacht.builtYear) >= minYear && 
      parseInt(yacht.builtYear) <= maxYear
    );
  }
  
  return filtered;
}

// Usage example
async function example() {
  try {
    // API-supported search parameters
    const searchParams = {
      region: 'Caribbean',
      yachtType: 'Catamaran',
      minLength: 30,
      currency: 'USD'
    };
    
    // Get results from API
    const apiResults = await searchYachts(searchParams);
    console.log(`Found ${apiResults.total} yachts from API`);
    
    // Apply client-side filtering
    const clientFilters = {
      minCabins: 3,
      builtYearMin: 2015,
      builtYearMax: 2023
    };
    
    const filteredResults = applyClientSideFilters(apiResults.hits, clientFilters);
    console.log(`Found ${filteredResults.length} yachts after client-side filtering`);
    
    // Do something with the filtered results
    filteredResults.forEach(yacht => {
      console.log(`${yacht.name} - ${yacht.yachtType} - ${yacht.length}m - ${yacht.cabins} cabins - Built ${yacht.builtYear}`);
    });
    
    return filteredResults;
  } catch (error) {
    console.error('Error in example:', error);
  }
}

// For React/Vue/Angular component usage:

// React example
/*
import React, { useState, useEffect } from 'react';

function YachtSearchComponent() {
  const [searchParams, setSearchParams] = useState({
    region: '',
    yachtType: '',
    minLength: '',
    currency: 'USD'
  });
  
  const [clientFilters, setClientFilters] = useState({
    minCabins: '',
    builtYearMin: '',
    builtYearMax: ''
  });
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get results from API
      const apiResults = await searchYachts(searchParams);
      
      // Apply client-side filtering
      const filteredResults = applyClientSideFilters(apiResults.hits, clientFilters);
      
      setResults({
        total: apiResults.total,
        filteredTotal: filteredResults.length,
        hits: filteredResults
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      {/* Search form UI *//*}
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'Searching...' : 'Search Yachts'}
      </button>
      
      {error && <div className="error">{error}</div>}
      
      {results && (
        <div>
          <h2>Found {results.filteredTotal} yachts</h2>
          {/* Results display UI *//*}
        </div>
      )}
    </div>
  );
}
*/

// Export functions for use in other files
export { searchYachts, applyClientSideFilters }; 
 