import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Card,
  ActivityIndicator,
  useTheme,
  Menu,
  Divider,
  RadioButton,
} from "react-native-paper";
import { Redirect, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { getUserWorkoutNotes, WorkoutNoteWithId } from "@/config/firestore";
import { LineChart } from "react-native-chart-kit";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

type ChartType = "weight" | "reps" | "oneRepMax";

interface ExerciseData {
  date: Date;
  weight: number;
  reps: number;
  oneRepMax: number;
}

export default function StatsScreen() {
  const { user, loading } = useAuth();
  const theme = useTheme();
  const [notes, setNotes] = useState<WorkoutNoteWithId[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [exerciseNames, setExerciseNames] = useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [chartType, setChartType] = useState<ChartType>("weight");
  const [exerciseMenuVisible, setExerciseMenuVisible] = useState(false);

  // Load notes when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadData();
      }
    }, [user])
  );

  // Redirect to login if not authenticated (after hooks to keep hook order stable)
  if (!loading && !user) {
    return <Redirect href="/(auth)/login" />;
  }

  const loadData = async () => {
    try {
      if (user) {
        const userNotes = await getUserWorkoutNotes(user.uid);
        setNotes(userNotes);

        // Get all unique exercise names from notes
        const uniqueExercises = new Set<string>();
        userNotes.forEach((note) => {
          note.exercises.forEach((exercise) => {
            uniqueExercises.add(exercise.name);
          });
        });

        const exerciseList = Array.from(uniqueExercises).sort((a, b) =>
          a.toLowerCase().localeCompare(b.toLowerCase())
        );
        setExerciseNames(exerciseList);

        // Set first exercise as default if available
        if (exerciseList.length > 0 && !selectedExercise) {
          setSelectedExercise(exerciseList[0]);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoadingNotes(false);
    }
  };

  const getExerciseData = (): ExerciseData[] => {
    if (!selectedExercise) return [];

    const dataByDate = new Map<string, ExerciseData[]>();

    notes.forEach((note) => {
      note.exercises.forEach((exercise) => {
        if (exercise.name === selectedExercise) {
          const weight = parseFloat(exercise.weight) || 0;
          const reps = parseInt(exercise.reps) || 0;
          const oneRepMax = weight * (1 + 0.0333 * reps);

          // Group by date
          const dateKey = note.date.toDateString();
          if (!dataByDate.has(dateKey)) {
            dataByDate.set(dateKey, []);
          }
          dataByDate.get(dateKey)!.push({
            date: note.date,
            weight,
            reps,
            oneRepMax,
          });
        }
      });
    });

    // For each day, select the best result based on chart type
    const bestDataPerDay: ExerciseData[] = [];
    dataByDate.forEach((dayData) => {
      let best = dayData[0];

      // Find the best entry for this day
      dayData.forEach((entry) => {
        if (entry.weight > best.weight) {
          best = entry;
        } else if (entry.weight === best.weight && entry.reps > best.reps) {
          best = entry;
        } else if (entry.oneRepMax > best.oneRepMax) {
          best = entry;
        }
      });

      bestDataPerDay.push(best);
    });

    return bestDataPerDay.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const getChartData = () => {
    const exerciseData = getExerciseData();

    if (exerciseData.length === 0) {
      return {
        labels: ["No data"],
        datasets: [{ data: [0] }],
      };
    }

    const labels = exerciseData.map((item) =>
      item.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    );
    const values = exerciseData.map((item) =>
      chartType === "weight"
        ? item.weight
        : chartType === "reps"
        ? item.reps
        : item.oneRepMax
    );

    return {
      labels,
      datasets: [{ data: values }],
    };
  };

  const getMaxWeight = () => {
    const data = getExerciseData();
    if (data.length === 0) return { weight: 0, reps: 0 };

    const max = data.reduce((prev, current) =>
      prev.weight > current.weight ? prev : current
    );
    return { weight: max.weight, reps: max.reps };
  };

  const getMaxReps = () => {
    const data = getExerciseData();
    if (data.length === 0) return { weight: 0, reps: 0 };

    const max = data.reduce((prev, current) =>
      prev.reps > current.reps ? prev : current
    );
    return { weight: max.weight, reps: max.reps };
  };

  const getSumOfReps = () => {
    const data = getExerciseData();
    return data.reduce((sum, item) => sum + item.reps, 0);
  };

  const getSumOfWeight = () => {
    const data = getExerciseData();
    return data.reduce((sum, item) => sum + item.weight, 0);
  };

  if (loadingNotes) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const maxWeight = getMaxWeight();
  const maxReps = getMaxReps();
  const sumOfReps = getSumOfReps();
  const sumOfWeight = getSumOfWeight();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Text variant="headlineMedium" style={styles.headerText}>
            Statistics
          </Text>
        </View>

        {exerciseNames.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No exercise data available. Add workout notes to see statistics!
            </Text>
          </View>
        ) : (
          <>
            {/* Exercise Selector */}
            <View style={styles.selectorContainer}>
              <Menu
                visible={exerciseMenuVisible}
                onDismiss={() => setExerciseMenuVisible(false)}
                anchorPosition="bottom"
                anchor={
                  <TouchableOpacity
                    style={[
                      styles.dropdownButton,
                      { borderColor: theme.colors.outline },
                    ]}
                    onPress={() => setExerciseMenuVisible(true)}
                  >
                    <Text variant="bodyLarge" style={styles.dropdownText}>
                      {selectedExercise || "Select Exercise"}
                    </Text>
                    <Text variant="bodyLarge" style={styles.dropdownIcon}>
                      ▼
                    </Text>
                  </TouchableOpacity>
                }
                contentStyle={{
                  backgroundColor: theme.colors.surface,
                  maxHeight: 300,
                }}
              >
                {exerciseNames.map((exercise, index) => (
                  <React.Fragment key={exercise}>
                    <Menu.Item
                      onPress={() => {
                        setSelectedExercise(exercise);
                        setExerciseMenuVisible(false);
                      }}
                      title={exercise}
                      titleStyle={{
                        color:
                          selectedExercise === exercise
                            ? theme.colors.primary
                            : theme.colors.onSurface,
                      }}
                    />
                    {index < exerciseNames.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </Menu>
            </View>

            {/* Chart */}
            {selectedExercise && getExerciseData().length > 0 && (
              <Card style={styles.chartCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.chartTitle}>
                    {chartType === "weight"
                      ? "Weight"
                      : chartType === "reps"
                      ? "Reps"
                      : "1RM"}{" "}
                    Over Time
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <LineChart
                      data={getChartData()}
                      width={Math.max(
                        Dimensions.get("window").width - 64,
                        getExerciseData().length * 80
                      )}
                      height={220}
                      chartConfig={{
                        backgroundColor: theme.colors.surface,
                        backgroundGradientFrom: theme.colors.surface,
                        backgroundGradientTo: theme.colors.surface,
                        decimalPlaces: chartType === "reps" ? 0 : 1,
                        color: (opacity = 1) =>
                          `rgba(${parseInt(
                            theme.colors.primary.slice(1, 3),
                            16
                          )}, ${parseInt(
                            theme.colors.primary.slice(3, 5),
                            16
                          )}, ${parseInt(
                            theme.colors.primary.slice(5, 7),
                            16
                          )}, ${opacity})`,
                        labelColor: (opacity = 1) =>
                          `rgba(255, 255, 255, ${opacity})`,
                        style: {
                          borderRadius: 16,
                        },
                        propsForDots: {
                          r: "6",
                          strokeWidth: "2",
                          stroke: theme.colors.primary,
                        },
                      }}
                      bezier
                      style={styles.chart}
                    />
                  </ScrollView>

                  {/* Radio Buttons */}
                  <View style={styles.chartTypeSelector}>
                    <TouchableOpacity
                      style={styles.radioButtonContainer}
                      onPress={() => setChartType("weight")}
                    >
                      <RadioButton
                        value="weight"
                        status={
                          chartType === "weight" ? "checked" : "unchecked"
                        }
                        onPress={() => setChartType("weight")}
                        color={theme.colors.primary}
                      />
                      <MaterialCommunityIcons
                        name="weight-kilogram"
                        size={24}
                        color={
                          chartType === "weight"
                            ? theme.colors.primary
                            : theme.colors.onSurfaceDisabled
                        }
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.radioButtonContainer}
                      onPress={() => setChartType("reps")}
                    >
                      <RadioButton
                        value="reps"
                        status={chartType === "reps" ? "checked" : "unchecked"}
                        onPress={() => setChartType("reps")}
                        color={theme.colors.primary}
                      />
                      <MaterialCommunityIcons
                        name="arm-flex"
                        size={24}
                        color={
                          chartType === "reps"
                            ? theme.colors.primary
                            : theme.colors.onSurfaceDisabled
                        }
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.radioButtonContainer}
                      onPress={() => setChartType("oneRepMax")}
                    >
                      <RadioButton
                        value="oneRepMax"
                        status={
                          chartType === "oneRepMax" ? "checked" : "unchecked"
                        }
                        onPress={() => setChartType("oneRepMax")}
                        color={theme.colors.primary}
                      />
                      <MaterialCommunityIcons
                        name="trophy"
                        size={24}
                        color={
                          chartType === "oneRepMax"
                            ? theme.colors.primary
                            : theme.colors.onSurfaceDisabled
                        }
                      />
                    </TouchableOpacity>
                  </View>
                </Card.Content>
              </Card>
            )}

            {/* Statistics Cards */}
            <View style={styles.statsGrid}>
              <Card style={styles.statCard}>
                <Card.Content>
                  <Text variant="titleSmall" style={styles.statLabel}>
                    Max Weight
                  </Text>
                  <Text variant="headlineSmall" style={styles.statValue}>
                    {maxWeight.weight} kg
                  </Text>
                  <Text variant="bodySmall" style={styles.statSubtext}>
                    {maxWeight.reps} reps
                  </Text>
                </Card.Content>
              </Card>

              <Card style={styles.statCard}>
                <Card.Content>
                  <Text variant="titleSmall" style={styles.statLabel}>
                    Max Reps
                  </Text>
                  <Text variant="headlineSmall" style={styles.statValue}>
                    {maxReps.reps}
                  </Text>
                  <Text variant="bodySmall" style={styles.statSubtext}>
                    at {maxReps.weight} kg
                  </Text>
                </Card.Content>
              </Card>

              <Card style={styles.statCard}>
                <Card.Content>
                  <Text variant="titleSmall" style={styles.statLabel}>
                    Sum of Reps
                  </Text>
                  <Text variant="headlineSmall" style={styles.statValue}>
                    {sumOfReps}
                  </Text>
                </Card.Content>
              </Card>

              <Card style={styles.statCard}>
                <Card.Content>
                  <Text variant="titleSmall" style={styles.statLabel}>
                    Sum of Weight
                  </Text>
                  <Text variant="headlineSmall" style={styles.statValue}>
                    {sumOfWeight.toFixed(1)} kg
                  </Text>
                </Card.Content>
              </Card>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1c1b1f",
  },
  content: {
    flex: 1,
    paddingTop: 28,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: "flex-start",
  },
  headerText: {
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.7,
  },
  selectorContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  dropdownText: {
    flex: 1,
  },
  dropdownIcon: {
    fontSize: 12,
    opacity: 0.7,
  },
  chartCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    elevation: 2,
  },
  chartTitle: {
    fontWeight: "600",
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
  },
  chartTypeSelector: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    gap: 24,
  },
  radioButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  statCard: {
    width: "48%",
    elevation: 2,
  },
  statLabel: {
    opacity: 0.7,
    marginBottom: 8,
  },
  statValue: {
    fontWeight: "700",
    marginBottom: 4,
  },
  statSubtext: {
    opacity: 0.6,
  },
});
