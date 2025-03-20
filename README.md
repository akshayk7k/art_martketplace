# Art Marketplace

A modern web application for artists to showcase and sell their artwork. Built with React and Firebase, featuring a responsive design and comprehensive artwork management system.

## Features

### User Features
- **Authentication System**
  - Email/Password Login
  - User Registration
  - Password Reset
  - Profile Management

- **Artist Dashboard**
  - Artwork Upload
  - Profile Customization
  - Statistics Overview

- **Artwork Management**
  - Image Upload with Preview
  - Title and Description
  - Category Assignment


### Admin Features
- **Admin Dashboard**
  - User Management
  - Artwork Approval System
  - Flagging System

### General Features
- Responsive Design
- Real-time UpdatProject Structure

## Technologies Used

### Frontend
- **React.js** - UI Framework
- **Firebase Auth** - Authentication
- **Firebase Firestore** - Database
- **Modern CSS** - Styling
  - Flexbox
  - Grid
  - Animations

### Backend (Firebase)
- **Cloud Functions** - Serverless Functions
- **Cloud Storage** - File Storage
- **Authentication** - User Management

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Firebase account
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/akshayk7k/art-marketplace.git
cd art-marketplace
```

2. Install Frontend Dependencies:
```bash
cd frontend
npm install
```

3. Install Backend Dependencies:
```bash
cd ../backend/functions
npm install
```

4. Set up Firebase:
   - Create a new Firebase project
   - Enable Authentication and Firestore
   - Add a web app to your Firebase project
   - Copy the configurati Configuration

1. Frontend Environment Setup:
Create `.env` file in the frontend directory:
```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

2. Firebase Configuration:
Create `src/firebase/config.js`:
```javascript
export const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};
```

## 📱 Usage

### Development
1. Start Frontend Development Server:
```bash
cd frontend
npm start
```

2. Start Backend Functions Locally:
```bash
cd backend/functions
npm run serve
```

### Production Build
1. Build Frontend:
```bash
cd frontend
npm run build
```

2. Deploy to Firebase:
```bash
firebase deploy
```

## Contributing

1. Fork the reposory
2. Create your feature branch:
```bash
git checkout -b feature/AmazingFeature
```
3. Commit your changes:
```bash
git commit -m 'Add some AmazingFeature'
```
4. Push to the branch:
```bash
git push origin feature/AmazingFeature
```
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Authors

- Kanzariya Akshay - Initial work

