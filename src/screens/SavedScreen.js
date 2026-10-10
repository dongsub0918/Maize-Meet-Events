import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@rneui/themed';
import EventCard from '../components/EventCard';
import EmptyState from '../components/EmptyState';
import LoadingOverlay from '../components/LoadingOverlay';
import { getSavedEvents } from '../db/database';
import { useAppContext } from '../context/AppContext';
import { createThemedStyles } from '../theme/theme';

const SAVED_SORT_PREFERENCES_KEY = '@maize-meet/saved-sort-preferences';

export default function SavedScreen({ navigation }) {
  const { savedEventIds, toggleSaved } = useAppContext();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateAscending, setDateAscending] = useState(true);
  const [titleAscending, setTitleAscending] = useState(true);
  const [primarySort, setPrimarySort] = useState('date');
  const [sortPreferencesLoaded, setSortPreferencesLoaded] = useState(false);
  const styles = useStyles();

  useEffect(() => {
    let cancelled = false;

    async function loadSortPreferences() {
      try {
        const storedPreferences = await AsyncStorage.getItem(SAVED_SORT_PREFERENCES_KEY);
        if (!storedPreferences || cancelled) return;

        const preferences = JSON.parse(storedPreferences);
        if (typeof preferences.dateAscending === 'boolean') {
          setDateAscending(preferences.dateAscending);
        }
        if (typeof preferences.titleAscending === 'boolean') {
          setTitleAscending(preferences.titleAscending);
        }
        if (preferences.primarySort === 'date' || preferences.primarySort === 'title') {
          setPrimarySort(preferences.primarySort);
        }
      } catch {
        // Keep the documented defaults if saved preferences cannot be read.
      } finally {
        if (!cancelled) setSortPreferencesLoaded(true);
      }
    }

    loadSortPreferences();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sortPreferencesLoaded) return;

    AsyncStorage.setItem(
      SAVED_SORT_PREFERENCES_KEY,
      JSON.stringify({ dateAscending, primarySort, titleAscending })
    ).catch(() => {
      // The controls should continue to work for this session if persistence fails.
    });
  }, [dateAscending, primarySort, sortPreferencesLoaded, titleAscending]);

  // [Modified] QA-02: Reloads the saved list whenever savedEventIds changes. Before,
  // it loaded only once when the tab first opened, so later saves and unsaves never showed up
  // and the list contained outdated entries.
  useEffect(() => {
    let cancelled = false;
    getSavedEvents()
      .then((rows) => {
        if (!cancelled) setEvents(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [savedEventIds]);

  // Builds a separate saved-events list so changing its order never mutates the events array
  // shared with Discover. The selected criterion is primary and the other breaks ties.
  const displayedEvents = Array.from(
    new Map(
      events
        .filter((event) => savedEventIds.includes(event.id))
        .map((event) => [event.id, event])
    ).values()
  ).sort((left, right) => {
    const rawDateComparison = new Date(left.startsAt) - new Date(right.startsAt);
    const dateComparison = dateAscending ? rawDateComparison : -rawDateComparison;
    const rawTitleComparison = left.title.localeCompare(right.title, undefined, {
      sensitivity: 'base',
    });
    const titleComparison = titleAscending ? rawTitleComparison : -rawTitleComparison;

    return primarySort === 'date'
      ? dateComparison || titleComparison
      : titleComparison || dateComparison;
  });

  function handleDateSort() {
    if (primarySort === 'date') {
      setDateAscending((current) => !current);
    } else {
      setPrimarySort('date');
    }
  }

  function handleTitleSort() {
    if (primarySort === 'title') {
      setTitleAscending((current) => !current);
    } else {
      setPrimarySort('title');
    }
  }

  if (loading || !sortPreferencesLoaded) {
    return <LoadingOverlay label="Loading saved events..." />;
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <Text h2 h2Style={styles.heading}>Saved events</Text>
        <Text style={styles.subheading}>Keep the good ones close.</Text>
        <Text style={styles.sortLabel}>Sort saved events</Text>
        <View style={styles.sortControls}>
          <Pressable
            accessibilityLabel={`Date order: ${dateAscending ? 'soonest first' : 'latest first'}`}
            accessibilityHint={
              primarySort === 'date'
                ? 'Toggles the saved events date order'
                : 'Makes date the primary sort order'
            }
            accessibilityRole="button"
            accessibilityState={{ selected: primarySort === 'date' }}
            onPress={handleDateSort}
            style={({ pressed }) => [
              styles.sortButton,
              primarySort === 'date' && styles.sortButtonSelected,
              pressed && styles.sortButtonPressed,
            ]}
          >
            <Text
              style={[
                styles.sortButtonText,
                primarySort === 'date' && styles.sortButtonTextSelected,
              ]}
            >
              Date: {dateAscending ? 'Soonest first' : 'Latest first'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel={`Title order: ${titleAscending ? 'A to Z' : 'Z to A'}`}
            accessibilityHint={
              primarySort === 'title'
                ? 'Toggles the saved events title order'
                : 'Makes title the primary sort order'
            }
            accessibilityRole="button"
            accessibilityState={{ selected: primarySort === 'title' }}
            onPress={handleTitleSort}
            style={({ pressed }) => [
              styles.sortButton,
              primarySort === 'title' && styles.sortButtonSelected,
              pressed && styles.sortButtonPressed,
            ]}
          >
            <Text
              style={[
                styles.sortButtonText,
                primarySort === 'title' && styles.sortButtonTextSelected,
              ]}
            >
              Title: {titleAscending ? 'A–Z' : 'Z–A'}
            </Text>
          </Pressable>
        </View>
      </View>
      <FlatList
        contentContainerStyle={displayedEvents.length ? styles.list : styles.emptyList}
        data={displayedEvents}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        // [Modified] QA-02: Keyed by event id. Each event now appears once, so the
        // id is a stable, unique key.
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <EmptyState
            message="Tap the heart on an event to keep it here."
            title="Nothing saved yet"
          />
        }
        renderItem={({ item }) => (
          <EventCard
            event={item}
            // [Modified] QA-02: The heart reads the live saved state from context.
            saved={savedEventIds.includes(item.id)}
            onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}
            onToggleSaved={toggleSaved}
          />
        )}
      />
    </SafeAreaView>
  );
}

const useStyles = createThemedStyles((colors) => ({
  safeArea: { backgroundColor: colors.cream, flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16 },
  heading: { color: colors.blue, fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },
  subheading: { color: colors.muted, marginTop: 3 },
  sortLabel: { color: colors.ink, fontSize: 13, fontWeight: '800', marginTop: 18 },
  sortControls: { flexDirection: 'row', gap: 8, marginTop: 8 },
  sortButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  sortButtonSelected: { backgroundColor: colors.blue, borderColor: colors.blue },
  sortButtonPressed: { opacity: 0.65 },
  sortButtonText: { color: colors.blue, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  sortButtonTextSelected: { color: colors.onAccent },
  list: { paddingBottom: 28, paddingHorizontal: 20, paddingTop: 18 },
  emptyList: { flexGrow: 1 },
  separator: { height: 12 },
}));
