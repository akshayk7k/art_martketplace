import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import ArtCard from "../components/ArtCard";
import "./Home.css";

const ITEMS_PER_PAGE = 3; // Show exactly 3 items per page

const Home = () => {
  const [artworks, setArtworks] = useState([]);
  const [filteredArtworks, setFilteredArtworks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        const artworksRef = collection(db, "artworks");
        const artworksQuery = query(artworksRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(artworksQuery);
        
        const artworksList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setArtworks(artworksList);
        setFilteredArtworks(artworksList);
      } catch (err) {
        console.error("Error fetching artworks:", err);
        setError(`Failed to load artworks: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchArtworks();
  }, []);

  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredArtworks(artworks);
    } else {
      const filtered = artworks.filter(art => art.category === selectedCategory);
      setFilteredArtworks(filtered);
    }
    setCurrentPage(1); // Reset to first page when category changes
  }, [selectedCategory, artworks]);

  const handleDelete = (deletedArtId) => {
    setArtworks(prevArtworks => prevArtworks.filter(art => art.id !== deletedArtId));
  };

  // Calculate pagination values
  const totalPages = Math.ceil(filteredArtworks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentArtworks = filteredArtworks.slice(startIndex, endIndex);

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
    window.scrollTo(0, 0);
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const handlePageSelect = (event) => {
    const page = Number(event.target.value);
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  // Generate array of page numbers for the selector
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  if (loading) {
    return <div className="loading">Loading artworks...</div>;
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

  const getEmptyStateMessage = () => {
    switch (selectedCategory) {
      case 'digital':
        return 'No digital artworks found.';
      case 'photography':
        return 'No photographs found.';
      case 'painting':
        return 'No paintings found.';
      default:
        return 'No artworks found.';
    }
  };

  if (filteredArtworks.length === 0) {
    return (
      <div className="no-artworks">
        <p>{getEmptyStateMessage()}</p>
        <p>Be the first to upload {selectedCategory !== 'all' ? `a ${selectedCategory} artwork` : 'an artwork'}!</p>
        <a href="/upload" className="upload-link">Upload {selectedCategory !== 'all' ? `${selectedCategory} artwork` : 'Artwork'}</a>
      </div>
    );
  }

  return (
    <div className="home-container">
      <h1>Art Gallery</h1>
      
      <div className="category-filter">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="category-selector"
        >
          <option value="all">All Categories</option>
          <option value="digital">Digital Art</option>
          <option value="photography">Photography</option>
          <option value="painting">Painting</option>
        </select>
      </div>

      <div className="art-grid">
        {currentArtworks.map((art) => (
          <ArtCard 
            key={art.id} 
            art={art} 
            onDelete={handleDelete}
          />
        ))}
      </div>
      
      {/* Pagination Controls */}
      <div className="pagination">
        <button 
          className="pagination-button"
          onClick={handlePrevPage}
          disabled={currentPage === 1}
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
          className="pagination-button"
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
      
      <div className="total-info">
        Total Artworks: {filteredArtworks.length}
        {selectedCategory !== "all" && ` (Filtered by ${selectedCategory})`}
      </div>
    </div>
  );
};

export default Home;
