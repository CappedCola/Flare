import React, { useEffect, useRef } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
	View,
	TouchableOpacity,
	StyleSheet,
	Appearance,
	Dimensions,
	Animated,
} from "react-native";
import { Icon, useTheme } from "@ui-kitten/components";
import { GalleryVerticalEnd, Plus, User } from 'lucide-react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { FeedScreen } from "../screens/FeedScreen";
import { CameraScreen } from "../screens/CameraScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { pillNavHeight } from "../constants/navigation";

const Tab = createBottomTabNavigator();

const FeedIcon = (props: any) => <GalleryVerticalEnd {...props} />;
const PersonIcon = (props: any) => <User {...props} />;
const PlusIcon = (props: any) => <Plus {...props} />;

interface GlassPillProps {
	children: React.ReactNode;
	isDark: boolean;
}

const GlassPill = ({ children, isDark }: GlassPillProps) => (
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
);

interface FullWidthTabBarProps {
	navigation: any;
	state: any;
}

const FullWidthTabBar = ({ navigation, state }: FullWidthTabBarProps) => {
	const theme = useTheme();
	const insets = useSafeAreaInsets();
	const colorScheme = Appearance.getColorScheme();
	const isDark = colorScheme === "dark";
	const { width: screenWidth } = Dimensions.get("window");

	const tabs = [
		{ name: "Feed", icon: FeedIcon },
		{ name: "Camera", icon: PlusIcon, isCenter: true },
		{ name: "Profile", icon: PersonIcon },
	];

	const indicatorAnim = useRef(new Animated.Value(0)).current;
	const currentIndex = tabs.findIndex(
		(tab) => tab.name === state.routeNames[state.index]
	);
	const isOnCameraTab = currentIndex === 1;

	useEffect(() => {
		Animated.spring(indicatorAnim, {
			toValue: currentIndex,
			useNativeDriver: false,
			tension: 120,
			friction: 8,
		}).start();
	}, [currentIndex]);

	const navigateToTab = (routeName: string) => {
		navigation.navigate(routeName as never);
	};

	const handleCameraButtonPress = async () => {
		if (isOnCameraTab) {
			// Trigger photo capture using global reference with error handling
			try {
				console.log('Camera button pressed - attempting capture');
				if ((global as any).cameraCapture) {
					console.log('Camera capture function found, executing...');
					await (global as any).cameraCapture();
					console.log('Camera capture completed successfully');
				} else {
					console.warn('Camera capture function not available');
					// Could show user-friendly message here
				}
			} catch (error) {
				console.error('Camera capture failed:', error);
				// Graceful error handling - don't crash the app
				// Could show error toast to user
			}
		} else {
			console.log('Navigating to camera tab');
			navigation.navigate("Camera");
		}
	};

	const getIconColor = (tabName: string) => {
		return tabName === state.routeNames[state.index]
			? theme["text-on-primary-color"]
			: theme["color-basic-600"];
	};

	return (
		<View style={[styles.container, { bottom: insets.bottom - 25 }]}>
			<GlassPill isDark={isDark}>
				<View style={styles.tabsContainer}>
					<Animated.View
						style={[
							styles.activeTabBackground,
							{
								backgroundColor: theme["color-primary-500"],
								transform: [
									{
										translateX: indicatorAnim.interpolate({
											inputRange: [0, 1, 2],
											outputRange: [
												0,
												screenWidth * 0.92 * 0.33,
												screenWidth * 0.92 * 0.67,
											],
										}),
									},
								],
							},
						]}
					/>

					{tabs.map((tab, index) => (
						<TouchableOpacity
							key={tab.name}
							style={[styles.tab, tab.isCenter && styles.hiddenTab]}
							onPress={() => navigateToTab(tab.name)}
							activeOpacity={0.7}
						>
							{!tab.isCenter && (
								<tab.icon
									size={screenWidth > 400 ? 36 : 32}
									color={getIconColor(tab.name)}
								/>
							)}
						</TouchableOpacity>
					))}
				</View>
			</GlassPill>

			<TouchableOpacity
				style={[
					styles.plusButton,
					isOnCameraTab && {
						backgroundColor: theme["color-primary-500"],
					}
				]}
				onPress={handleCameraButtonPress}
				activeOpacity={0.8}
			>
				<PlusIcon size={32} color="#FFFFFF" />
			</TouchableOpacity>
		</View>
	);
};

export const BottomTabs = () => {
	return (
		<Tab.Navigator
			tabBar={(props) => <FullWidthTabBar {...props} />}
			screenOptions={{
				headerShown: false,
			}}
		>
			<Tab.Screen name="Feed" component={FeedScreen} />
			<Tab.Screen name="Camera" component={CameraScreen} />
			<Tab.Screen name="Profile" component={ProfileScreen} />
		</Tab.Navigator>
	);
};

const styles = StyleSheet.create({
	container: {
		position: "absolute",
		left: 0,
		right: 0,
		alignItems: "center", // Center the pill horizontally
		zIndex: 1000,
	},
	pillContainer: {
		width: "92%",
		maxWidth: 400,
		height: 84,
		borderRadius: 42,
		overflow: "hidden",
		borderWidth: 0.75,
		borderColor: "rgba(255,255,255,0.05)",
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 6,
		},
		shadowOpacity: 0.25,
		shadowRadius: 16,
		elevation: 16,
	},
	activeTabBackground: {
		position: "absolute",
		width: 60,
		height: 60,
		borderRadius: 30,
		opacity: 0.7,
		zIndex: 1,
		top: 12,
		left: "16.67%",
		marginLeft: -32,
	},
	plusButton: {
		position: "absolute",
		top: 6,
		width: 100,
		height: 74,
		borderRadius: 35,
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 8,
		},
		shadowOpacity: 0.3,
		shadowRadius: 12,
		elevation: 8,
	},
	plusIcon: {
		width: 32,
		height: 32,
	},
	tabsContainer: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-around",
		paddingHorizontal: 0,
		height: 96,
	},
	tab: {
		alignItems: "center",
		justifyContent: "center",
		flex: 1,
		height: "100%",
		zIndex: 2,
	},
	hiddenTab: {
		opacity: 0,
		pointerEvents: "none",
	},
	tabIcon: {
		width: 24,
		height: 24,
	},
});
