import { useState, useEffect } from 'react';
import './StarRating.css';

const StarRating = ({ initialRating = 0, onRate, readonly = false }) => {
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);

  useEffect(() => {
    setRating(initialRating);
  }, [initialRating]);

  const handleClick = (value) => {
    if (!readonly) {
      setRating(value);
      if (onRate) onRate(value);
    }
  };

  const renderStar = (position) => {
    const starValue = Math.ceil(position);
    const isHalfStar = position % 1 !== 0;
    const filled = position <= (hover || rating);
    const halfFilled = isHalfStar && (starValue - 0.5) <= (hover || rating);

    return (
      <span
        key={position}
        className={`star ${filled ? 'filled' : ''} ${halfFilled ? 'half-filled' : ''} ${readonly ? 'readonly' : ''}`}
        onClick={() => handleClick(position)}
        onMouseEnter={() => !readonly && setHover(position)}
        onMouseLeave={() => !readonly && setHover(0)}
      >
        {isHalfStar ? '⭐' : '⭐'}
      </span>
    );
  };

  return (
    <div className="star-rating-container">
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((num) => renderStar(num))}
      </div>
      <span className="rating-value">
        {rating.toFixed(1)}
      </span>
    </div>
  );
};

export default StarRating; 