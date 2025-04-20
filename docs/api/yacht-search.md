# Yacht Search API Documentation

## Overview

The Yacht Search API provides endpoints for searching and retrieving yacht information. This API integrates with the Ankor API service to provide comprehensive yacht search capabilities.

## Endpoints

### GET `/api/search`

Search for yachts using various filters and parameters.

#### Request Parameters

| Parameter    | Type    | Description                                      | Example           |
|-------------|---------|--------------------------------------------------|-------------------|
| vesselName  | string  | Name of the yacht                                | "Ocean Dream"     |
| type        | string  | Type of yacht                                    | "Sailing"         |
| charterType | string  | Type of charter                                  | "Crewed"         |
| lengthMin   | number  | Minimum length of yacht in meters                | 20                |
| lengthMax   | number  | Maximum length of yacht in meters                | 50                |
| capacity    | number  | Number of guests the yacht can accommodate       | 12                |
| region      | string  | Geographic region where the yacht operates       | "Caribbean"       |
| displayCurrency | string | Currency for price display (default: USD)     | "USD"            |
| minPrice    | number  | Minimum price                                    | 5000              |
| maxPrice    | number  | Maximum price                                    | 50000             |
| limit       | number  | Number of results per page (default: 50)         | 50                |
| offset      | number  | Number of results to skip (default: 0)           | 0                 |

#### Supported Values

##### Yacht Types
- Gulet
- Sailing
- Catamaran
- Motor
- Power Catamaran
- Classic
- Expedition
- Sport fishing

##### Charter Types
- Bareboat
- Crewed

##### Regions
- Africa
- Antarctica
- Arabian Gulf
- Australasia & South Pacific
- Caribbean
- East Mediterranean
- Indian Ocean & South East Asia
- North America
- Northern Europe
- South & Central America
- West Mediterranean

##### Currencies
- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- AUD (Australian Dollar)
- AED (UAE Dirham)
- SGD (Singapore Dollar)
- HKD (Hong Kong Dollar)
- JPY (Japanese Yen)
- CAD (Canadian Dollar)
- CHF (Swiss Franc)
- BTC (Bitcoin)
- ETH (Ethereum)

#### Response Format

```json
{
  "total": number,
  "hits": [
    {
      "uri": string,
      "name": string,
      "hero": string,
      "length": number,
      "cabins": number,
      "sleeps": number,
      "builtYear": number,
      "make": string,
      "yachtType": string,
      "region": string,
      "charterType": string,
      "pricing": {
        "currency": string,
        "day": {
          "from": number
        },
        "week": {
          "from": number
        }
      }
    }
  ]
}
```

#### Example Request

```javascript
const response = await fetch('/api/search?type=Sailing&region=Caribbean&capacity=8&displayCurrency=USD');
const data = await response.json();
```

#### Example Response

```json
{
  "total": 1,
  "hits": [
    {
      "uri": "yacht-123",
      "name": "Ocean Dream",
      "hero": "https://example.com/yacht-image.jpg",
      "length": 25,
      "cabins": 4,
      "sleeps": 8,
      "builtYear": 2020,
      "make": "Sunseeker",
      "yachtType": "Sailing",
      "region": "Caribbean",
      "charterType": "Crewed",
      "pricing": {
        "currency": "USD",
        "day": {
          "from": 2500
        },
        "week": {
          "from": 14500
        }
      }
    }
  ]
}
```

#### Error Responses

The API may return the following error status codes:

- `400 Bad Request`: Invalid parameters provided
- `401 Unauthorized`: Authentication failed
- `403 Forbidden`: Company not authorized
- `500 Internal Server Error`: Server-side error

Error responses will include a message explaining the error:

```json
{
  "error": "Invalid search parameters. Please check your filters and try again."
}
```

## Rate Limiting

The API implements caching to improve performance and reduce load on the Ankor API service. Responses are cached for 5 minutes by default.

## Authentication

The API handles authentication with the Ankor API service automatically. No additional authentication is required for frontend requests.

## Best Practices

1. Always include a `displayCurrency` parameter to ensure consistent price display
2. Use pagination parameters (`limit` and `offset`) for large result sets
3. Provide specific search criteria to get more relevant results
4. Handle error responses appropriately in your frontend application 