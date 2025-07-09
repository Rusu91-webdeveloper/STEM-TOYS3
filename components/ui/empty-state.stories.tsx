import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import React from "react";

import {
  EmptyState,
  EmptyCart,
  EmptyWishlist,
  EmptySearch,
  EmptyOrders,
  EmptyDigitalLibrary,
} from "./empty-state";

// Base EmptyState Stories
const emptyStateMeta: Meta<typeof EmptyState> = {
  title: "UI/EmptyState/EmptyState",
  component: EmptyState,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "minimal", "illustrated"],
    },
  },
  args: {
    primaryAction: { label: "Primary Action", onClick: fn() },
    secondaryAction: {
      label: "Secondary Action",
      onClick: fn(),
      variant: "outline",
    },
  },
};

export default emptyStateMeta;
type EmptyStory = StoryObj<typeof emptyStateMeta>;

export const BasicEmpty: EmptyStory = {
  args: {
    title: "No items found",
    description: "There are no items to display at the moment.",
  },
};

export const EmptyWithAction: EmptyStory = {
  args: {
    title: "No products found",
    description: "We couldn't find any products matching your criteria.",
    primaryAction: { label: "Clear Filters", onClick: fn() },
  },
};

export const EmptyWithSecondaryAction: EmptyStory = {
  args: {
    title: "No results",
    description: "Try adjusting your search or browse our categories.",
    primaryAction: { label: "Browse Categories", onClick: fn() },
    secondaryAction: {
      label: "Clear Search",
      onClick: fn(),
      variant: "outline",
    },
  },
};

export const MinimalEmpty: EmptyStory = {
  args: {
    variant: "muted",
    title: "Empty",
    description: "Nothing to show here.",
  },
};

export const IllustratedEmpty: EmptyStory = {
  args: {
    variant: "primary",
    title: "Welcome to your dashboard",
    description: "Get started by creating your first item.",
    primaryAction: { label: "Create Item", onClick: fn() },
  },
};

// EmptyCart Stories
const cartMeta: Meta<typeof EmptyCart> = {
  title: "UI/EmptyState/EmptyCart",
  component: EmptyCart,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export const EmptyCartMeta = cartMeta;
type CartStory = StoryObj<typeof cartMeta>;

export const EmptyCartDefault: CartStory = {
  args: {
    onContinueShopping: fn(),
  },
};

export const EmptyCartCustom: CartStory = {
  args: {
    title: "Your shopping cart is empty",
    description: "Discover amazing STEM toys and educational products.",
    onContinueShopping: fn(),
  },
};

// EmptyWishlist Stories
const wishlistMeta: Meta<typeof EmptyWishlist> = {
  title: "UI/EmptyState/EmptyWishlist",
  component: EmptyWishlist,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export const EmptyWishlistMeta = wishlistMeta;
type WishlistStory = StoryObj<typeof wishlistMeta>;

export const EmptyWishlistDefault: WishlistStory = {
  args: {
    onBrowseProducts: fn(),
  },
};

// EmptySearch Stories
const searchMeta: Meta<typeof EmptySearch> = {
  title: "UI/EmptyState/EmptySearch",
  component: EmptySearch,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export const EmptySearchMeta = searchMeta;
type SearchStory = StoryObj<typeof searchMeta>;

export const EmptySearchDefault: SearchStory = {
  args: {
    onBrowseCategories: fn(),
  },
};

export const EmptySearchWithQuery: SearchStory = {
  args: {
    query: "microscope",
    onBrowseCategories: fn(),
  },
};

// EmptyOrders Stories
const ordersMeta: Meta<typeof EmptyOrders> = {
  title: "UI/EmptyState/EmptyOrders",
  component: EmptyOrders,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export const EmptyOrdersMeta = ordersMeta;
type OrdersStory = StoryObj<typeof ordersMeta>;

export const EmptyOrdersDefault: OrdersStory = {
  args: {
    onStartShopping: fn(),
  },
};

// EmptyDigitalLibrary Stories
const digitalMeta: Meta<typeof EmptyDigitalLibrary> = {
  title: "UI/EmptyState/EmptyDigitalLibrary",
  component: EmptyDigitalLibrary,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    onBrowseBooks: fn(),
  },
};

export const EmptyDigitalLibraryMeta = digitalMeta;
type DigitalStory = StoryObj<typeof digitalMeta>;

export const EmptyDigitalLibraryDefault: DigitalStory = {
  args: {},
};

// Example Layout Showcases
export const EcommerceEmptyStates: StoryObj = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Empty Cart</h3>
        <EmptyCart onContinueShopping={fn()} />
      </div>
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Empty Wishlist</h3>
        <EmptyWishlist onBrowseProducts={fn()} />
      </div>
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Empty Search</h3>
        <EmptySearch onBrowseCategories={fn()} />
      </div>
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Empty Orders</h3>
        <EmptyOrders onStartShopping={fn()} />
      </div>
    </div>
  ),
  parameters: {
    layout: "fullscreen",
  },
};

export const EmptyStateVariants: StoryObj = {
  render: () => (
    <div className="space-y-8 p-6">
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Default Variant</h3>
        <EmptyState
          title="No items found"
          description="There are no items to display at the moment."
          primaryAction={{ label: "Add Item", onClick: fn() }}
        />
      </div>
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Minimal Variant</h3>
        <EmptyState
          variant="muted"
          title="Empty"
          description="Nothing to show here."
        />
      </div>
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Illustrated Variant</h3>
        <EmptyState
          variant="primary"
          title="Welcome to your dashboard"
          description="Get started by creating your first item."
          primaryAction={{ label: "Create Item", onClick: fn() }}
        />
      </div>
    </div>
  ),
  parameters: {
    layout: "fullscreen",
  },
};
