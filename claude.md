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

- **React Native 0.74+** with **Expo SDK 51+**
- **TypeScript** with strict type-checking
- **UI Kitten** + **Eva Design** for consistent UI components
- **React Navigation v6** for navigation
- **Inter font** for typography

### Project Structure

```
/
├── App.tsx                     # Root app component with providers
├── package.json               # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── app/
    ├── navigation/
    │   ├── RootNavigator.tsx  # Main navigation container
    │   └── BottomTabs.tsx     # Bottom tab navigation
    ├── screens/
    │   ├── FeedScreen.tsx     # Home feed with photo cards
    │   ├── CameraScreen.tsx   # BeReal-style camera interface
    │   └── ProfileScreen.tsx  # User profile and stats
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

- **Feed Cards**: Airbnb-inspired layout with user info, photo, and actions
- **Camera Interface**: BeReal-style full-screen with timer and side controls
- **Profile Grid**: Instagram-like photo grid with stats overview

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

- [ ] Implement actual camera functionality with expo-camera
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

## Notes for Future Development

- All screens are currently using placeholder data and mock UI
- Camera functionality will require `expo-camera` and proper permissions
- Photo storage will need backend integration (Firebase, AWS S3, etc.)
- Real-time features will require WebSocket or similar real-time connection
- Push notifications will need expo-notifications setup
- The app is designed to be camera-first, prioritizing quick photo capture
