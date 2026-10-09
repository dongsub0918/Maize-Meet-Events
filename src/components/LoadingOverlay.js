import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Text } from '@rneui/themed';
import { createThemedStyles, useAppColors } from '../theme/theme';

export default function LoadingOverlay({ label = 'Loading events...' }) {
  const colors = useAppColors();
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.blue} size="large" />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  container: { alignItems: 'center', backgroundColor: colors.cream, flex: 1, justifyContent: 'center' },
  label: { color: colors.muted, marginTop: 12 },
}));
