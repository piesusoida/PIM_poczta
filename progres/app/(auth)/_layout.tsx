import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthLayout() {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack>
      <Stack.Screen 
        name="login" 
        options={{ 
          title: 'Login',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="register" 
        options={{ 
          title: 'Register',
          headerShown: false 
        }} 
      />
    </Stack>
  );
}