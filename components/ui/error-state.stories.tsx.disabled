import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import React from 'react';

import { 
  ErrorState,
  NetworkError,
  NotFoundError,
  PermissionError,
  ServerError,
  TimeoutError,
  DatabaseError,
  EmptyState,
  LoadFailedError,
  ErrorBoundaryFallback
} from './error-state';

// Base ErrorState Stories
const errorStateMeta: Meta<typeof ErrorState> = {
  title: 'UI/ErrorState/ErrorState',
  component: ErrorState,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'minimal', 'detailed'] },
  },
  args: {
    onRetry: fn(),
    onAction: fn(),
  },
};

export default errorStateMeta;
type ErrorStory = StoryObj<typeof errorStateMeta>;

export const BasicError: ErrorStory = {
  args: {
    title: 'Something went wrong',
    description: 'An unexpected error occurred. Please try again.',
  },
};

export const ErrorWithRetry: ErrorStory = {
  args: {
    title: 'Failed to load data',
    description: 'We couldn\'t load the requested information.',
    showRetry: true,
  },
};

export const ErrorWithAction: ErrorStory = {
  args: {
    title: 'Access Denied',
    description: 'You don\'t have permission to view this content.',
    actionLabel: 'Go to Login',
    showRetry: false,
  },
};

export const MinimalError: ErrorStory = {
  args: {
    variant: 'minimal',
    title: 'Error',
    description: 'Something went wrong.',
  },
};

export const DetailedError: ErrorStory = {
  args: {
    variant: 'detailed',
    title: 'System Error',
    description: 'A detailed error occurred in the system. Our team has been notified and is working on a fix.',
    showRetry: true,
    actionLabel: 'Report Issue',
  },
};

// NetworkError Stories
const networkMeta: Meta<typeof NetworkError> = {
  title: 'UI/ErrorState/NetworkError',
  component: NetworkError,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onRetry: fn(),
  },
};

export const NetworkErrorMeta = networkMeta;
type NetworkStory = StoryObj<typeof networkMeta>;

export const NetworkErrorDefault: NetworkStory = {
  args: {},
};

export const NetworkErrorCustom: NetworkStory = {
  args: {
    description: 'Please check your internet connection and try again.',
  },
};

// NotFoundError Stories
const notFoundMeta: Meta<typeof NotFoundError> = {
  title: 'UI/ErrorState/NotFoundError',
  component: NotFoundError,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onAction: fn(),
  },
};

export const NotFoundErrorMeta = notFoundMeta;
type NotFoundStory = StoryObj<typeof notFoundMeta>;

export const NotFoundDefault: NotFoundStory = {
  args: {},
};

export const NotFoundProduct: NotFoundStory = {
  args: {
    resource: 'product',
    actionLabel: 'Browse Products',
  },
};

export const NotFoundPage: NotFoundStory = {
  args: {
    resource: 'page',
    actionLabel: 'Go Home',
  },
};

// PermissionError Stories
const permissionMeta: Meta<typeof PermissionError> = {
  title: 'UI/ErrorState/PermissionError',
  component: PermissionError,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onAction: fn(),
  },
};

export const PermissionErrorMeta = permissionMeta;
type PermissionStory = StoryObj<typeof permissionMeta>;

export const PermissionDefault: PermissionStory = {
  args: {},
};

export const PermissionAdmin: PermissionStory = {
  args: {
    resource: 'admin panel',
    actionLabel: 'Request Access',
  },
};

// ServerError Stories  
const serverMeta: Meta<typeof ServerError> = {
  title: 'UI/ErrorState/ServerError',
  component: ServerError,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onRetry: fn(),
    onAction: fn(),
  },
};

export const ServerErrorMeta = serverMeta;
type ServerStory = StoryObj<typeof serverMeta>;

export const ServerErrorDefault: ServerStory = {
  args: {},
};

export const ServerErrorWithCode: ServerStory = {
  args: {
    errorCode: '500',
  },
};

