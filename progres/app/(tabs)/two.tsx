import { StyleSheet } from 'react-native';
import { Button, Portal, Dialog, Paragraph } from 'react-native-paper';
import { useRouter, Redirect } from 'expo-router';
import { useState } from 'react';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/contexts/AuthContext';

export default function TabTwoScreen() {
  const { signOut, user, loading } = useAuth();
  const router = useRouter();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [errorDialogVisible, setErrorDialogVisible] = useState(false);

  // Redirect to login if not authenticated
  if (!loading && !user) {
    return <Redirect href="/(auth)/login" />;
  }

  const showLogoutDialog = () => {
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
  };

  const hideErrorDialog = () => {
    setErrorDialogVisible(false);
  };

  const handleLogout = async () => {
    hideDialog();
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      setErrorDialogVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab Two</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      
      {user && (
        <View style={styles.userInfo}>
          <Text style={styles.userEmail}>Logged in as:</Text>
          <Text style={styles.userEmailValue}>{user.email}</Text>
        </View>
      )}

      <Button 
        mode="contained" 
        onPress={showLogoutDialog}
        style={styles.logoutButton}
        buttonColor="#D32F2F"
        icon="logout"
      >
        Logout
      </Button>

      <EditScreenInfo path="app/(tabs)/two.tsx" />

      {/* Logout Confirmation Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={hideDialog}>
          <Dialog.Title>Logout</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Are you sure you want to logout?</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialog}>Cancel</Button>
            <Button onPress={handleLogout} textColor="#D32F2F">Logout</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Error Dialog */}
      <Portal>
        <Dialog visible={errorDialogVisible} onDismiss={hideErrorDialog}>
          <Dialog.Title>Error</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Failed to logout. Please try again.</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideErrorDialog}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userEmailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
});
