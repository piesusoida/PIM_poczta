import React from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Tabs, Redirect } from "expo-router";
import { useTheme } from "react-native-paper";

import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { useAuth } from "@/contexts/AuthContext";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
}) {
  return <MaterialCommunityIcons size={26} {...props} />;
}

export default function TabLayout() {
  const theme = useTheme();
  const { user, loading } = useAuth();

  // Redirect to login if not authenticated
  if (!loading && !user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceDisabled,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
        headerShown: useClientOnlyValue(false, true),
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null, // Hide this screen from navigation
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="account" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: "",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="notebook" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="chart-line" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
