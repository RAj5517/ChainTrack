import axios from 'axios';
import { getCoinsList, searchCoins, getCoinNews as getNews } from '../services/api';

// Configure axios defaults
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Fetch coins market data - wrapper around the existing API service
export const fetchCoinsMarkets = async (coinIds = [], searchQuery = '') => {
  try {
    console.log('Fetching coins markets with params:', { coinIds, searchQuery });
    
    // If we have coin IDs, fetch those specific coins
    if (coinIds && coinIds.length > 0) {
      const response = await axios.get('/api/coingecko/coins/markets', {
        params: {
          vs_currency: 'usd',
          ids: coinIds.join(','),
          order: 'market_cap_desc',
          per_page: 250,
          page: 1,
          sparkline: false,
        }
      });
      console.log('Coins markets response:', response.data);
      return response.data;
    } 
    // If we have a search query, use the existing search function
    else if (searchQuery) {
      const results = await searchCoins(searchQuery);
      console.log('Search results:', results);
      return results;
    } 
    // Otherwise, just get the list of coins
    else {
      const results = await getCoinsList();
      console.log('Default coins list:', results);
      return results;
    }
  } catch (error) {
    console.error('Error fetching coins markets:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return [];
  }
};

// Fetch news for a specific coin - updated to use direct API call
export const fetchCoinNews = async (coinId) => {
  console.log("fetchCoinNews called with coinId:", coinId);
  try {
    if (!coinId) {
      console.log("No coinId provided to fetchCoinNews");
      return [];
    }
    
    // Direct call to the API service instead of wrapper
    const news = await getNews(coinId);
    console.log(`Fetched ${news.length} news items for ${coinId}`);
    return news;
  } catch (error) {
    console.error('Error fetching coin news:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return [];
  }
}; 