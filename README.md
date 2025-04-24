# Yacht and Ship Search API

## Overview

This API provides endpoints for searching and retrieving detailed information about yachts and ships. Built with Next.js, it serves as a middleware between client applications and the Ankor.io API, handling authentication, data enrichment, caching, and more.

## Features

- **Authentication**: JWT-based authentication system for secure API access
- **Caching**: In-memory caching to improve performance and reduce API calls
- **Search Functionality**: Advanced filtering options for yacht/ship search
- **Data Enrichment**: Enhances yacht data with operating areas, pricing, and region information
- **Currency Conversion**: Support for multiple currencies
- **Error Handling**: Robust error handling with informative messages
- **CORS Support**: Cross-Origin Resource Sharing for frontend integration

## API Endpoints

### Authentication

#### `POST /api/auth`
- Generates a JWT assertion for authentication with the Ankor.io API
- No request parameters required

#### `POST /api/token`
- Exchanges JWT assertion for an access token
- No request parameters required

### Yacht/Ship Search

#### `GET /api/yacht`
Search for yachts with various filter options.

Query Parameters:
- `limit` (default: 50): Number of results to return
- `offset` (default: 0): Pagination offset
- `sort` (default: "name"): Sort field
- `order` (default: "asc"): Sort order
- `uri`: Optional specific yacht URI for detailed information
- `make`: Filter by yacht manufacturer
- `name`: Filter by vessel name
- `length_min`/`length_max`: Filter by yacht length
- `sleeps_min`: Filter by minimum sleeping capacity
- `year_min`: Filter by minimum build year
- `yachtType`: Filter by yacht type
- `region`: Filter by geographic region
- `guests`: Filter by guest capacity
- `checkIn`/`checkOut`: Filter by availability dates
- `currency`: Display price in specific currency
- `priceMin`/`priceMax`: Filter by price range

#### `GET /api/yacht-details`
Fetch detailed information for a specific yacht.

Query Parameters:
- `uri`: Required - Unique identifier for the yacht

#### `GET /api/ship-details`
Fetch detailed information for a specific ship.

Query Parameters:
- `uri`: Required - Unique identifier for the ship

#### `GET /api/filtered-ships`
Search for ships with various filter options.

Query Parameters:
- Similar to `/api/yacht` but tailored for ships

#### `GET /api/search`
Generic search endpoint with more filter options.

### Currency

#### `GET /api/currency`
Get exchange rates for currency conversion.

Query Parameters:
- `from` (default: "USD"): Base currency
- `to`: Target currency (optional)
- `amount` (default: 1): Amount to convert

## Architecture

The API uses a middleware pattern:

1. Client makes request to Next.js API endpoints
2. API authenticates with Ankor.io using JWT
3. Requests are made to the Ankor.io API with the obtained token
4. Results are cached, enriched, and formatted before returning to the client
5. Error handling and retry mechanisms ensure reliable operation

### Caching System

The API implements multiple caching layers:
- Token cache: Stores authentication tokens to minimize auth requests
- Response cache: Stores API responses with a 5-minute TTL
- Yacht details cache: Stores detailed yacht information separately

### Error Handling

The API handles various error scenarios:
- Authentication failures
- Rate limiting issues
- Timeouts with retry mechanisms
- Invalid parameters with descriptive error messages

## Environment Variables

Required environment variables:
- `BASE_URL`: Base URL of your API
- `NEXT_PUBLIC_BASE_ANKOR_API_URL`: Ankor API base URL
- `PRIVATE_KEY`: Private key for JWT signing
- `KEY_ID`: Key ID for JWT header
- `NEXT_PUBLIC_COMPANY_URI`: Company URI for authentication

## Development

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://your-repository.git
cd your-repository

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

### Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Technical Notes

- Built with Next.js API routes
- Uses axios for HTTP requests
- Implements exponential backoff for API retries
- Handles concurrent requests with batching
- Processes a maximum of 20 yachts in detail to avoid timeouts

## Error Codes

- `400`: Invalid request parameters
- `401`: Authentication failed
- `429`: Rate limit exceeded
- `500`: Internal server error

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the [MIT License](LICENSE).
