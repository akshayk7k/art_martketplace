# Art Marketplace

A modern, full-stack web application for artists to showcase, sell, and manage their artwork online. Built with React, Firebase, and Node.js.

![Art Marketplace Preview](https://art-martketplace.vercel.app/)
## 🌟 Features

### User Features
- 🔐 Secure Authentication with Firebase
- 🎨 Artwork Upload with Image Processing
  - Automatic image resizing and optimization
  - Multiple aspect ratio support
  - Image preview functionality
- 👤 User Profiles with Portfolio Management
- ⭐ Rating and Review System
- 💬 Artist-Collector Messaging
- 🛒 Shopping Cart and Checkout

### Admin Features
- 📊 Dashboard with Analytics
- 👥 User Management
- 🖼️ Artwork Moderation
- 📈 Sales Reports
- ⚙️ System Configuration

### Technical Features
- 🚀 Progressive Web App (PWA) Support
- 📱 Responsive Design
- 🔄 Real-time Updates
- 🔍 Advanced Search and Filtering
- 🌐 Multi-language Support

## 🛠️ Tech Stack

### Frontend
- React.js with Hooks
- Firebase Authentication
- Firebase Firestore
- Firebase Storage
- React Router
- Context API for State Management
- Modern CSS with Flexbox/Grid
- CSS Animations and Transitions

### Backend
- Node.js
- Express.js
- Firebase Admin SDK
- JWT Authentication
- RESTful API

### Database
- Firebase Firestore
- Firebase Storage for Images

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/akshayk7k/art_marketplace.git
cd art-marketplace
```

2. Install dependencies:
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Configure Firebase:
- Create a new Firebase project
- Enable Authentication and Firestore
- Generate Firebase configuration
- Add configuration to `frontend/src/firebase/config.js`

4. Set up environment variables:
Create a `.env` file in the backend directory:
```bash
JWT_SECRET=your_secret
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend development server:
```bash
cd frontend
npm start
```

The application will be available at `http://localhost:3000`

## 📱 UI/UX Features

### Modern Design
- Dark/Light theme support
- Glassmorphism effects
- Smooth animations
- Custom scrollbars
- Interactive hover effects
- Loading skeletons

### Responsive Design
- Mobile-first approach
- Flexible grid layouts
- Adaptive typography
- Touch-friendly interactions
- Optimized for all screen sizes

### Accessibility
- WCAG 2.1 compliant
- Keyboard navigation
- Screen reader support
- Clear visual hierarchy
- Proper HTML semantics

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- CSRF protection
- Rate limiting
- Secure file uploads


## 👨‍💻 Author

Akshay K - [@akshayk7k](https://github.com/akshayk7k)

## 📞 Contact

Project Link: [https://github.com/akshayk7k/art_marketplace](https://github.com/akshayk7k/art_marketplace)

