import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import {
  Text,
  Card,
  FAB,
  ActivityIndicator,
  Portal,
  Dialog,
  Paragraph,
  Button,
  IconButton,
  useTheme,
} from "react-native-paper";
import { useRouter, Redirect, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserWorkoutNotes,
  deleteWorkoutNote,
  WorkoutNoteWithId,
} from "@/config/firestore";

export default function NotesScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const [notes, setNotes] = useState<WorkoutNoteWithId[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadNotes();
      }
    }, [user])
  );

  if (!loading && !user) {
    return <Redirect href="/(auth)/login" />;
  }

  const loadNotes = async () => {
    try {
      if (user) {
        const userNotes = await getUserWorkoutNotes(user.uid);
        setNotes(userNotes);
      }
    } catch (error) {
      console.error("Error loading notes:", error);
      showDialog("Failed to load notes. Please try again.");
    } finally {
      setLoadingNotes(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotes();
  };

  const showDialog = (message: string) => {
    setDialogMessage(message);
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
  };

  const showDeleteDialog = (noteId: string) => {
    setNoteToDelete(noteId);
    setDeleteDialogVisible(true);
  };

  const hideDeleteDialog = () => {
    setDeleteDialogVisible(false);
    setNoteToDelete(null);
  };

  const handleDeleteNote = async () => {
    if (!noteToDelete || !user) return;

    try {
      await deleteWorkoutNote(user.uid, noteToDelete);
      // Remove note from local state
      setNotes(notes.filter((note) => note.id !== noteToDelete));
      hideDeleteDialog();
    } catch (error) {
      console.error("Error deleting note:", error);
      hideDeleteDialog();
      showDialog("Failed to delete note. Please try again.");
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderNoteItem = ({ item }: { item: WorkoutNoteWithId }) => (
    <Card style={styles.noteCard}>
      <Card.Content style={styles.noteCardContent}>
        <TouchableOpacity style={styles.noteInfo}>
          <View>
            <Text variant="titleMedium" style={styles.noteTitle}>
              {item.title}
            </Text>
            <Text variant="bodyMedium" style={styles.noteDate}>
              {formatDate(item.date)}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.actionsContainer}>
          <IconButton
            icon="pencil"
            size={24}
            onPress={() => router.push(`/edit-note?noteId=${item.id}`)}
            iconColor={theme.colors.primary}
          />
          <IconButton
            icon="delete"
            size={24}
            onPress={() => showDeleteDialog(item.id)}
            iconColor="#ef5350"
          />
        </View>
      </Card.Content>
    </Card>
  );

  if (loadingNotes) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text variant="headlineMedium" style={styles.headerText}>
            Notebook
          </Text>
        </View>

        {/* Notes List */}
        {notes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No notes yet. Add your first workout note!
            </Text>
          </View>
        ) : (
          <FlatList
            data={notes}
            renderItem={renderNoteItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </View>

      {/* Add Note Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push("/add-note")}
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

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={hideDeleteDialog}>
          <Dialog.Title>Delete Note</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Are you sure you want to delete this note?</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDeleteDialog}>Cancel</Button>
            <Button onPress={handleDeleteNote} textColor="#ef5350">
              Delete
            </Button>
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  noteCard: {
    marginBottom: 12,
    elevation: 2,
  },
  noteCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  noteInfo: {
    flex: 1,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  noteTitle: {
    fontWeight: "600",
    marginBottom: 4,
  },
  noteDate: {
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.7,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
