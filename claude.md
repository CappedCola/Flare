# Flare - Streak Photo Social App

## Product Description

Flare is a social photo-sharing app focused on daily streaks and authentic moments. Users capture and share daily photos to maintain streaks with friends, inspired by BeReal's authentic sharing model and Snapchat's camera-first experience.

## DEVICES

Flare is meant to be used on multiple different devices and you should make any UI changes with this in mind. Don't 'hardcode' things if you shouldn't so that the UI will look good on multiple different devices including the different phones, and ipads.

### User Flow

1. **Feed**: Browse friends' daily streak photos in a clean, card-based layout
2. **Camera**: Capture daily photos with BeReal-style timer and dual camera views
3. **Profile**: View personal streak stats and photo grid history

## Architecture & Tech Stack

### Core Technologies

- **React Native 0.79.4** with **Expo SDK 53.0.0**
- **TypeScript 5.8.3** with strict type-checking
- **UI Kitten 5.3.1** + **Eva Design 2.2.0** for consistent UI components
- **React Navigation v6** for navigation
- **Inter font** with **@expo-google-fonts/inter** for typography
- **Lucide React Native 0.525.0** for modern icon system
- **Expo Camera 16.1.10** for camera functionality
- **Expo Blur 14.1.5** + **Expo Linear Gradient 14.1.5** for glass morphism UI effects

### Project Structure

```
/
├── App.tsx                     # Root app component with providers
├── package.json               # Dependencies and scripts
├── app.json                   # Expo configuration
├── tsconfig.json             # TypeScript configuration
└── app/
    ├── navigation/
    │   ├── RootNavigator.tsx  # Main navigation container
    │   └── BottomTabs.tsx     # Apple glass pill bottom navigation with blur effects
    ├── screens/
    │   ├── FeedScreen.tsx     # Home feed with full-width photos and social interactions
    │   ├── CameraScreen.tsx   # Functional camera with expo-camera integration
    │   ├── ProfileScreen.tsx  # User profile with tabbed interface (streaks/settings)
    │   └── FriendsScreen.tsx  # Complete friends management with search and mutual friends
    ├── constants/
    │   └── navigation.ts      # Navigation height constants for consistent spacing
    ├── components/            # Shared reusable components
    │   ├── CommentModal.tsx   # Comment viewing and posting modal
    │   ├── FullscreenImageViewer.tsx # Image expansion modal
    │   ├── NotificationModal.tsx # Personal photo notifications
    │   ├── PhotoEditor.tsx    # Photo editing interface
    │   └── UserSelector.tsx   # Friend selection for photo sharing
    ├── context/
    │   ├── AuthContext.tsx    # Authentication state management
    │   ├── NavigationContext.tsx # Navigation utilities
    │   └── NotificationContext.tsx # Personal photo notifications
    ├── theme/
    │   └── newflaretheme.ts   # Custom Flare Eva Design theme
    └── assets/               # Static assets
```

## UI/UX Design System

### Theme Configuration

The app uses a custom Eva Design theme with a modern light visual identity and Flare branding colors:

- **Primary**: `#FF4D4D` (main red brand color for accents and buttons)
- **Background**: Light beige (`#FDF6EC`) main background, off-white (`#FAF9F6`) sections, pure white (`#FFFFFF`) cards
- **Text**: Dark gray (`#2C2C2C`) for primary text, medium gray (`#666666`) for secondary text
- **Borders**: Light gray (`#E8E8E8`) for subtle borders, medium gray (`#CCCCCC`) for stronger borders
- **Shadows**: Subtle drop shadows (`rgba(0, 0, 0, 0.1)`) for modern card depth
- **Visual Style**: Light, airy, and friendly with high contrast readability

### Component Patterns

