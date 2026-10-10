import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@rneui/themed";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getNote, saveNote } from "../db/database";
import { createThemedStyles, useAppColors } from "../theme/theme";

const MINIMUM_SAVING_DURATION = 1000;

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export default function NotesScreen({ navigation, route }) {
  const { eventId, eventTitle } = route.params;
  const [note, setNote] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const timer = useRef(null);
  const pendingNote = useRef(null);
  const hasUserEdited = useRef(false);
  const saveVersion = useRef(0);
  const mounted = useRef(true);
  const colors = useAppColors();
  const styles = useStyles();

  useEffect(() => {
    getNote(eventId)
      .then((stored) => {
        const storedNote = stored?.body || "";
        hasUserEdited.current = false;
        setNote(storedNote);
      })
      .finally(() => setLoaded(true));
  }, [eventId]);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded || !hasUserEdited.current) return;

    const currentVersion = saveVersion.current + 1;
    saveVersion.current = currentVersion;
    pendingNote.current = note;
    setSaveStatus("pending");

    timer.current = setTimeout(() => {
      pendingNote.current = null;
      setSaveStatus("saving");

      async function persistNote() {
        const minimumDuration = wait(MINIMUM_SAVING_DURATION);
        try {
          await saveNote(eventId, note);
          await minimumDuration;
          if (mounted.current && saveVersion.current === currentVersion) {
            setSaveStatus("saved");
          }
        } catch {
          await minimumDuration;
          if (mounted.current && saveVersion.current === currentVersion) {
            setSaveStatus("error");
          }
        }
      }

      persistNote();
    }, 700);

    return () => clearTimeout(timer.current);
  }, [eventId, loaded, note]);

  function handleNoteChange(nextNote) {
    hasUserEdited.current = true;
    setNote(nextNote);
  }

  // Save any typing that is still waiting when the user leaves the screen.
  useEffect(() => {
    return () => {
      if (pendingNote.current !== null) {
        saveNote(eventId, pendingNote.current).catch(() => {});
      }
    };
  }, [eventId]);

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons
              color={colors.blue}
              name="arrow-left"
              size={25}
            />
          </Pressable>
          <Text style={styles.headerTitle}>Private note</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.content}>
          <Text style={styles.eyebrow}>NOTE FOR</Text>
          <Text h3 h3Style={styles.eventTitle}>
            {eventTitle}
          </Text>
          <Text style={styles.helper}>Only you can see this note.</Text>

          <TextInput
            multiline
            onChangeText={handleNoteChange}
            placeholder="What do you want to remember about this event?"
            placeholderTextColor={colors.placeholder}
            style={styles.input}
            textAlignVertical="top"
            value={note}
          />
          <View style={styles.noteMeta}>
            <Text
              accessibilityLiveRegion="polite"
              style={[
                styles.saveStatus,
                saveStatus === "error" && styles.saveError,
              ]}
            >
              {saveStatus === "saving" && "Saving…"}
              {saveStatus === "saved" && "Saved"}
              {saveStatus === "error" && "Could not save changes."}
            </Text>
            <Text style={styles.characterCount}>{note.length} characters</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = createThemedStyles((colors) => ({
  safeArea: { backgroundColor: colors.cream, flex: 1 },
  flex: { flex: 1 },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  backButton: {
    alignItems: "center",
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  headerTitle: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  content: { flex: 1, paddingHorizontal: 22, paddingTop: 28 },
  eyebrow: {
    color: colors.blueLight,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  eventTitle: {
    color: colors.blue,
    fontSize: 25,
    fontWeight: "900",
    lineHeight: 30,
    marginTop: 6,
  },
  helper: { color: colors.muted, marginTop: 8 },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.ink,
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 22,
    maxHeight: 330,
    minHeight: 180,
    padding: 16,
  },
  noteMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  saveStatus: { color: colors.muted, fontSize: 12 },
  saveError: { color: colors.danger },
  characterCount: { color: colors.muted, fontSize: 12 },
}));
