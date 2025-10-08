import { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component that catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the whole app.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // You could also log to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, render it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Otherwise, render the default error UI
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
            p: 3,
          }}
        >
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={this.handleReset}>
                Try Again
              </Button>
            }
            sx={{ maxWidth: 600 }}
          >
            <Typography variant="h6" gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {this.state.error?.message || 'An unexpected error occurred'}
            </Typography>
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;