import { light, dark } from '@eva-design/eva';

export const lightTheme = {
  ...light,
  'color-primary-100': '#E8E8FF',
  'color-primary-200': '#D1D1FF',
  'color-primary-300': '#ABABFF',
  'color-primary-400': '#8B8BFF',
  'color-primary-500': '#4FD3FF',
  'color-primary-600': '#4344CD',
  'color-primary-700': '#2D2FAB',
  'color-primary-800': '#1A1C89',
  'color-primary-900': '#0F1071',
  
  'color-success-100': '#E8F5E8',
  'color-success-200': '#C3E6C3',
  'color-success-300': '#9DD69D',
  'color-success-400': '#77C677',
  'color-success-500': '#52B952',
  'color-success-600': '#419341',
  'color-success-700': '#306D30',
  'color-success-800': '#1F471F',
  'color-success-900': '#0E210E',
  
  'color-warning-100': '#FFF4E8',
  'color-warning-200': '#FFE1C3',
  'color-warning-300': '#FFCD9D',
  'color-warning-400': '#FFB977',
  'color-warning-500': '#FFA552',
  'color-warning-600': '#CC8441',
  'color-warning-700': '#996330',
  'color-warning-800': '#66421F',
  'color-warning-900': '#33210E',
  
  'color-danger-100': '#FFE8E8',
  'color-danger-200': '#FFC3C3',
  'color-danger-300': '#FF9D9D',
  'color-danger-400': '#FF7777',
  'color-danger-500': '#FF5252',
  'color-danger-600': '#CC4141',
  'color-danger-700': '#993030',
  'color-danger-800': '#661F1F',
  'color-danger-900': '#330E0E',
  
  'color-basic-100': '#FFFFFF',
  'color-basic-200': '#F7F9FC',
  'color-basic-300': '#EDF1F7',
  'color-basic-400': '#E4E9F2',
  'color-basic-500': '#C5CEE0',
  'color-basic-600': '#8F9BB3',
  'color-basic-700': '#2E3A59',
  'color-basic-800': '#222B45',
  'color-basic-900': '#192038',
  'color-basic-1000': '#151A30',
  'color-basic-1100': '#101426',
};

export const darkTheme = {
  ...dark,
  'color-primary-100': '#0F1071',
  'color-primary-200': '#1A1C89',
  'color-primary-300': '#2D2FAB',
  'color-primary-400': '#4344CD',
  'color-primary-500': '#4FD3FF',
  'color-primary-600': '#8B8BFF',
  'color-primary-700': '#ABABFF',
  'color-primary-800': '#D1D1FF',
  'color-primary-900': '#E8E8FF',
  
  'color-success-100': '#0E210E',
  'color-success-200': '#1F471F',
  'color-success-300': '#306D30',
  'color-success-400': '#419341',
  'color-success-500': '#52B952',
  'color-success-600': '#77C677',
  'color-success-700': '#9DD69D',
  'color-success-800': '#C3E6C3',
  'color-success-900': '#E8F5E8',
  
  'color-warning-100': '#33210E',
  'color-warning-200': '#66421F',
  'color-warning-300': '#996330',
  'color-warning-400': '#CC8441',
  'color-warning-500': '#FFA552',
  'color-warning-600': '#FFB977',
  'color-warning-700': '#FFCD9D',
  'color-warning-800': '#FFE1C3',
  'color-warning-900': '#FFF4E8',
  
  'color-danger-100': '#330E0E',
  'color-danger-200': '#661F1F',
  'color-danger-300': '#993030',
  'color-danger-400': '#CC4141',
  'color-danger-500': '#FF5252',
  'color-danger-600': '#FF7777',
  'color-danger-700': '#FF9D9D',
  'color-danger-800': '#FFC3C3',
  'color-danger-900': '#FFE8E8',
  
  'background-basic-color-1': '#0E0E12',
  'background-basic-color-2': '#1A1B22',
  'border-basic-color-2': '#2B2C38',
  'color-primary-500': '#4FD3FF',
  'color-basic-100': '#101426',
  'color-basic-200': '#151A30',
  'color-basic-300': '#192038',
  'color-basic-400': '#222B45',
  'color-basic-500': '#2E3A59',
  'color-basic-600': '#8F9BB3',
  'color-basic-700': '#C5CEE0',
  'color-basic-800': '#E4E9F2',
  'color-basic-900': '#EDF1F7',
  'color-basic-1000': '#F7F9FC',
  'color-basic-1100': '#FFFFFF',
};

export const oceanBreezeTheme = {
  ...light,
  // 1. PRIMARY (blue) – 5 shades
'color-primary-100': '#D0EFFF',  // lightest tint
  'color-primary-300': '#5CC1FF',  // light tint
  'color-primary-500': '#4FD3FF',  // main brand color
  'color-primary-700': '#007ACC',  // dark shade
  'color-primary-900': '#00568A',  // darkest shade

  // 2. BACKGROUNDS – 3 colors
  'background-basic-color-1': '#121212', // main app bg (almost black)
  'background-basic-color-2': '#1E1E1E', // cards & surfaces
  'background-basic-color-3': '#2A2A2A', // modals & overlays

  // 3. TEXT & ICONS – 4 colors
  'color-basic-600': '#757575', // inactive/secondary text
  'color-basic-800': '#E0E0E0', // active text/icons
  'color-basic-900': '#FAFAFA', // primary text
  'text-basic-color': '#FFFFFF',// main body text

  // 4. BORDERS & DIVIDERS – 2 colors
  'border-basic-color-2': '#333333', // main borders
  'border-basic-color-3': '#444444', // subtle dividers

  // 5. ACCENTS (semantic feedback)
  'color-success-500': '#4CAF50', // success
  'color-warning-500': '#FFB300', // warning
  'color-danger-500':  '#E53935', // error

  // 6. EXTRA HIGHLIGHTS
  'color-info-500':   '#0096A8', // secondary accent (teal)
  'color-basic-100':  '#181818', // ultra-light neutral for padding
};