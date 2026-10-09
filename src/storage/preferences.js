import AsyncStorage from '@react-native-async-storage/async-storage';

const DARK_KEY = 'preferences.darkTheme';

export async function getPreferences() {
  const storedTheme = await AsyncStorage.getItem(DARK_KEY);

  return {
    // Stored as the string "true" or "false"; Boolean("false") would be true.
    darkTheme: storedTheme === 'true',
  };
}

export function setDarkTheme(value) {
  return AsyncStorage.setItem(DARK_KEY, String(value));
}

export function resetPreferences() {
  return AsyncStorage.clear();
}
