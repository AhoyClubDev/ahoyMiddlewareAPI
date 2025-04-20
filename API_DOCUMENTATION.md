# Yacht Search API Documentation

## Overview

This API allows you to search for yacht listings using various filter parameters. It returns yacht data including specifications, pricing, and availability.

## Base URL

```
/api/search
```

## Authentication

No authentication is required to use this API.

## Endpoints

### GET /api/search

Search for yachts using various filters.

#### Request Parameters

| Parameter    | Type   | Required | Description                                      |
|--------------|--------|----------|--------------------------------------------------|
| name         | string | No       | Filter by vessel name                            |
| charterType  | string | No       | Filter by charter type (Bareboat/Crewed)         |
| minLength    | number | No       | Minimum vessel length in meters                  |
| maxLength    | number | No       | Maximum vessel length in meters                  |
| sleeps       | number | No       | Minimum number of guests the vessel can accommodate |
| yachtType    | string | No       | Type of vessel                                   |
| currency     | string | No       | Currency for price values (defaults to USD)      |
| priceMin     | number | No       | Minimum price                                    |
| priceMax     | number | No       | Maximum price                                    |
| region       | string | No       | Geographical region                              |
| limit        | number | No       | Maximum number of results to return (default: 50) |
| offset       | number | No       | Number of results to skip (for pagination)       |

#### Enum Values

**charterType**
- Bareboat
- Crewed

**yachtType**
- Gulet
- Sailing
- Catamaran
- Motor
- Power Catamaran
- Classic
- Expedition
- Sport fishing

**currency**
- USD (default)
- EUR
- GBP
- AUD
- AED
- SGD
- HKD
- JPY
- CAD
- CHF
- BTC
- ETH

**region**
- Africa
- Antarctica
- Arabian Gulf
- Australasia & South Pacific
- Bahamas
- Caribbean
- Indian Ocean & South East Asia
- North America
- Northern Europe
- East Mediterranean
- West Mediterranean
- South & Central America

#### Response Format

```json
{
  "total": 123,
  "hits": [
    {
      "uri": "unique-yacht-identifier",
      "name": "Yacht Name",
      "hero": "main-image-url.jpg",
      "length": "35",
      "cabins": "4",
      "sleeps": "8",
      "builtYear": "2018",
      "make": "Manufacturer",
      "yachtType": "Catamaran",
      "region": "Caribbean",
      "charterType": "Crewed",
      "pricing": {
        "currency": "USD",
        "day": {
          "from": 2500
        },
        "week": {
          "from": 15000
        }
      }
    }
  ]
}
```

#### Example Request

```javascript
// Using fetch
fetch('/api/search?region=Caribbean&yachtType=Catamaran&minLength=30&currency=USD')
  .then(response => response.json())
  .then(data => console.log(data));

// Using axios
axios.get('/api/search', {
  params: {
    region: 'Caribbean',
    yachtType: 'Catamaran',
    minLength: 30,
    currency: 'USD'
  }
})
.then(response => console.log(response.data));
```

## Client-Side Filtering

For more advanced filtering, you can implement additional client-side filtering on the returned results. The frontend implementation supports filtering by:

1. **Minimum Cabins** - Filter results to show only yachts with at least the specified number of cabins
2. **Built Year Range** - Filter results to show yachts built within a specific year range

Example client-side filtering:

```javascript
// After receiving API response
const filterResults = (yachts, filters) => {
  let filtered = [...yachts];
  
  // Filter by minimum cabins
  if (filters.minCabins) {
    filtered = filtered.filter(yacht => 
      yacht.cabins && parseInt(yacht.cabins) >= filters.minCabins
    );
  }
  
  // Filter by built year range
  if (filters.builtYearMin || filters.builtYearMax) {
    const minYear = filters.builtYearMin || 1900;
    const maxYear = filters.builtYearMax || new Date().getFullYear();
    
    filtered = filtered.filter(yacht => 
      yacht.builtYear && 
      parseInt(yacht.builtYear) >= minYear && 
      parseInt(yacht.builtYear) <= maxYear
    );
  }
  
  return filtered;
};
```

## Error Responses

| Status Code | Description                                  |
|-------------|----------------------------------------------|
| 400         | Bad Request - Invalid parameters             |
| 401         | Unauthorized - Authentication failure        |
| 403         | Forbidden - Company not authorized           |
| 500         | Internal Server Error                        |

## Cross-Origin Resource Sharing (CORS)

This API supports CORS for cross-domain requests, including from localhost for development purposes.

## Rate Limiting

No specific rate limiting is applied, but please be considerate with request frequency.

## Support

For questions or issues with the API, please contact the development team. 