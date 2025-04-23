import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../firebase/config';
import { auth } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import './Upload.css';

const Upload = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('digital-photography');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const CATEGORIES = {
    'digital-photography': 'Digital Photography',
    'art-painting': 'Art & Painting'
  };

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title || !description || !category) {
      setError('Please fill in all fields and select a file');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const storageRef = ref(storage, `artworks/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'artworks'), {
        title,
        description,
        imageUrl: url,
        category,
        userId: auth.currentUser.uid,
        username: auth.currentUser.displayName || 'Anonymous',
        createdAt: serverTimestamp(),
        ratings: [],
        averageRating: 0,
        ratingCounts: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
      });

      navigate('/');
    } catch (error) {
      console.error('Error uploading artwork:', error);
      setError('Error uploading artwork. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <h2>Upload Artwork</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="title">Title:</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter artwork title"
            required
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="category">Category:</label>
          <select 
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="category-select"
            disabled={loading}
          >
            {Object.entries(CATEGORIES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter artwork description"
            required
            disabled={loading}
            rows={4}
          />
        </div>

        <div className="form-group">
          <label htmlFor="file">Image:</label>
          <input
            id="file"
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            accept="image/*"
            required
            disabled={loading}
            className="file-input"
          />
          <small className="file-help">Supported formats: JPG, PNG, GIF</small>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={`submit-button ${loading ? 'loading' : ''}`}
        >
          {loading ? 'Uploading...' : 'Upload Artwork'}
        </button>
      </form>
    </div>
  );
};

export default Upload; 