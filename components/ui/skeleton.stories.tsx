import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonProduct,
  SkeletonPage,
} from "./skeleton";

// Base Skeleton Stories
const skeletonMeta: Meta<typeof Skeleton> = {
  title: "UI/Skeleton/Skeleton",
  component: Skeleton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "select", options: ["default", "pulse", "wave"] },
  },
};

export default skeletonMeta;
type SkeletonStory = StoryObj<typeof skeletonMeta>;

export const Default: SkeletonStory = {
  args: {
    className: "w-40 h-4",
  },
};

export const PulseVariant: SkeletonStory = {
  args: {
    variant: "pulse",
    className: "w-40 h-4",
  },
};

export const WaveVariant: SkeletonStory = {
  args: {
    variant: "wave",
    className: "w-40 h-4",
  },
};

export const CircularSkeleton: SkeletonStory = {
  args: {
    className: "w-12 h-12 rounded-full",
  },
};

export const RectangularSkeleton: SkeletonStory = {
  args: {
    className: "w-64 h-32 rounded-md",
  },
};

// SkeletonText Stories
const textMeta: Meta<typeof SkeletonText> = {
  title: "UI/Skeleton/SkeletonText",
  component: SkeletonText,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    lines: { control: { type: "range", min: 1, max: 10, step: 1 } },
    variant: { control: "select", options: ["default", "pulse", "wave"] },
  },
};

export const SkeletonTextMeta = textMeta;
type TextStory = StoryObj<typeof textMeta>;

export const SingleLine: TextStory = {
  args: {
    lines: 1,
  },
};

export const ThreeLines: TextStory = {
  args: {
    lines: 3,
  },
};

export const FiveLines: TextStory = {
  args: {
    lines: 5,
  },
};

export const PulseText: TextStory = {
  args: {
    lines: 3,
    variant: "pulse",
  },
};

export const WaveText: TextStory = {
  args: {
    lines: 3,
    variant: "wave",
  },
};

// SkeletonCard Stories
const cardMeta: Meta<typeof SkeletonCard> = {
  title: "UI/Skeleton/SkeletonCard",
  component: SkeletonCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "select", options: ["default", "pulse", "wave"] },
    showImage: { control: "boolean" },
  },
};

export const SkeletonCardMeta = cardMeta;
type CardStory = StoryObj<typeof cardMeta>;

export const BasicCard: CardStory = {
  args: {},
};

export const CardWithImage: CardStory = {
  args: {
    showImage: true,
  },
};

export const PulseCard: CardStory = {
  args: {
    variant: "pulse",
    showImage: true,
  },
};

export const WaveCard: CardStory = {
  args: {
    variant: "wave",
    showImage: true,
  },
};

// SkeletonTable Stories
const tableMeta: Meta<typeof SkeletonTable> = {
  title: "UI/Skeleton/SkeletonTable",
  component: SkeletonTable,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    rows: { control: { type: "range", min: 1, max: 10, step: 1 } },
    columns: { control: { type: "range", min: 1, max: 8, step: 1 } },
    variant: { control: "select", options: ["default", "pulse", "wave"] },
  },
};

export const SkeletonTableMeta = tableMeta;
type TableStory = StoryObj<typeof tableMeta>;

export const SmallTable: TableStory = {
  args: {
    rows: 3,
    columns: 3,
  },
};

export const MediumTable: TableStory = {
  args: {
    rows: 5,
    columns: 4,
  },
};

export const LargeTable: TableStory = {
  args: {
    rows: 8,
    columns: 6,
  },
};

export const PulseTable: TableStory = {
  args: {
    rows: 5,
    columns: 4,
    variant: "pulse",
  },
};

// SkeletonProduct Stories
const productMeta: Meta<typeof SkeletonProduct> = {
  title: "UI/Skeleton/SkeletonProduct",
  component: SkeletonProduct,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    layout: { control: "select", options: ["grid", "list"] },
    variant: { control: "select", options: ["default", "pulse", "wave"] },
  },
};

export const SkeletonProductMeta = productMeta;
type ProductStory = StoryObj<typeof productMeta>;

export const GridProduct: ProductStory = {
  args: {
    layout: "grid",
  },
};

export const ListProduct: ProductStory = {
  args: {
    layout: "list",
  },
};

export const PulseProduct: ProductStory = {
  args: {
    layout: "grid",
    variant: "pulse",
  },
};

export const WaveProduct: ProductStory = {
  args: {
    layout: "grid",
    variant: "wave",
  },
};

// SkeletonPage Stories
const pageMeta: Meta<typeof SkeletonPage> = {
  title: "UI/Skeleton/SkeletonPage",
  component: SkeletonPage,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "select", options: ["default", "pulse", "wave"] },
  },
};

export const SkeletonPageMeta = pageMeta;
type PageStory = StoryObj<typeof pageMeta>;

export const DefaultPage: PageStory = {
  args: {},
};

export const PulsePage: PageStory = {
  args: {
    variant: "pulse",
  },
};

export const WavePage: PageStory = {
  args: {
    variant: "wave",
  },
};

// Multiple Product Grid Example
export const ProductGrid: StoryObj = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      <SkeletonProduct layout="grid" />
      <SkeletonProduct layout="grid" />
      <SkeletonProduct layout="grid" />
      <SkeletonProduct layout="grid" />
      <SkeletonProduct layout="grid" />
      <SkeletonProduct layout="grid" />
    </div>
  ),
  parameters: {
    layout: "fullscreen",
  },
};

// Product List Example
export const ProductList: StoryObj = {
  render: () => (
    <div className="space-y-4 p-6">
      <SkeletonProduct layout="list" />
      <SkeletonProduct layout="list" />
      <SkeletonProduct layout="list" />
      <SkeletonProduct layout="list" />
    </div>
  ),
  parameters: {
    layout: "fullscreen",
  },
};
