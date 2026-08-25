import {
  createTheme,
  responsiveFontSizes,
} from "@mui/material/styles";

let theme = createTheme({
  palette: {
    primary: {
      main: "#0B2D5C",
      dark: "#071F41",
      light: "#244A76",
      contrastText: "#FFFFFF",
    },

    secondary: {
      main: "#00AEEF",
      dark: "#008BC0",
      light: "#43C5F3",
      contrastText: "#FFFFFF",
    },

    background: {
      default: "#F4F6F8",
      paper: "#FFFFFF",
    },

    text: {
      primary: "#172033",
      secondary: "#5C6678",
    },

    divider: "#E2E7EE",
  },

  shape: {
    borderRadius: 10,
  },

  typography: {
    fontFamily:
      '"Inter", "Segoe UI", Roboto, Arial, sans-serif',

    h1: {
      fontSize: "2rem",
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: "-0.02em",
    },

    h2: {
      fontSize: "1.75rem",
      fontWeight: 700,
      lineHeight: 1.25,
      letterSpacing: "-0.02em",
    },

    h3: {
      fontSize: "1.5rem",
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: "-0.015em",
    },

    h4: {
      fontSize: "1.35rem",
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: "-0.01em",
    },

    h5: {
      fontSize: "1.15rem",
      fontWeight: 700,
      lineHeight: 1.35,
    },

    h6: {
      fontSize: "1rem",
      fontWeight: 700,
      lineHeight: 1.4,
    },

    subtitle1: {
      fontSize: "0.95rem",
      fontWeight: 600,
      lineHeight: 1.45,
    },

    subtitle2: {
      fontSize: "0.875rem",
      fontWeight: 600,
      lineHeight: 1.45,
    },

    body1: {
      fontSize: "0.95rem",
      lineHeight: 1.55,
    },

    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
    },

    button: {
      fontSize: "0.875rem",
      fontWeight: 700,
      textTransform: "none",
      letterSpacing: "0.01em",
    },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },

        body: {
          margin: 0,
          backgroundColor: "#F4F6F8",
        },

        "*": {
          boxSizing: "border-box",
        },
      },
    },

    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },

      styleOverrides: {
        root: {
          minHeight: 42,
          borderRadius: 8,
          padding: "9px 18px",
          fontWeight: 700,
          textTransform: "none",

          "&.MuiButton-containedPrimary:hover": {
            backgroundColor: "#071F41",
          },

          "&.MuiButton-outlinedPrimary": {
            borderWidth: 1.5,
          },

          "&.MuiButton-outlinedPrimary:hover": {
            borderWidth: 1.5,
          },
        },

        sizeSmall: {
          minHeight: 36,
          padding: "6px 14px",
        },

        sizeLarge: {
          minHeight: 48,
          padding: "11px 22px",
        },
      },
    },

    MuiTextField: {
      defaultProps: {
        size: "small",
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          minHeight: 42,
          borderRadius: 8,
          backgroundColor: "#FFFFFF",

          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#CBD3DD",
          },

          "&:hover .MuiOutlinedInput-notchedOutline":
            {
              borderColor: "#8C99AA",
            },

          "&.Mui-focused .MuiOutlinedInput-notchedOutline":
            {
              borderWidth: 2,
            },
        },

        input: {
          paddingTop: 10,
          paddingBottom: 10,
          fontSize: "0.9rem",
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: "0.9rem",
        },
      },
    },

    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },

    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },

      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: 12,
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #E2E7EE",
          borderRadius: 12,
          boxShadow:
            "0 2px 8px rgba(15, 35, 60, 0.05)",
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          fontSize: "0.82rem",
          color: "#384458",
          backgroundColor: "#F7F9FB",
        },

        body: {
          fontSize: "0.875rem",
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          height: 28,
          borderRadius: 6,
          fontWeight: 600,
        },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontSize: "0.9rem",
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: "1.2rem",
          fontWeight: 700,
          lineHeight: 1.35,
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          minHeight: 40,
          fontSize: "0.9rem",
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },

    MuiSelect: {
      styleOverrides: {
        select: {
          fontSize: "0.9rem",
        },
      },
    },

    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontSize: "0.78rem",
          marginLeft: 4,
          marginRight: 4,
        },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "#E2E7EE",
        },
      },
    },
  },
});

theme = responsiveFontSizes(theme);

export default theme;