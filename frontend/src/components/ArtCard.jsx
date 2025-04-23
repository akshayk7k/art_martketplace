import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import Modal from './Modal';
import StarRating from './StarRating';
import "./ArtCard.css";

const ArtCard = ({ art, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [totalRatings, setTotalRatings] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const { currentUser, isAdmin } = useAuth();

  const isOwner = currentUser && art.userId === currentUser.uid;
  const canModify = isAdmin || isOwner;

  useEffect(() => {
    if (art.id) {
      fetchRatingsAndReviews();
    }
  }, [art.id]);

  const fetchRatingsAndReviews = async () => {
    try {
      const artworkRef = doc(db, "artworks", art.id);
      const artworkDoc = await getDoc(artworkRef);
      const data = artworkDoc.data();
      
      if (data.ratings) {
        const ratings = data.ratings || [];
        const total = ratings.length;
        const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
        const average = total > 0 ? Number((sum / total).toFixed(1)) : 0;
        
        setAverageRating(average);
        setTotalRatings(total);
        setReviews(ratings.filter(r => r.review).sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        ));

        if (currentUser) {
          const userRatingObj = ratings.find(r => r.userId === currentUser.uid);
          if (userRatingObj) {
            setUserRating(userRatingObj.rating);
            setUserReview(userRatingObj.review || '');
          }
        }
      }
    } catch (error) {
      console.error("Error fetching ratings:", error);
    }
  };

  const handleRatingSubmit = async (rating) => {
    if (!currentUser) {
      alert("Please log in to rate artworks");
      return;
    }

    if (isOwner) {
      alert("You cannot rate your own artwork");
      return;
    }

    try {
      const artworkRef = doc(db, "artworks", art.id);
      const artworkDoc = await getDoc(artworkRef);
      const data = artworkDoc.data();
      const ratings = data.ratings || [];

      const updatedRatings = ratings.filter(r => r.userId !== currentUser.uid);
      
      const newRating = {
        userId: currentUser.uid,
        username: currentUser.displayName || 'Anonymous',
        rating: Number(rating.toFixed(1)),
        timestamp: new Date().toISOString()
      };
      updatedRatings.push(newRating);

      await updateDoc(artworkRef, {
        ratings: updatedRatings
      });

      await fetchRatingsAndReviews();
      setUserRating(rating);
    } catch (error) {
      console.error("Error updating rating:", error);
      alert("Failed to update rating. Please try again.");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert("Please log in to review artworks");
      return;
    }

    if (isOwner) {
      alert("You cannot review your own artwork");
      return;
    }

    try {
      const artworkRef = doc(db, "artworks", art.id);
      const artworkDoc = await getDoc(artworkRef);
      const data = artworkDoc.data();
      const ratings = data.ratings || [];

      const updatedRatings = ratings.filter(r => r.userId !== currentUser.uid);
      
      const newRating = {
        userId: currentUser.uid,
        username: currentUser.displayName || 'Anonymous',
        rating: Number(userRating.toFixed(1)),
        review: userReview.trim(),
        timestamp: new Date().toISOString()
      };
      updatedRatings.push(newRating);

      await updateDoc(artworkRef, {
        ratings: updatedRatings
      });

      await fetchRatingsAndReviews();
      setIsReviewModalOpen(false);
    } catch (error) {
      console.error("Error updating review:", error);
      alert("Failed to update review. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!canModify) return;
    
    try {
      setIsDeleting(true);
      await deleteDoc(doc(db, "artworks", art.id));
      onDelete(art.id);
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting artwork:", error);
      alert("Failed to delete artwork. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="art-card">
      <div className="art-image-container" onClick={() => setIsModalOpen(true)}>
        <img src={art.imageData} alt={art.title} />
        <div className="image-overlay">
          <span>Click to view full size</span>
        </div>
      </div>

      <div className="art-info">
        <h3 className="art-title">{art.title}</h3>
        <p className="art-artist">{art.artist}</p>

        <div className="rating-container">
          <div className="rating-summary">
            <StarRating 
              initialRating={averageRating} 
              readonly={true} 
            />
            <span className="rating-count">({totalRatings} ratings)</span>
          </div>

          {currentUser && !isOwner && (
            <div className="user-rating">
              <p>Rate this artwork:</p>
              <StarRating 
                initialRating={userRating} 
                onRate={handleRatingSubmit}
              />
              <button 
                className="review-button"
                onClick={() => setIsReviewModalOpen(true)}
              >
                Write a Review
              </button>
            </div>
          )}
        </div>

        <div className="reviews-section">
          <h4>Reviews ({reviews.length})</h4>
          {reviews.length > 0 ? (
            <>
              <div className="reviews-list">
                {(showAllReviews ? reviews : reviews.slice(0, 2)).map((review, index) => (
                  <div key={index} className="review-item">
                    <div className="review-header">
                      <span className="reviewer-name">{review.username}</span>
                      <StarRating initialRating={review.rating} readonly={true} />
                    </div>
                    <p className="review-text">{review.review}</p>
                    <span className="review-date">
                      {new Date(review.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
              {reviews.length > 2 && (
                <button 
                  className="show-more-button"
                  onClick={() => setShowAllReviews(!showAllReviews)}
                >
                  {showAllReviews ? 'Show Less' : `Show All Reviews (${reviews.length})`}
                </button>
              )}
            </>
          ) : (
            <p className="no-reviews">No reviews yet. Be the first to review!</p>
          )}
        </div>

        {canModify && (
          <button 
            className="delete-button"
            onClick={() => setIsDeleteModalOpen(true)}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Artwork'}
          </button>
        )}

        <div className="upload-badges">
          {isOwner && <span className="owner-badge">Your Artwork</span>}
          <span className={art.isAdminUpload ? "admin-upload-badge" : "user-upload-badge"}>
            {art.isAdminUpload ? 'Admin Upload' : 'User Upload'}
          </span>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
      >
        <img 
          src={art.imageData} 
          alt={art.title} 
          className="full-size-image"
        />
      </Modal>

      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Artwork"
      >
        <div className="delete-confirmation">
          <p>This action cannot be undone.</p>
          <div className="modal-buttons">
            <button 
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isReviewModalOpen} 
        onClose={() => setIsReviewModalOpen(false)}
        title="Write a Review"
      >
        <form onSubmit={handleReviewSubmit} className="review-form">
          <div className="review-rating">
            <p>Your Rating:</p>
            <StarRating 
              initialRating={userRating} 
              onRate={rating => setUserRating(rating)}
            />
          </div>
          <div className="review-input">
            <label htmlFor="review">Your Review:</label>
            <textarea
              id="review"
              value={userReview}
              onChange={(e) => setUserReview(e.target.value)}
              placeholder="Share your thoughts about this artwork..."
              rows={4}
              required
            />
          </div>
          <div className="modal-buttons">
            <button 
              type="button" 
              onClick={() => setIsReviewModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit">
              Submit Review
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ArtCard;
