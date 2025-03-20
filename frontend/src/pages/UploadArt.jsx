import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { collection, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./UploadArt.css";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB max size
const ASPECT_RATIOS = {
  "3:4": { width: 3, height: 4 },
  "4:3": { width: 4, height: 3 },
  "16:9": { width: 16, height: 9 },
  "1:1": { width: 1, height: 1 }
};

const resizeAndConvertToBase64 = (file, aspectRatio) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let targetWidth = 800;
        let targetHeight = Math.round((targetWidth * aspectRatio.height) / aspectRatio.width);

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        let sourceWidth = img.width;
        let sourceHeight = img.height;
        let sourceX = 0;
        let sourceY = 0;

        const sourceAspectRatio = sourceWidth / sourceHeight;
        const targetAspectRatio = aspectRatio.width / aspectRatio.height;

        if (sourceAspectRatio > targetAspectRatio) {
          sourceWidth = Math.round(sourceHeight * targetAspectRatio);
          sourceX = Math.round((img.width - sourceWidth) / 2);
        } else {
          sourceHeight = Math.round(sourceWidth / targetAspectRatio);
          sourceY = Math.round((img.height - sourceHeight) / 2);
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,
          0, 0, targetWidth, targetHeight
        );

        const base64Image = canvas.toDataURL('image/jpeg', 0.85);
        resolve(base64Image);
      };
    };
  });
};

const UploadArt = () => {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [image, setImage] = useState(null);
  const [category, setCategory] = useState("photography");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedRatio, setSelectedRatio] = useState("3:4");
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setUploadProgress(0);

    try {
      if (!image) {
        throw new Error("Please select an image");
      }

      if (!currentUser) {
        throw new Error("You must be logged in to upload artwork");
      }

      setUploadProgress(30);
      const base64Image = await resizeAndConvertToBase64(image, ASPECT_RATIOS[selectedRatio]);
      setUploadProgress(60);

      const docRef = await addDoc(collection(db, "artworks"), {
        title,
        artist,
        imageData: base64Image,
        aspectRatio: selectedRatio,
        userId: currentUser.uid,
        category,
        createdAt: new Date().toISOString()
      });

      setUploadProgress(100);
      alert("Artwork uploaded successfully!");
      navigate("/");
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload artwork. Please try again.");
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError(`Image size should be less than ${(MAX_IMAGE_SIZE / (1024 * 1024)).toFixed(1)}MB`);
      return;
    }

    setImage(file);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const preview = await resizeAndConvertToBase64(file, ASPECT_RATIOS[selectedRatio]);
      setImagePreview(preview);
    };
    reader.readAsDataURL(file);
    
    setError('');
  };

  const handleAspectRatioChange = async (e) => {
    setSelectedRatio(e.target.value);
    if (image) {
      const preview = await resizeAndConvertToBase64(image, ASPECT_RATIOS[e.target.value]);
      setImagePreview(preview);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError(`Image size should be less than ${(MAX_IMAGE_SIZE / (1024 * 1024)).toFixed(1)}MB`);
      return;
    }

    setImage(file);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const preview = await resizeAndConvertToBase64(file, ASPECT_RATIOS[selectedRatio]);
      setImagePreview(preview);
    };
    reader.readAsDataURL(file);
    
    setError('');
  };

  return (
    <div className="upload-page">
      <div className="upload-container">
        <div className="upload-header">
          <h1>Share Your Photography</h1>
          <p>Upload your artwork to showcase your talent to the world</p>
        </div>

        <div className="upload-content">
          <div 
            className={`upload-preview ${isDragging ? 'dragging' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {imagePreview ? (
              <div className="preview-container">
                <img src={imagePreview} alt="Preview" className="preview-image" />
                <button 
                  className="remove-image"
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                  }}
                >
                  Remove Image
                </button>
              </div>
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p>Drag and drop your image here or click to browse</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="file-input"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="upload-button">
                  Choose File
                </label>
              </div>
            )}
          </div>

          <form onSubmit={handleUpload} className="upload-form">
            {error && <div className="upload-error">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                disabled={loading}
                className="form-select"
              >
                <option value="photography">Photography</option>
                <option value="digital">Digital Art</option>
                <option value="painting">Painting</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="aspectRatio">Aspect Ratio</label>
              <select
                id="aspectRatio"
                value={selectedRatio}
                onChange={handleAspectRatioChange}
                disabled={loading}
                className="form-select"
              >
                <option value="3:4">3:4 (Portrait)</option>
                <option value="4:3">4:3 (Landscape)</option>
                <option value="16:9">16:9 (Widescreen)</option>
                <option value="1:1">1:1 (Square)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                type="text"
                placeholder="Give your artwork a title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="artist">Artist Name</label>
              <input
                id="artist"
                type="text"
                placeholder="Your name or artist name"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                required
                disabled={loading}
                className="form-input"
              />
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{uploadProgress}%</span>
              </div>
            )}

            <button 
              type="submit" 
              className="submit-button"
              disabled={loading || !image}
            >
              {loading ? 'Uploading...' : 'Upload Artwork'}
            </button>
          </form>
        </div>

        <div className="upload-requirements">
          <h3>Image Requirements</h3>
          <ul>
            <li>Maximum file size: 10MB</li>
            <li>Supported formats: JPEG, PNG</li>
            <li>Recommended resolution: 800px width</li>
            <li>Images will be automatically optimized</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UploadArt;
