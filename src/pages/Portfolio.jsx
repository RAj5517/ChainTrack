import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// This component acts as a redirect from the old Portfolio route to the new Watchlist route
const PortfolioRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the new Watchlist page
    navigate('/watchlist', { replace: true });
  }, [navigate]);

  return (
    <div className="loading">
      <p>Redirecting to Watchlist...</p>
    </div>
  );
};

export default PortfolioRedirect; 