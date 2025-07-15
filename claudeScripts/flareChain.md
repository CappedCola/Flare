Flare Chain Feature - Implementation Documentation
Feature Description
Flare Chains is a time-pressured photo-passing game feature for the Flare app where users respond to prompts by taking photos, creating collaborative visual stories that travel through friend networks. Each participant has 60 minutes to respond or the chain dies, creating social pressure and viral engagement moments.

INTEGRATION NOTES
This feature integrates with the existing Flare app architecture and should maintain consistency with current design patterns, navigation structure, and Firebase implementation. All new components should follow the established UI Kitten + Eva Design system.

Core User Flow
Prompt Selection: User chooses from daily themes (Sleepy Sunday, Thirsty Thursday), categories (Emotions, Adventure, Creativity), or creates custom prompt
Chain Creation: Take first photo interpreting the prompt, select friends to invite (3-8 people)
Auto Group Chat: System creates group chat with all chain participants
Response Chain: Each person has 60 minutes to take photo interpreting original prompt their way
Chain Progression: View all previous photos, add your interpretation, pass to next person
Chain Completion: Chain ends when timer expires, max participants reached, or manually completed
Social Discovery: Meet new friends through mutual chain participation
Architecture & Tech Stack Integration
Builds on Existing Stack
React Native 0.79.4 with Expo SDK 53.0.0 (no changes)
TypeScript 5.8.3 with new Flare Chain interfaces
UI Kitten 5.3.1 + Eva Design 2.2.0 using existing newflaretheme.ts
React Navigation v6 with new FlareNavigator stack
Lucide React Native 0.525.0 with Flame, Clock, Users icons
Expo Camera 16.1.10 for chain photo capture
Firebase integration extends existing firebaseService.ts
New Project Structure Extensions
app/
├── navigation/
│ ├── RootNavigator.tsx # Updated with Flare tab
│ ├── BottomTabs.tsx # Add Flare tab with Flame icon
│ └── FlareNavigator.tsx # NEW: Flare feature navigation stack
├── screens/
│ ├── [existing screens...]
│ └── flare/ # NEW: Flare Chain screens
│ ├── FlareHomeScreen.tsx # Dashboard with active chains
│ ├── FlarePromptScreen.tsx # Prompt selection interface
│ ├── FlareCreationScreen.tsx # Chain creation flow
│ ├── FlareResponseScreen.tsx # Respond to received chain
│ ├── FlareChainViewScreen.tsx # View chain progression
│ └── FlareHistoryScreen.tsx # User's chain history
├── components/
│ ├── [existing components...]
│ └── flare/ # NEW: Flare Chain components
│ ├── PromptCard.tsx # Prompt display cards
│ ├── ChainTimeline.tsx # Visual chain progression
│ ├── FlareTimer.tsx # 60-minute countdown timer
│ ├── ChainPhotoCard.tsx # Individual chain photos
│ ├── PhotoCarousel.tsx # Swipeable photo viewer
│ ├── ChainChat.tsx # Integrated group chat
│ ├── PromptSelector.tsx # Category/prompt picker
│ └── ResponseCamera.tsx # Camera with prompt overlay
├── services/
│ ├── firebaseService.ts # EXTENDED with chain functions
│ ├── flareChainService.ts # NEW: Chain management
│ └── promptService.ts # NEW: Prompt system
├── context/
│ ├── [existing contexts...]
│ └── FlareContext.tsx # NEW: Flare state management
├── types/
│ ├── index.ts # EXTENDED with Flare interfaces
│ └── flare.ts # NEW: Flare-specific types
├── hooks/
│ ├── useFlareChains.ts # NEW: Chain data management
│ ├── useChainTimer.ts # NEW: Timer countdown logic
│ └── usePrompts.ts # NEW: Prompt data hooks
└── utils/
├── chainHelpers.ts # NEW: Chain utility functions
└── timerHelpers.ts # NEW: Timer calculations
UI/UX Design System Integration
Extends Existing Theme
Uses the established newflaretheme.ts with Flare brand colors:

Primary:
#FF4D4D for chain status, timers, and call-to-action buttons
Background: Existing light beige (
#FDF6EC), off-white (
#FAF9F6), white (
#FFFFFF) hierarchy
Chain Status Colors: Green (active), Yellow (warning), Red (urgent), Gray (completed/expired)
Prompt Categories: Each category has distinct color (Adventure:
#4ECDC4, Emotions:
#FF6B6B, etc.)
New Component Patterns
Chain Cards: Full-width layout similar to FeedScreen cards with chain status, timer, participant avatars
Prompt Cards: Card-based selection interface with category colors, emoji indicators, popularity badges
Timer Components: Prominent countdown displays with color-coded urgency states
Chain Timeline: Horizontal scrollable photo progression with interpretation text
Response Interface: Camera overlay with prompt reminder, previous photos reference
Group Chat Integration: Embedded chat using existing chat components with chain-specific features
Navigation Integration
New Flare Tab: Flame icon in BottomTabs navigation with notification badges for active chains
Stack Navigation: FlareNavigator follows existing navigation patterns
Deep Linking: Chain invitations, notifications link directly to appropriate screens
Tab Badges: Show count of active chains requiring user response
AI Collaboration Tips
Requesting Flare Chain Features
When asking for new Flare Chain features or modifications:

Be specific about the chain component:
✅ "Add timer warning at 5 minutes remaining in FlareTimer component"
❌ "Make timers more urgent"
Reference existing Flare patterns:
✅ "Use the same card style as PromptCard for the new CategoryCard"
❌ "Make it look consistent"
Specify integration points:
✅ "Extend existing firebaseService.ts with chain creation function"
❌ "Add backend support"
File Update Requests
For Flare Chain modifications, mention:

File path: app/screens/flare/FlareResponseScreen.tsx
Component name: ResponseCamera component
Integration point: "Update to use existing camera permissions from CameraScreen.tsx"
Example Requests
"Add chain expiration notification to FlareTimer component using existing notification patterns"
"Create ChainPhotoCard component using same styling as FeedScreen photo cards"
"Extend firebaseService.ts with flareChainService functions for chain management"
"Add Flare tab to BottomTabs.tsx with active chain count badge"
Sprint TODO List
Phase 1: Foundation (Week 1)
Create FlareNavigator.tsx following existing navigation patterns
Add Flare tab to BottomTabs.tsx with Flame icon
Create basic Flare screen components (empty states)
Extend types/index.ts with Flare Chain interfaces
Set up basic Firestore collections for chains
Phase 2: Core Chain Mechanics (Week 2)
Implement FlareCreationScreen.tsx with prompt selection
Create chain photo capture using existing camera patterns
Build FlareResponseScreen.tsx for responding to chains
Implement 60-minute timer system with notifications
Extend firebaseService.ts with chain CRUD operations
Phase 3: Social Features (Week 3)
Integrate group chat creation for chains
Build ChainTimeline.tsx component for progression view
Implement friend selection for chain recipients
Add chain notifications using existing notification system
Create FlareHomeScreen.tsx dashboard
Phase 4: Advanced Features (Week 4)
Build prompt management system (daily, category, custom)
Implement chain history and statistics
Add photo reactions and chain sharing
Create chain discovery and friend suggestions
Polish UI animations and transitions
Phase 5: Integration & Testing (Week 5)
Full integration testing with existing app features
Performance optimization for real-time updates
Push notification setup for chain events
User onboarding flow for Flare Chains
Beta testing and bug fixes
Current Integration Status
Existing Systems to Leverage
Authentication: Use existing AuthContext.tsx for user management
Camera: Extend CameraScreen.tsx patterns for chain photo capture
Navigation: Follow BottomTabs.tsx and navigation constants
Firebase: Build on existing firebaseService.ts architecture
Friends: Use existing FriendsScreen.tsx friend selection patterns
Chat: Extend existing group chat functionality
Notifications: Use existing NotificationContext.tsx system
New Systems to Build
Chain Management: Timer system, chain state, progression logic
Prompt System: Daily prompts, categories, custom prompt creation
Chain Discovery: Friend suggestions through mutual participation
Statistics: User chain stats, achievements, leaderboards
Real-time Updates: Chain status, photo additions, timer sync
Technical Implementation Notes
Firebase Extensions Required
New Collections: flareChains, promptCategories, dailyPrompts, customPrompts, userChainStats
Security Rules: Chain access control, photo upload permissions
Cloud Functions: Timer expiration, notification triggers, chain cleanup
Storage: Chain photo organization separate from regular posts
Real-time Features
Chain Status: Live updates for timer, participant additions, completions
Group Chat: Real-time messaging integrated with chain events
Notifications: Push notifications for chain invitations, timer warnings, completions
Photo Sync: Instant photo additions across all chain participants
Performance Considerations
Photo Optimization: Compress chain photos for faster loading
Real-time Limits: Optimize Firestore listeners for active chains only
Cache Strategy: Cache prompt data, user statistics locally
Offline Support: Handle network interruptions gracefully
Prompt System Architecture
Daily Prompts
Schedule: Automated daily prompt rotation
Themes: Monday Motivation, Transformation Tuesday, Wisdom Wednesday, Thirsty Thursday, Feel-Good Friday, Social Saturday, Sleepy Sunday
Management: Admin interface for prompt updates
Category System
Emotions: Mood-based prompts for emotional expression
Adventure: Action and exploration-focused challenges
Creativity: Artistic and creative interpretation prompts
Connection: Social interaction and relationship building
Growth: Personal development and learning challenges
Custom: User-generated prompts with moderation
Prompt Selection UX
Today's Special: Featured daily prompt with special styling
Browse Categories: Grid view of category cards with emoji/color coding
Custom Creation: Text input with character limits and content moderation
Popular/Trending: Algorithm-driven popular prompt suggestions
Social Discovery Features
Chain-Based Friend Discovery
Mutual Participation: Suggest friends who participated in same chains
Chain Completion: Friend suggestions after successful chain completion
Similar Interests: Match users based on prompt category preferences
Geographic Proximity: Suggest local users in similar chains
Viral Mechanics
Chain Stories: Shareable compilations of completed chains
Achievement System: Badges for chain completions, clutch responses, social connections
Leaderboards: Weekly/monthly most active participants
Chain Challenges: Themed weekly challenges with group participation
Notes for Development
Code Organization
Follow existing component patterns from FeedScreen.tsx and CameraScreen.tsx
Use established navigation patterns from RootNavigator.tsx and BottomTabs.tsx
Extend firebaseService.ts rather than creating separate Firebase implementations
Maintain UI Kitten component usage for consistency
Testing Strategy
Unit tests for chain logic, timer calculations, prompt management
Integration tests for Firebase operations, real-time updates
E2E tests for complete chain creation and response flows
Performance tests for real-time features with multiple users
Launch Considerations
Gradual rollout with feature flags
Onboarding tutorial for new Flare Chain users
Content moderation for custom prompts
Analytics tracking for chain completion rates, user engagement
App store updates highlighting new social gaming features
Important Development Reminders
Follow existing Flare app patterns and architecture.
NEVER create files unless absolutely necessary for the feature.
ALWAYS extend existing files (firebaseService.ts, types/index.ts) rather than creating new ones when possible.
Use established UI Kitten components and newflaretheme.ts styling.
Maintain consistency with existing navigation, authentication, and Firebase patterns.