- **Feed Cards**: Full-width image layout with separated header/footer containers, edge-to-edge visual alignment, and social media interactions (Heart, MessageCircle, Expand icons)
- **Apple Glass Pill Navigation**: Modern bottom navigation with adaptive blur effects that work with light backgrounds, animated indicators, and floating plus button
- **Camera Interface**: Full-screen react-native-vision-camera implementation with permission handling and location display
- **Profile Tabs**: Dual-view interface with animated tab switching between "Streaks" and "Settings" views, Friends button integration
- **Friends Interface**: Three-tab layout with real-time updates, search functionality, and mutual friends discovery
- **Photo Grid**: 3-column responsive grid layout with light card items for streak photos, featuring subtle shadows and borders
- **Modal Components**: Comment modal, fullscreen image viewer, and notification system for enhanced user interactions

## AI Collaboration Tips

### Requesting Features

When asking for new features or modifications, please:

1. **Be specific about the screen/component**:

   - ✅ "Add a like button to FeedScreen cards"
   - ❌ "Add social features"

2. **Reference existing patterns**:

   - ✅ "Use the same card style as FeedScreen for the new NotificationScreen"
   - ❌ "Make it look good"

3. **Specify UI Kit components**:
   - ✅ "Use UI Kitten's Button with 'primary' status"
   - ❌ "Add a button"

### File Updates

For modifications, mention:

- **File path**: `app/screens/FeedScreen.tsx`
- **Component/function name**: `FeedCard` component
- **Specific changes**: "Add heart icon button to card actions"

### Refactoring Requests

When requesting code reorganization:

- Specify the **current structure** vs **desired structure**
- Mention any **new files** that should be created
- Indicate if **existing imports** need updating

### Example Requests

- "Add a comments modal to FeedScreen that slides up from bottom"
- "Create a shared components folder with a reusable PhotoCard component"
- "Update the newflaretheme.ts to support switching between light and dark themes"
- "Add navigation to a new SettingsScreen from ProfileScreen header"

## Sprint TODO List

### Phase 1: Core Features

- [x] Implement actual camera functionality with react-native-vision-camera
- [x] Create Apple glass pill navigation with blur effects
- [x] Add animated tab indicators and floating camera button
- [x] Implement profile screen with tabbed interface
- [x] Add responsive design for multiple device sizes
- [x] Add photo capture and storage functionality
- [x] Apply Flare theme throughout the app
- [x] Add photo upload and storage integration
- [x] Create user authentication flow
- [x] Implement real-time streak tracking

### Phase 2: Social Features

- [x] Add friends system and friend requests
- [x] Implement push notifications for streak reminders
- [x] Create like/comment functionality
- [ ] Add photo sharing to other platforms

### Phase 3: Advanced Features

- [ ] Add streak challenges and leaderboards
- [ ] Implement photo filters and editing
- [ ] Create privacy controls and settings
- [ ] Add analytics and usage insights

### Phase 4: Polish & Launch

- [ ] Performance optimization and testing
- [ ] App store assets and marketing materials
- [ ] Beta testing and user feedback integration
- [ ] Production deployment and monitoring

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on specific platform
npm run ios
npm run android
npm run web

