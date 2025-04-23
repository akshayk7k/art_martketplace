import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth, updateProfile } from 'firebase/auth';
import './Profile.css';

const Profile = () => {
  const { currentUser, refreshUser } = useAuth();
  const auth = getAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [userProfile, setUserProfile] = useState({
    displayName: '',
    email: '',
    bio: '',
    joinedDate: '',
    totalArtworks: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const fetchTotalArtworks = async (userId) => {
    try {
      const artworksRef = collection(db, 'artworks');
      const q = query(artworksRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (err) {
      console.error('Error fetching total artworks:', err);
      return 0;
    }
  };

  const fetchUserProfile = async () => {
    try {
      if (!auth.currentUser) {
        setError('Please login to view your profile');
        setLoading(false);
        return;
      }

      const profileRef = doc(db, 'profiles', auth.currentUser.uid);
      const profileDoc = await getDoc(profileRef);
      
      // Get actual total artworks count
      const totalArtworks = await fetchTotalArtworks(auth.currentUser.uid);
      
      if (profileDoc.exists()) {
        const profileData = profileDoc.data();
        setUserProfile({
          displayName: profileData.displayName || auth.currentUser.displayName || 'Anonymous',
          email: auth.currentUser.email,
          bio: profileData.bio || '',
          joinedDate: profileData.joinedDate ? new Date(profileData.joinedDate.seconds * 1000) : new Date(),
          totalArtworks: totalArtworks // Use the actual count
        });

        // Update the total artworks in profile document if it's different
        if (profileData.totalArtworks !== totalArtworks) {
          await updateDoc(profileRef, {
            totalArtworks: totalArtworks,
            updatedAt: new Date()
          });
        }
      } else {
        // Create a new profile document if it doesn't exist
        const newProfileData = {
          displayName: auth.currentUser.displayName || 'Anonymous',
          email: auth.currentUser.email,
          bio: '',
          joinedDate: new Date(),
          totalArtworks: totalArtworks,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await setDoc(profileRef, newProfileData);
        setUserProfile(newProfileData);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.currentUser) {
      fetchUserProfile();
    }
  }, [auth.currentUser]);

  const handleEditClick = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsEditing(true);
      setIsTransitioning(false);
    }, 300);
  };

  const handleCancelClick = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsEditing(false);
      fetchUserProfile(); // Reset form to original data
      setIsTransitioning(false);
    }, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUpdateSuccess(false);

    try {
      if (!auth.currentUser) {
        throw new Error('You must be logged in to update your profile');
      }

      // Validate inputs
      if (!userProfile.displayName.trim()) {
        throw new Error('Display name cannot be empty');
      }

      setIsTransitioning(true);

      // Update Firestore profile
      const profileRef = doc(db, 'profiles', auth.currentUser.uid);
      await updateDoc(profileRef, {
        displayName: userProfile.displayName.trim(),
        bio: userProfile.bio.trim(),
        updatedAt: new Date()
      });

      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: userProfile.displayName.trim()
      });

      // Refresh the user state in context
      await refreshUser();

      // Show success message and refresh profile data
      setUpdateSuccess(true);
      
      setTimeout(() => {
        setIsEditing(false);
        setIsTransitioning(false);
      }, 300);
      
      await fetchUserProfile(); // Refresh the profile data

      // Hide success message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
      setIsTransitioning(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (error) {
    return <div className="error"><p>{error}</p></div>;
  }

  if (!auth.currentUser) {
    return (
      <div className="no-profile">
        <p>Please login to view your profile</p>
        <a href="/login" className="login-link">Login</a>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className={`profile-form ${isTransitioning ? 'fade-out' : ''}`}>
          <div className="form-group">
            <label>Display Name</label>
            <input
              type="text"
              value={userProfile.displayName}
              onChange={(e) => setUserProfile({...userProfile, displayName: e.target.value})}
              placeholder="Enter your display name"
              required
              minLength={2}
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea
              value={userProfile.bio}
              onChange={(e) => setUserProfile({...userProfile, bio: e.target.value})}
              placeholder="Tell us about yourself"
              rows="4"
              maxLength={500}
            />
          </div>

          <div className="form-buttons">
            <button type="submit" className="save-button" disabled={!userProfile.displayName.trim()}>
              Save Changes
            </button>
            <button 
              type="button" 
              className="cancel-button"
              onClick={handleCancelClick}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className={`profile-info ${isTransitioning ? 'fade-out' : ''}`}>
          <div className="info-group">
            <h3>Display Name</h3>
            <p>{userProfile.displayName}</p>
          </div>

          <div className="info-group">
            <h3>Email</h3>
            <p>{userProfile.email}</p>
          </div>

          <div className="info-group">
            <h3>Bio</h3>
            <p>{userProfile.bio || 'No bio added yet.'}</p>
          </div>

          <div className="info-group">
            <h3>Member Since</h3>
            <p>{new Date(userProfile.joinedDate).toLocaleDateString()}</p>
          </div>

          <div className="info-group">
            <h3>Total Artworks</h3>
            <p>{userProfile.totalArtworks}</p>
          </div>

          <button 
            className="edit-button"
            onClick={handleEditClick}
          >
            Edit Profile
          </button>
        </div>
      )}

      {updateSuccess && (
        <div className="success-message">
          Profile updated successfully!
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
};

export default Profile; 