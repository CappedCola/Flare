# Flare UI Design System - Comprehensive Guide

## Color System

### Primary Colors (Red Spectrum)
```typescript
// Main app red (logo background)
'color-primary-100': '#FFD6D6',  // Lightest red tint
'color-primary-200': '#FFAFAF',  // Light red
'color-primary-300': '#FF8787',  // Medium-light red
'color-primary-400': '#FF6161',  // Medium red
'color-primary-500': '#FF4D4D',  // Main red (primary brand color)
'color-primary-600': '#E84343',  // Dark red
'color-primary-700': '#D13737',  // Darker red
'color-primary-800': '#AA2C2C',  // Very dark red
'color-primary-900': '#7F1F1F',  // Darkest red
```

**Usage Examples:**
- Accent buttons: `theme['color-primary-500']` (FeedScreen:378, ProfileScreen:150)
- Active states: Heart icons when liked (CommentModal:103, FullscreenImageViewer:334)
- Tab indicators: Active tab background (BottomTabs:131)

### Accent Colors (Off-white/Beige)
```typescript
// Firework body (off-white beige tones)
'color-accent-100': '#FDFBF9',  // Almost white
'color-accent-200': '#F5F0E6',  // Very light beige
'color-accent-300': '#EDE8D0',  // Light beige
'color-accent-400': '#D9CBA1',  // Medium beige
```

### Background System
```typescript
'background-basic-color-1': '#FDF6EC',  // Main app background (light beige)
'background-basic-color-2': '#FAF9F6',  // Section backgrounds (off-white)
'background-basic-color-3': '#FFFFFF',  // Cards/tiles (pure white)
```

**Usage Examples:**
- Main screen backgrounds: `theme['background-basic-color-1']` (FeedScreen:265, ProfileScreen:274)
- Card surfaces: `theme['background-basic-color-3']` (FeedScreen:53, ProfileScreen:20)
- Input fields: `theme['background-basic-color-2']` (CommentModal:384)

### Text Color Hierarchy
```typescript
'text-primary-color': '#2C2C2C',      // Primary dark text
'text-secondary-color': '#666666',    // Secondary gray text
'text-hint-color': '#999999',         // Hint/placeholder text
'text-on-primary-color': '#FFFFFF',   // White text on red backgrounds
```

### Border System
```typescript
'border-basic-color-2': '#E8E8E8',  // Light borders
'border-basic-color-3': '#CCCCCC',  // Medium borders
'border-basic-color-4': '#999999',  // Stronger borders
```

### System Status Colors
```typescript
'color-success-500': '#43A047',   // Success green
'color-warning-500': '#F57C00',   // Warning orange
'color-danger-500': '#B71C1C',    // Error red
'color-info-500': '#00ACC1',      // Info blue
```

## Typography System

### UI Kitten Text Categories
- **h4**: Large titles (24px, weight 700) - FeedScreen:378, 469
- **h5**: Section headers (20px, weight 700) - CommentModal:325
- **h6**: Subsection headers (18px, weight 600) - FeedScreen:350
- **s1**: Body text medium (16px, weight 500/600) - FeedScreen:510, ProfileScreen:186
- **s2**: Body text small (14px) - ProfileScreen:158
- **p1**: Paragraph text (15px) - CommentModal:309
- **p2**: Smaller paragraph (14px, line-height 20) - FeedScreen:116
- **c1**: Caption medium (14px) - CommentModal:77
- **c2**: Caption small (13px, 12px) - FeedScreen:69, CommentModal:285

### Font Weight Patterns
```typescript
fontWeight: '700'  // Headers and usernames
fontWeight: '600'  // Buttons and important text
fontWeight: '500'  // Regular body text
fontWeight: '400'  // Light text and descriptions
```

## Layout Patterns

### Feed Layout (FeedScreen)
```typescript
// Post wrapper with spacing
postWrapper: {
  marginBottom: 24,
}

// Card structure with shadows
postContainer: {
  borderRadius: 12,
  shadowColor: 'rgba(0, 0, 0, 0.1)',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 1,
  shadowRadius: 8,
  elevation: 4,
}

// Full-width image container
imageContainer: {
  aspectRatio: 4/5,
  width: '100%',
}

// Action button spacing
actionButtons: {
  flexDirection: 'row',
  gap: 20,
}
```

### Profile Layout (ProfileScreen)
```typescript
// Avatar styling with border
avatar: {
  marginBottom: 20,
  borderWidth: 3,
  borderColor: theme['color-primary-500']
}

// Photo grid calculations
const photoSize = (width - 48) / 3;

photoGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 4,
  justifyContent: 'space-between',
}

// Tab indicator system
tabIndicator: {
  flex: 1,
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 20,
  alignItems: 'center',
}
```

