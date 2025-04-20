import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

const NewsCard = ({ news, isSmall = false }) => {
  // Debug log the news item on component render
  useEffect(() => {
    console.log("NewsCard received props:", { 
      title: news?.title,
      hasImage: Boolean(news?.urlToImage),
      hasDescription: Boolean(news?.description),
      isSmall
    });
  }, [news, isSmall]);
  
  // Handle clicking on the news card
  const handleNewsClick = () => {
    if (news && news.url) {
      window.open(news.url, '_blank', 'noopener,noreferrer');
    }
  };
  
  // Format date to more readable format
  const formatDate = (dateString) => {
    try {
      if (!dateString) return "Recent";
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Recent"; // Invalid date
      
      // For recent dates, show relative time
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      
      if (diffHours < 24) {
        return diffHours === 0 ? 'Just now' : `${diffHours}h ago`;
      } else if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else {
        return date.toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      }
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return "Recent";
    }
  };
  
  // Truncate description to avoid it being too long
  const truncateDescription = (description) => {
    if (!description) return "No description available";
    if (description.length <= 120) return description;
    return description.substring(0, 120) + '...';
  };

  // Ensure the news object is valid
  if (!news) {
    console.error("NewsCard received null or undefined news item");
    return null;
  }
  
  if (!news.title) {
    console.error("NewsCard received news item without title:", news);
    return null;
  }

  // Default image if none provided
  const imageUrl = news.urlToImage || "https://via.placeholder.com/300x160?text=Crypto+News";
  // Ensure we have a source name
  const sourceName = news.source || "News Source";

  return (
    <div 
      className={`news-card ${isSmall ? 'small' : ''}`}
      onClick={handleNewsClick}
      data-testid="news-card"
    >
      <div className="news-image">
        <img 
          src={imageUrl} 
          alt={news.title || "Cryptocurrency news"} 
          onError={(e) => {
            console.log("Image failed to load, using fallback");
            e.target.src = "https://via.placeholder.com/300x160?text=News";
          }}
        />
      </div>
      <div className="news-content">
        <h3>{news.title}</h3>
        {!isSmall && (
          <p className="news-description">{truncateDescription(news.description)}</p>
        )}
        <div className="news-meta">
          <p className="news-date">
            <span>🕒</span> {formatDate(news.publishedAt)}
          </p>
          <p className="news-source">{sourceName}</p>
        </div>
        {news.url && (
          <a 
            href={news.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="read-more"
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering parent's click
              console.log("Read more clicked for:", news.title);
            }} 
          >
            Read More
          </a>
        )}
      </div>
    </div>
  );
};

NewsCard.propTypes = {
  news: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    url: PropTypes.string.isRequired,
    urlToImage: PropTypes.string,
    publishedAt: PropTypes.string,
    source: PropTypes.string
  }).isRequired,
  isSmall: PropTypes.bool
};

export default NewsCard; 