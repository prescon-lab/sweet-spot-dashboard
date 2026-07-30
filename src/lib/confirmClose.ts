export const CONFIRM_CLOSE_MESSAGE = "Tem certeza que quer fechar sem salvar?";

/** Returns true when the user confirms closing without saving. */
export function confirmDiscardChanges(): boolean {
  if (typeof window === "undefined") return true;
  return window.confirm(CONFIRM_CLOSE_MESSAGE);
}

/**
 * Wraps an onOpenChange handler so that closing the dialog asks for
 * confirmation first. Opening is always allowed.
 */
export function withCloseConfirmation(
  onOpenChange: (open: boolean) => void,
): (open: boolean) => void {
  return (open: boolean) => {
    if (open) {
      onOpenChange(true);
      return;
    }
    if (confirmDiscardChanges()) onOpenChange(false);
  };
}
