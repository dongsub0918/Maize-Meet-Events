import React from 'react';
import { View } from 'react-native';
import { Text } from '@rneui/themed';
import { createThemedStyles } from '../theme/theme';

export default function CapacityBadge({ capacity, registeredCount = 0 }) {
  const styles = useStyles();
  const label = capacity === null ? 'Drop-in event' : `${registeredCount} / ${capacity}`;

  return (
    <View style={styles.badge}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.badgeBackground,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  label: { color: colors.badgeText, fontSize: 12, fontWeight: '700' },
}));
