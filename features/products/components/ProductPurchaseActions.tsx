"use client";

import { ShoppingCart, Check } from "lucide-react";
import React, { useEffect, useId, useRef, useState } from "react";

import { formatPrice } from "@/lib/email/base";
import { cn } from "@/lib/utils";

import {
  collectStickyEndNodes,
  endRegionHidesSticky,
  shouldShowStickyPurchaseBar,
} from "../lib/sticky-purchase-bar";

interface ProductPurchaseActionsProps {
  productName: string;
  price: number;
  isOutOfStock: boolean;
  isAdding: boolean;
  justAdded: boolean;
  onAdd: () => void;
  buttonRef?: React.Ref<HTMLButtonElement>;
}

const COOKIE_SELECTORS = [
  "#cookie-banner",
  "#cookiebot",
  "#CybotCookiebotDialog",
  "#onetrust-banner-sdk",
  ".cookie-banner",
  ".cookie-consent",
  "[data-cookie-banner]",
  "[data-cookie-consent]",
].join(",");

const CHAT_SELECTORS = [
  "#chat-widget",
  "#tidio-chat",
  "#crisp-chatbox",
  ".crisp-client",
  "#tawkchat-container",
  "[data-chat-widget]",
  "iframe[title*='chat' i]",
  "iframe[title*='messenger' i]",
].join(",");

function measureBottomObstructions(): { offset: number; chatClearance: boolean } {
  if (typeof document === "undefined") {
    return { offset: 0, chatClearance: false };
  }

  let offset = 0;
  document.querySelectorAll(COOKIE_SELECTORS).forEach(node => {
    if (!(node instanceof HTMLElement)) return;
    const rect = node.getBoundingClientRect();
    if (rect.height < 24 || rect.width < 120) return;
    const anchoredToBottom = rect.bottom >= window.innerHeight - 12;
    if (anchoredToBottom && rect.top < window.innerHeight) {
      offset = Math.max(offset, Math.round(window.innerHeight - rect.top));
    }
  });

  let chatClearance = false;
  document.querySelectorAll(CHAT_SELECTORS).forEach(node => {
    if (!(node instanceof HTMLElement)) return;
    const rect = node.getBoundingClientRect();
    if (rect.width < 24 || rect.height < 24) return;
    const nearRight = rect.right > window.innerWidth - 140;
    const nearBottom = rect.bottom > window.innerHeight - 180;
    if (nearRight && nearBottom) chatClearance = true;
  });

  return { offset, chatClearance };
}

function buttonLabel(isOutOfStock: boolean, isAdding: boolean, justAdded: boolean) {
  if (isOutOfStock) return "Stoc epuizat";
  if (justAdded) return "Adăugat în coș";
  if (isAdding) return "Se adaugă…";
  return "Adaugă în coș";
}

