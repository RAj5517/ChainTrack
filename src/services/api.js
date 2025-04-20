import axios from 'axios';

// Use proxied endpoints to avoid CORS issues
const COINGECKO_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.coingecko.com/api/v3'
  : '/api/coingecko';

// Using CryptoCompare for crypto news (free tier available)
const CRYPTOCOMPARE_NEWS_URL = process.env.NODE_ENV === 'production'
  ? 'https://min-api.cryptocompare.com/data/v2/news/'
  : '/api/cryptocompare/news/';

const CRYPTOCOMPARE_API_KEY = ''; // Free tier API usage is sufficient

// Configure axios defaults
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 10, // Maximum number of requests
  timeWindow: 60000, // Time window in milliseconds (1 minute)
  retryDelay: 60000, // Delay before retrying after rate limit (1 minute)
};

let requestQueue = [];
let requestCount = 0;
let lastResetTime = Date.now();

// Helper function to manage rate limiting
const manageRateLimit = async () => {
  const now = Date.now();
  
  // Reset counter if time window has passed
  if (now - lastResetTime >= RATE_LIMIT.timeWindow) {
    requestCount = 0;
    lastResetTime = now;
  }
  
  // If we've hit the rate limit, wait
  if (requestCount >= RATE_LIMIT.maxRequests) {
    const waitTime = RATE_LIMIT.timeWindow - (now - lastResetTime);
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
      requestCount = 0;
      lastResetTime = Date.now();
    }
  }
  
  requestCount++;
};

// Enhanced makeRequest function with retry logic
const makeRequest = async (url, options = {}, retryCount = 0) => {
  try {
    await manageRateLimit();
    
    const response = await axios.get(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 429 && retryCount < 3) {
      console.log(`Rate limit reached, retrying in ${RATE_LIMIT.retryDelay/1000} seconds... (Attempt ${retryCount + 1}/3)`);
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.retryDelay));
      return makeRequest(url, options, retryCount + 1);
    }
    throw error;
  }
};

// Get list of coins from CoinGecko
export const getCoinsList = async () => {
  try {
    const url = `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false`;
    return await makeRequest(url);
  } catch (error) {
    console.error('Error fetching coins list:', error);
    throw error;
  }
};

