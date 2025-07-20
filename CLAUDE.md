# Flare - Social Photo Chain App

## Product Overview

Flare is a React Native social photo app combining daily streaks, authentic photo sharing, and collaborative photo chains. Users capture photos to maintain streaks and participate in sequential photo chains with friends.

**Core Features:**
- **Flare Chains**: Sequential turn-based photo storytelling with prompts given to users
- **Social Feed**: Instagram-style photo feed with reactions and comments with these given chians
- **Friends System**: Complete friend management with requests and discovery

## Architecture

### Tech Stack
- **React Native 0.79.4** with **Expo SDK 53.0.0**
- **TypeScript 5.8.3** with strict type-checking
- **UI Kitten 5.3.1** + **Eva Design 2.2.0** for consistent UI
- **React Navigation v6** for navigation
- **React Native Vision Camera 4.7.0** for camera functionality
- **React Native Firebase 22.4.0** for backend services

### Project Structure
```
app/
├── navigation/           # Navigation components
├── screens/             # All screen components
│   ├── flare/          # Flare chain specific screens
│   └── [other screens] # Feed, Camera, Profile, Friends, etc.
├── components/         # Reusable UI components
├── services/           # Firebase and API services
├── hooks/              # Custom React hooks
├── context/            # React Context providers
├── types/              # TypeScript type definitions
├── theme/              # UI Kitten theme configuration
└── config/             # App configuration
```

## Core Features Detail

### Flare Chains System

**What are Flare Chains?**
Sequential photo-sharing chains where users take turns responding to prompts through photos. Each participant has 60 minutes to respond, creating collaborative visual storytelling.

**Key Components:**
- **Turn-based system**: Only one person can respond at a time
- **Prompt-driven**: Daily themes, categories, or custom prompts
- **Timer mechanics**: 60-minute countdown per turn with visual indicators
- **Social integration**: Reactions, group chat, achievements

**Chain Flow:**
1. Creator selects prompt and takes initial photo
2. Invites a friend to the chain
3. Participants take turns in sequence
4. Real-time timer counts down (60 min per turn)
5. Chain completes when all respond or expires

**Participant Statuses:**
- `WAITING_TURN`: Awaiting their position
- `CURRENT_TURN`: Active turn with timer
- `RESPONDED`: Successfully submitted
- `TURN_EXPIRED`: Missed 60-minute window
- `SKIPPED`: Voluntarily skipped turn

### Daily Streaks & Feed

**Feed System:**
- Instagram-style full-width photo layout
- Real-time Firebase subscriptions
- Social interactions (likes, comments, reactions)
- Edge-to-edge visual alignment

**Photo Capture:**
- Vision Camera integration with lens switching
- Permission handling and error states
- Firebase Storage upload with metadata
- Automatic feed posting

### Friends & Social

**Friends Management:**
- Three-tab interface (Friends, Requests, Add Friends)
- Real-time friend request notifications
- Username-based search with filtering
- Mutual friends discovery ("People You May Know")

**Social Features:**
- Like/unlike system with real-time updates
- Comment modal with posting functionality
- Friend request management (send, accept, decline)
- Push notifications for social interactions

## Development Environment

### Firebase Configuration
- **Authentication**: Email/password with user documents
- **Firestore**: Real-time data sync for posts, chains, friends
- **Storage**: Photo upload with automatic URL generation
- **Security Rules**: Configured for user data protection

### Key Services
- **flareChainService.ts**: Chain creation, turn management, photo responses
- **firebaseService.ts**: Auth, posts, storage, user management
- **promptService.ts**: Daily prompts, categories, trending
- **chatService.ts**: Real-time messaging for chains

### Important Hooks
- **useFlareChains**: Chain state management and real-time updates
- **useChainTimer**: 60-minute countdown with visual states
- **useAchievements**: User achievement tracking
- **useChat**: Real-time messaging functionality

## UI/UX Design System

### Theme & Visual Identity
- **Themes**: Main theme file is kept in ..app/theme/newflaretheme.ts
- **Primary Color**: `#FF4D4D` (Flare red for accents)
- **Background**: Light beige (`#FDF6EC`) with off-white sections
- **Cards**: Pure white with subtle shadows
- **Typography**: Inter font with proper weight hierarchy

### Component Patterns
- **Apple Glass Navigation**: Floating bottom tabs with blur effects
- **Full-screen Camera**: Vision Camera with permission handling
- **Feed Cards**: Edge-to-edge photos with separated social actions
- **Modal System**: Comments, fullscreen viewer, notifications
- **Responsive Design**: Multi-device support (phones, tablets)

## Development Commands

```bash
# Install dependencies
npm install

# Development client (for camera) - right now we are using the development build only for testing
npx expo start --dev-client
```

## Implementation Status

### ✅ Completed
- Firebase integration (Auth, Firestore, Storage)
- Vision Camera with lens switching
- Real-time feed with social interactions
- Complete friends system with requests
- Apple glass navigation with animations
- Responsive multi-device UI
- Flare chains sequential system
- Timer mechanics with visual states
- Photo upload and storage workflow

### 🔧 In Progress
- Removing Achievement system and leaderboards
- Enhanced prompt categories
- Group chat for chains
- Advanced photo editing

### 📋 Future Features
- Push notifications
- Photo sharing to external platforms
- Privacy controls and settings
- Analytics and usage insights
- Performance optimization

## Key Files for Agents

### Core App Structure
- `App.tsx`: Root component with providers
- `app/navigation/RootNavigator.tsx`: Main navigation
- `app/context/AuthContext.tsx`: Authentication state

### Flare Chains
- `app/services/flareChainService.ts`: Chain logic and Firebase ops
- `app/hooks/useFlareChains.ts`: Chain state management
- `app/screens/flare/`: All chain-related screens
- `app/types/flare.ts`: Chain type definitions

### Social Features
- `app/services/firebaseService.ts`: Core Firebase operations
- `app/screens/FeedScreen.tsx`: Main social feed
- `app/screens/FriendsScreen.tsx`: Friend management
- `app/components/CommentModal.tsx`: Social interactions

### Camera & Photos
- `app/screens/CameraScreen.tsx`: Photo capture
- `app/components/PhotoEditor.tsx`: Photo editing
- `app/services/firebaseService.ts`: Photo upload logic

## Development Notes

- **Camera requires EAS development builds** for full functionality
- **All Firebase operations include error handling** and retry logic
- **Real-time updates** via onSnapshot listeners throughout app
- **Type safety enforced** with strict TypeScript configuration
- **Responsive design** prioritizes mobile-first with tablet support
- **Authentication required** for all core functionality
- **Photo storage** handled via Firebase Storage with automatic URLs

## MCP 
- **Firebase MCP** This project directory has acsess to the firebase MCP which you should use in any case where it would be beneficial


## Agent Specialization Context

This file provides comprehensive context for specialized agent modes:

- **Developer Agent**: Focus on architecture, services, and implementation details
- **Debugging Agent**: Use error handling patterns, Firebase debugging, and type definitions
- **Brainstorming Agent**: Leverage social features, chain mechanics, and user experience patterns
- **UI Agent**: Reference theme system, component patterns, and responsive design principles

All agents should understand the core Flare chains concept and Firebase-based architecture when working on any part of the application.