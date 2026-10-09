import { StyleSheet } from 'react-native';
import { createTheme } from '@rneui/themed';
import { useAppContext } from '../context/AppContext';

// Every color the screens use lives in these two palettes so that the
// dark theme setting can recolor the whole interface, not just the navigation.
export const lightPalette = {
  maize: '#FFCB05',
  blue: '#00274C',
  blueLight: '#33597D',
  cream: '#F7F4ED',
  ink: '#17212B',
  muted: '#66717C',
  border: '#DCE2E7',
  danger: '#B42318',
  surface: '#FFFFFF',
  iconBackground: '#EDF1F4',
  noteIconBackground: '#E5EDF4',
  bodyText: '#3E4A55',
  badgeBackground: '#E4ECF5',
  badgeText: '#23313D',
  placeholder: '#7B858E',
  chipBorder: '#AAB4BE',
  tabInactive: '#77838E',
  tabBorder: '#E2E6EA',
  heart: '#C6253D',
  onAccent: '#FFFFFF',
  onMaize: '#00274C',
  shadow: '#102B44',
};

export const darkPalette = {
  maize: '#FFCB05',
  blue: '#FFCB05',
  blueLight: '#9DB4CC',
  cream: '#101820',
  ink: '#F7F4ED',
  muted: '#9AA5B1',
  border: '#253443',
  danger: '#F97066',
  surface: '#17212B',
  iconBackground: '#22303D',
  noteIconBackground: '#22303D',
  bodyText: '#C9D1D9',
  badgeBackground: '#22303D',
  badgeText: '#E4ECF5',
  placeholder: '#7B858E',
  chipBorder: '#4A5968',
  tabInactive: '#8A96A1',
  tabBorder: '#253443',
  heart: '#F0546C',
  onAccent: '#00274C',
  onMaize: '#00274C',
  shadow: '#000000',
};

// Light colors, for code that runs before preferences are available.
export const colors = lightPalette;

export function getPalette(darkTheme) {
  return darkTheme ? darkPalette : lightPalette;
}

// Returns the palette for the current dark theme setting.
export function useAppColors() {
  const { preferences } = useAppContext();
  return getPalette(preferences.darkTheme);
}

// Builds a light and a dark StyleSheet from one factory and returns a hook
// that picks the right one for the current dark theme setting.
export function createThemedStyles(factory) {
  const lightStyles = StyleSheet.create(factory(lightPalette));
  const darkStyles = StyleSheet.create(factory(darkPalette));
  return function useThemedStyles() {
    const { preferences } = useAppContext();
    return preferences.darkTheme ? darkStyles : lightStyles;
  };
}

export const appTheme = createTheme({
  lightColors: {
    primary: lightPalette.blue,
    secondary: lightPalette.maize,
    background: lightPalette.cream,
    white: lightPalette.surface,
    black: lightPalette.ink,
    grey0: lightPalette.ink,
    grey3: lightPalette.muted,
    grey5: lightPalette.border,
    divider: lightPalette.border,
  },
  darkColors: {
    primary: '#4A7AB0',
    secondary: darkPalette.blueLight,
    background: darkPalette.cream,
    white: darkPalette.surface,
    black: darkPalette.ink,
    grey0: darkPalette.ink,
    grey3: darkPalette.muted,
    grey5: darkPalette.border,
    divider: darkPalette.border,
  },
  mode: 'light',
  components: {
    Button: {
      radius: 10,
      titleStyle: { fontWeight: '700' },
    },
    Card: {
      containerStyle: {
        borderRadius: 16,
        borderWidth: 0,
        margin: 0,
      },
    },
  },
});
