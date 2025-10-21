import React, { useState } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const showDialog = (
    title: string,
    message: string,
    success: boolean = false
  ) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setIsSuccess(success);
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
    if (isSuccess) {
      router.replace("/(tabs)");
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      showDialog("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      showDialog("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      showDialog("Error", "Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password);
      showDialog("Success", "Account created successfully!", true);
    } catch (error: any) {
      console.error("Registration error:", error);
      let errorMessage = "An error occurred during registration";

      // Parse Firebase error codes
      if (error.code) {
        switch (error.code) {
          case "auth/email-already-in-use":
            errorMessage = "This email is already registered";
            break;
          case "auth/invalid-email":
            errorMessage = "Invalid email address format";
            break;
          case "auth/operation-not-allowed":
            errorMessage = "Email/password accounts are not enabled";
            break;
          case "auth/weak-password":
            errorMessage = "Password is too weak";
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      }

      showDialog("Registration Failed", errorMessage);
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
          {/* Register Form */}
          <Card style={styles.formCard}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.headerContainer}>
                <Text variant="headlineMedium" style={styles.headerText}>
                  Join us!
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

              {/* Confirm Password Input */}
              <PaperTextInput
                mode="outlined"
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                right={
                  <PaperTextInput.Icon
                    icon={showConfirmPassword ? "eye-off" : "eye"}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  />
                }
                style={styles.input}
                disabled={loading}
              />

              {/* Register Button */}
              <Button
                mode="contained"
                onPress={handleRegister}
                style={styles.registerButton}
                contentStyle={styles.buttonContent}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : "Register"}
              </Button>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <Divider style={styles.divider} />
                <Text variant="bodyMedium" style={styles.dividerText}>
                  or
                </Text>
                <Divider style={styles.divider} />
              </View>

              {/* Google Register Button */}
              <Button
                mode="outlined"
                icon="google"
                onPress={() => {}}
                style={styles.googleButton}
                contentStyle={styles.buttonContent}
                disabled={loading}
              >
                Register with Google
              </Button>

              {/* Login Link */}
              <View style={styles.loginLinkContainer}>
                <Text variant="bodyMedium">Already have an account? </Text>
                <Button
                  mode="text"
                  onPress={() => router.back()}
                  disabled={loading}
                  compact
                >
                  Login
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
  registerButton: {
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
  loginLinkContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
});
