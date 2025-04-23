import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { collection, query, getDocs, updateDoc, addDoc, doc } from 'firebase/firestore';
import Modal from '../components/Modal';
import './AdminDashboard.css';

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

  const handleEdit = async (artworkId, newTitle, newArtist) => {
    try {
      await updateDoc(doc(db, "artworks", artworkId), {
        title: newTitle,
        artist: newArtist,
        lastEdited: new Date().toISOString()
      });
      
      setArtworks(prevArtworks => 
        prevArtworks.map(art => 
          art.id === artworkId 
            ? { ...art, title: newTitle, artist: newArtist } 
            : art
        )
      );
      
      alert("Artwork updated successfully!");
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
      <div className="artwork-list">
        <h2>Manage Artworks</h2>
        <div className="artwork-grid">
          {artworks.map(art => (
            <div key={art.id} className={`artwork-card ${art.flagged ? 'flagged' : ''} ${art.isAdminUpload ? 'admin-upload' : ''}`}>
              <img src={art.imageData || art.imageUrl} alt={art.title} />
              <div className="artwork-info">
                <input
                  type="text"
                  value={art.title}
                  onChange={(e) => handleEdit(art.id, e.target.value, art.artist)}
                  className="edit-title"
                />
                <input
                  type="text"
                  value={art.artist}
                  onChange={(e) => handleEdit(art.id, art.title, e.target.value)}
                  className="edit-artist"
                />
                <p className="upload-date">
                  Uploaded: {new Date(art.createdAt).toLocaleDateString()}
                  {art.lastEdited && ` (Edited: ${new Date(art.lastEdited).toLocaleDateString()})`}
                </p>
                {art.isAdminUpload && <span className="admin-badge">Admin Upload</span>}
              </div>
              <div className="admin-actions">
                <button
                  className={`flag-button ${art.flagged ? 'unflag' : 'flag'}`}
                  onClick={() => handleFlag(art.id, !art.flagged)}
                >
                  <img 
                    src={art.flagged ? unflagIcon : flagIcon} 
                    alt={art.flagged ? "Unflag" : "Flag"} 
                  />
                  {art.flagged ? 'Unflag' : 'Flag'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 