import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import ArtCard from "../components/ArtCard";
import "./Home.css";

const ITEMS_PER_PAGE = 4; // Show exactly 4 items per page (2x2 grid)

const CATEGORIES = {
  ALL: 'All Categories',
  DIGITAL: 'Digital Photography',
  ART: 'Art & Painting'
};

const Home = () => {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        let artworksQuery;
        if (selectedCategory === CATEGORIES.ALL) {
          artworksQuery = query(collection(db, 'artworks'), orderBy('createdAt', 'desc'));
        } else {
          artworksQuery = query(
            collection(db, 'artworks'),
            where('category', '==', selectedCategory),
            orderBy('createdAt', 'desc')
          );
        }

        const querySnapshot = await getDocs(artworksQuery);
        const artworkData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setArtworks(artworkData);
        setTotalPages(Math.ceil(artworkData.length / ITEMS_PER_PAGE));
        setCurrentPage(1); // Reset to first page when category changes
      } catch (error) {
        console.error('Error fetching artworks:', error);
        setError(`Failed to load artworks: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchArtworks();
  }, [selectedCategory]);

  const handleDelete = (deletedArtId) => {
    setArtworks(prevArtworks => prevArtworks.filter(art => art.id !== deletedArtId));
  };

  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return artworks.slice(startIndex, endIndex);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

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

  return (
    <div className="home-container">
      <h1>Art Gallery</h1>
      
      <div className="category-selection">
        {Object.values(CATEGORIES).map((category) => (
          <button
            key={category}
            className={`category-button ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => handleCategoryChange(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {artworks.length === 0 ? (
        <div className="no-artworks">
          <p>No artworks found in {selectedCategory === CATEGORIES.ALL ? 'any category' : selectedCategory}. Be the first to upload!</p>
          <a href="/upload" className="upload-link">Upload Artwork</a>
        </div>
      ) : (
        <>
          <div className="art-grid">
            {getCurrentPageItems().map((artwork) => (
              <ArtCard 
                key={artwork.id} 
                art={artwork} 
                onDelete={handleDelete}
              />
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="pagination">
              <div className="pagination-controls">
                <button
                  className="pagination-button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                  className="pagination-button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
              <div className="total-info">
                ({artworks.length} total artworks)
              </div>
            </div>
          )}
          
          <div className="total-info">
            {selectedCategory === CATEGORIES.ALL ? '' : `${selectedCategory}: `}
            Total Artworks: {artworks.length}
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
