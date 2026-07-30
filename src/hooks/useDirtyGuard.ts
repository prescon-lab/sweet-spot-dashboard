import { useCallback, useEffect, useState } from "react";
import { confirmDiscardChanges } from "@/lib/confirmClose";

/**
 * Tracks whether a dialog has unsaved edits so the "close without saving"
 * confirmation only shows up when there really are changes.
 *
 * Spread `containerProps` on the dialog content: any input/textarea/select
 * change (or checkbox/switch click) inside it flags the dialog as dirty.
 */
export function useDirtyGuard(open: boolean) {
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (open) setDirty(false);
  }, [open]);

  const markDirty = useCallback(() => setDirty(true), []);
  const markClean = useCallback(() => setDirty(false), []);

  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest?.('[role="checkbox"], [role="switch"], [role="radio"]')) {
      setDirty(true);
    }
  }, []);

  const containerProps = {
    onInputCapture: markDirty,
    onChangeCapture: markDirty,
    onClickCapture: handleClickCapture,
  };

  /** Use as the Dialog's onOpenChange. Confirms only when dirty. */
  const guardOpenChange = useCallback(
    (onOpenChange: (open: boolean) => void) => (next: boolean) => {
      if (next) {
        onOpenChange(true);
        return;
      }
      if (!dirty || confirmDiscardChanges()) {
        setDirty(false);
        onOpenChange(false);
      }
    },
    [dirty],
  );

  /** Use on explicit "close without saving" buttons. */
  const requestClose = useCallback(
    (onOpenChange: (open: boolean) => void) => {
      if (!dirty || confirmDiscardChanges()) {
        setDirty(false);
        onOpenChange(false);
      }
    },
    [dirty],
  );

  return { dirty, markDirty, markClean, containerProps, guardOpenChange, requestClose };
}
