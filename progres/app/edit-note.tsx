import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  FlatList,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  TextInput as PaperTextInput,
  Button,
  Card,
  IconButton,
  useTheme,
  ActivityIndicator,
  Portal,
  Dialog,
  Paragraph,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { DatePickerModal } from "react-native-paper-dates";
import {
  getExerciseNames,
  addCustomExerciseName,
  updateWorkoutNote,
  getUserWorkoutNotes,
} from "../config/firestore";
import { useAuth } from "../contexts/AuthContext";

interface Exercise {
  id: string;
  name: string;
  weight: string;
  reps: string;
}

export default function EditNoteScreen() {
  const params = useLocalSearchParams();
  const noteId = params.noteId as string;

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExercise, setCurrentExercise] = useState({
    name: "",
    weight: "",
    reps: "",
  });
  const [exerciseNames, setExerciseNames] = useState<string[]>([]);
  const [filteredExerciseNames, setFilteredExerciseNames] = useState<string[]>(
    []
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");

  const router = useRouter();
  const theme = useTheme();
  const { user } = useAuth();

  const showDialog = (message: string) => {
    setDialogMessage(message);
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
  };

  useEffect(() => {
    loadExerciseNames();
    loadNoteData();
  }, []);

  const loadExerciseNames = async () => {
    const names = await getExerciseNames(user?.uid);
    setExerciseNames(names);
  };

  const loadNoteData = async () => {
    if (!user?.uid || !noteId) {
      router.back();
      return;
    }

    try {
      const notes = await getUserWorkoutNotes(user.uid);
      const note = notes.find((n) => n.id === noteId);

      if (note) {
        setTitle(note.title);
        setDate(note.date);
        setExercises(
          note.exercises.map((ex, index) => ({
            id: `${Date.now()}-${index}`,
            ...ex,
          }))
        );
      } else {
        showDialog("Note not found");
        router.back();
      }
    } catch (error) {
      console.error("Error loading note:", error);
      showDialog("Failed to load note");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleExerciseNameChange = (text: string) => {
    setCurrentExercise({ ...currentExercise, name: text });

    if (text.trim().length > 0) {
      const filtered = exerciseNames
        .filter((name) => name.toLowerCase().includes(text.toLowerCase()))
        .slice(0, 5);
      setFilteredExerciseNames(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredExerciseNames([]);
      setShowSuggestions(false);
    }
  };

  const selectExerciseName = (name: string) => {
    setCurrentExercise({ ...currentExercise, name });
    setShowSuggestions(false);
  };

  const onDismissDatePicker = () => {
    setDatePickerVisible(false);
  };

  const onConfirmDate = (params: { date: Date | undefined }) => {
    setDatePickerVisible(false);
    if (params.date) {
      setDate(params.date);
    }
  };

  const addExercise = async () => {
    if (
      currentExercise.name &&
      currentExercise.weight &&
      currentExercise.reps
    ) {
      const exerciseName = currentExercise.name.trim();

      const isExistingName = exerciseNames.some(
        (name) => name.toLowerCase() === exerciseName.toLowerCase()
      );

      if (!isExistingName && user?.uid) {
        try {
          await addCustomExerciseName(user.uid, exerciseName);
          await loadExerciseNames();
        } catch (error) {
          console.error("Error saving custom exercise name:", error);
        }
      }

      const newExercise: Exercise = {
        id: Date.now().toString(),
        ...currentExercise,
      };
      setExercises([...exercises, newExercise]);
      setCurrentExercise({ name: "", weight: "", reps: "" });
    }
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter((ex) => ex.id !== id));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleUpdate = async () => {
    if (!title.trim()) {
      showDialog("Please enter a title for your workout note");
      return;
    }

    if (exercises.length === 0) {
      showDialog("Please add at least one exercise");
      return;
    }

    if (!noteId) {
      showDialog("Note ID not found");
      return;
    }

    try {
      const exercisesToSave = exercises.map(({ id, ...exercise }) => exercise);

      const noteData = {
        title: title.trim(),
        date,
        exercises: exercisesToSave,
      };

      await updateWorkoutNote(noteId, noteData);

      router.back();
    } catch (error) {
      console.error("Error updating note:", error);
      showDialog("Failed to update workout note. Please try again.");
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <Card style={styles.formCard}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.headerContainer}>
                  <Text variant="headlineMedium" style={styles.headerText}>
                    Edit Workout Note
                  </Text>
                </View>

                {/* Title Input */}
                <PaperTextInput
                  mode="outlined"
                  label="Title"
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter note title"
                  style={styles.input}
                />

                {/* Date Picker */}
                <PaperTextInput
                  mode="outlined"
                  label="Date"
                  value={formatDate(date)}
                  editable={false}
                  right={
                    <PaperTextInput.Icon
                      icon="calendar"
                      onPress={() => setDatePickerVisible(true)}
                    />
                  }
                  style={styles.input}
                  onPress={() => setDatePickerVisible(true)}
                />

                {/* Exercise Input Section */}
                <View style={styles.exerciseInputContainer}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Add Exercise
                  </Text>

                  <View style={styles.autocompleteContainer}>
                    <PaperTextInput
                      mode="outlined"
                      label="Exercise Name"
                      value={currentExercise.name}
                      onChangeText={handleExerciseNameChange}
                      placeholder="e.g. Bench Press"
                      style={styles.input}
                      onFocus={() => {
                        if (
                          currentExercise.name.trim().length > 0 &&
                          filteredExerciseNames.length > 0
                        ) {
                          setShowSuggestions(true);
                        }
                      }}
                    />

                    {showSuggestions && filteredExerciseNames.length > 0 && (
                      <Card style={styles.suggestionsCard} mode="elevated">
                        <FlatList
                          data={filteredExerciseNames}
                          keyExtractor={(item, index) => `${item}-${index}`}
                          style={styles.suggestionsList}
                          keyboardShouldPersistTaps="handled"
                          showsVerticalScrollIndicator={false}
                          renderItem={({ item }) => (
                            <TouchableOpacity
                              onPress={() => selectExerciseName(item)}
                              style={styles.suggestionItem}
                            >
                              <Text
                                variant="bodyMedium"
                                style={styles.suggestionText}
                              >
                                {item}
                              </Text>
                            </TouchableOpacity>
                          )}
                        />
                      </Card>
                    )}
                  </View>

                  <View style={styles.exerciseRow}>
                    <PaperTextInput
                      mode="outlined"
                      label="Weight (kg)"
                      value={currentExercise.weight}
                      onChangeText={(text) =>
                        setCurrentExercise({ ...currentExercise, weight: text })
                      }
                      placeholder="0"
                      keyboardType="numeric"
                      style={[styles.input, styles.exerciseInput]}
                    />

                    <PaperTextInput
                      mode="outlined"
                      label="Reps"
                      value={currentExercise.reps}
                      onChangeText={(text) =>
                        setCurrentExercise({ ...currentExercise, reps: text })
                      }
                      placeholder="0"
                      keyboardType="numeric"
                      style={[styles.input, styles.exerciseInput]}
                    />

                    <IconButton
                      icon="plus-circle"
                      size={32}
                      iconColor={theme.colors.primary}
                      onPress={addExercise}
                      style={styles.addButton}
                    />
                  </View>
                </View>

                {/* Exercises List */}
                <View style={styles.exercisesListContainer}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Exercises
                  </Text>
                  <ScrollView
                    style={styles.exercisesScrollView}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                  >
                    {exercises.length > 0 ? (
                      exercises.map((exercise) => (
                        <Card
                          key={exercise.id}
                          style={styles.exerciseCard}
                          mode="outlined"
                        >
                          <Card.Content style={styles.exerciseCardContent}>
                            <View style={styles.exerciseInfo}>
                              <Text
                                variant="titleSmall"
                                style={styles.exerciseName}
                              >
                                {exercise.name}
                              </Text>
                              <Text
                                variant="bodyMedium"
                                style={styles.exerciseDetails}
                              >
                                {exercise.weight} kg × {exercise.reps} reps
                              </Text>
                            </View>
                            <IconButton
                              icon="delete"
                              size={20}
                              iconColor={theme.colors.error}
                              onPress={() => removeExercise(exercise.id)}
                            />
                          </Card.Content>
                        </Card>
                      ))
                    ) : (
                      <View style={styles.emptyExercisesPlaceholder} />
                    )}
                  </ScrollView>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                  <Button
                    mode="outlined"
                    onPress={handleCancel}
                    style={styles.cancelButton}
                    contentStyle={styles.buttonContent}
                  >
                    Cancel
                  </Button>

                  <Button
                    mode="contained"
                    onPress={handleUpdate}
                    style={styles.saveButton}
                    contentStyle={styles.buttonContent}
                  >
                    Update
                  </Button>
                </View>
              </Card.Content>
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      <DatePickerModal
        locale="en"
        mode="single"
        visible={datePickerVisible}
        onDismiss={onDismissDatePicker}
        date={date}
        onConfirm={onConfirmDate}
        label="Select Date"
        saveLabel="Select"
        animationType="slide"
      />

      {/* Error Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={hideDialog}>
          <Dialog.Title>Error</Dialog.Title>
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
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 16,
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
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  input: {
    marginBottom: 10,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: "600",
  },
  exerciseInputContainer: {
    marginTop: 4,
    marginBottom: 16,
    zIndex: 9999,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 1,
  },
  exerciseInput: {
    flex: 1,
  },
  addButton: {
    marginTop: -8,
  },
  exercisesListContainer: {
    marginBottom: 16,
    zIndex: 1,
    height: 230,
  },
  exercisesScrollView: {
    flex: 1,
    borderRadius: 8,
  },
  emptyExercisesPlaceholder: {
    flex: 1,
  },
  exerciseCard: {
    marginBottom: 6,
  },
  exerciseCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontWeight: "600",
    marginBottom: 2,
  },
  exerciseDetails: {
    color: "#666",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  autocompleteContainer: {
    position: "relative",
    zIndex: 9999,
  },
  suggestionsCard: {
    position: "absolute",
    top: 58,
    left: 0,
    right: 0,
    maxHeight: 140,
    zIndex: 10000,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  suggestionsList: {
    maxHeight: 140,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    backgroundColor: "#2d2d2d",
  },
  suggestionText: {
    color: "#fff",
  },
});
