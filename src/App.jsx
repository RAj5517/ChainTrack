import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './App.css';
import AppProvider from './context/AppContext';

// Import our pages
import Home from './pages/Home';
import CoinDetail from './pages/CoinDetail';
import News from './pages/News';
import Watchlist from './pages/Watchlist';
import PortfolioRedirect from './pages/Portfolio'; // Import the redirect component

// Navbar with active page indicator
const NavBar = () => {
  const location = useLocation();
  const [activePath, setActivePath] = useState('/');

  useEffect(() => {
    setActivePath(location.pathname);
  }, [location]);

  return (
    <header className="app-header">
      <Link to="/" className="app-logo">
        <span className="logo-icon">⛓️</span>
        <span className="logo-text">ChainTrack</span>
      </Link>
      <nav className="app-nav">
        <Link to="/" className={activePath === '/' || activePath.startsWith('/coin/') ? 'active' : ''}>
          <span className="nav-icon">📊</span>
          <span className="nav-text">Explore</span>
        </Link>
        <Link to="/watchlist" className={activePath === '/watchlist' ? 'active' : ''}>
          <span className="nav-icon">⭐</span>
          <span className="nav-text">Watchlist</span>
        </Link>
        <Link to="/news" className={activePath === '/news' ? 'active' : ''}>
          <span className="nav-icon">📰</span>
          <span className="nav-text">News</span>
        </Link>
      </nav>
    </header>
  );
};

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="app-container">
          <NavBar />

          <main className="app-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/coin/:id" element={<CoinDetail />} />
              <Route path="/news" element={<News />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/portfolio" element={<PortfolioRedirect />} />
            </Routes>
          </main>

          <footer className="app-footer">
            <p>© {new Date().getFullYear()} ChainTrack - Cryptocurrency Price Tracker</p>
            <p>Powered by CoinGecko API</p>
          </footer>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
