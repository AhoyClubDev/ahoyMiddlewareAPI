import axios from "axios";

// Simple in-memory cache for exchange rates
const cache = {
  data: null,
  timestamp: 0,
  ttl: 3600000, // 1 hour in milliseconds
  isExpired: function() {
    return !this.data || Date.now() - this.timestamp > this.ttl;
  },
  update: function(data) {
    this.data = data;
    this.timestamp = Date.now();
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Get query parameters with defaults
    const { from = 'USD', to, amount = 1 } = req.query;
    
    // If no 'to' currency is specified, return all exchange rates for 'from' currency
    let exchangeRates;
    
    // Check if we have cached data that's not expired
    if (cache.isExpired()) {
      // Fetch fresh exchange rates
      const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
      cache.update(response.data.rates);
      exchangeRates = response.data.rates;
    } else {
      // Use cached exchange rates
      exchangeRates = cache.data;
    }
    
    // If 'from' currency is not USD, we need to normalize the rates
    const fromRate = exchangeRates[from] || 1;
    
    // Prepare response object
    const result = {
      base: from,
      timestamp: new Date().toISOString(),
      rates: {}
    };
    
    // If a specific 'to' currency is requested
    if (to) {
      if (!exchangeRates[to]) {
        return res.status(400).json({ error: `Currency '${to}' not supported` });
      }
      
      // Calculate the conversion
      const toRate = exchangeRates[to];
      const conversionRate = toRate / fromRate;
      const convertedAmount = parseFloat(amount) * conversionRate;
      
      result.to = to;
      result.amount = parseFloat(amount);
      result.convertedAmount = convertedAmount;
      result.rate = conversionRate;
    } else {
      // Return all rates relative to the 'from' currency
      for (const currency in exchangeRates) {
        result.rates[currency] = exchangeRates[currency] / fromRate;
      }
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Currency API Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
