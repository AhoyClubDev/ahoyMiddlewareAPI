import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

// API Documentation Component
export default function ApiDocs() {
  const [expandedSection, setExpandedSection] = useState('yacht-list');

  // Toggle a specific section's expanded state
  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>API Documentation - Ankor API</title>
        <meta name="description" content="Documentation for the Ankor API endpoints" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mr-4">
            &larr; Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-800">API Documentation</h1>
        </div>
        
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Yacht API</h2>
            <p className="text-gray-600 mb-4">
              The Yacht API provides endpoints for retrieving yacht information, including listing multiple yachts
              and detailed information about specific yachts.
            </p>
            
            {/* Yacht List Section */}
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
              <div 
                className={`bg-gray-100 p-4 flex justify-between items-center cursor-pointer ${expandedSection === 'yacht-list' ? 'border-b border-gray-200' : ''}`}
                onClick={() => toggleSection('yacht-list')}
              >
                <h3 className="text-lg font-medium text-gray-800">Get Yacht List</h3>
                <span className="text-gray-500">
                  {expandedSection === 'yacht-list' ? '−' : '+'}
                </span>
              </div>
              
              {expandedSection === 'yacht-list' && (
                <div className="p-4">
                  <div className="mb-4">
                    <h4 className="text-md font-medium text-gray-800 mb-2">Endpoint</h4>
                    <div className="bg-gray-800 text-white p-2 rounded font-mono">GET /api/search</div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-md font-medium text-gray-800 mb-2">Query Parameters</h4>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap font-mono text-sm text-gray-700">vesselName</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">String</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">No</td>
                          <td className="px-4 py-2 text-sm text-gray-700">Name of the yacht</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap font-mono text-sm text-gray-700">type</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">String</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">No</td>
                          <td className="px-4 py-2 text-sm text-gray-700">Type of yacht (Gulet, Sailing, Catamaran, Motor, Power Catamaran, Classic, Expedition, Sport fishing)</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap font-mono text-sm text-gray-700">charterType</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">String</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">No</td>
                          <td className="px-4 py-2 text-sm text-gray-700">Type of charter (Bareboat, Crewed)</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap font-mono text-sm text-gray-700">lengthMin</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">Number</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">No</td>
                          <td className="px-4 py-2 text-sm text-gray-700">Minimum length of yacht in meters</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap font-mono text-sm text-gray-700">lengthMax</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">Number</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">No</td>
                          <td className="px-4 py-2 text-sm text-gray-700">Maximum length of yacht in meters</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap font-mono text-sm text-gray-700">capacity</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">Integer</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">No</td>
                          <td className="px-4 py-2 text-sm text-gray-700">Number of guests the yacht can accommodate</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap font-mono text-sm text-gray-700">region</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">String</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">No</td>
                          <td className="px-4 py-2 text-sm text-gray-700">Geographic region where the yacht operates</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap font-mono text-sm text-gray-700">displayCurrency</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">String</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">No</td>
                          <td className="px-4 py-2 text-sm text-gray-700">Currency for price display (default: USD)</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap font-mono text-sm text-gray-700">minPrice</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">Number</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">No</td>
                          <td className="px-4 py-2 text-sm text-gray-700">Minimum price in specified currency</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap font-mono text-sm text-gray-700">maxPrice</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">Number</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">No</td>
                          <td className="px-4 py-2 text-sm text-gray-700">Maximum price in specified currency</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap font-mono text-sm text-gray-700">limit</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">Integer</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">No</td>
                          <td className="px-4 py-2 text-sm text-gray-700">Number of results per page (default: 50)</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap font-mono text-sm text-gray-700">offset</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">Integer</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">No</td>
                          <td className="px-4 py-2 text-sm text-gray-700">Number of results to skip (default: 0)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-md font-medium text-gray-800 mb-2">Example Request</h4>
                    <div className="bg-gray-800 text-white p-2 rounded font-mono overflow-x-auto">
                      GET /api/search?type=Sailing&region=Caribbean&capacity=8&displayCurrency=USD
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-md font-medium text-gray-800 mb-2">Example Response</h4>
                    <div className="bg-gray-800 text-white p-2 rounded font-mono overflow-x-auto">
                      {`{
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
}`}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-md font-medium text-gray-800 mb-2">Error Responses</h4>
                    <p className="text-gray-600 mb-2">The API may return the following error status codes:</p>
                    <ul className="list-disc list-inside text-gray-600 mb-2">
                      <li>400 Bad Request: Invalid parameters provided</li>
                      <li>401 Unauthorized: Authentication failed</li>
                      <li>403 Forbidden: Company not authorized</li>
                      <li>500 Internal Server Error: Server-side error</li>
                    </ul>
                    <p className="text-gray-600 mb-2">Error responses will include a message explaining the error:</p>
                    <div className="bg-gray-800 text-white p-2 rounded font-mono overflow-x-auto">
                      {`{
  "error": "Invalid search parameters. Please check your filters and try again."
}`}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-md font-medium text-gray-800 mb-2">Rate Limiting and Caching</h4>
                    <p className="text-gray-600">
                      The API implements caching to improve performance and reduce load on the Ankor API service. 
                      Responses are cached for 5 minutes by default.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-md font-medium text-gray-800 mb-2">Best Practices</h4>
                    <ul className="list-disc list-inside text-gray-600">
                      <li>Always include a displayCurrency parameter to ensure consistent price display</li>
                      <li>Use pagination parameters (limit and offset) for large result sets</li>
                      <li>Provide specific search criteria to get more relevant results</li>
                      <li>Handle error responses appropriately in your frontend application</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Yacht Detail Section */}
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
              <div 
                className={`bg-gray-100 p-4 flex justify-between items-center cursor-pointer ${expandedSection === 'yacht-detail' ? 'border-b border-gray-200' : ''}`}
                onClick={() => toggleSection('yacht-detail')}
              >
                <h3 className="text-lg font-medium text-gray-800">Get Yacht Details</h3>
                <span className="text-gray-500">
                  {expandedSection === 'yacht-detail' ? '−' : '+'}
                </span>
              </div>
              
              {expandedSection === 'yacht-detail' && (
                <div className="p-4">
                  <div className="mb-4">
                    <h4 className="text-md font-medium text-gray-800 mb-2">Endpoint</h4>
                    <div className="bg-gray-800 text-white p-2 rounded font-mono">GET /api/yacht</div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-md font-medium text-gray-800 mb-2">Query Parameters</h4>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap font-mono text-sm text-gray-700">uri</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">String</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">Yes</td>
                          <td className="px-4 py-2 text-sm text-gray-700">The unique identifier for the yacht</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap font-mono text-sm text-gray-700">includeDetailedSpecs</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">Boolean</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">No</td>
                          <td className="px-4 py-2 text-sm text-gray-700">Include detailed specifications. Default: false</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-md font-medium text-gray-800 mb-2">Example Request</h4>
                    <div className="bg-gray-800 text-white p-2 rounded font-mono overflow-x-auto">
                      GET /api/yacht?uri=c::8864389904::vessel::d5cabfd2-fe8c-11ed-889f-43d4bb723744&includeDetailedSpecs=true
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-md font-medium text-gray-800 mb-2">Example Response</h4>
                    <div className="bg-gray-800 text-white p-2 rounded font-mono overflow-x-auto">
                      {`{
  "uri": "c::8864389904::vessel::d5cabfd2-fe8c-11ed-889f-43d4bb723744",
  "name": "MISCHIEF",
  "description": "Luxurious motor yacht with exceptional amenities...",
  "length": 54.0,
  "beam": 9.4,
  "draft": 2.7,
  "builtYear": 2006,
  "cabins": 6,
  "sleeps": 12,
  "make": "Baglietto",
  "blueprint": {
    "masterCabins": 1,
    "vipCabins": 2,
    "doubleCabins": 1,
    "twinCabins": 2,
    "bathrooms": 6,
    "crewCabins": 7,
    "maxCrew": 9
  },
  "amenities": [
    "Jacuzzi on deck",
    "WiFi",
    "Air conditioning",
    "Stabilizers"
  ],
  "equipment": [
    "Jet Skis (2)",
    "Kayaks",
    "Paddleboards",
    "Snorkeling gear"
  ],
  "pricing": {
    "day": {
      "from": 5500
    },
    "week": {
      "from": 360000
    },
    "currency": "USD"
  },
  "hero": "/image/vessel/d5cabfd2-fe8c-11ed-889f-43d4bb723744/{imageVariant}"
}`}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 