# Video Call Platform - Frontend

A modern React frontend for the video call platform, built with TypeScript, Tailwind CSS, and WebRTC for real-time video communication.

## Features

- 🔐 **Authentication**: User login/signup with JWT tokens
- 👥 **Role-based Access**: Different interfaces for educators and children/students  
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices
- 🎥 **WebRTC Video Calls**: Real-time video/audio communication
- 💡 **Clean UI/UX**: Modern design with Tailwind CSS
- ⚡ **Fast & Performant**: Built with Vite for optimal performance

## Tech Stack

- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling  
- **React Router** for navigation
- **Socket.io Client** for real-time communication
- **Axios** for API calls
- **Heroicons** for icons

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

## Project Structure

```
src/
├── components/           # React components
│   ├── Auth/            # Authentication components
│   ├── Common/          # Shared components  
│   ├── Dashboard/       # Dashboard components
│   ├── Layout/          # Layout components
│   └── Session/         # Session-related components
├── hooks/               # Custom React hooks
├── services/            # API and service functions
├── types/               # TypeScript type definitions
├── config/              # Configuration files
└── App.tsx              # Main application component
```

## Key Components

### Authentication
- **LoginForm**: User login interface
- **SignupForm**: User registration with role selection
- **ProtectedRoute**: Route protection based on authentication

### Dashboard  
- **Dashboard**: Main user dashboard showing sessions
- Shows different content based on user role (educator vs child)

### Session Management
- **CreateSession**: Form for educators to create new sessions
- **JoinSession**: Interface for students to join sessions by code  
- **VideoSession**: Main video call interface with WebRTC

### Video Features
- **useWebRTC**: Custom hook managing WebRTC connections
- **VideoGrid**: Responsive video grid for participants
- Real-time audio/video controls
- Screen sharing support (planned)

## API Integration

The frontend connects to the backend API at `http://localhost:3000/api` with:

- Automatic JWT token handling
- Request/response interceptors
- Error handling and redirects
- TypeScript interfaces for all API responses

## Responsive Design

The application is fully responsive and works on:

- **Desktop**: Full-featured interface
- **Tablet**: Optimized touch interface  
- **Mobile**: Mobile-first design with simplified navigation

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px  
- Desktop: > 1024px

## User Roles

### Educator (Teacher)
- Create and manage video sessions
- Start/end sessions  
- View all participants
- Access to session analytics (planned)

### Child (Student)  
- Join sessions using session codes
- Participate in video calls
- View session history

## WebRTC Implementation

The video calling feature uses:

- **Peer-to-peer connections** for optimal performance
- **Socket.io signaling** for connection establishment
- **Adaptive bitrate** based on connection quality
- **Cross-browser compatibility** (Chrome, Firefox, Safari)

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- **TypeScript** for type safety
- **Clean Architecture** with separated concerns
- **Custom hooks** for reusable logic  
- **Consistent naming** and file organization
- **Comments** for complex logic

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

*WebRTC features require modern browsers with camera/microphone permissions*

## Future Enhancements

- 📊 AI-powered attention tracking
- 😊 Emotion detection during sessions  
- 📝 Session recording and playback
- 🔗 Screen sharing capabilities
- 📱 Mobile app versions (React Native)
- 🌍 Multi-language support

## Contributing

1. Follow the existing code style
2. Add TypeScript types for new features
3. Ensure mobile responsiveness  
4. Test on multiple browsers
5. Update this README for significant changes