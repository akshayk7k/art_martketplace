import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { deleteDoc, doc, collection, addDoc, query, where, getDocs, getDoc, updateDoc } from 'firebase/firestore';
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
  const [ratingDistribution, setRatingDistribution] = useState({
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0
  });
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
        
        // Calculate rating distribution
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        ratings.forEach(rating => {
          const roundedRating = Math.round(rating.rating);
          distribution[roundedRating]++;
        });
        
        setRatingDistribution(distribution);
        setAverageRating(average);
        setTotalRatings(total);
        setReviews(ratings.filter(r => r.review).sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        ));

        // Get user's rating and review if they've rated
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

      // Remove existing rating if any
      const updatedRatings = ratings.filter(r => r.userId !== currentUser.uid);
      
      // Add new rating
      const newRating = {
        userId: currentUser.uid,
        username: currentUser.displayName,
        rating: Number(rating.toFixed(1)),
        timestamp: new Date().toISOString()
      };
      updatedRatings.push(newRating);

      // Update artwork document
      await updateDoc(artworkRef, {
        ratings: updatedRatings
      });

      // Update local state
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

      // Remove existing rating if any
      const updatedRatings = ratings.filter(r => r.userId !== currentUser.uid);
      
      // Add new rating with review
      const newRating = {
        userId: currentUser.uid,
        username: currentUser.displayName,
        rating: Number(userRating.toFixed(1)),
        review: userReview.trim(),
        timestamp: new Date().toISOString()
      };
      updatedRatings.push(newRating);

      // Update artwork document
      await updateDoc(artworkRef, {
        ratings: updatedRatings
      });

      // Update local state
      await fetchRatingsAndReviews();
      setIsReviewModalOpen(false);
    } catch (error) {
      console.error("Error updating review:", error);
      alert("Failed to update review. Please try again.");
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteDoc(doc(db, "artworks", art.id));
      onDelete(art.id);
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting artwork:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="art-card">
        <div className="art-image-container" onClick={() => setIsModalOpen(true)}>
          <img src={art.imageData || art.imageUrl} alt={art.title} />
          <div className="image-overlay">
            <span>Click to view full size</span>
          </div>
          {canModify && (
            <button 
              className="delete-button"
              onClick={(e) => {
                e.stopPropagation();
                setIsDeleteModalOpen(true);
              }}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : '🗑️ Delete'}
            </button>
          )}
        </div>
        <h3>{art.title}</h3>
        <p className="artist-name">{art.artist}</p>
        
        {/* Rating and Review Section */}
        <div className="rating-review-container">
          <div className="rating-container">
            <div className="rating-summary">
              <div className="review-summary-header">
                <h3>Review summary</h3>
                <span className="info-icon">ⓘ</span>
              </div>
              <div className="rating-bars">
                {[5, 4, 3, 2, 1].map(stars => (
                  <div key={stars} className="rating-bar-row">
                    <span className="stars-label">{stars}</span>
                    <div className="rating-bar-container">
                      <div 
                        className="rating-bar-fill" 
                        style={{ 
                          width: `${totalRatings ? (ratingDistribution[stars] / totalRatings) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rating-summary-right">
                <span className="rating-number">{averageRating.toFixed(1)}</span>
                <StarRating 
                  initialRating={averageRating} 
                  readonly={true} 
                />
                <span className="rating-count">{totalRatings} reviews</span>
              </div>
            </div>
            {currentUser && !isOwner && (
              <div className="user-rating">
                <div className="rating-actions">
                  <div className="quick-rate">
                    <p>Rate this artwork:</p>
                    <StarRating 
                      initialRating={userRating} 
                      onRate={handleRatingSubmit}
                    />
                  </div>
                  <button 
                    className="write-review-button" 
                    onClick={() => setIsReviewModalOpen(true)}
                  >
                    Write a Review
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Reviews Display Section */}
          <div className="reviews-display">
            <h4 className="reviews-title">Reviews ({reviews.length})</h4>
            {reviews.length > 0 ? (
              <>
                <div className="reviews-list">
                  {(showAllReviews ? reviews : reviews.slice(0, 2)).map((review, index) => (
                    <div key={index} className="review-item">
                      <div className="review-header">
                        <div className="review-user-info">
                          <span className="review-username">{review.username}</span>
                          <span className="review-date">
                            {new Date(review.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <StarRating initialRating={review.rating} readonly={true} />
                      </div>
                      {review.review && <p className="review-text">{review.review}</p>}
                    </div>
                  ))}
                </div>
                {reviews.length > 2 && (
                  <button 
                    className="show-more-button"
                    onClick={() => setShowAllReviews(!showAllReviews)}
                  >
                    {showAllReviews ? 'Show Less' : `Show All ${reviews.length} Reviews`}
                  </button>
                )}
              </>
            ) : (
              <p className="no-reviews">No reviews yet. Be the first to review!</p>
            )}
          </div>
        </div>

        {isOwner && <p className="owner-badge">Your Artwork</p>}
        <div className="upload-type-badge">
          {art.isAdminUpload ? (
            <span className="admin-upload-badge">Admin Upload</span>
          ) : (
            <span className="user-upload-badge">User Upload</span>
          )}
        </div>
      </div>

      {/* Review Modal */}
      <Modal 
        isOpen={isReviewModalOpen} 
        onClose={() => setIsReviewModalOpen(false)}
        title="Write a Review"
      >
        <div className="review-modal">
          <form onSubmit={handleReviewSubmit}>
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
                className="cancel-button"
                onClick={() => setIsReviewModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-button"
              >
                Submit Review
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Image Preview Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <img 
          src={art.imageData || art.imageUrl} 
          alt={art.title} 
          className="full-size-image"
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Artwork"
      >
        <div className="delete-confirmation">
          <span className="modal-warning-icon">⚠️</span>
          <h3>Are you sure you want to delete "{art.title}"?</h3>
          <p className="modal-warning">
            This action cannot be undone. The artwork will be permanently removed from the marketplace.
          </p>
          <div className="modal-actions">
            <button 
              className="modal-button cancel"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button 
              className="modal-button delete"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Artwork'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ArtCard;
