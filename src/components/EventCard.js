import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Card, Text } from '@rneui/themed';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatEventDate, formatEventTime } from '../utils/date';
import { colors } from '../theme/theme';

// [Modified] QA-02: The card used to copy `initiallySaved` into its own local state.
// That copy went stale when the event was saved or unsaved somewhere else (the details screen,
// another tab), so the heart could show the wrong value. The card now takes a `saved` prop and
// renders it directly. The value comes from AppContext's savedEventIds, so every heart for an
// event shows the same thing.
export default function EventCard({ event, saved, onPress, onToggleSaved }) {
  // [Modified] QA-02: Asks the context to toggle this event. The context updates
  // the heart immediately and ignores extra taps while the save is in progress.
  function handleSavedPress() {
    onToggleSaved(event.id);
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <Card containerStyle={styles.card}>
        <View style={styles.topRow}>
          <Text style={styles.category}>{event.category.toUpperCase()}</Text>
          {/* [Modified] QA-02: Larger hitSlop so taps near the heart register, plus
              accessibility state so screen readers announce whether the event is saved. */}
          <Pressable
            accessibilityLabel={saved ? 'Remove from saved events' : 'Save event'}
            accessibilityRole="button"
            accessibilityState={{ selected: saved }}
            hitSlop={10}
            onPress={handleSavedPress}
            style={styles.heartButton}
          >
            <MaterialCommunityIcons
              color={saved ? '#C6253D' : colors.muted}
              name={saved ? 'heart' : 'heart-outline'}
              size={22}
            />
          </Pressable>
        </View>
        <Text h4 h4Style={styles.title} numberOfLines={1}>
          {event.title}
        </Text>
        <Text style={styles.date}>{formatEventDate(event.startsAt)}</Text>
        <Text numberOfLines={1} style={styles.meta}>
          {formatEventTime(event.startsAt, event.endsAt)} · {event.location}
        </Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    elevation: 1,
    height: 174,
    padding: 18,
    shadowColor: '#102B44',
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  pressed: { opacity: 0.78 },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  category: { color: colors.blueLight, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  heartButton: { alignItems: 'center', height: 28, justifyContent: 'center', width: 28 },
  title: { color: colors.ink, fontSize: 20, fontWeight: '800', marginTop: 2 },
  date: { color: colors.blue, fontSize: 14, fontWeight: '700', marginTop: 8 },
  meta: { color: colors.muted, fontSize: 13, marginTop: 3 },
});
