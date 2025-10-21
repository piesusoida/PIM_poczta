import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  Card,
  ActivityIndicator,
  useTheme,
  Avatar,
  IconButton,
  Portal,
  Dialog,
  TextInput,
  Button,
} from "react-native-paper";
import { Redirect, router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserWorkoutNotes,
  WorkoutNoteWithId,
  getUserProfile,
  updateUsername,
} from "@/config/firestore";

interface TrainingDay {
  date: Date;
  hasTraining: boolean;
}

export default function ProfileScreen() {
  const { user, loading, signOut } = useAuth();
  const theme = useTheme();
  const [notes, setNotes] = useState<WorkoutNoteWithId[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [username, setUsername] = useState("");
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [tempUsername, setTempUsername] = useState("");
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadUserData();
      }
    }, [user])
  );

  // Redirect to login if not authenticated (after hooks to keep hook order stable)
  if (!loading && !user) {
    return <Redirect href="/(auth)/login" />;
  }

  const loadUserData = async () => {
    try {
      if (user) {
        const userProfile = await getUserProfile(user.uid);
        if (userProfile) {
          setUsername(
            userProfile.username || user.email?.split("@")[0] || "User"
          );
        } else {
          setUsername(user.email?.split("@")[0] || "User");
        }

        const userNotes = await getUserWorkoutNotes(user.uid);
        setNotes(userNotes);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleEditUsername = () => {
    setTempUsername(username);
    setEditDialogVisible(true);
  };

  const handleSaveUsername = async () => {
    if (!user || !tempUsername.trim()) return;

    try {
      await updateUsername(user.uid, tempUsername.trim());
      setUsername(tempUsername.trim());
      setEditDialogVisible(false);
    } catch (error) {
      console.error("Error updating username:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getTrainingCalendar = (): TrainingDay[][] => {
    const today = new Date();

    const daysToShow = 84;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysToShow + 1);

    // Adjust to start from Monday
    const dayOfWeek = startDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(startDate.getDate() - daysToMonday);

    // Create set of training dates for quick lookup
    const trainingDates = new Set(
      notes.map((note) => note.date.toDateString())
    );

    // Generate calendar - we need days organized by day of week (rows)
    const daysByWeekday: TrainingDay[][] = [[], [], [], [], [], [], []]; // 7 rows for each day of week
    const totalDays = daysToShow + daysToMonday;

    for (let i = 0; i < totalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const weekdayIndex = currentDate.getDay();
      const adjustedIndex = weekdayIndex === 0 ? 6 : weekdayIndex - 1; // Monday = 0, Sunday = 6

      daysByWeekday[adjustedIndex].push({
        date: currentDate,
        hasTraining: trainingDates.has(currentDate.toDateString()),
      });
    }

    return daysByWeekday;
  };

  const getTrainingStreak = (): number => {
    if (notes.length === 0) return 0;

    // Sort notes by date, newest first
    const sortedNotes = [...notes].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );

    // Find the last date in the streak (going backwards from newest)
    let lastStreakDate = sortedNotes[0].date;

    for (let i = 1; i < sortedNotes.length; i++) {
      const currentDate = sortedNotes[i - 1].date;
      const nextDate = sortedNotes[i].date;

      const daysDiff = Math.floor(
        (currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // If gap is more than 14 days, streak is broken
      if (daysDiff > 14) {
        break;
      }

      lastStreakDate = nextDate;
    }

    // Calculate weeks from last streak date to today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDate = new Date(lastStreakDate);
    lastDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor(
      (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return Math.ceil(daysDiff / 7);
  };
  if (loading || loadingData) {
    return (
      <SafeAreaView
        style={[styles.container, styles.centerContent]}
        edges={["top"]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  const trainingCalendar = getTrainingCalendar();
  const streak = getTrainingStreak();
  const totalWorkouts = notes.length;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Profile Header */}
          <Card style={styles.profileCard}>
            <Card.Content style={styles.profileContent}>
              <View style={styles.profileHeader}>
                {user?.photoURL ? (
                  <Avatar.Image size={80} source={{ uri: user.photoURL }} />
                ) : (
                  <Avatar.Icon size={80} icon="account" />
                )}
                <View style={styles.profileInfo}>
                  <View style={styles.usernameContainer}>
                    <Text variant="headlineSmall" style={styles.username}>
                      {username}
                    </Text>
                    <IconButton
                      icon="pencil"
                      size={20}
                      onPress={handleEditUsername}
                      iconColor={theme.colors.primary}
                    />
                  </View>
                  <Text variant="bodyMedium" style={styles.email}>
                    {user?.email}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Personal stats */}
          <Card style={styles.statsCard}>
            <Card.Content>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text variant="headlineMedium" style={styles.statValue}>
                    {totalWorkouts}
                  </Text>
                  <Text variant="bodyMedium" style={styles.statLabel}>
                    Workouts
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant="headlineMedium" style={styles.statValue}>
                    {streak}
                  </Text>
                  <Text variant="bodyMedium" style={styles.statLabel}>
                    Week Streak
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Training Calendar*/}
          <Card style={styles.calendarCard}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Training Calendar
              </Text>
              <Text variant="bodySmall" style={styles.calendarSubtitle}>
                Last 12 weeks
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.calendarScroll}
              >
                <View>
                  <View style={styles.calendarContainer}>
                    <View style={styles.dayLabelsColumn}>
                      {["Mon", "", "Wed", "", "Fri", "", "Sun"].map(
                        (day, index) => (
                          <View key={index} style={styles.dayLabelContainer}>
                            <Text variant="labelSmall" style={styles.dayLabel}>
                              {day}
                            </Text>
                          </View>
                        )
                      )}
                    </View>

                    <View style={styles.calendarGrid}>
                      {trainingCalendar.map((weekdayRow, rowIndex) => (
                        <View key={rowIndex} style={styles.weekdayRow}>
                          {weekdayRow.map((day, dayIndex) => (
                            <View
                              key={`${rowIndex}-${dayIndex}`}
                              style={[
                                styles.daySquare,
                                day.hasTraining && styles.daySquareActive,
                                !day.hasTraining && styles.daySquareInactive,
                              ]}
                            />
                          ))}
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendSquare, styles.daySquareInactive]}
                  />
                  <Text variant="bodySmall" style={styles.legendText}>
                    No training
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendSquare, styles.daySquareActive]} />
                  <Text variant="bodySmall" style={styles.legendText}>
                    Training
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          <Button
            mode="outlined"
            onPress={() => setLogoutDialogVisible(true)}
            style={styles.logoutButton}
            textColor="#ef5350"
            icon="logout"
          >
            Sign Out
          </Button>
        </View>

        {/* Edit Username Dialog */}
        <Portal>
          <Dialog
            visible={editDialogVisible}
            onDismiss={() => setEditDialogVisible(false)}
          >
            <Dialog.Title>Edit Username</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Username"
                value={tempUsername}
                onChangeText={setTempUsername}
                mode="outlined"
                autoFocus
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setEditDialogVisible(false)}>
                Cancel
              </Button>
              <Button onPress={handleSaveUsername}>Save</Button>
            </Dialog.Actions>
          </Dialog>

          <Dialog
            visible={logoutDialogVisible}
            onDismiss={() => setLogoutDialogVisible(false)}
          >
            <Dialog.Title>Sign Out</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">
                Are you sure you want to sign out?
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setLogoutDialogVisible(false)}>
                Cancel
              </Button>
              <Button onPress={handleLogout}>Sign Out</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1c1b1f",
  },
  scrollView: {
    flex: 1,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 16,
    paddingTop: 28,
  },
  profileCard: {
    marginBottom: 16,
    elevation: 2,
  },
  profileContent: {
    paddingVertical: 20,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  usernameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  username: {
    fontWeight: "600",
  },
  email: {
    opacity: 0.7,
    marginTop: 4,
  },
  statsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontWeight: "700",
  },
  statLabel: {
    opacity: 0.7,
    marginTop: 4,
  },
  calendarCard: {
    marginBottom: 16,
    elevation: 2,
  },
  calendarSubtitle: {
    opacity: 0.7,
    marginBottom: 12,
  },
  calendarContainer: {
    flexDirection: "row",
  },
  dayLabelsColumn: {
    width: 40,
    justifyContent: "space-between",
    paddingRight: 8,
  },
  dayLabelContainer: {
    height: 20,
    justifyContent: "center",
  },
  dayLabel: {
    textAlign: "right",
    opacity: 0.7,
  },
  calendarScroll: {
    marginBottom: 16,
  },
  calendarGrid: {
    flexDirection: "column",
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  daySquare: {
    width: 16,
    height: 16,
    borderRadius: 2,
    marginRight: 4,
  },
  daySquareInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  daySquareActive: {
    backgroundColor: "#d0bcff",
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendSquare: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 6,
  },
  legendText: {
    opacity: 0.7,
  },
  logoutButton: {
    marginBottom: 32,
  },
});
