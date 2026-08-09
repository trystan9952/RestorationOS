import { getErrorMessage } from "@/lib/database/errors";
import type { AsyncStatus } from "@/types";

type AsyncPatch = {
  status: AsyncStatus;
  error: string | null;
  [key: string]: unknown;
};

type SetAsyncState = (partial: AsyncPatch) => void;

/**
 * Shared loading/error envelope for Zustand async actions.
 * Keeps entity-specific success updates in each action while centralizing status transitions.
 */
export async function runAsyncAction<T>(
  set: SetAsyncState,
  action: () => Promise<T>,
  preload?: Omit<AsyncPatch, "status" | "error">
): Promise<T> {
  set({ status: "loading", error: null, ...preload });

  try {
    return await action();
  } catch (error) {
    set({ status: "error", error: getErrorMessage(error) });
    throw error;
  }
}
