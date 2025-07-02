# Keepr - Streak Photo Social App

## Product Description

Keepr is a social photo-sharing app focused on daily streaks and authentic moments. Users capture and share daily photos to maintain streaks with friends, inspired by BeReal's authentic sharing model and Snapchat's camera-first experience.

## DEVICES

keepr is meant to be used on multiple different devices and you should make any UI changes with this inmind. Don't 'hardcode' things if you shouldn't so that the UI will look good on multiple different devies including the different phones, and ipads.

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
    │   ├── FeedScreen.tsx     # Home feed with photo cards and social interactions
    │   ├── CameraScreen.tsx   # Functional camera with expo-camera integration
    │   └── ProfileScreen.tsx  # User profile with tabbed interface (streaks/settings)
    ├── constants/
    │   └── navigation.ts      # Navigation height constants for consistent spacing
    ├── components/            # Shared reusable components (empty for now)
    ├── theme/
    │   └── theme.ts          # Custom Eva Design theme
    └── assets/               # Static assets
```

## UI/UX Design System

### Theme Configuration

The app uses a custom Eva Design theme with these key colors:

- **Primary**: `#5D5FEF` (purple brand color)
- **Light/Dark mode support** with inverted color palettes
- **Card-based layouts** with rounded corners and subtle shadows

### Component Patterns

- **Feed Cards**: Social media layout with user avatars, photo placeholders, and action buttons (Heart, MessageCircle, Expand icons)
- **Apple Glass Pill Navigation**: Modern bottom navigation with blur effects, animated indicators, and floating plus button
- **Camera Interface**: Full-screen expo-camera implementation with permission handling and location display
- **Profile Tabs**: Dual-view interface with animated tab switching between "Streaks" and "Settings" views
- **Stats Cards**: Metric display cards showing streak count, total photos, and friend count with themed icons
- **Photo Grid**: 3-column responsive grid layout with placeholder items for streak photos

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
- "Update the theme.ts to support switching between light and dark themes"
- "Add navigation to a new SettingsScreen from ProfileScreen header"

## Sprint TODO List

### Phase 1: Core Features

- [x] Implement actual camera functionality with expo-camera
- [x] Create Apple glass pill navigation with blur effects
- [x] Add animated tab indicators and floating camera button
- [x] Implement profile screen with tabbed interface
- [x] Add responsive design for multiple device sizes
- [ ] Add photo capture and storage functionality
- [ ] Add photo upload and storage integration
- [ ] Create user authentication flow
- [ ] Implement real-time streak tracking

### Phase 2: Social Features

- [ ] Add friends system and friend requests
- [ ] Implement push notifications for streak reminders
- [ ] Create like/comment functionality
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
```

## Current Implementation Status

### Completed Features
- **Camera Integration**: Full expo-camera implementation with permission handling and error states
- **Modern Navigation**: Apple-inspired glass pill bottom navigation with blur effects and smooth animations
- **Responsive Design**: Device-agnostic UI that adapts to different screen sizes (phones, tablets)
- **Profile Interface**: Tabbed profile screen with stats cards and photo grid layout
- **Icon System**: Comprehensive Lucide React Native icon integration throughout the app
- **Theme Integration**: Dark mode support with proper UI Kitten theme implementation

### Technical Improvements Made
- **Navigation Constants**: Centralized navigation height constants in `app/constants/navigation.ts`
- **Glass Morphism**: Advanced blur effects using expo-blur and linear gradients
- **Animated Interactions**: Smooth tab switching and indicator animations
- **Permission Management**: Proper camera permission handling with user-friendly error states
- **Screen Adaptations**: Responsive layouts with proper safe area handling

### Current UI State
- **FeedScreen**: Social media-style cards with avatars, photo placeholders, and action buttons
- **CameraScreen**: Full-screen camera with location display and friends-only indicator
- **ProfileScreen**: Two-tab interface (Streaks/Settings) with stats overview and photo grid
- **BottomTabs**: Floating glass pill navigation with animated active state indicators

## Notes for Future Development

- Photo capture functionality is implemented but needs storage integration
- Photo storage will need backend integration (Firebase, AWS S3, etc.)
- Real-time features will require WebSocket or similar real-time connection
- Push notifications will need expo-notifications setup
- The app prioritizes camera-first experience with quick access via floating button
- All data is currently mocked - backend integration needed for real functionality

## Development Flows

- Use these two developments flows to know about how they work and how I can run the app in either way if I need for the camera