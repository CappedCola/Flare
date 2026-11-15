# Flare

Flare is a social photo app built around **Flare Chains**: turn-based photo stories where friends take turns answering a prompt with a photo, each with 60 minutes to respond. It also has daily streaks, a photo feed with reactions and comments, and a friends system.

It's for small friend groups who want a lighter, more playful way to share photos than a regular feed.

## Built with

- React Native 0.79 + Expo SDK 53, TypeScript (strict)
- UI Kitten / Eva Design, React Navigation
- React Native Vision Camera (dev-client builds) with an Expo Camera fallback for Expo Go
- React Native Firebase: Auth, Firestore, Storage
- Jest for an offline test suite (all Firebase modules mocked), run in GitHub Actions

## Project layout

```
app/
├── screens/      Feed, Camera, Profile, Friends, auth, and flare/ chain screens
├── components/   Reusable UI
├── services/     Firebase and data services
├── hooks/        Custom hooks
├── context/      React context providers
├── navigation/   Navigators
└── config/       Firebase setup and app config
tests/            Jest suites (offline, Firebase mocked)
```

## Running it

You need Node 20+, and Xcode or Android Studio for native builds.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create your own Firebase project with Auth, Firestore and Storage enabled.
3. Copy the env template and fill in your Firebase web config:
   ```bash
   cp .env.example .env
   ```
4. Download your platform config files from the Firebase console into the project root (they're gitignored):
   - `GoogleService-Info.plist` (iOS)
   - `google-services.json` (Android)
5. Start it:
   ```bash
   npm run ios       # or: npm run android
   ```
   For Expo Go (no Vision Camera), set `EXPO_PUBLIC_USE_VISION_CAMERA=false` and run `npm start`.

## Tests

```bash
npm test          # watch-friendly
npm run test:ci   # what CI runs
```

The suite is hermetic: every `@react-native-firebase` package is swapped for a local mock, so no test touches the network.

## Roadmap

- [ ] Re-enable the Firebase emulators for local development
- [ ] Push notifications for "your turn" and expiring chains
- [ ] Group chains with more than two participants
- [ ] Streak history and achievements on the profile screen
- [ ] Android release build and store listing

## License

[MIT](LICENSE)
