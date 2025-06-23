import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import { 
  LoadingSpinner, 
  LoadingButton, 
  LoadingOverlay, 
  ProgressLoading,
  LoadingDots,
  LoadingOperation,
  InlineLoading
} from './loading';

// LoadingSpinner Stories
const spinnerMeta: Meta<typeof LoadingSpinner> = {
  title: 'UI/Loading/LoadingSpinner',
  component: LoadingSpinner,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    variant: { control: 'select', options: ['default', 'secondary', 'destructive'] },
  },
};

export default spinnerMeta;
type SpinnerStory = StoryObj<typeof spinnerMeta>;

export const SmallSpinner: SpinnerStory = {
  args: {
    size: 'sm',
  },
};

export const MediumSpinner: SpinnerStory = {
  args: {
    size: 'md',
  },
};

export const LargeSpinner: SpinnerStory = {
  args: {
    size: 'lg',
  },
};

export const SecondarySpinner: SpinnerStory = {
  args: {
    variant: 'secondary',
    size: 'md',
  },
};

export const DestructiveSpinner: SpinnerStory = {
  args: {
    variant: 'destructive',
    size: 'md',
  },
};

// LoadingButton Stories
const buttonMeta: Meta<typeof LoadingButton> = {
  title: 'UI/Loading/LoadingButton',
  component: LoadingButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: { 
      control: 'select', 
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] 
    },
    isLoading: { control: 'boolean' },
  },
  args: { onClick: fn() },
};

export const LoadingButtonMeta = buttonMeta;
type ButtonStory = StoryObj<typeof buttonMeta>;

export const IdleButton: ButtonStory = {
  args: {
    children: 'Click me',
    isLoading: false,
  },
};

export const LoadingButtonStory: ButtonStory = {
  args: {
    children: 'Processing...',
    isLoading: true,
  },
};

export const LoadingPrimaryButton: ButtonStory = {
  args: {
    children: 'Save Changes',
    isLoading: true,
    variant: 'default',
  },
};

export const LoadingSecondaryButton: ButtonStory = {
  args: {
    children: 'Cancel',
    isLoading: true,
    variant: 'secondary',
  },
};

// LoadingDots Stories
const dotsMeta: Meta<typeof LoadingDots> = {
  title: 'UI/Loading/LoadingDots',
  component: LoadingDots,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
};

export const LoadingDotsMeta = dotsMeta;
type DotsStory = StoryObj<typeof dotsMeta>;

export const SmallDots: DotsStory = {
  args: {
    size: 'sm',
  },
};

export const MediumDots: DotsStory = {
  args: {
    size: 'md',
  },
};

export const LargeDots: DotsStory = {
  args: {
    size: 'lg',
  },
};

// LoadingOperation Stories
const operationMeta: Meta<typeof LoadingOperation> = {
  title: 'UI/Loading/LoadingOperation',
  component: LoadingOperation,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    operation: { 
      control: 'select', 
      options: ['search', 'upload', 'download', 'refresh', 'cart', 'processing'] 
    },
  },
};

export const LoadingOperationMeta = operationMeta;
type OperationStory = StoryObj<typeof operationMeta>;

export const SearchOperation: OperationStory = {
  args: {
    operation: 'search',
    children: 'Searching products...',
  },
};

export const UploadOperation: OperationStory = {
  args: {
    operation: 'upload',
    children: 'Uploading files...',
  },
};

export const DownloadOperation: OperationStory = {
  args: {
    operation: 'download',
    children: 'Downloading...',
  },
};

export const CartOperation: OperationStory = {
  args: {
    operation: 'cart',
    children: 'Adding to cart...',
  },
};

export const ProcessingOperation: OperationStory = {
  args: {
    operation: 'processing',
    children: 'Processing payment...',
  },
};

// InlineLoading Stories
const inlineMeta: Meta<typeof InlineLoading> = {
  title: 'UI/Loading/InlineLoading',
  component: InlineLoading,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export const InlineLoadingMeta = inlineMeta;
type InlineStory = StoryObj<typeof inlineMeta>;

export const BasicInline: InlineStory = {
  args: {
    children: 'Loading...',
  },
};

export const InlineWithText: InlineStory = {
  args: {
    children: 'Fetching product details',
  },
};

// ProgressLoading Stories
const progressMeta: Meta<typeof ProgressLoading> = {
  title: 'UI/Loading/ProgressLoading',
  component: ProgressLoading,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    progress: { control: { type: 'range', min: 0, max: 100, step: 1 } },
  },
};

export const ProgressLoadingMeta = progressMeta;
type ProgressStory = StoryObj<typeof progressMeta>;

export const ZeroProgress: ProgressStory = {
  args: {
    progress: 0,
    children: 'Starting...',
  },
};

export const HalfProgress: ProgressStory = {
  args: {
    progress: 50,
    children: 'Half way there...',
  },
};

export const NearComplete: ProgressStory = {
  args: {
    progress: 85,
    children: 'Almost done...',
  },
};

export const CompleteProgress: ProgressStory = {
  args: {
    progress: 100,
    children: 'Complete!',
  },
}; 