### Modal Layout (CommentModal)
```typescript
// Slide-up modal container
modalContainer: {
  height: '95%',
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  overflow: 'hidden',
}

// Header with close button
header: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 20,
  paddingVertical: 18,
  borderBottomWidth: 1,
}
```

## Component Styling Patterns

### UI Kitten Components

#### Avatar Implementation
```typescript
<Avatar
  size='small'|'medium'|'giant'
  source={{ uri: imageUrl || 'https://via.placeholder.com/40' }}
  style={[
    styles.avatar,
    { borderColor: theme['color-primary-500'] }
  ]}
/>
```

#### Text with Theme Colors
```typescript
<Text 
  category='h4'|'s1'|'p1'|'c2'
  style={[
    styles.text,
    { color: theme['text-primary-color'] }
  ]}
>
  Content
</Text>
```

#### Buttons with Primary Color
```typescript
const friendsButton = {
  backgroundColor: theme['color-primary-500'],
  borderColor: theme['color-primary-500'],
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderRadius: 20,
  borderWidth: 1,
}
```

### Custom Components

#### Glass Morphism Navigation (BottomTabs)
```typescript
// BlurView with gradient overlay
<BlurView
  intensity={15}
  tint={isDark ? "dark" : "light"}
  style={styles.pillContainer}
>
  <LinearGradient
    colors={[
      isDark ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.28)",
      "rgba(255,255,255,0.02)",
    ]}
    style={StyleSheet.absoluteFill}
  />
  {children}
</BlurView>

// Pill container styling
pillContainer: {
  width: "92%",
  maxWidth: 400,
  height: 84,
  borderRadius: 42,
  overflow: "hidden",
  borderWidth: 0.75,
  borderColor: "rgba(255,255,255,0.05)",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.25,
  shadowRadius: 16,
  elevation: 16,
}
```

#### Action Button Pattern
```typescript
actionButton: {
  padding: 8,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
}

// With icon and optional text
<TouchableOpacity style={styles.actionButton} onPress={handleAction}>
  <Heart 
    size={24} 
    color={isActive ? theme['color-primary-500'] : theme['color-basic-600']} 
    fill={isActive ? theme['color-primary-500'] : 'none'}
  />
  {count > 0 && (
    <Text style={[styles.actionText, { color: theme['text-secondary-color'] }]}>
      {count}
    </Text>
  )}
</TouchableOpacity>
```

## Animation Implementations

### Modal Slide Animations (CommentModal)
```typescript
// Slide up from bottom
const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;

// Show modal
Animated.spring(slideAnim, {
  toValue: 0,
  useNativeDriver: true,
  tension: 120,
  friction: 8,
}).start();

// Hide modal
Animated.spring(slideAnim, {
  toValue: Dimensions.get('window').height,
  useNativeDriver: true,
  tension: 120,
  friction: 8,
}).start();
```

### Tab Indicator Animation (BottomTabs)
```typescript
const indicatorAnim = useRef(new Animated.Value(0)).current;

// Animate to new tab position
Animated.spring(indicatorAnim, {
  toValue: currentIndex,
  useNativeDriver: false,
  tension: 120,
  friction: 8,
}).start();

// Interpolate position
transform: [{
  translateX: indicatorAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [
      screenWidth * 0.92 * 0.167,
      screenWidth * 0.92 * 0.5,
      screenWidth * 0.92 * 0.833,
    ],
  }),
}]
```

### Fade Overlay Animation (FullscreenImageViewer)
```typescript
const fadeAnim = useRef(new Animated.Value(0)).current;

// Show overlay
Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true,
}).start();

// Auto-hide after delay
setTimeout(() => {
  Animated.timing(fadeAnim, {
    toValue: 0,
    duration: 200,
    useNativeDriver: true,
  }).start(() => setShowOverlay(false));
}, 3000);
```

### Preview Animation (VisionCameraScreen)
```typescript
const previewOpacity = useRef(new Animated.Value(0)).current;

// Animate in
Animated.timing(previewOpacity, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true,
}).start();

// Animate out
Animated.timing(previewOpacity, {
  toValue: 0,
  duration: 200,
  useNativeDriver: true,
}).start(() => {
  setShowPreview(false);
  setCapturedPhoto(null);
});
```

## Responsive Design Patterns

### Screen Dimension Handling
```typescript
const { width, height } = Dimensions.get('window');
const photoSize = (width - 48) / 3; // ProfileScreen grid calculation

// Icon size adaptation
<Icon 
  size={screenWidth > 400 ? 36 : 32} 
  color={getIconColor(tab.name)} 
/>

// Container width constraints
pillContainer: {
  width: "92%",
  maxWidth: 400,
}
```