# Run with development client
npx expo start --dev-client
```

## Current Implementation Status

### Completed Features
- **Camera Integration**: Full react-native-vision-camera implementation with permission handling and error states
- **Modern Navigation**: Apple-inspired glass pill bottom navigation with blur effects and smooth animations
- **Responsive Design**: Device-agnostic UI that adapts to different screen sizes (phones, tablets)
- **Profile Interface**: Tabbed profile screen with stats cards and photo grid layout
- **Icon System**: Comprehensive Lucide React Native icon integration throughout the app
- **Theme Integration**: Modern light Flare theme with bright, friendly visual identity and proper UI Kitten theme implementation
- **Photo Capture**: Working photo capture with orientation detection and proper preview display
- **Lens Switching**: Ultra-wide (.5x) and standard (1x) camera lens support for compatible devices

### Technical Improvements Made
- **Navigation Constants**: Centralized navigation height constants in `app/constants/navigation.ts`
- **Glass Morphism**: Advanced blur effects using expo-blur and linear gradients
- **Animated Interactions**: Smooth tab switching and indicator animations
- **Permission Management**: Proper camera permission handling with user-friendly error states using react-native-permissions
- **Screen Adaptations**: Responsive layouts with proper safe area handling
- **Photo Orientation**: Dynamic photo preview rotation for landscape photos with properly positioned UI controls

### Current UI State
- **FeedScreen**: Instagram-style full-width image layout with edge-to-edge visual alignment, separated header/footer containers, and comprehensive social interactions
- **CameraScreen**: Full-screen camera with location display and friends-only indicator using Vision Camera
- **ProfileScreen**: Clean two-tab interface (Streaks/Settings) with Friends button integration, removed stats cards, and focused photo grid layout
- **FriendsScreen**: Complete friends management with three-tab interface, real-time updates, search functionality, and mutual friends discovery
- **BottomTabs**: Floating glass pill navigation with adaptive blur effects and animated active state indicators

## Notes for Future Development

- Photo capture functionality is implemented with Vision Camera for hardware lens access
- Photo storage will need backend integration (Firebase, AWS S3, etc.)
- Real-time features will require WebSocket or similar real-time connection
- Push notifications will need expo-notifications setup
- The app prioritizes camera-first experience with quick access via floating button
- All data is currently mocked - backend integration needed for real functionality
- Vision Camera requires EAS development builds for full functionality

## Development Flows

- Use these two development flows to know about how they work and how I can run the app in either way if I need for the camera

## Firebase Integration Status

### ✅ Completed Implementation
- **Firebase Config**: `app/config/firebase.ts` - Complete React Native Firebase setup
- **Service Layer**: `app/services/firebaseService.ts` - All Firebase operations (auth, posts, storage)
- **Authentication Context**: `app/context/AuthContext.tsx` - React Context for auth state management
- **Real-time Feed**: FeedScreen connected to live Firestore subscriptions
- **Photo Upload**: Camera screen uploads photos to Firebase Storage and creates Firestore posts
- **Type Safety**: Complete TypeScript interfaces in `app/types/index.ts`

### 🔧 Firebase Services Used
- **Authentication**: Email/password sign up, sign in, sign out with user document creation
- **Firestore**: Real-time post subscriptions, user data storage, like system
- **Storage**: Photo upload with automatic URL generation and metadata storage
- **Real-time Listeners**: Live feed updates, authentication state changes

### 📊 Data Flow Implementation
1. **Photo Capture**: Vision Camera → Local file URI
2. **Upload Process**: Firebase Storage upload → Download URL generation
3. **Post Creation**: Firestore document with photo URL, user data, timestamp
4. **Real-time Display**: onSnapshot listener → Automatic feed updates for all users
5. **Social Interactions**: Like system with real-time user ID tracking

## Friends System Implementation

### ✅ Complete Friends Management
- **FriendsScreen.tsx**: Three-tab interface (Friends, Requests, Add Friends)
- **Real-time Updates**: Live friend request notifications via Firestore subscriptions
- **Search Functionality**: Username-based user search with filtered results
- **Mutual Friends**: "People You May Know" feature showing friends of friends
- **Request Management**: Send, accept, and decline friend requests with status tracking

### 🔧 Friends Service Functions
- `getUserFriends()`: Fetch user's complete friends list
- `getFriendRequests()`: Get incoming and outgoing friend requests
- `searchUsersByUsername()`: Search users by username with filtering
- `sendFriendRequest()`: Send friend request with duplicate prevention
- `acceptFriendRequest()`: Accept request and update both users' friend lists
- `declineFriendRequest()`: Decline request and update status
- `getMutualFriends()`: Calculate and return mutual friends with count

### 📱 Profile Integration
- **Removed Stats Cards**: Eliminated Current Streak, Total Photos, Friends count display
- **Friends Button**: Added prominent Friends button in profile header with navigation
- **Clean Layout**: Improved spacing and focus on photo grid and user info

# Important Instruction Reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.