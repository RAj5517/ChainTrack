import { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [watchlist, setWatchlist] = useState(() => {
    const savedWatchlist = localStorage.getItem('watchlist');
    return savedWatchlist ? JSON.parse(savedWatchlist) : [];
  });

  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const addToWatchlist = (coinId) => {
    if (!watchlist.includes(coinId)) {
      setWatchlist([...watchlist, coinId]);
    }
  };

  const removeFromWatchlist = (coinId) => {
    setWatchlist(watchlist.filter(id => id !== coinId));
  };

  return (
    <AppContext.Provider value={{ 
      watchlist, 
      addToWatchlist, 
      removeFromWatchlist 
    }}>
      {children}
    </AppContext.Provider>
  );
};

AppProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default AppProvider; 