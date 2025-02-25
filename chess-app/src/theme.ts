import { createTheme } from '@mui/material/styles';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#60efff',
    },
    secondary: {
      main: '#7dff90',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});
