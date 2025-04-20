import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCoinDetails } from '../services/api';

const CoinDetail = () => {
  const { id } = useParams();
  const [coin, setCoin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCoinDetails = async () => {
      try {
        setLoading(true);
        const data = await getCoinDetails(id);
        setCoin(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch coin details');
        setLoading(false);
      }
    };

    fetchCoinDetails();
  }, [id]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!coin) return <div className="error">Coin not found</div>;

  return (
    <div className="coin-detail-container">
      <Link to="/" className="back-button">← Back to Home</Link>
      
      <div className="coin-header">
        <img src={coin.image.large} alt={coin.name} className="coin-logo" />
        <h1>{coin.name} ({coin.symbol.toUpperCase()})</h1>
      </div>

      <div className="coin-price-container">
        <div className="current-price">
          <h2>${coin.market_data.current_price.usd.toLocaleString()}</h2>
          <span className={`price-change ${coin.market_data.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`}>
            {coin.market_data.price_change_percentage_24h.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="market-info">
        <div className="info-item">
          <h3>Market Cap</h3>
          <p>${coin.market_data.market_cap.usd.toLocaleString()}</p>
        </div>
        <div className="info-item">
          <h3>24h Trading Volume</h3>
          <p>${coin.market_data.total_volume.usd.toLocaleString()}</p>
        </div>
        <div className="info-item">
          <h3>Circulating Supply</h3>
          <p>{coin.market_data.circulating_supply.toLocaleString()} {coin.symbol.toUpperCase()}</p>
        </div>
        <div className="info-item">
          <h3>Total Supply</h3>
          <p>{coin.market_data.total_supply ? coin.market_data.total_supply.toLocaleString() : 'N/A'} {coin.symbol.toUpperCase()}</p>
        </div>
      </div>

      <div className="coin-description">
        <h3>About {coin.name}</h3>
        <div dangerouslySetInnerHTML={{ __html: coin.description.en }} />
      </div>
    </div>
  );
};

export default CoinDetail; 