# Art Marketplace

A full-stack web application for artists to showcase and sell their artwork online.

## Features

- User Authentication with Firebase
- Artwork Upload and Management
- User Profiles with Portfolio
- Rating and Review System
- Admin Dashboard
- Responsive Design
- Modern UI Components:
  - Dark-themed modals with blur effects
  - Smooth animations and transitions
  - Accessible color contrasts
  - Mobile-responsive layouts
  - Custom scrollbars
  - Interactive hover effects

## Tech Stack

- Frontend: React.js, Firebase Auth, Firestore
- Backend: Node.js, Express.js, Firebase Admin SDK
- Database: Firebase Firestore
- Authentication: Firebase Auth, JWT
- UI/UX: 
  - Modern CSS with Flexbox/Grid
  - CSS Animations and Transitions
  - Cross-browser compatible styles
  - Mobile-first responsive design

## Setup

1. Clone and install dependencies:
```bash
git clone https://github.com/akshayk7k/art_marketplace.git
cd art-marketplace
npm install
cd frontend
npm install
```

2. Configure Firebase:
- Create Firebase project
- Enable Auth and Firestore
- Add config to `frontend/src/firebase/config.js`

3. Set environment variables:
```bash
JWT_SECRET=your_secret
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
```

4. Start development servers:
```bash
# Backend
npm run dev

# Frontend
cd frontend
npm start
```

## UI Components

### Modals
The application features modern, accessible modals with:
- Dark theme with proper contrast ratios
- Backdrop blur effects (with Safari support)
- Smooth enter/exit animations
- Mobile-responsive layouts
- Keyboard navigation support
- Clear action buttons with hover states

### Responsive Design
- Mobile-first approach
- Flexible grid layouts
- Adaptive typography
- Touch-friendly interactions
- Optimized for various screen sizes

### Accessibility
- WCAG 2.1 compliant color contrasts
- Keyboard navigation support
- Screen reader friendly
- Clear visual hierarchy
- Proper HTML semantics

## License

MIT License 

## Contact

Akshay K - [@akshayk7k](https://github.com/akshayk7k)

Project Link: [https://github.com/akshayk7k/art_marketplace.git](https://github.com/akshayk7k/art_marketplace.git)