// Search for a specific coin by query
export const searchCoins = async (query) => {
  console.log("searchCoins function called with query:", query);
  try {
    // First try direct search
    console.log("Calling CoinGecko search API...");
    const response = await axios.get(`${COINGECKO_BASE_URL}/search`, {
      params: {
        query: query
      }
    });
    
    console.log("CoinGecko search response:", response.status, response.statusText);
    console.log("Response data structure:", Object.keys(response.data));
    
    // If we have coin results, get their details
    if (response.data && response.data.coins && response.data.coins.length > 0) {
      console.log(`Found ${response.data.coins.length} coins in search results`);
      console.log("First few coins:", response.data.coins.slice(0, 3));
      
      // Get IDs of first 5 results
      const coinIds = response.data.coins.slice(0, 5).map(coin => coin.id).join(',');
      console.log("Getting market data for coin IDs:", coinIds);
      
      // Fetch market data for these coins
      try {
        const marketDataResponse = await axios.get(`${COINGECKO_BASE_URL}/coins/markets`, {
          params: {
            vs_currency: 'usd',
            ids: coinIds,
            order: 'market_cap_desc',
            sparkline: false,
          }
        });
        
        console.log("Market data response:", marketDataResponse.status, marketDataResponse.statusText);
        console.log(`Received market data for ${marketDataResponse.data.length} coins`);
        
        return marketDataResponse.data;
      } catch (marketError) {
        console.error("Error fetching market data:", marketError);
        
        // If market data fails, return basic data from search
        console.log("Falling back to basic search data without market details");
        return response.data.coins.slice(0, 5).map(coin => ({
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol,
          image: coin.large || coin.thumb,
          current_price: 0,
          price_change_percentage_24h: 0
        }));
      }
    } else {
      console.log("No coins found in search response");
      if (response.data) {
        console.log("Response data structure:", response.data);
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error searching coins:', error);
    
    // Log detailed error info
    if (error.response) {
      console.error("API error response:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    } else if (error.request) {
      console.error("No response received from API", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }
    
    // Return mock data for testing during API issues
    console.log("Returning mock search results due to API error");
    return [
      {
        id: "bitcoin",
        symbol: "btc",
        name: "Bitcoin",
        image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
        current_price: 60000,
        price_change_percentage_24h: 2.5
      },
      {
        id: "ethereum",
        symbol: "eth",
        name: "Ethereum",
        image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
        current_price: 3000,
        price_change_percentage_24h: 1.8
      }
    ];
  }
};

// Get detailed information about a specific coin
export const getCoinDetails = async (coinId) => {
  try {
    const response = await axios.get(`${COINGECKO_BASE_URL}/coins/${coinId}`, {
      params: {
        localization: false,
        tickers: false,
        market_data: true,
        community_data: false,
        developer_data: false,
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching coin details:', error);
    throw error;
  }
};

// Get historical price data for a coin
export const getCoinHistory = async (id, days = 7) => {
  try {
    const url = `${COINGECKO_BASE_URL}/coins/${id}/market_chart?vs_currency=usd&days=${days}`;
    return await makeRequest(url);
  } catch (error) {
    console.error('Error fetching coin history:', error);
    throw error;
  }
};

// Get news for a specific coin
export const getCoinNews = async (coinId) => {
  try {
    const coinDetails = await getCoinDetails(coinId);
    const coinName = coinDetails.name;
    const coinSymbol = coinDetails.symbol.toUpperCase();
    
    const options = {
      params: {
        lang: 'EN',
        categories: coinSymbol,
        sortOrder: 'popular',
      },
      headers: {}
    };

    // Add API key if available
    if (CRYPTOCOMPARE_API_KEY) {
      options.headers['authorization'] = `Apikey ${CRYPTOCOMPARE_API_KEY}`;
    }

    const response = await axios.get(CRYPTOCOMPARE_NEWS_URL, options);
    
    // Map response to our expected format
    if (response.data && response.data.Data && response.data.Data.length > 0) {
      return response.data.Data.map(article => ({
        title: article.title,
        description: article.body?.substring(0, 200) + '...' || 'No description available',
        url: article.url,
        urlToImage: article.imageurl || 'https://via.placeholder.com/300x200?text=Crypto+News',
        publishedAt: article.published_on ? new Date(article.published_on * 1000).toISOString() : new Date().toISOString(),
        source: article.source || 'CryptoCompare'
      }));
    }
    
    // If no specific news, search for general news with the coin name
    return getCryptoNewsByKeyword(coinName);
  } catch (error) {
    console.error(`Error fetching news for ${coinId}:`, error);
    return [];
  }
};

// Get latest cryptocurrency news from CryptoCompare
export const getCryptoNews = async () => {
  try {
    console.log("Starting getCryptoNews function");
    
    const options = {
      params: {
        lang: 'EN',
        sortOrder: 'popular', // Options: latest, popular
        categories: 'BTC,ETH,XRP,Trading,Mining',
        extraParams: 'ChainTrack' // Identifying our app to the API provider
      },
      headers: {}
    };

    // Add API key if available
    if (CRYPTOCOMPARE_API_KEY) {
      options.headers['authorization'] = `Apikey ${CRYPTOCOMPARE_API_KEY}`;
      console.log("Using API key for CryptoCompare");
    } else {
      console.log("No API key provided for CryptoCompare - using free tier with rate limits");
    }

    console.log(`Making request to: ${CRYPTOCOMPARE_NEWS_URL} with options:`, JSON.stringify(options, null, 2));
    
    console.log("About to make axios request");
    const response = await axios.get(CRYPTOCOMPARE_NEWS_URL, options);
    console.log("CryptoCompare API response status:", response.status);
    
    // Log more detailed information for debugging
    if (response.data) {
      const hasData = response.data.Data ? true : false;
      const dataLength = hasData ? response.data.Data.length : 0;
      console.log(`API response received. Has Data property: ${hasData}, Number of news items: ${dataLength}`);
      
      if (hasData && dataLength > 0) {
        console.log("Sample news item:", JSON.stringify(response.data.Data[0], null, 2));
      } else {
        console.log("Response data structure:", JSON.stringify(response.data, null, 2));
      }
    }
    
    // Map response to our expected format
    if (response.data && response.data.Data && response.data.Data.length > 0) {
      console.log(`Found ${response.data.Data.length} news articles from CryptoCompare`);
      
      const mappedData = response.data.Data.map(article => ({
        title: article.title || 'No Title',
        description: article.body ? (article.body.substring(0, 200) + '...') : 'No description available',
        url: article.url || '#',
        urlToImage: article.imageurl || 'https://via.placeholder.com/300x200?text=Crypto+News',
        publishedAt: article.published_on ? new Date(article.published_on * 1000).toISOString() : new Date().toISOString(),
        source: article.source || 'CryptoCompare'
      }));
      
      console.log(`Successfully mapped ${mappedData.length} news articles`);
      return mappedData;
    } else {
      console.error("Unexpected API response format from CryptoCompare:", response.data);
    }
    
    // Fallback to mock data if the API fails or is rate limited
    console.log("No news data found in response, using mock data as fallback");
    return getMockNews();
  } catch (error) {
    console.error('Error fetching crypto news:', error);
    
    // Log detailed error information
    if (error.response) {
      console.error("API error response:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      
      // Check for rate limiting (common with free tier)
      if (error.response.status === 429) {
        console.log("Rate limit exceeded. This is common with the free tier. Using mock data.");
      }
    } else if (error.request) {
      console.error("No response received from API. Network issue?", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }
    
    // Return mock data on error
    console.log("Using mock data due to API error");
    return getMockNews();
  }
};

// Get news by keyword search
export const getCryptoNewsByKeyword = async (keyword) => {
  try {
    const options = {
      params: {
        lang: 'EN',
        q: keyword,
        sortOrder: 'popular',
      },
      headers: {}
    };

    // Add API key if available
    if (CRYPTOCOMPARE_API_KEY) {
      options.headers['authorization'] = `Apikey ${CRYPTOCOMPARE_API_KEY}`;
    }

    const response = await axios.get(CRYPTOCOMPARE_NEWS_URL, options);
    
    // Map response to our expected format
    if (response.data && response.data.Data && response.data.Data.length > 0) {
      return response.data.Data.map(article => ({
        title: article.title,
        description: article.body?.substring(0, 200) + '...' || 'No description available',
        url: article.url,
        urlToImage: article.imageurl || 'https://via.placeholder.com/300x200?text=Crypto+News',
        publishedAt: article.published_on ? new Date(article.published_on * 1000).toISOString() : new Date().toISOString(),
        source: article.source || 'CryptoCompare'
      }));
    }
    
    // If no news found with keyword, return empty array
    return [];
  } catch (error) {
    console.error(`Error fetching news for keyword ${keyword}:`, error);
    return [];
  }
};

// Get mock news data for testing or when API fails
const getMockNews = () => {
  return [
    {
      title: "Bitcoin Reaches New All-Time High",
      description: "Bitcoin has surpassed its previous record, reaching a new all-time high price amid increased institutional adoption.",
      url: "https://example.com/bitcoin-ath",
      urlToImage: "https://via.placeholder.com/300x200?text=Bitcoin+News",
      publishedAt: new Date().toISOString(),
      source: "Mock Data"
    },
    {
      title: "Ethereum Completes Major Network Upgrade",
      description: "Ethereum has successfully implemented its latest upgrade, bringing significant improvements to scalability and energy efficiency.",
      url: "https://example.com/ethereum-upgrade",
      urlToImage: "https://via.placeholder.com/300x200?text=Ethereum+News",
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      source: "Mock Data"
    },
    {
      title: "Major Bank Announces Cryptocurrency Custody Service",
      description: "A leading global bank has announced plans to offer cryptocurrency custody services to its institutional clients.",
      url: "https://example.com/bank-crypto-custody",
      urlToImage: "https://via.placeholder.com/300x200?text=Banking+News",
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      source: "Mock Data"
    },
    {
      title: "Regulatory Developments in Cryptocurrency Markets",
      description: "New regulatory frameworks for cryptocurrencies are being developed in several countries, aiming to provide clarity for investors and businesses.",
      url: "https://example.com/crypto-regulations",
      urlToImage: "https://via.placeholder.com/300x200?text=Regulation+News",
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      source: "Mock Data"
    },
    {
      title: "NFT Market Shows Signs of Recovery",
      description: "After months of declining sales, the NFT market is showing signs of recovery with increased trading volume and new project launches.",
      url: "https://example.com/nft-recovery",
      urlToImage: "https://via.placeholder.com/300x200?text=NFT+News",
      publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      source: "Mock Data"
    }
  ];
};

// Get trending coins
export const getTrendingCoins = async () => {
  try {
    const response = await axios.get(`${COINGECKO_BASE_URL}/search/trending`);
    
    if (response.data && response.data.coins) {
      // Extract the coin ids from trending data
      const coinIds = response.data.coins.map(item => item.item.id).join(',');
      
      // Get full market data for these trending coins
      if (coinIds.length > 0) {
        const marketDataResponse = await axios.get(`${COINGECKO_BASE_URL}/coins/markets`, {
          params: {
            vs_currency: 'usd',
            ids: coinIds,
            order: 'market_cap_desc',
            per_page: 10,
            page: 1,
            sparkline: false,
          }
        });
        
        return marketDataResponse.data;
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching trending coins:', error);
    return [];
  }
};

// Get top gainers (coins with highest positive price change in 24h)
export const getTopGainers = async () => {
  try {
    // Get top 100 coins
    const response = await axios.get(`${COINGECKO_BASE_URL}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 100,
        page: 1,
        sparkline: false,
      }
    });
    
    // Sort by price change percentage (descending)
    const sorted = [...response.data].sort((a, b) => 
      (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0)
    );
    
    // Return top 10 gainers
    return sorted.slice(0, 10);
  } catch (error) {
    console.error('Error fetching top gainers:', error);
    return [];
  }
};

// Get top losers (coins with lowest negative price change in 24h)
export const getTopLosers = async () => {
  try {
    // Get top 100 coins
    const response = await axios.get(`${COINGECKO_BASE_URL}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 100,
        page: 1,
        sparkline: false,
      }
    });
    
    // Sort by price change percentage (ascending)
    const sorted = [...response.data].sort((a, b) => 
      (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0)
    );
    
    // Return top 10 losers
    return sorted.slice(0, 10);
  } catch (error) {
    console.error('Error fetching top losers:', error);
    return [];
  }
};

// Get coins with highest volume in 24h
export const getHighestVolume = async () => {
  try {
    // Get coins sorted by volume
    const response = await axios.get(`${COINGECKO_BASE_URL}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        order: 'volume_desc',
        per_page: 10,
        page: 1,
        sparkline: false,
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching highest volume coins:', error);
    return [];
  }
}; 