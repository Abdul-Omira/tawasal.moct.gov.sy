/**
 * Syrian Ministry Color Palette 2025
 * Official color scheme for the Ministry of Communication and Information Technology
 */

export const Colors = {
  // Primary Green Colors (الأخضر)
  green: {
    50: '#f0f9f7',
    100: '#dcf3ee', 
    200: '#bbe8de',
    300: '#8dd7c8',
    400: '#5bc0ae',
    500: '#00594f',    // Main brand green
    600: '#004d42',    // Secondary green
    700: '#003d34',    // Dark green
    800: '#004a40',
    900: '#003d34',
    950: '#002420'
  },

  // Gold Colors (الذهبي)  
  gold: {
    50: '#fefdf8',
    100: '#fefaef',
    200: '#fcf3d9',
    300: '#f8e8be',
    400: '#f2d898',
    500: '#e3ddd2',    // Light gold
    600: '#d9c89e',    // Main gold
    700: '#ad9e6e',    // Dark gold
    800: '#8b7f56',
    900: '#726747',
    950: '#3c3325'
  },

  // Maroon Colors (المارون)
  maroon: {
    50: '#fdf2f6',
    100: '#fce7ef',
    200: '#fad0e1',
    300: '#f6a8c9',
    400: '#f075a8',
    500: '#e5438a',
    600: '#d1256d',
    700: '#b21855',
    800: '#94164a',
    900: '#7a2631',    // Main maroon
    950: '#672146',    // Dark maroon
    darkest: '#420023' // Darkest maroon
  },

  // Black/Gray Colors (الأسود)
  gray: {
    50: '#f8f8f8',
    100: '#f1f1f1',
    200: '#e4e4e4',
    300: '#d1d1d1',
    400: '#b4b4b4',
    500: '#9a9a9a',
    600: '#818181',
    700: '#6a6a6a',
    800: '#4d4d4d',    // Medium gray
    900: '#302e2f',    // Dark gray/black
    950: '#1a1a1a'
  },

  // Semantic colors using the new palette
  primary: {
    DEFAULT: '#00594f',   // Main green
    light: '#279e91',     // Lighter green  
    dark: '#003d34',      // Dark green
    foreground: '#ffffff'
  },

  secondary: {
    DEFAULT: '#d9c89e',   // Main gold
    light: '#e3ddd2',     // Light gold
    dark: '#ad9e6e',      // Dark gold
    foreground: '#302e2f'
  },

  accent: {
    DEFAULT: '#7a2631',   // Main maroon
    light: '#672146',     // Dark maroon
    dark: '#420023',      // Darkest maroon
    foreground: '#ffffff'
  },

  muted: {
    DEFAULT: '#4d4d4d',   // Medium gray
    foreground: '#302e2f' // Dark gray
  },

  // Background colors
  background: {
    DEFAULT: '#ffffff',
    secondary: '#f8f8f8',
    muted: '#f1f1f1'
  },

  // Border colors
  border: {
    DEFAULT: '#e4e4e4',
    secondary: '#d1d1d1'
  }
} as const;

// CSS Custom Properties for use in stylesheets
export const cssVariables = {
  '--color-primary': Colors.primary.DEFAULT,
  '--color-primary-light': Colors.primary.light,
  '--color-primary-dark': Colors.primary.dark,
  '--color-primary-foreground': Colors.primary.foreground,
  
  '--color-secondary': Colors.secondary.DEFAULT,
  '--color-secondary-light': Colors.secondary.light,
  '--color-secondary-dark': Colors.secondary.dark,
  '--color-secondary-foreground': Colors.secondary.foreground,
  
  '--color-accent': Colors.accent.DEFAULT,
  '--color-accent-light': Colors.accent.light,
  '--color-accent-dark': Colors.accent.dark,
  '--color-accent-foreground': Colors.accent.foreground,
  
  '--color-background': Colors.background.DEFAULT,
  '--color-background-secondary': Colors.background.secondary,
  '--color-background-muted': Colors.background.muted,
  
  '--color-muted': Colors.muted.DEFAULT,
  '--color-muted-foreground': Colors.muted.foreground,
  
  '--color-border': Colors.border.DEFAULT,
  '--color-border-secondary': Colors.border.secondary
} as const;

// Utility functions
export const getColorValue = (colorPath: string): string => {
  const keys = colorPath.split('.');
  let value: any = Colors;
  
  for (const key of keys) {
    value = value[key];
    if (value === undefined) {
      console.warn(`Color path "${colorPath}" not found`);
      return Colors.primary.DEFAULT;
    }
  }
  
  return typeof value === 'string' ? value : Colors.primary.DEFAULT;
};

// Export for use in Tailwind config
export const tailwindColors = {
  primary: Colors.primary,
  secondary: Colors.secondary,
  accent: Colors.accent,
  green: Colors.green,
  gold: Colors.gold,
  maroon: Colors.maroon,
  muted: Colors.muted,
  background: Colors.background,
  border: Colors.border
};