### Safe Area Implementation
```typescript
import { SafeAreaView } from 'react-native-safe-area-context';

// With specific edges
<SafeAreaView style={styles.container} edges={['top']}>

// Full safe area
<SafeAreaView style={styles.container}>

// Safe area insets for positioning
const insets = useSafeAreaInsets();
<View style={[styles.container, { bottom: insets.bottom - 25 }]}>
```

### Keyboard Avoidance
```typescript
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={Platform.OS === 'ios' ? 45 : 0}
  style={styles.inputContainer}
>
```

### Device Orientation Handling
```typescript
// Photo orientation detection (VisionCameraScreen)
Image.getSize(`file://${photo.path}`, (width, height) => {
  const orientation = width > height ? 'landscape' : 'portrait';
  setPhotoOrientation(orientation);
});

// Landscape preview styling
previewOverlayLandscape: {
  transform: [{ rotate: '90deg' }],
  width: Dimensions.get('window').height,
  height: Dimensions.get('window').width,
  top: '50%',
  left: '50%',
  marginTop: -Dimensions.get('window').width / 2,
  marginLeft: -Dimensions.get('window').height / 2,
}
```

## Component Composition Patterns

### Card Component Structure
```typescript
// Three-part card structure used in FeedScreen
<View style={styles.postWrapper}>
  {/* Header */}
  <View style={[styles.postContainer, styles.postHeaderContainer]}>
    <Avatar />
    <Text>Username</Text>
    <Text>Time</Text>
  </View>

  {/* Content */}
  <View style={styles.imageContainer}>
    <Image />
  </View>
  
  {/* Footer */}
  <View style={[styles.postContainer, styles.postFooterContainer]}>
    <Text>Caption</Text>
    <View style={styles.actionButtons}>
      {/* Action buttons */}
    </View>
  </View>
</View>
```

### Modal Component Pattern
```typescript
// Standard modal structure
<Modal visible={visible} transparent animationType="none">
  <View style={styles.overlay}>
    <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header with close button */}
        <View style={styles.header}>
          <Text>Title</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={26} />
          </TouchableOpacity>
        </View>
        
        {/* Content */}
        <ScrollView style={styles.content}>
          {children}
        </ScrollView>
        
        {/* Footer/Actions */}
        <View style={styles.footer}>
          {/* Footer content */}
        </View>
      </SafeAreaView>
    </Animated.View>
  </View>
</Modal>
```

### List Item Component
```typescript
// Reusable list item pattern (ProfileScreen MenuItem)
const MenuItem = ({ icon: Icon, title, onPress, theme }) => (
  <TouchableOpacity 
    style={[styles.menuItem, { borderBottomColor: theme['border-basic-color-3'] }]}
    onPress={onPress}
  >
    <Icon size={24} color={theme['color-basic-600']} />
    <Text style={[styles.menuItemText, { color: theme['text-primary-color'] }]}>
      {title}
    </Text>
  </TouchableOpacity>
);
```

### Input Component Pattern
```typescript
// Consistent input styling with theme integration
<TextInput
  style={[
    styles.textInput,
    {
      backgroundColor: theme['background-basic-color-2'],
      color: theme['text-primary-color'],
      borderColor: theme['border-basic-color-4'],
    },
  ]}
  placeholder="Placeholder text"
  placeholderTextColor={theme['text-secondary-color']}
  value={value}
  onChangeText={setValue}
/>
```

## Spacing System

### Consistent Spacing Values
- **4px**: Small gaps between related elements
- **8px**: Small padding within components
- **12px**: Medium padding and margins
- **16px**: Standard padding for containers
- **20px**: Large spacing between sections
- **24px**: Extra large spacing between major components
- **31px**: Horizontal padding for main content areas

### Shadow System
```typescript
// Light shadow for cards
shadowColor: 'rgba(0, 0, 0, 0.1)',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 1,
shadowRadius: 8,
elevation: 4,

// Strong shadow for floating elements
shadowColor: '#000',
shadowOffset: { width: 0, height: 6 },
shadowOpacity: 0.25,
shadowRadius: 16,
elevation: 16,
```

## Navigation Integration

### Navigation Constants
```typescript
// app/constants/navigation.ts
export const pillNavHeight = 84; // Height of bottom navigation pill

// Usage in content padding
contentContainerStyle={[
  styles.content,
  { paddingBottom: pillNavHeight + 16 }
]}
```

### Navigation Context Usage
```typescript
import { useNavigation as useNavigationContext } from '../context/NavigationContext';

const { hideNavigation, showNavigation, isNavigationVisible } = useNavigationContext();

// Hide navigation for fullscreen experiences
useEffect(() => {
  if (showPreview) {
    hideNavigation();
  } else {
    showNavigation();
  }
}, [showPreview]);
```

This comprehensive design system provides the foundation for consistent UI development across the Flare application, ensuring visual coherence and maintainable code patterns.