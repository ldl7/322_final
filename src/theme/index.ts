import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200ee', // Example primary color
    accent: '#03dac6',  // Example accent color (might be 'secondary' in MD3)
    // You can customize other colors here
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#bb86fc', // Example primary color for dark theme
    accent: '#03dac6',  // Example accent color for dark theme
    // You can customize other colors here
  },
};

// Default theme can be set here, or dynamically chosen later
// For now, let's keep it simple and assume App.tsx will pick one.
