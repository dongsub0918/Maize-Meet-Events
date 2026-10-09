import React from 'react';
import { View } from 'react-native';
import { Button, Text } from '@rneui/themed';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createThemedStyles, useAppColors } from '../theme/theme';

export default function EmptyState({ title, message, actionLabel, onAction }) {
  const colors = useAppColors();
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons color={colors.blueLight} name="calendar-blank-outline" size={42} />
      <Text h4 style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && <Button onPress={onAction} title={actionLabel} type="clear" />}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  container: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 72 },
  title: { color: colors.ink, fontWeight: '800', marginTop: 14 },
  message: { color: colors.muted, lineHeight: 21, marginBottom: 8, marginTop: 8, textAlign: 'center' },
}));