export function ProductPurchaseActions({
  productName,
  price,
  isOutOfStock,
  isAdding,
  justAdded,
  onAdd,
  buttonRef,
}: ProductPurchaseActionsProps) {
  const label = buttonLabel(isOutOfStock, isAdding, justAdded);
  const priceLabel = formatPrice(price);
  const statusId = useId();
  const [showSticky, setShowSticky] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(0);
  const [chatClearance, setChatClearance] = useState(false);
  const anchorRef = useRef<HTMLButtonElement | null>(null);

  const setAnchor = (node: HTMLButtonElement | null) => {
    anchorRef.current = node;
    if (typeof buttonRef === "function") {
      buttonRef(node);
    } else if (buttonRef && "current" in buttonRef) {
      (buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current =
        node;
    }
  };

  useEffect(() => {
    if (isOutOfStock) {
      setShowSticky(false);
      return undefined;
    }
    const button = anchorRef.current;
    if (!button || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const mobileQuery = window.matchMedia("(max-width: 767px)");
    let buttonVisible = true;
    let endRegionActive = false;
    const endState = new Map<Element, boolean>();

    const syncSticky = () => {
      setShowSticky(
        shouldShowStickyPurchaseBar({
          isMobile: mobileQuery.matches,
          isOutOfStock: false,
          buyButtonVisible: buttonVisible,
          endRegionActive,
        })
      );
    };

    const buttonObserver = new IntersectionObserver(
      ([entry]) => {
        buttonVisible = entry.isIntersecting;
        syncSticky();
      },
      { threshold: 0.15 }
    );
    buttonObserver.observe(button);

    const endObserver = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          endState.set(entry.target, endRegionHidesSticky(entry));
        }
        endRegionActive = Array.from(endState.values()).some(Boolean);
        syncSticky();
      },
      { threshold: [0, 0.08] }
    );

    // The layout footer is mounted later with ssr:false. Re-attach when it appears,
    // and also watch the PDP sentinel that is in the document from the first paint.
    const attachEndRegions = () => {
      let changed = false;
      for (const node of collectStickyEndNodes(document)) {
        if (endState.has(node)) continue;
        const rect = node.getBoundingClientRect();
        const inView =
          rect.height > 0 && rect.top < window.innerHeight && rect.bottom > 0;
        endState.set(
          node,
          endRegionHidesSticky({
            isIntersecting: inView,
            boundingClientRect: rect,
          })
        );
        endObserver.observe(node);
        changed = true;
      }
      if (!changed) return;
      endRegionActive = Array.from(endState.values()).some(Boolean);
      syncSticky();
    };
    attachEndRegions();

    const refreshObstructions = () => {
      const next = measureBottomObstructions();
      setBottomOffset(next.offset);
      setChatClearance(next.chatClearance);
    };
    refreshObstructions();

    const mutationObserver =
      typeof MutationObserver === "undefined"
        ? null
        : new MutationObserver(() => {
            refreshObstructions();
            attachEndRegions();
          });
    mutationObserver?.observe(document.body, {
      childList: true,
      subtree: true,
    });

    let frame = 0;
    const refreshOnScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        refreshObstructions();
      });
    };

    mobileQuery.addEventListener("change", syncSticky);
    window.addEventListener("resize", refreshObstructions);
    window.addEventListener("scroll", refreshOnScroll, { passive: true });

    return () => {
      buttonObserver.disconnect();
      endObserver.disconnect();
      mutationObserver?.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      mobileQuery.removeEventListener("change", syncSticky);
      window.removeEventListener("resize", refreshObstructions);
      window.removeEventListener("scroll", refreshOnScroll);
    };
  }, [isOutOfStock]);

  const buttonClass = cn(
    "inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-base font-semibold transition",
    "disabled:cursor-not-allowed",
    isOutOfStock
      ? "border border-slate-200 bg-slate-100 text-slate-500"
      : justAdded
        ? "bg-emerald-600 text-white"
        : "bg-[#0b1220] text-white shadow-[0_12px_24px_-16px_rgba(15,23,42,0.9)] hover:bg-blue-600"
  );

  return (
    <>
      <button
        ref={setAnchor}
        type="button"
        data-testid="add-to-cart"
        className={buttonClass}
        onClick={onAdd}
        disabled={isOutOfStock || isAdding || justAdded}
        aria-describedby={statusId}
      >
        {justAdded ? (
          <Check className="h-5 w-5" aria-hidden />
        ) : (
          <ShoppingCart className="h-5 w-5" aria-hidden />
        )}
        <span>{label}</span>
      </button>
      <p id={statusId} className="sr-only">
        {label}
      </p>

      {showSticky ? (
        <div
          data-testid="pdp-sticky-add-to-cart"
          className="fixed inset-x-0 z-30 border-t border-slate-200 bg-white/95 shadow-[0_-12px_30px_-24px_rgba(15,23,42,0.65)] backdrop-blur md:hidden"
          style={{
            bottom: bottomOffset,
            paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))",
          }}
        >
          <div
            className="mx-auto flex max-w-3xl items-center gap-3 px-3 pt-2.5"
            style={{ paddingRight: chatClearance ? "4.75rem" : undefined }}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-950" title={productName}>
                {productName}
              </p>
              <p className="text-sm font-bold text-slate-900">{priceLabel}</p>
            </div>
            <button
              type="button"
              className={cn(buttonClass, "w-auto shrink-0 px-4 py-2.5 text-sm")}
              onClick={onAdd}
              disabled={isAdding || justAdded}
            >
              {label}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
