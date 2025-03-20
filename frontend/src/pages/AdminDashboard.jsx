import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { collection, query, getDocs, updateDoc, addDoc, doc } from 'firebase/firestore';
import Modal from '../components/Modal';
import './AdminDashboard.css';
import './ManageArtworks.css';

// Import icons
import flagIcon from '../assets/icons/flag.svg';
import unflagIcon from '../assets/icons/unflag.svg';
import uploadIcon from '../assets/icons/upload.svg';
import adminBadgeIcon from '../assets/icons/admin-badge.svg';
import loadingSpinner from '../assets/loading.svg';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB max size

const resizeAndConvertToBase64 = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Maximum width of 1200px
        if (width > 1200) {
          height = Math.round((height * 1200) / width);
          width = 1200;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with reduced quality
        const base64Image = canvas.toDataURL('image/jpeg', 0.8);
        resolve(base64Image);
      };
    };
  });
};

const AdminDashboard = () => {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    artist: ''
  });
  const [newArtwork, setNewArtwork] = useState({
    title: '',
    artist: '',
    image: null
  });
  const { isAdmin, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }

    fetchArtworks();
  }, [isAdmin, navigate]);

  const fetchArtworks = async () => {
    try {
      const artworksRef = collection(db, "artworks");
      const q = query(artworksRef);
      const querySnapshot = await getDocs(q);
      
      const artworksList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setArtworks(artworksList);
    } catch (err) {
      console.error("Error fetching artworks:", err);
      setError("Failed to load artworks");
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setUploadError(`Image size should be less than ${(MAX_IMAGE_SIZE / (1024 * 1024)).toFixed(1)}MB`);
      return;
    }

    setNewArtwork(prev => ({ ...prev, image: file }));
    setUploadError('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploadError('');
    setIsUploading(true);

    try {
      if (!newArtwork.image || !newArtwork.title || !newArtwork.artist) {
        throw new Error("Please fill in all fields");
      }

      const base64Image = await resizeAndConvertToBase64(newArtwork.image);
      
      const docRef = await addDoc(collection(db, "artworks"), {
        title: newArtwork.title,
        artist: newArtwork.artist,
        imageData: base64Image,
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
        isAdminUpload: true
      });

      // Reset form and refresh artworks
      setNewArtwork({ title: '', artist: '', image: null });
      fetchArtworks();
      alert("Artwork uploaded successfully!");
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError(err.message || "Failed to upload artwork");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFlag = async (artworkId, isFlagged) => {
    try {
      const artworkRef = doc(db, "artworks", artworkId);
      await updateDoc(artworkRef, {
        flagged: isFlagged
      });
      setArtworks(prevArtworks => 
        prevArtworks.map(art => 
          art.id === artworkId ? { ...art, flagged: isFlagged } : art
        )
      );
    } catch (err) {
      console.error("Error updating artwork:", err);
      alert("Failed to update artwork status");
    }
  };

  const openEditModal = (artwork) => {
    setEditingArtwork(artwork);
    setEditForm({
      title: artwork.title,
      artist: artwork.artist
    });
  };

  const closeEditModal = () => {
    setEditingArtwork(null);
    setEditForm({
      title: '',
      artist: ''
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await updateDoc(doc(db, "artworks", editingArtwork.id), {
        title: editForm.title.trim(),
        artist: editForm.artist.trim(),
        lastEdited: new Date().toISOString()
      });
      
      setArtworks(prevArtworks => 
        prevArtworks.map(art => 
          art.id === editingArtwork.id 
            ? { ...art, title: editForm.title.trim(), artist: editForm.artist.trim() } 
            : art
        )
      );
      
      closeEditModal();
    } catch (err) {
      console.error("Error updating artwork:", err);
      alert("Failed to update artwork");
    }
  };

  if (loading) return (
    <div className="admin-loading">
      <img src={loadingSpinner} alt="Loading..." />
      <span>Loading...</span>
    </div>
  );
  if (error) return <div className="admin-error">{error}</div>;

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      {/* Upload Section */}
      <div className="admin-upload-section">
        <h2>Upload New Artwork</h2>
        {uploadError && <div className="upload-error">{uploadError}</div>}
        <form onSubmit={handleUpload} className="admin-upload-form">
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              value={newArtwork.title}
              onChange={(e) => setNewArtwork(prev => ({ ...prev, title: e.target.value }))}
              required
              disabled={isUploading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="artist">Artist</label>
            <input
              type="text"
              id="artist"
              value={newArtwork.artist}
              onChange={(e) => setNewArtwork(prev => ({ ...prev, artist: e.target.value }))}
              required
              disabled={isUploading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="image">Image</label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageSelect}
              required
              disabled={isUploading}
            />
          </div>
          <button type="submit" disabled={isUploading} className={isUploading ? 'loading' : ''}>
            {isUploading ? (
              <>
                <img src={loadingSpinner} alt="" className="spinner" />
                Uploading...
              </>
            ) : (
              <>
                <img src={uploadIcon} alt="" />
                Upload Artwork
              </>
            )}
          </button>
        </form>
      </div>

      {/* Stats Section */}
      <div className="artwork-stats">
        <div className="stat-card">
          <h3>Total Artworks</h3>
          <p>{artworks.length}</p>
        </div>
        <div className="stat-card">
          <h3>Flagged Artworks</h3>
          <p>{artworks.filter(art => art.flagged).length}</p>
        </div>
        <div className="stat-card">
          <h3>Admin Uploads</h3>
          <p>{artworks.filter(art => art.isAdminUpload).length}</p>
        </div>
      </div>

      {/* Artworks Management Section */}
      <div className="artwork-management">
        <div className="artwork-management-header">
          <h2>Manage Artworks</h2>
        </div>

        <div className="artwork-grid">
          {artworks.length === 0 ? (
            <div className="artwork-empty">
              <div className="artwork-empty-icon">🖼️</div>
              <p className="artwork-empty-text">No artworks found</p>
            </div>
          ) : (
            artworks.map(artwork => (
              <div key={artwork.id} className="artwork-card">
                <div className="artwork-image">
                  <img src={artwork.imageData} alt={artwork.title} />
                </div>
                
                <div className="artwork-info">
                  <h3 className="artwork-title">{artwork.title}</h3>
                  <p className="artwork-artist">{artwork.artist}</p>
                  
                  <div className="artwork-meta">
                    <span className="artwork-date">
                      <span>📅</span>
                      {new Date(artwork.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`artwork-status ${artwork.flagged ? 'flagged' : 'active'}`}>
                      {artwork.flagged ? '🚩 Flagged' : '✓ Active'}
                    </span>
                  </div>
                </div>

                <div className="artwork-actions">
                  <button
                    className={`action-button flag-button ${artwork.flagged ? 'flagged' : ''}`}
                    onClick={() => handleFlag(artwork.id, !artwork.flagged)}
                  >
                    {artwork.flagged ? (
                      <>🚫 Unflag</>
                    ) : (
                      <>🚩 Flag</>
                    )}
                  </button>
                  
                  <button
                    className="action-button edit-button"
                    onClick={() => openEditModal(artwork)}
                  >
                    ✏️ Edit
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingArtwork && (
        <div className="edit-modal-overlay" onClick={closeEditModal}>
          <div className="edit-modal" onClick={e => e.stopPropagation()}>
            <button className="edit-modal-close" onClick={closeEditModal}>×</button>
            <div className="edit-modal-header">
              <h3>Edit Artwork</h3>
            </div>
            <form onSubmit={handleEditSubmit} className="edit-modal-form">
              <div className="form-group">
                <label htmlFor="edit-title">Title</label>
                <input
                  id="edit-title"
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter artwork title"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-artist">Artist</label>
                <input
                  id="edit-artist"
                  type="text"
                  value={editForm.artist}
                  onChange={(e) => setEditForm(prev => ({ ...prev, artist: e.target.value }))}
                  placeholder="Enter artist name"
                  required
                />
              </div>
              <div className="edit-modal-actions">
                <button
                  type="button"
                  className="cancel-edit-button"
                  onClick={closeEditModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="save-changes-button"
                  disabled={!editForm.title.trim() || !editForm.artist.trim()}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 