export type ActionResult<T = void> =
  | { success: true; data: T }
  | {
      success: false;
      errors: { _form?: string; [key: string]: string | undefined };
    };
