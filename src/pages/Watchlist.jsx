import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { getCoinsList, searchCoins, getCoinHistory } from '../services/api';
import { AppContext } from '../context/AppContext';
import { fetchCoinsMarkets } from '../api/api';
import "../styles/Watchlist.css";

const Watchlist = () => {
  const { watchlist, addToWatchlist, removeFromWatchlist } = useContext(AppContext);
  const [watchlistCoins, setWatchlistCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [activeCoin, setActiveCoin] = useState(null);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('watchlist'); // 'watchlist' or 'add'
  const [priceHistory, setPriceHistory] = useState([]);
  const [historyTimeframe, setHistoryTimeframe] = useState(7); // days
  const [isLoadingChart, setIsLoadingChart] = useState(false);

  // Load all coins in watchlist
  useEffect(() => {
    const fetchWatchlistData = async () => {
      setLoading(true);
      if (watchlist.length > 0) {
        try {
          const data = await fetchCoinsMarkets(watchlist);
          setWatchlistCoins(data);
        } catch (error) {
          console.error('Error fetching watchlist data:', error);
        }
      } else {
        setWatchlistCoins([]);
      }
      setLoading(false);
    };

    fetchWatchlistData();
  }, [watchlist]);

  // Search for coins - fixed and improved
  useEffect(() => {
    console.log("Search query changed:", searchQuery);
    console.log("Current search results:", searchResults);
    console.log("Is searching:", isSearching);
    console.log("Show search results:", showSearchResults);
    
    if (searchQuery.trim() === '') {
      console.log("Empty search query, clearing results");
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    if (searchTimeout) {
      console.log("Clearing previous search timeout");
      clearTimeout(searchTimeout);
    }

    setIsSearching(true);
    console.log("Set isSearching to true");

    const timeoutId = setTimeout(async () => {
      try {
        console.log("Search timeout triggered, searching for:", searchQuery);
        // Direct API call to get search results
        const data = await searchCoins(searchQuery);
        console.log("Search API response:", data);
        
        if (data && data.length > 0) {
          console.log("Valid data received, filtering out watchlisted coins");
          // Filter out coins already in watchlist
          const filteredResults = data.filter(coin => !watchlist.includes(coin.id));
          console.log("Filtered results:", filteredResults);
          setSearchResults(filteredResults.slice(0, 10)); // Limit to 10 results
          // Force showing search results if we have results
          if (filteredResults.length > 0) {
            console.log("Setting showSearchResults to true as we have results");
            setShowSearchResults(true);
          }
        } else {
          console.log("No results found or invalid data");
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Error searching coins:', error);
        setSearchResults([]);
      } finally {
        console.log("Search complete, setting isSearching to false");
        setIsSearching(false);
      }
    }, 500);

    console.log("Set new search timeout");
    setSearchTimeout(timeoutId);

    return () => {
      if (searchTimeout) {
        console.log("Cleanup: clearing search timeout");
        clearTimeout(searchTimeout);
      }
    };
  }, [searchQuery, watchlist]);

  // Fetch price history for selected coin
  useEffect(() => {
    if (!activeCoin) {
      setPriceHistory([]);
      return;
    }

    const fetchPriceHistory = async () => {
      console.log("Fetching price history for:", activeCoin.id, "timeframe:", historyTimeframe);
      setIsLoadingChart(true);
      try {
        const data = await getCoinHistory(activeCoin.id, historyTimeframe);
        console.log("History data received:", data);
        if (data && data.prices) {
          setPriceHistory(data.prices);
        } else {
          setPriceHistory([]);
        }
      } catch (error) {
        console.error('Error fetching price history:', error);
        setPriceHistory([]);
      } finally {
        setIsLoadingChart(false);
      }
    };

    fetchPriceHistory();
  }, [activeCoin, historyTimeframe]);

  const handleSearchFocus = () => {
    console.log("Search input focused");
    console.log("Current search results:", searchResults);
    if (searchResults.length > 0) {
      console.log("Showing search results on focus because we have results");
      setShowSearchResults(true);
    } else if (searchQuery.trim() !== '') {
      console.log("No results but query exists, trigger search on focus");
      // If we have a query but no results, show a loading state
      setIsSearching(true);
      // Re-trigger the search
      searchCoins(searchQuery).then(data => {
        console.log("Focus-triggered search results:", data);
        if (data && data.length > 0) {
          const filteredResults = data.filter(coin => !watchlist.includes(coin.id));
          setSearchResults(filteredResults.slice(0, 10));
          setShowSearchResults(true);
        }
        setIsSearching(false);
      }).catch(error => {
        console.error("Error in focus-triggered search:", error);
        setIsSearching(false);
      });
    }
  };

  // Update the blur handler to delay hiding results
  const handleSearchBlur = () => {
    console.log("Search input blurred");
    // Delay hiding results to allow clicking on them
    setTimeout(() => {
      console.log("Blur timeout: hiding search results");
      setShowSearchResults(false);
    }, 200);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (watchlist.length > 0) {
        const data = await fetchCoinsMarkets(watchlist);
        setWatchlistCoins(data);
      }
      
      if (activeCoin) {
        console.log("Refreshing price history for:", activeCoin.id);
        const historyData = await getCoinHistory(activeCoin.id, historyTimeframe);
        if (historyData && historyData.prices) {
          setPriceHistory(historyData.prices);
        }
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddCoin = () => {
    console.log("Adding coin to watchlist:", selectedCoin);
    if (selectedCoin) {
      try {
        // Add coin to watchlist
        addToWatchlist(selectedCoin.id);
        
        // Show a temporary success message (optional)
        console.log(`Added ${selectedCoin.name} to watchlist`);
        
        // Reset the form
        setSelectedCoin(null);
        setSearchQuery('');
        setSearchResults([]);
        
        // Switch to watchlist tab
        setActiveTab('watchlist');
        
        // Refresh data after adding a coin
        handleRefresh();
      } catch (error) {
        console.error("Error adding coin to watchlist:", error);
        // Handle error (could add state for error message if needed)
      }
    } else {
      console.warn("No coin selected to add");
    }
  };

  const handleCoinSelect = (coin) => {
    console.log("Selected coin:", coin);
    setSelectedCoin(coin);
    setSearchQuery(coin.name);
    // Don't hide search results immediately to avoid flashing
    setTimeout(() => {
      setShowSearchResults(false);
    }, 100);
  };

  const handleCoinClick = (coin) => {
    console.log("Coin clicked:", coin.id);
    setActiveCoin(coin);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Update the search input to ensure proper handling of events
  const renderSearchBox = () => {
    return (
      <div className="search-box">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
          placeholder="Search for a cryptocurrency..."
          className="search-input"
          autoComplete="off"
        />
        <span className="search-icon">🔍</span>
        {isSearching && <div className="search-loading">Searching...</div>}

        {showSearchResults && searchResults.length > 0 && (
          <div 
            className="search-results"
            onMouseDown={(e) => e.preventDefault()} // Prevent blur event from hiding results
          >
            {searchResults.map((coin) => (
              <div
                key={coin.id}
                className="search-result-item"
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent blur event from hiding results
                  handleCoinSelect(coin);
                }}
              >
                <img 
                  src={coin.image} 
                  alt={coin.name} 
                  className="result-icon"
                  onError={(e) => {
                    // Fallback for missing images
                    e.target.src = "https://via.placeholder.com/24?text=coin";
                  }}
                />
                <div className="result-info">
                  <span className="result-name">{coin.name}</span>
                  <span className="result-symbol">{coin.symbol.toUpperCase()}</span>
                </div>
                <span className="result-price">{formatCurrency(coin.current_price || 0)}</span>
              </div>
            ))}
          </div>
        )}

        {showSearchResults && searchResults.length === 0 && !isSearching && searchQuery.trim() !== '' && (
          <div className="no-results">
            No cryptocurrencies found matching "{searchQuery}"
          </div>
        )}
      </div>
    );
  };

  // Render price chart for coin
  const renderPriceChart = () => {
    if (!activeCoin) {
      return (
        <div className="no-selection">
          <div className="empty-icon">📈</div>
          <h3>Select a coin to view chart</h3>
          <p>Click on any coin in your watchlist to see price history</p>
        </div>
      );
    }

    if (isLoadingChart) {
      return <div className="loading-spinner">Loading price data...</div>;
    }

    if (priceHistory.length === 0) {
      return (
        <div className="empty-chart">
          <div className="empty-icon">📊</div>
          <p>No price data available for {activeCoin.name}</p>
          <p>Try selecting another timeframe or check back later</p>
        </div>
      );
    }

    // Simple price chart visualization using CSS
    const prices = priceHistory.map(item => item[1]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice;

    return (
      <div className="price-chart-container">
        <div className="chart-header">
          <div>
            <h3>{activeCoin.name} Price Chart</h3>
            <div className="chart-price">
              Current: {formatCurrency(activeCoin.current_price || 0)}
              <span className={`chart-change ${activeCoin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`}>
                {activeCoin.price_change_percentage_24h > 0 ? '+' : ''}
                {activeCoin.price_change_percentage_24h?.toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="chart-timeframes">
            <button 
              className={historyTimeframe === 1 ? 'active' : ''} 
              onClick={() => setHistoryTimeframe(1)}
            >
              24h
            </button>
            <button 
              className={historyTimeframe === 7 ? 'active' : ''} 
              onClick={() => setHistoryTimeframe(7)}
            >
              7d
            </button>
            <button 
              className={historyTimeframe === 30 ? 'active' : ''} 
              onClick={() => setHistoryTimeframe(30)}
            >
              30d
            </button>
            <button 
              className={historyTimeframe === 90 ? 'active' : ''} 
              onClick={() => setHistoryTimeframe(90)}
            >
              90d
            </button>
          </div>
        </div>

        <div className="price-chart">
          <div className="chart-y-axis">
            <span>{formatCurrency(maxPrice)}</span>
            <span>{formatCurrency(minPrice + range/2)}</span>
            <span>{formatCurrency(minPrice)}</span>
          </div>
          <div className="chart-plot">
            {priceHistory.map((point, index) => {
              // Calculate relative position of data point in the chart
              const normalizedHeight = ((point[1] - minPrice) / range) * 100;
              return (
                <div 
                  key={index} 
                  className="chart-point" 
                  style={{ 
                    left: `${(index / (priceHistory.length - 1)) * 100}%`,
                    bottom: `${normalizedHeight}%` 
                  }}
                  title={`${new Date(point[0]).toLocaleDateString()} - ${formatCurrency(point[1])}`}
                >
                  <div className="point-dot"></div>
                </div>
              );
            })}
            <div className="chart-line">
              {priceHistory.map((point, index) => {
                if (index === 0) return null;
                
                const prevPoint = priceHistory[index - 1];
                const startX = ((index - 1) / (priceHistory.length - 1)) * 100;
                const endX = (index / (priceHistory.length - 1)) * 100;
                const startY = ((prevPoint[1] - minPrice) / range) * 100;
                const endY = ((point[1] - minPrice) / range) * 100;
                
                return (
                  <svg key={index} style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 1 }}>
                    <line
                      x1={`${startX}%`}
                      y1={`${100 - startY}%`}
                      x2={`${endX}%`}
                      y2={`${100 - endY}%`}
                      style={{ 
                        stroke: activeCoin.price_change_percentage_24h >= 0 ? 'var(--positive-color)' : 'var(--negative-color)',
                        strokeWidth: '2px'
                      }}
                    />
                  </svg>
                );
              })}
            </div>
          </div>
        </div>

        <div className="chart-x-axis">
          {priceHistory.length > 0 && (
            <>
              <span>{new Date(priceHistory[0][0]).toLocaleDateString()}</span>
              <span>{new Date(priceHistory[Math.floor(priceHistory.length / 2)][0]).toLocaleDateString()}</span>
              <span>{new Date(priceHistory[priceHistory.length - 1][0]).toLocaleDateString()}</span>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="watchlist-container">
      <div className="watchlist-dashboard">
        <div className="dashboard-header">
          <h1>Your Watchlist</h1>
          <div className="dashboard-actions">
            <button 
              className="refresh-button" 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              title="Refresh data"
            >
              {isRefreshing ? '🔄' : '⟳'} {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="watchlist-stats">
          <div className="stats-card">
            <h3>Tracked Coins</h3>
            <p className="stat-value">{watchlist.length}</p>
          </div>
        </div>

        <div className="watchlist-tabs">
          <button 
            className={`tab-button ${activeTab === 'watchlist' ? 'active' : ''}`}
            onClick={() => setActiveTab('watchlist')}
          >
            My Coins
          </button>
          <button 
            className={`tab-button ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            Add New Coin
          </button>
        </div>

        <div className="watchlist-content">
          <div className="coins-panel">
            {activeTab === 'watchlist' ? (
              <>
                {loading ? (
                  <div className="loading-spinner">Loading your coins...</div>
                ) : watchlist.length === 0 ? (
                  <div className="empty-watchlist">
                    <div className="empty-icon">📈</div>
                    <h3>Your watchlist is empty</h3>
                    <p>Click "Add New Coin" to start tracking cryptocurrencies</p>
                    <button 
                      className="add-tab-button"
                      onClick={() => setActiveTab('add')}
                    >
                      Add New Coin
                    </button>
                  </div>
                ) : (
                  <div className="coins-list custom-scrollbar">
                    {watchlistCoins.map((coin) => (
                      <div 
                        key={coin.id}
                        className={`coin-card ${activeCoin?.id === coin.id ? 'active' : ''}`}
                        onClick={() => handleCoinClick(coin)}
                      >
                        <div className="coin-info">
                          <img 
                            src={coin.image} 
                            alt={coin.name} 
                            className="coin-icon"
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/40?text=coin";
                            }}
                          />
                          <div className="coin-details">
                            <h3>{coin.name}</h3>
                            <div className="coin-meta">
                              <span className="coin-symbol">{coin.symbol.toUpperCase()}</span>
                              <span className="coin-price">{formatCurrency(coin.current_price || 0)}</span>
                              <span className={`coin-change ${coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`}>
                                {coin.price_change_percentage_24h > 0 ? '+' : ''}
                                {coin.price_change_percentage_24h?.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <button 
                          className="remove-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromWatchlist(coin.id);
                            if (activeCoin?.id === coin.id) {
                              setActiveCoin(null);
                            }
                          }}
                          title="Remove from watchlist"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="add-coin-section custom-scrollbar">
                <h3>Search Cryptocurrency</h3>
                {renderSearchBox()}

                {selectedCoin && (
                  <div className="selected-coin">
                    <img 
                      src={selectedCoin.image} 
                      alt={selectedCoin.name} 
                      className="selected-icon"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/32?text=coin";
                      }}
                    />
                    <div className="selected-info">
                      <span className="selected-name">{selectedCoin.name}</span>
                      <span className="selected-symbol">{selectedCoin.symbol.toUpperCase()}</span>
                    </div>
                    <span className="selected-price">{formatCurrency(selectedCoin.current_price || 0)}</span>
                  </div>
                )}

                <button
                  className="add-button"
                  onClick={handleAddCoin}
                  disabled={!selectedCoin || watchlist.includes(selectedCoin.id)}
                >
                  {watchlist.includes(selectedCoin?.id) 
                    ? 'Already in watchlist' 
                    : selectedCoin 
                      ? `Add ${selectedCoin.name} to Watchlist` 
                      : 'Select a coin to add'
                  }
                </button>
                
                {/* Add more detailed instructions */}
                <div className="search-instructions">
                  <h4>How to add coins to your watchlist:</h4>
                  <ol>
                    <li>Type a cryptocurrency name or symbol in the search box</li>
                    <li>Select a coin from the search results</li>
                    <li>Click the "Add to Watchlist" button</li>
                  </ol>
                  <p>You can track price changes and view detailed charts for any cryptocurrency in your watchlist.</p>
                </div>
              </div>
            )}
          </div>

          <div className="chart-panel">
            <div className="panel-header">
              <h2>Price History</h2>
            </div>
            {renderPriceChart()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Watchlist; 