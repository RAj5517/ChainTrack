import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  getCoinsList, 
  getTrendingCoins, 
  getTopGainers, 
  getTopLosers, 
  getHighestVolume 
} from '../services/api';
import '../styles/Home.css';

const Home = () => {
  const [coins, setCoins] = useState([]);
  const [filteredCoins, setFilteredCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  
  // States for different categories
  const [trendingCoins, setTrendingCoins] = useState([]);
  const [topGainers, setTopGainers] = useState([]);
  const [topLosers, setTopLosers] = useState([]);
  const [highestVolume, setHighestVolume] = useState([]);
  const [activeCategory, setActiveCategory] = useState('trending');
  const [categoryLoading, setCategoryLoading] = useState(true);

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        setLoading(true);
        const data = await getCoinsList();
        setCoins(data);
        setFilteredCoins(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch coins');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCoins();
  }, []);
  
  // Fetch data for categories
  useEffect(() => {
    const fetchCategoryData = async () => {
      setCategoryLoading(true);
      try {
        // Fetch data for all categories in parallel
        const [trending, gainers, losers, volume] = await Promise.all([
          getTrendingCoins(),
          getTopGainers(),
          getTopLosers(),
          getHighestVolume()
        ]);
        
        setTrendingCoins(trending || []);
        setTopGainers(gainers || []);
        setTopLosers(losers || []);
        setHighestVolume(volume || []);
      } catch (err) {
        console.error('Error fetching category data:', err);
      } finally {
        setCategoryLoading(false);
      }
    };
    
    fetchCategoryData();
  }, []);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (!searchTerm) {
      setFilteredCoins(coins);
      return;
    }

    // First filter local coins
    const localFilteredCoins = coins.filter(coin => 
      coin.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredCoins(localFilteredCoins);

    // If less than 3 results locally or search term is 3+ characters, search API
    if ((localFilteredCoins.length < 3 && searchTerm.length >= 2) || searchTerm.length >= 3) {
      const newTimeout = setTimeout(async () => {
        setSearching(true);
        try {
          const apiResults = await getCoinsList();
          
          // Combine local and API results, remove duplicates
          const combinedResults = [...localFilteredCoins];
          
          apiResults.forEach(apiCoin => {
            if (!combinedResults.some(coin => coin.id === apiCoin.id)) {
              combinedResults.push(apiCoin);
            }
          });
          
          setFilteredCoins(combinedResults);
        } catch (err) {
          console.error('Error searching coins:', err);
        } finally {
          setSearching(false);
        }
      }, 500); // Debounce search API calls
      
      setSearchTimeout(newTimeout);
      
      return () => {
        clearTimeout(newTimeout);
      };
    }
  }, [searchTerm, coins]);

  const handleSearch = (e) => {
    const { value } = e.target;
    setSearchTerm(value);
    setSearching(value.length > 0);
  };
  
  // Get active category data
  const getActiveCategoryData = () => {
    switch (activeCategory) {
      case 'trending':
        return {
          title: 'Trending Coins',
          data: trendingCoins,
          emptyMessage: 'No trending coins available'
        };
      case 'gainers':
        return {
          title: 'Top Gainers (24h)',
          data: topGainers,
          emptyMessage: 'No top gainers available'
        };
      case 'losers':
        return {
          title: 'Top Losers (24h)',
          data: topLosers,
          emptyMessage: 'No top losers available'
        };
      case 'volume':
        return {
          title: 'Highest Volume (24h)',
          data: highestVolume,
          emptyMessage: 'No volume data available'
        };
      default:
        return {
          title: 'Trending Coins',
          data: trendingCoins,
          emptyMessage: 'No trending coins available'
        };
    }
  };
  
  // Render a compact coin card for the sidebar
  const renderCompactCoinCard = (coin) => {
    const priceChangePercentage = coin.price_change_percentage_24h;
    const isPriceChangePositive = priceChangePercentage > 0;
    
    return (
      <Link to={`/coin/${coin.id}`} key={coin.id} className="compact-coin-card">
        <div className="compact-coin-info">
          <img 
            src={coin.image} 
            alt={`${coin.name} logo`} 
            className="compact-coin-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/28?text=?';
            }}
          />
          <div className="compact-coin-details">
            <span className="compact-coin-name">{coin.name}</span>
            <span className="compact-coin-symbol">{coin.symbol.toUpperCase()}</span>
          </div>
        </div>
        <div className="compact-coin-price">
          <span>{formatCurrency(coin.current_price)}</span>
          <span className={`compact-coin-change ${isPriceChangePositive ? 'positive' : 'negative'}`}>
            {isPriceChangePositive ? '+' : ''}{priceChangePercentage?.toFixed(2)}%
          </span>
        </div>
      </Link>
    );
  };
  
  // Helper function to format currency
  const formatCurrency = (value) => {
    if (!value && value !== 0) return 'N/A';
    
    // For values less than 1, use more decimal places
    if (Math.abs(value) < 1) {
      // For extremely small values, use scientific notation
      if (Math.abs(value) < 0.00001) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          notation: 'scientific'
        }).format(value);
      }
      // For small but not tiny values, show more decimals
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 4,
        maximumFractionDigits: 6
      }).format(value);
    }
    
    // For larger values, use standard formatting
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="home-container">
      <h1>Cryptocurrency Market</h1>
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Search for a cryptocurrency..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
        {searching && <span className="searching-indicator">Searching...</span>}
      </div>
      
      <div className="crypto-dashboard">
        <div className="main-content">
          {filteredCoins.length === 0 ? (
            <div className="no-results">No cryptocurrencies found matching your search.</div>
          ) : (
            <div className="coin-list">
              {filteredCoins.map((coin) => (
                <Link to={`/coin/${coin.id}`} key={coin.id} className="coin-card">
                  <div className="coin-image">
                    <img src={coin.image} alt={coin.name} onError={(e) => {
                      e.target.src = "https://via.placeholder.com/40?text=coin";
                    }} />
                  </div>
                  <div className="coin-info">
                    <div className="coin-name">{coin.name} ({coin.symbol.toUpperCase()})</div>
                    <p className="price">{formatCurrency(coin.current_price)}</p>
                    <p className={`price-change ${coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`}>
                      {coin.price_change_percentage_24h >= 0 ? '+' : ''}
                      {coin.price_change_percentage_24h?.toFixed(2)}%
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        
        <div className="sidebar">
          <div className="category-tabs">
            <button 
              className={`category-tab ${activeCategory === 'trending' ? 'active' : ''}`}
              onClick={() => setActiveCategory('trending')}
            >
              Trending
            </button>
            <button 
              className={`category-tab ${activeCategory === 'gainers' ? 'active' : ''}`}
              onClick={() => setActiveCategory('gainers')}
            >
              Top Gainers
            </button>
            <button 
              className={`category-tab ${activeCategory === 'losers' ? 'active' : ''}`}
              onClick={() => setActiveCategory('losers')}
            >
              Top Losers
            </button>
            <button 
              className={`category-tab ${activeCategory === 'volume' ? 'active' : ''}`}
              onClick={() => setActiveCategory('volume')}
            >
              Highest Volume
            </button>
          </div>
          
          <div className="category-content">
            <div className="category-title">{getActiveCategoryData().title}</div>
            
            {categoryLoading ? (
              <div className="category-loading">Loading category data...</div>
            ) : getActiveCategoryData().data && getActiveCategoryData().data.length > 0 ? (
              <div className="category-coins">
                {getActiveCategoryData().data.slice(0, 5).map(renderCompactCoinCard)}
              </div>
            ) : (
              <div className="category-empty">{getActiveCategoryData().emptyMessage}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 