import { useState, useEffect } from 'react';
import { getCryptoNews } from '../services/api';
import NewsCard from '../components/NewsCard';

// Default mock news for fallback
const DEFAULT_MOCK_NEWS = [
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
  }
];

const News = () => {
  const [news, setNews] = useState(DEFAULT_MOCK_NEWS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchNews = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }
      
      console.log("Fetching news...");
      const data = await getCryptoNews();
      console.log("News data received:", data);
      
      if (data && Array.isArray(data) && data.length > 0) {
        setNews(data);
        setLastRefreshed(new Date());
        setError(null);
        console.log(`Successfully loaded ${data.length} news items`);
      } else {
        console.error("Invalid or empty news data format:", data);
        setError('Received invalid data from the API');
        setNews(DEFAULT_MOCK_NEWS);
      }
    } catch (err) {
      console.error("Error in fetchNews:", err);
      setError('Failed to fetch news: ' + (err.message || 'Unknown error'));
      setNews(DEFAULT_MOCK_NEWS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNews();
  };

  const formatRefreshTime = () => {
    try {
      return lastRefreshed.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (err) {
      console.error("Error formatting time:", err);
      return "Unknown time";
    }
  };

  return (
    <div className="news-container">
      <div className="news-header">
        <h1>Cryptocurrency News</h1>
        <div className="refresh-container">
          <span className="last-updated">
            Last updated: {formatRefreshTime()}
          </span>
          <button 
            onClick={handleRefresh} 
            disabled={refreshing || loading} 
            className="refresh-button"
          >
            {refreshing ? '🔄 Refreshing...' : '⟳ Refresh News'}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading && !refreshing ? (
        <div className="loading-container">
          <div className="loading-text">Loading cryptocurrency news</div>
          <div className="loading-spinner"></div>
        </div>
      ) : news && news.length > 0 ? (
        <div className="news-grid">
          {news.map((article, index) => (
            <NewsCard key={index} news={article} isSmall={true} />
          ))}
        </div>
      ) : (
        <div className="empty-news">
          <div className="empty-icon">📰</div>
          <h3>No News Available</h3>
          <p>There are no cryptocurrency news articles available at the moment. Please try again later.</p>
          <button onClick={handleRefresh} className="try-again-button">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default News; 