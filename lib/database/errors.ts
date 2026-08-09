import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Normalized data-layer error so callers do not depend on Supabase error shapes.
 */
export class DatabaseError extends Error {
  readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "DatabaseError";
    this.cause = cause;
  }
}

type QueryResult<T> = {
  data: T;
  error: PostgrestError | null;
};

/** Throw when a Supabase query fails; return data as-is (may be null). */
export function unwrapQuery<T>(result: QueryResult<T>): T {
  if (result.error) {
    throw new DatabaseError(result.error.message, result.error);
  }

  return result.data;
}

/** Like unwrapQuery, but reject null/undefined rows from `.single()`. */
export function unwrapSingle<T>(
  result: QueryResult<T>,
  message = "Expected a single row from Supabase"
): NonNullable<T> {
  const data = unwrapQuery(result);

  if (data == null) {
    throw new DatabaseError(message);
  }

  return data;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
}
