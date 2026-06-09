import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import CalendarScreen from '../screens/CalendarScreen';
import MaterialsScreen from '../screens/MaterialsScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ClassesScreen from '../screens/ClassScreen';
import PlannerScreen from '../screens/PlannerScreen';
import StudySessionScreen from '../screens/StudySessionScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// bottom tab nav for logged in users
function MainTabNavigator({ navigation }) {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#62119f',
        tabBarInactiveTintColor: '#62119f',
        tabBarStyles: { backgroundColor: '#d1e9ef', borderTopColor: '#62119f' },
        headerStyle: { backgroundColor: '#d1e9ef', borderBottomWidth: 1, borderBottomColor: '#d1e9ef' },
        headerTintColor: '#62119f',
        headerTitleStyle: { fontWeight: 'bold' },
        headerRight: () => (
          <TouchableOpacity
            style={{ marginRight: 15 }}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-circle" size={28} color="#62119f" />
          </TouchableOpacity>
        ),
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Classes') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Planner') {
            iconName = focused ? 'sparkles' : 'sparkles-outline';
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Materials') {
            iconName = focused ? 'folder-open' : 'folder-open-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: t('dashboard'),
          headerTitle: t('dashboard'),
        }}
      />
      <Tab.Screen
        name="Classes"
        component={ClassesScreen}
        options={{
          tabBarLabel: t('classes'),
          headerTitle: t('classes'),
        }}
      />
      <Tab.Screen
        name="Planner"
        component={PlannerScreen}
        options={{
          tabBarLabel: t('planner'),
          headerTitle: t('planner'),
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarLabel: t('calendar'),
          headerTitle: t('calendar'),
        }}
      />
      <Tab.Screen
        name="Materials"
        component={MaterialsScreen}
        options={{
          tabBarLabel: t('materials'),
          headerTitle: t('materials'),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        setUserToken(token);
      } catch (e) {
        console.error('Failed to load user token', e);
      } finally {
        setIsLoading(false);
      }
    };
    checkToken();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafaf9' }}>
        <ActivityIndicator size="large" color="#62119f" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={userToken == null ? "Login" : "Main"}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: t('login'), headerShown: false }}
        />
        <Stack.Screen
          name="Main"
          component={MainTabNavigator}
          options={{ title: t('dashboard'), headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: t('register'), headerShown: false }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            title: t('myProfile'),
            headerShown: true,
            headerTintColor: '#62119f',
            headerStyle: { backgroundColor: '#d1e9ef', borderBottomWidth: 1, borderBottomColor: '#e7e5e4' },
            headerTitleStyle: { fontWeight: 'bold' }
          }}
        />
        <Stack.Screen
          name="StudySession"
          component={StudySessionScreen}
          options={{ title: t('studySession'), headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