// TimeoutError Stories
const timeoutMeta: Meta<typeof TimeoutError> = {
  title: 'UI/ErrorState/TimeoutError',
  component: TimeoutError,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onRetry: fn(),
  },
};

export const TimeoutErrorMeta = timeoutMeta;
type TimeoutStory = StoryObj<typeof timeoutMeta>;

export const TimeoutDefault: TimeoutStory = {
  args: {},
};

export const TimeoutCustom: TimeoutStory = {
  args: {
    description: 'The search is taking longer than expected.',
  },
};

// DatabaseError Stories
const databaseMeta: Meta<typeof DatabaseError> = {
  title: 'UI/ErrorState/DatabaseError',
  component: DatabaseError,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onRetry: fn(),
    onAction: fn(),
  },
};

export const DatabaseErrorMeta = databaseMeta;
type DatabaseStory = StoryObj<typeof databaseMeta>;

export const DatabaseDefault: DatabaseStory = {
  args: {},
};

export const DatabaseWithAction: DatabaseStory = {
  args: {
    actionLabel: 'Contact Support',
  },
};

// EmptyState Stories
const emptyMeta: Meta<typeof EmptyState> = {
  title: 'UI/ErrorState/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onAction: fn(),
  },
};

export const EmptyStateMeta = emptyMeta;
type EmptyStory = StoryObj<typeof emptyMeta>;

export const EmptyDefault: EmptyStory = {
  args: {
    title: 'No items found',
    description: 'There are no items to display at the moment.',
  },
};

export const EmptyWithAction: EmptyStory = {
  args: {
    title: 'No products found',
    description: 'We couldn\'t find any products matching your criteria.',
    actionLabel: 'Clear Filters',
  },
};

// LoadFailedError Stories
const loadFailedMeta: Meta<typeof LoadFailedError> = {
  title: 'UI/ErrorState/LoadFailedError',
  component: LoadFailedError,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onRetry: fn(),
  },
};

export const LoadFailedErrorMeta = loadFailedMeta;
type LoadFailedStory = StoryObj<typeof loadFailedMeta>;

export const LoadFailedDefault: LoadFailedStory = {
  args: {},
};

export const LoadFailedProducts: LoadFailedStory = {
  args: {
    resource: 'products',
  },
};

export const LoadFailedOrders: LoadFailedStory = {
  args: {
    resource: 'orders',
  },
};

// ErrorBoundaryFallback Stories
const errorBoundaryMeta: Meta<typeof ErrorBoundaryFallback> = {
  title: 'UI/ErrorState/ErrorBoundaryFallback',
  component: ErrorBoundaryFallback,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  args: {
    onRetry: fn(),
    onReport: fn(),
  },
};

export const ErrorBoundaryFallbackMeta = errorBoundaryMeta;
type ErrorBoundaryStory = StoryObj<typeof errorBoundaryMeta>;

export const ErrorBoundaryDefault: ErrorBoundaryStory = {
  args: {},
};

export const ErrorBoundaryWithError: ErrorBoundaryStory = {
  args: {
    error: new Error('Something went wrong in the component tree'),
    errorInfo: {
      componentStack: '\n    in ComponentThatThrows\n    in div\n    in App',
    },
  },
};

// Example Layouts
export const ErrorGrid: StoryObj = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Network Error</h3>
        <NetworkError />
      </div>
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Not Found</h3>
        <NotFoundError resource="product" />
      </div>
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Permission Error</h3>
        <PermissionError resource="admin panel" />
      </div>
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Server Error</h3>
        <ServerError errorCode="500" />
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};

export const EmptyStates: StoryObj = {
  render: () => (
    <div className="space-y-8 p-6">
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Empty Product List</h3>
        <EmptyState
          title="No products found"
          description="We couldn't find any products matching your search criteria."
          actionLabel="Clear Filters"
          onAction={fn()}
        />
      </div>
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Empty Cart</h3>
        <EmptyState
          title="Your cart is empty"
          description="Start shopping to add items to your cart."
          actionLabel="Browse Products"
          onAction={fn()}
        />
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
}; 