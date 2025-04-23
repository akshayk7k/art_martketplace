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

const CATEGORIES = {
  'digital-photography': 'Digital Photography',
  'art-painting': 'Art & Painting'
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

        // Create a temporary canvas for the original image
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        // Calculate dimensions to crop the image to the desired aspect ratio
        let sourceWidth = img.width;
        let sourceHeight = img.height;
        let sourceX = 0;
        let sourceY = 0;

        const sourceAspectRatio = sourceWidth / sourceHeight;
        const targetAspectRatio = aspectRatio.width / aspectRatio.height;

        if (sourceAspectRatio > targetAspectRatio) {
          // Image is wider than needed
          sourceWidth = Math.round(sourceHeight * targetAspectRatio);
          sourceX = Math.round((img.width - sourceWidth) / 2);
        } else {
          // Image is taller than needed
          sourceHeight = Math.round(sourceWidth / targetAspectRatio);
          sourceY = Math.round((img.height - sourceHeight) / 2);
        }

        // Set canvas dimensions
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Draw the image with proper cropping and resizing
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,
          0, 0, targetWidth, targetHeight
        );

        // Convert to base64 with reduced quality
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedRatio, setSelectedRatio] = useState("3:4");
  const [imagePreview, setImagePreview] = useState(null);
  const [category, setCategory] = useState("digital-photography"); // Default category
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
      console.log("Starting upload process...");
      console.log("Selected category:", category); // Add this for debugging
      
      if (!image) {
        throw new Error("Please select an image");
      }

      if (!currentUser) {
        throw new Error("You must be logged in to upload artwork");
      }

      if (!category || category === 'all') {
        throw new Error("Please select a specific category");
      }

      setUploadProgress(30);
      
      // Convert and resize image
      console.log("Processing image...");
      const base64Image = await resizeAndConvertToBase64(image, ASPECT_RATIOS[selectedRatio]);
      console.log("Image processed successfully");

      setUploadProgress(60);

      // Add to Firestore with the correct category
      const artworkData = {
        title,
        artist,
        imageData: base64Image,
        aspectRatio: selectedRatio,
        category: category, // Make sure category is being set correctly
        userId: currentUser.uid,
        username: currentUser.displayName || 'Anonymous',
        createdAt: new Date().toISOString(),
        ratings: [],
        averageRating: 0,
        ratingCounts: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
      };

      console.log("Adding to Firestore with category:", artworkData.category);
      const docRef = await addDoc(collection(db, "artworks"), artworkData);
      console.log("Document added to Firestore:", docRef.id);

      setUploadProgress(100);
      alert("Artwork uploaded successfully!");
      navigate("/");
    } catch (err) {
      console.error("Upload error:", {
        message: err.message,
        code: err.code,
        stack: err.stack
      });
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
    
    // Generate preview
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

  return (
    <div className="upload-container">
      <h2>Upload Artwork</h2>
      <div className="upload-limits">
        <p>Image Requirements:</p>
        <ul>
          <li>Maximum image size: 10MB</li>
          <li>Images will be automatically cropped and resized</li>
          <li>Recommended width: 800px</li>
          <li>High-quality JPEG format</li>
        </ul>
      </div>
      {error && <div className="error-message">{error}</div>}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="progress-bar">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}
      <form onSubmit={handleUpload}>
        <div className="form-group">
          <label htmlFor="aspectRatio">Aspect Ratio</label>
          <select
            id="aspectRatio"
            value={selectedRatio}
            onChange={handleAspectRatioChange}
            disabled={loading}
          >
            <option value="3:4">3:4 (Portrait)</option>
            <option value="4:3">4:3 (Landscape)</option>
            <option value="16:9">16:9 (Widescreen)</option>
            <option value="1:1">1:1 (Square)</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select 
            id="category"
            value={category}
            onChange={(e) => {
              console.log("Category changed to:", e.target.value); // Add this for debugging
              setCategory(e.target.value);
            }}
            required
            disabled={loading}
            className="category-select"
          >
            {Object.entries(CATEGORIES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            placeholder="Artwork Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="artist">Artist</label>
          <input
            id="artist"
            type="text"
            placeholder="Artist Name"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="image">Image</label>
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            required
            disabled={loading}
          />
        </div>
        {imagePreview && (
          <div className="image-preview">
            <h4>Preview:</h4>
            <img src={imagePreview} alt="Preview" />
          </div>
        )}
        <button 
          type="submit" 
          disabled={loading || !image}
          className={loading ? 'loading' : ''}
        >
          {loading ? "Uploading..." : "Upload Artwork"}
        </button>
      </form>
    </div>
  );
};

export default UploadArt;
