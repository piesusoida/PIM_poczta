import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput as PaperTextInput,
  Button,
  Card,
  Divider,
  useTheme,
} from 'react-native-paper';

export default function LoginScreen() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const theme = useTheme();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <Text variant="headlineMedium" style={styles.headerText}>
              Track your progress!
            </Text>
          </View>

          {/* Login Form */}
          <Card style={styles.formCard}>
            <Card.Content style={styles.cardContent}>
              {/* Login Input */}
              <PaperTextInput
                mode="outlined"
                label="Login"
                value={login}
                onChangeText={setLogin}
                placeholder="Enter your login"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />

              {/* Password Input */}
              <PaperTextInput
                mode="outlined"
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                right={
                  <PaperTextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                style={styles.input}
              />

              {/* Login Button */}
              <Button
                mode="contained"
                onPress={() => {}}
                style={styles.loginButton}
                contentStyle={styles.buttonContent}
              >
                Login
              </Button>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <Divider style={styles.divider} />
                <Text variant="bodyMedium" style={styles.dividerText}>
                  or
                </Text>
                <Divider style={styles.divider} />
              </View>

              {/* Google Login Button */}
              <Button
                mode="outlined"
                icon="google"
                onPress={() => {}}
                style={styles.googleButton}
                contentStyle={styles.buttonContent}
              >
                Login with Google
              </Button>
            </Card.Content>
          </Card>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  formCard: {
    marginHorizontal: 0,
    elevation: 2,
  },
  cardContent: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  input: {
    marginBottom: 16,
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
  },
  googleButton: {
    marginBottom: 8,
  },
});