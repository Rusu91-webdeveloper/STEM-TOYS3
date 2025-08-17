import { cva, type VariantProps } from "class-variance-authority";
import {
  ShoppingCart,
  Heart,
  Search,
  Package,
  FileText,
  Users,
  Star,
  BookOpen,
  Download,
  CreditCard,
  MapPin,
  MessageCircle,
  Plus,
  ArrowRight,
} from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center space-y-6 p-8",
  {
    variants: {
      variant: {
        default: "text-muted-foreground",
        primary: "text-primary",
        secondary: "text-secondary",
        muted: "text-muted-foreground/60",
      },
      size: {
        sm: "py-6 space-y-4",
        default: "py-8 space-y-6",
        lg: "py-12 space-y-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  title: string;
  description?: string;
  icon?: React.ComponentType<any>;
  illustration?: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary";
  };
  showDivider?: boolean;
}

function EmptyState({
  className,
  variant,
  size,
  title,
  description,
  icon: Icon,
  illustration,
  primaryAction,
  secondaryAction,
  showDivider = false,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(emptyStateVariants({ variant, size, className }))}
      role="status"
      aria-label={`Empty state: ${title}`}
      {...props}
    >
      <div className="flex flex-col items-center space-y-4">
        {illustration ? (
          <div className="w-32 h-32 flex items-center justify-center">
            {illustration}
          </div>
        ) : Icon ? (
          <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center">
            <Icon
              className="w-8 h-8 text-muted-foreground/60"
              aria-hidden="true"
            />
          </div>
        ) : null}

        <div className="space-y-2 max-w-md">
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {(primaryAction || secondaryAction) && (
          <>
            {showDivider && <div className="w-24 h-px bg-border" />}
            <div className="flex flex-col sm:flex-row gap-3">
              {primaryAction && (
                <Button
                  onClick={primaryAction.onClick}
                  variant={primaryAction.variant || "default"}
                  size="lg"
                  className="gap-2"
                >
                  {primaryAction.label}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
              {secondaryAction && (
                <Button
                  onClick={secondaryAction.onClick}
                  variant={secondaryAction.variant || "outline"}
                  size="lg"
                >
                  {secondaryAction.label}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Specialized empty state components for common e-commerce scenarios

interface EmptyCartProps {
  onContinueShopping: () => void;
  onViewWishlist?: () => void;
  className?: string;
}

function EmptyCart({
  onContinueShopping,
  onViewWishlist,
  className,
}: EmptyCartProps) {
  return (
    <EmptyState
      className={className}
      title="Your cart is empty"
      description="Looks like you haven't added anything to your cart yet. Start shopping to find amazing STEM toys and educational books!"
      icon={ShoppingCart}
      primaryAction={{
        label: "Start Shopping",
        onClick: onContinueShopping,
      }}
      secondaryAction={
        onViewWishlist
          ? {
              label: "View Wishlist",
              onClick: onViewWishlist,
              variant: "outline",
            }
          : undefined
      }
      showDivider
    />
  );
}

interface EmptyWishlistProps {
  onBrowseProducts: () => void;
  className?: string;
}

function EmptyWishlist({ onBrowseProducts, className }: EmptyWishlistProps) {
  return (
    <EmptyState
      className={className}
      title="Your wishlist is empty"
      description="Save items you love for later! Add products to your wishlist to keep track of your favorites."
      icon={Heart}
      primaryAction={{
        label: "Browse Products",
        onClick: onBrowseProducts,
      }}
    />
  );
}

interface EmptySearchProps {
  query?: string;
  onClearFilters?: () => void;
  onBrowseCategories: () => void;
  className?: string;
}

function EmptySearch({
  query,
  onClearFilters,
  onBrowseCategories,
  className,
}: EmptySearchProps) {
  return (
    <EmptyState
      className={className}
      title={query ? `No results for "${query}"` : "No results found"}
      description="We couldn't find any products matching your search. Try adjusting your filters or browse our categories."
      icon={Search}
      primaryAction={{
        label: "Browse Categories",
        onClick: onBrowseCategories,
      }}
      secondaryAction={
        onClearFilters
          ? {
              label: "Clear Filters",
              onClick: onClearFilters,
              variant: "outline",
            }
          : undefined
      }
    />
  );
}

interface EmptyOrdersProps {
  onStartShopping: () => void;
  className?: string;
}

function EmptyOrders({ onStartShopping, className }: EmptyOrdersProps) {
  return (
    <EmptyState
      className={className}
      title="No orders yet"
      description="You haven't placed any orders with us yet. Start shopping to see your order history here!"
      icon={Package}
      primaryAction={{
        label: "Start Shopping",
        onClick: onStartShopping,
      }}
    />
  );
}

interface EmptyDigitalLibraryProps {
  onBrowseBooks: () => void;
  onLearnMore?: () => void;
  className?: string;
}

function EmptyDigitalLibrary({
  onBrowseBooks,
  onLearnMore,
  className,
}: EmptyDigitalLibraryProps) {
  return (
    <EmptyState
      className={className}
      title="Your digital library is empty"
      description="Purchase digital books and educational content to build your learning library. Access your content anytime, anywhere!"
      icon={BookOpen}
      primaryAction={{
        label: "Browse Digital Books",
        onClick: onBrowseBooks,
      }}
      secondaryAction={
        onLearnMore
          ? {
              label: "Learn More",
              onClick: onLearnMore,
              variant: "outline",
            }
          : undefined
      }
    />
  );
}

interface EmptyReviewsProps {
  onWriteReview: () => void;
  className?: string;
}

function EmptyReviews({ onWriteReview, className }: EmptyReviewsProps) {
  return (
    <EmptyState
      className={className}
      title="No reviews yet"
      description="Be the first to share your experience with this product! Your review helps other customers make informed decisions."
      icon={Star}
      primaryAction={{
        label: "Write a Review",
        onClick: onWriteReview,
      }}
      variant="secondary"
      size="sm"
    />
  );
}

interface EmptyAddressesProps {
  onAddAddress: () => void;
  className?: string;
}

function EmptyAddresses({ onAddAddress, className }: EmptyAddressesProps) {
  return (
    <EmptyState
      className={className}
      title="No saved addresses"
      description="Add your shipping addresses to make checkout faster and easier."
      icon={MapPin}
      primaryAction={{
        label: "Add Address",
        onClick: onAddAddress,
      }}
      size="sm"
    />
  );
}

interface EmptyPaymentMethodsProps {
  onAddPaymentMethod: () => void;
  className?: string;
}

function EmptyPaymentMethods({
  onAddPaymentMethod,
  className,
}: EmptyPaymentMethodsProps) {
  return (
    <EmptyState
      className={className}
      title="No payment methods saved"
      description="Save your payment methods for quick and secure checkout."
      icon={CreditCard}
      primaryAction={{
        label: "Add Payment Method",
        onClick: onAddPaymentMethod,
      }}
      size="sm"
    />
  );
}

interface EmptyCommentsProps {
  onAddComment: () => void;
  className?: string;
}

function EmptyComments({ onAddComment, className }: EmptyCommentsProps) {
  return (
    <EmptyState
      className={className}
      title="No comments yet"
      description="Start the conversation! Share your thoughts and engage with the community."
      icon={MessageCircle}
      primaryAction={{
        label: "Add Comment",
        onClick: onAddComment,
      }}
      size="sm"
    />
  );
}

interface EmptyDownloadsProps {
  onBrowseDigital: () => void;
  className?: string;
}

function EmptyDownloads({ onBrowseDigital, className }: EmptyDownloadsProps) {
  return (
    <EmptyState
      className={className}
      title="No downloads available"
      description="You don't have any digital downloads yet. Purchase digital content to access downloadable materials."
      icon={Download}
      primaryAction={{
        label: "Browse Digital Content",
        onClick: onBrowseDigital,
      }}
    />
  );
}

interface EmptyBlogProps {
  onCreatePost?: () => void;
  onSuggestTopic?: () => void;
  className?: string;
  isAdmin?: boolean;
}

function EmptyBlog({
  onCreatePost,
  onSuggestTopic,
  className,
  isAdmin = false,
}: EmptyBlogProps) {
  return (
    <EmptyState
      className={className}
      title="No blog posts yet"
      description={
        isAdmin
          ? "Get started by creating your first blog post to share insights and engage with your audience."
          : "We're working on exciting content for you! Check back soon for the latest updates and insights."
      }
      icon={FileText}
      primaryAction={
        isAdmin && onCreatePost
          ? {
              label: "Create First Post",
              onClick: onCreatePost,
            }
          : onSuggestTopic
            ? {
                label: "Suggest a Topic",
                onClick: onSuggestTopic,
                variant: "outline",
              }
            : undefined
      }
    />
  );
}

interface EmptyNotificationsProps {
  onSettings?: () => void;
  className?: string;
}

function EmptyNotifications({
  onSettings,
  className,
}: EmptyNotificationsProps) {
  return (
    <EmptyState
      className={className}
      title="No notifications"
      description="You're all caught up! We'll notify you of important updates and activity."
      icon={FileText}
      secondaryAction={
        onSettings
          ? {
              label: "Notification Settings",
              onClick: onSettings,
              variant: "outline",
            }
          : undefined
      }
      size="sm"
    />
  );
}

export {
  EmptyState,
  EmptyCart,
  EmptyWishlist,
  EmptySearch,
  EmptyOrders,
  EmptyDigitalLibrary,
  EmptyReviews,
  EmptyAddresses,
  EmptyPaymentMethods,
  EmptyComments,
  EmptyDownloads,
  EmptyBlog,
  EmptyNotifications,
  emptyStateVariants,
  type EmptyStateProps,
  type EmptyCartProps,
  type EmptyWishlistProps,
  type EmptySearchProps,
  type EmptyOrdersProps,
  type EmptyDigitalLibraryProps,
  type EmptyReviewsProps,
  type EmptyAddressesProps,
  type EmptyPaymentMethodsProps,
  type EmptyCommentsProps,
  type EmptyDownloadsProps,
  type EmptyBlogProps,
  type EmptyNotificationsProps,
};
