import React, { useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, TouchableOpacity, StyleSheet, Appearance, Dimensions } from "react-native";
import { Icon, useTheme } from "@ui-kitten/components";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { FeedScreen } from "../screens/FeedScreen";
import { CameraScreen } from "../screens/CameraScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { navBarHeight } from "../constants/navigation";

const Tab = createBottomTabNavigator();

const HomeIcon = (props: any) => <Icon {...props} name="home-outline" />;
const CameraIcon = (props: any) => <Icon {...props} name="plus-outline" />;
const PersonIcon = (props: any) => <Icon {...props} name="person-outline" />;

interface FullWidthTabBarProps {
	navigation: any;
	state: any;
}

const FullWidthTabBar = ({ navigation, state }: FullWidthTabBarProps) => {
	const theme = useTheme();
	const insets = useSafeAreaInsets();
	const colorScheme = Appearance.getColorScheme();
	const isDark = colorScheme === "dark";
	const { width: screenWidth } = Dimensions.get('window');

	const tabs = [
		{ name: "Feed", icon: HomeIcon },
		{ name: "Camera", icon: CameraIcon },
		{ name: "Profile", icon: PersonIcon },
	];

	const navigateToTab = (routeName: string) => {
		navigation.navigate(routeName as never);
	};

	const getIconColor = (tabName: string) => {
		return tabName === state.routeNames[state.index]
			? theme["color-primary-500"]
			: theme["color-basic-600"];
	};

	return (
		<View
			style={[
				styles.container,
				{ bottom: Math.max(insets.bottom + 6, 6) }, // Safe positioning with minimum 6px
			]}
		>
			<BlurView
				intensity={17} // Slightly higher for better effect
				tint={isDark ? "dark" : "light"}
				style={styles.pillContainer}
			>
				{/* Translucent overlay for liquid glass effect */}
				<View
					style={[
						styles.overlay,
						{
							backgroundColor: isDark
								? "rgba(0, 0, 0, 0.2)"
								: "rgba(255, 255, 255, 0.14)",
						}, // Darker & more opaque
					]}
				/>

				{/* Tab buttons container */}
				<View style={styles.tabsContainer}>
					{tabs.map((tab) => (
						<TouchableOpacity
							key={tab.name}
							style={styles.tab}
							onPress={() => navigateToTab(tab.name)}
							activeOpacity={0.7}
						>
							<tab.icon
								style={[
									styles.tabIcon, 
									{ 
										color: getIconColor(tab.name),
										width: screenWidth > 400 ? 26 : 24,
										height: screenWidth > 400 ? 26 : 24
									}
								]}
							/>
						</TouchableOpacity>
					))}
				</View>
			</BlurView>
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
		width: "92%", // CUSTOMIZABLE: Adjust pill width (60%-85%)
		maxWidth: 400, // Prevents pill from being too wide on large screens
		height: navBarHeight + 2,
		borderRadius: navBarHeight / 2, // Perfect pill shape
		overflow: "hidden",
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 8,
	},
	overlay: {
		...StyleSheet.absoluteFillObject,
		borderRadius: navBarHeight / 2,
	},
	tabsContainer: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-evenly", // Better spacing for 3 icons
		paddingHorizontal: 16,
	},
	tab: {
		alignItems: "center",
		justifyContent: "center",
		flex: 1, // Equal space for each tab
		height: "100%",
	},
	tabIcon: {
		width: 24,
		height: 24,
	},
});
