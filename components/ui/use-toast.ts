// Inspired by react-hot-toast library
"use client";

import * as React from "react";

import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 5000;

type ToasterToast = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "success" | "warning" | "info";
  duration?: number;
  dismissible?: boolean;
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  className?: string;
  style?: React.CSSProperties;
  icon?: React.ReactNode;
  onDismiss?: () => void;
  onAction?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
  CLEAR_TOASTS: "CLEAR_TOASTS",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["CLEAR_TOASTS"];
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      // Toast to dismiss is either passed or is the first toast
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    case "CLEAR_TOASTS":
      toastTimeouts.forEach((timeout) => clearTimeout(timeout));
      toastTimeouts.clear();
      return {
        ...state,
        toasts: [],
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

interface Toast extends Omit<ToasterToast, "id"> {}

function toast(props: Toast) {
  const id = genId();

  const update = (props: Partial<ToasterToast>) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
  
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  const toastData: ToasterToast = {
    ...props,
    id,
    open: true,
    onOpenChange: (open) => {
      if (!open) dismiss();
    },
    dismissible: props.dismissible !== false,
  };

  dispatch({
    type: "ADD_TOAST",
    toast: toastData,
  });

  return {
    id,
    dismiss,
    update,
  };
}

// Convenience methods for different toast types
function toastSuccess(
  title: string,
  description?: string,
  options?: Omit<Toast, "title" | "description" | "variant">
) {
  return toast({
    title,
    description,
    variant: "success",
    ...options,
  });
}

function toastError(
  title: string,
  description?: string,
  options?: Omit<Toast, "title" | "description" | "variant">
) {
  return toast({
    title,
    description,
    variant: "destructive",
    ...options,
  });
}

function toastWarning(
  title: string,
  description?: string,
  options?: Omit<Toast, "title" | "description" | "variant">
) {
  return toast({
    title,
    description,
    variant: "warning",
    ...options,
  });
}

function toastInfo(
  title: string,
  description?: string,
  options?: Omit<Toast, "title" | "description" | "variant">
) {
  return toast({
    title,
    description,
    variant: "info",
    ...options,
  });
}

function toastLoading(
  title: string,
  description?: string,
  options?: Omit<Toast, "title" | "description" | "variant">
) {
  return toast({
    title,
    description,
    variant: "default",
    duration: 0, // Don't auto-dismiss loading toasts
    dismissible: false,
    ...options,
  });
}

function toastPromise<T>(
  promise: Promise<T>,
  {
    loading,
    success,
    error,
  }: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  }
) {
  const toastId = toastLoading(loading);

  promise
    .then((data) => {
      toastId.update({
        title: typeof success === "function" ? success(data) : success,
        variant: "success",
        duration: 4000,
        dismissible: true,
      });
    })
    .catch((error) => {
      toastId.update({
        title: typeof error === "function" ? error(error) : error,
        variant: "destructive",
        duration: 4000,
        dismissible: true,
      });
    });

  return toastId;
}

function dismiss(toastId?: string) {
  dispatch({
    type: "DISMISS_TOAST",
    toastId,
  });
}

function clearToasts() {
  dispatch({
    type: "CLEAR_TOASTS",
  });
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    toastSuccess,
    toastError,
    toastWarning,
    toastInfo,
    toastLoading,
    toastPromise,
    dismiss,
    clearToasts,
  };
}

export { useToast, toast, toastSuccess, toastError, toastWarning, toastInfo, toastLoading, toastPromise, dismiss, clearToasts };
export type { ToasterToast, Toast };
