import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import ArtCard from "../components/ArtCard";
import "./Home.css"; // Reusing Home styles for consistency

const ITEMS_PER_PAGE = 3; // Changed from 4 to 3 items per page

const MyArtwork = () => {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchUserArtworks = async () => {
      try {
        if (!currentUser) {
          setError("Please login to view your artwork");
          setLoading(false);
          return;
        }

        const artworksRef = collection(db, "artworks");
        
        // First try with both where and orderBy
        try {
          const artworksQuery = query(
            artworksRef,
            where("userId", "==", currentUser.uid),
            orderBy("createdAt", "desc")
          );
          
          const querySnapshot = await getDocs(artworksQuery);
          const artworksList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setArtworks(artworksList);
        } catch (indexError) {
          // If index error occurs, fallback to just filtering by userId
          if (indexError.message.includes("requires an index")) {
            console.log("Index not ready yet, falling back to basic query");
            const basicQuery = query(
              artworksRef,
              where("userId", "==", currentUser.uid)
            );
            
            const basicSnapshot = await getDocs(basicQuery);
            const basicArtworksList = basicSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            // Sort the results in memory
            basicArtworksList.sort((a, b) => b.createdAt - a.createdAt);
            setArtworks(basicArtworksList);
          } else {
            throw indexError;
          }
        }
      } catch (err) {
        console.error("Error fetching artworks:", err);
        setError(
          err.message.includes("requires an index")
            ? "The system is being set up. Please try again in a few minutes."
            : `Failed to load your artworks: ${err.message}`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserArtworks();
  }, [currentUser]);

  const handleDelete = (deletedArtId) => {
    setArtworks(prevArtworks => prevArtworks.filter(art => art.id !== deletedArtId));
  };

  // Pagination calculations
  const totalPages = Math.ceil(artworks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentArtworks = artworks.slice(startIndex, endIndex);

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handlePageSelect = (event) => {
    const page = Number(event.target.value);
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  // Generate array of page numbers for the selector
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  if (loading) {
    return <div className="loading">Loading your artworks...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="no-artworks">
        <p>Please login to view your artwork</p>
        <a href="/login" className="upload-link">Login</a>
      </div>
    );
  }

  if (artworks.length === 0) {
    return (
      <div className="no-artworks">
        <p>You haven't uploaded any artwork yet.</p>
        <a href="/upload" className="upload-link">Upload Your First Artwork</a>
      </div>
    );
  }

  return (
    <div className="home-container">
      <h1>My Artwork</h1>
      
      <div className="art-grid">
        {currentArtworks.map((art) => (
          <ArtCard 
            key={art.id} 
            art={art} 
            onDelete={handleDelete}
            showDeleteButton={true}
          />
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={handlePrevPage} 
            disabled={currentPage === 1}
            className="pagination-button"
          >
            Previous
          </button>
          
          <div className="pagination-controls">
            <span className="pagination-info">
              Page {currentPage} of {totalPages}
            </span>
            <select 
              value={currentPage}
              onChange={handlePageSelect}
              className="page-selector"
            >
              {pageNumbers.map(num => (
                <option key={num} value={num}>
                  Go to Page {num}
                </option>
              ))}
            </select>
          </div>

          <button 
            onClick={handleNextPage} 
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}
      
      <div className="total-info">
        Total Artworks: {artworks.length}
      </div>
    </div>
  );
};

export default MyArtwork;