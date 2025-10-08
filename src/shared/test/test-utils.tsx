import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AuthProvider, MapsProvider, PlacesProvider } from '../../providers';

/**
 * Custom render function that wraps components with all necessary providers
 */
interface AllProvidersProps {
  children: React.ReactNode;
}

const AllProviders: React.FC<AllProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      <MapsProvider>
        <PlacesProvider>{children}</PlacesProvider>
      </MapsProvider>
    </AuthProvider>
  );
};

/**
 * Custom render function that includes all app providers
 */
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllProviders, ...options });

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Override render with our custom render
export { customRender as render };