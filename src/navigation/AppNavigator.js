import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useHeritage } from '../context/HeritageContext';
import SplashScreen from '../screens/Splash';
import WelcomeScreen from '../screens/Welcome';
import LoginScreen from '../screens/Login';
import RegisterScreen from '../screens/Register';
import HomeScreen from '../screens/Home';
import ExploreScreen from '../screens/Explore';
import TrailScreen from '../screens/Trail';
import FavoritesScreen from '../screens/Favorites';
import ProfileScreen from '../screens/Profile';
import DetailsScreen from '../screens/Details';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const tabIcon = ({ focused, icon }) => <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icon}</Text>;
const openDetails = (navigation, site) => navigation.getParent()?.navigate('Details', { site });

function TimedSplash({ navigation }) {
  const { isHydrated, user } = useHeritage();
  useEffect(() => {
    if (!isHydrated) return undefined;
    const timer = setTimeout(() => navigation.replace(user ? 'MainTabs' : 'Welcome'), 1100);
    return () => clearTimeout(timer);
  }, [isHydrated, navigation, user]);
  return <SplashScreen />;
}
function WelcomeRoute({ navigation }) { return <WelcomeScreen onStart={() => navigation.navigate('Login')} />; }
function LoginRoute({ navigation }) { return <LoginScreen onBack={() => navigation.goBack()} onSignUp={() => navigation.navigate('Register')} onLogin={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })} />; }
function RegisterRoute({ navigation }) { return <RegisterScreen onBack={() => navigation.goBack()} onRegistered={form => navigation.navigate('Login', { email: form.email })} />; }
function HomeRoute({ navigation }) { return <HomeScreen onOpenDetails={site => openDetails(navigation, site)} onOpenFavorites={() => navigation.navigate('Favorites')} />; }
function ExploreRoute({ navigation }) { return <ExploreScreen onOpenDetails={site => openDetails(navigation, site)} />; }
function TrailRoute({ navigation }) { return <TrailScreen onOpenDetails={site => openDetails(navigation, site)} />; }
function FavoritesRoute({ navigation }) { return <FavoritesScreen onOpenDetails={site => openDetails(navigation, site)} onOpenTrail={() => navigation.navigate('Trail')} />; }
function ProfileRoute({ navigation }) { const { logout } = useHeritage(); return <ProfileScreen onLogout={async () => { await logout(); navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Login' }] }); }} />; }

export function MainTabs() {
  return <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: styles.tabBar, tabBarItemStyle: styles.tabItem, tabBarLabelStyle: styles.tabLabel, tabBarActiveTintColor: '#B9572B', tabBarInactiveTintColor: '#8A7161', tabBarHideOnKeyboard: true }}>
    <Tab.Screen name="Home" component={HomeRoute} options={{ tabBarIcon: props => tabIcon({ ...props, icon: '⌂' }) }} />
    <Tab.Screen name="Explore" component={ExploreRoute} options={{ tabBarIcon: props => tabIcon({ ...props, icon: '⌕' }) }} />
    <Tab.Screen name="Trail" component={TrailRoute} options={{ tabBarIcon: props => tabIcon({ ...props, icon: '⌁' }) }} />
    <Tab.Screen name="Favorites" component={FavoritesRoute} options={{ tabBarIcon: props => tabIcon({ ...props, icon: '♡' }) }} />
    <Tab.Screen name="Profile" component={ProfileRoute} options={{ tabBarIcon: props => tabIcon({ ...props, icon: '◉' }) }} />
  </Tab.Navigator>;
}
function DetailsRoute({ navigation, route }) { return <DetailsScreen item={route.params?.site} onBack={() => navigation.goBack()} onOpenTrail={() => navigation.navigate('MainTabs', { screen: 'Trail' })} />; }
export default function AppNavigator() {
  return <NavigationContainer><Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }} initialRouteName="Splash">
    <Stack.Screen name="Splash" component={TimedSplash} /><Stack.Screen name="Welcome" component={WelcomeRoute} /><Stack.Screen name="Login" component={LoginRoute} /><Stack.Screen name="Register" component={RegisterRoute} /><Stack.Screen name="MainTabs" component={MainTabs} /><Stack.Screen name="Details" component={DetailsRoute} />
  </Stack.Navigator></NavigationContainer>;
}
const styles = StyleSheet.create({
  tabBar: { height: 68, paddingTop: 5, paddingBottom: 6, borderTopColor: '#EADCCE', borderTopWidth: 1, backgroundColor: '#FFFDF9', elevation: 8, shadowColor: '#4B2E23', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: -2 } },
  tabItem: { paddingVertical: 2 }, tabLabel: { fontWeight: '700', fontSize: 10 }, tabIcon: { fontSize: 24, lineHeight: 26, color: '#8A7161' }, tabIconActive: { color: '#B9572B' },
});
