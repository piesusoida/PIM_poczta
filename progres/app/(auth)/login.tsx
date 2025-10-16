import React, { useState } from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Text,
  TextInput as PaperTextInput,
  Button,
  Card,
  Divider,
  ActivityIndicator,
  Portal,
  Dialog,
  Paragraph,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();

  const showDialog = (title: string, message: string) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showDialog("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      // Navigate to main app after successful login
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "An error occurred during login";

      // Parse Firebase error codes
      if (error.code) {
        switch (error.code) {
          case "auth/invalid-email":
            errorMessage = "Invalid email address format";
            break;
          case "auth/user-disabled":
            errorMessage = "This account has been disabled";
            break;
          case "auth/user-not-found":
            errorMessage = "No account found with this email";
            break;
          case "auth/wrong-password":
            errorMessage = "Incorrect password";
            break;
          case "auth/invalid-credential":
            errorMessage = "Invalid email or password";
            break;
          case "auth/too-many-requests":
            errorMessage = "Too many failed attempts. Please try again later";
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      }

      showDialog("Login Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // Navigate to main app after successful login
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Google login error:", error);
      let errorMessage = "An error occurred during Google login";

      // Parse error codes
      if (error.code) {
        switch (error.code) {
          case "-5": // SIGN_IN_CANCELLED
            errorMessage = "Sign-in was cancelled";
            break;
          case "12501": // SIGN_IN_CANCELLED (Android)
            errorMessage = "Sign-in was cancelled";
            break;
          case "SIGN_IN_CANCELLED":
            errorMessage = "Sign-in was cancelled";
            break;
          case "IN_PROGRESS":
            errorMessage = "Sign-in already in progress";
            break;
          case "PLAY_SERVICES_NOT_AVAILABLE":
            errorMessage = "Google Play Services not available";
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Don't show error if user cancelled
      if (
        !error.code ||
        (error.code !== "-5" &&
          error.code !== "12501" &&
          error.code !== "SIGN_IN_CANCELLED")
      ) {
        showDialog("Google Login Failed", errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          {/* Login Form */}
          <Card style={styles.formCard}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.headerContainer}>
                <Text variant="headlineMedium" style={styles.headerText}>
                  Track your progress!
                </Text>
              </View>
              {/* Email Input */}
              <PaperTextInput
                mode="outlined"
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                style={styles.input}
                disabled={loading}
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
                    icon={showPassword ? "eye-off" : "eye"}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  />
                }
                style={styles.input}
                disabled={loading}
              />

              {/* Login Button */}
              <Button
                mode="contained"
                onPress={handleLogin}
                style={styles.loginButton}
                contentStyle={styles.buttonContent}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : "Login"}
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
                onPress={handleGoogleLogin}
                style={styles.googleButton}
                contentStyle={styles.buttonContent}
                disabled={loading}
              >
                Login with Google
              </Button>

              {/* Register Link */}
              <View style={styles.registerLinkContainer}>
                <Text variant="bodyMedium">Don't have an account? </Text>
                <Button
                  mode="text"
                  onPress={() => router.push("/(auth)/register")}
                  disabled={loading}
                  compact
                >
                  Register
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>
      </KeyboardAvoidingView>

      {/* Dialog for messages */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={hideDialog}>
          <Dialog.Title>{dialogTitle}</Dialog.Title>
          <Dialog.Content>
            <Paragraph>{dialogMessage}</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialog}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1c1b1f",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  headerText: {
    textAlign: "center",
    fontWeight: "600",
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
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  divider: {
    flex: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#666",
  },
  googleButton: {
    marginBottom: 8,
  },
  registerLinkContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
});
