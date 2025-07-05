import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      50: '#e8f5f0',
      100: '#d1ebe1',
      200: '#a3d7c3',
      300: '#75c3a5',
      400: '#47af87',
      500: '#2d8659', // Primary color
      600: '#246b47',
      700: '#1b5035',
      800: '#123523',
      900: '#091a11'
    },
    gray: {
      50: '#f8f9fa',
      100: '#f1f3f4',
      200: '#e8eaed',
      300: '#dadce0',
      400: '#bdc1c6',
      500: '#9aa0a6',
      600: '#80868b',
      700: '#5f6368',
      800: '#3c4043',
      900: '#202124'
    }
  },
  fonts: {
    heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '4rem'
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '500',
        borderRadius: 'md'
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600'
          },
          _active: {
            bg: 'brand.700'
          }
        },
        outline: {
          borderColor: 'brand.500',
          color: 'brand.500',
          _hover: {
            bg: 'brand.50'
          }
        },
        ghost: {
          color: 'brand.500',
          _hover: {
            bg: 'brand.50'
          }
        }
      }
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: 'lg',
          boxShadow: 'sm',
          border: '1px solid',
          borderColor: 'gray.200',
          bg: 'white'
        }
      }
    },
    Input: {
      defaultProps: {
        focusBorderColor: 'brand.500'
      }
    },
    Select: {
      defaultProps: {
        focusBorderColor: 'brand.500'
      }
    },
    Textarea: {
      defaultProps: {
        focusBorderColor: 'brand.500'
      }
    },
    Badge: {
      variants: {
        success: {
          bg: 'green.100',
          color: 'green.800'
        },
        warning: {
          bg: 'yellow.100',
          color: 'yellow.800'
        },
        error: {
          bg: 'red.100',
          color: 'red.800'
        },
        info: {
          bg: 'blue.100',
          color: 'blue.800'
        }
      }
    },
    Table: {
      variants: {
        simple: {
          th: {
            borderBottom: '2px solid',
            borderColor: 'gray.200',
            color: 'gray.600',
            fontSize: 'sm',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: 'wider'
          },
          td: {
            borderBottom: '1px solid',
            borderColor: 'gray.100'
          }
        }
      }
    }
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800'
      },
      '*::placeholder': {
        color: 'gray.400'
      },
      '*, *::before, &::after': {
        borderColor: 'gray.200'
      }
    }
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false
  }
});

export default theme;