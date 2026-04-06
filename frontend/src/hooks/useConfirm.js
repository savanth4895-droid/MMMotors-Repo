import { useState, useCallback, useRef } from 'react';

/**
 * useConfirm — drop-in replacement for window.confirm using ConfirmDialog.
 *
 * Usage:
 *   const { confirm, ConfirmDialogComponent } = useConfirm();
 *
 *   // In JSX: render <ConfirmDialogComponent />
 *   // In handler:
 *   const ok = await confirm({ title: 'Delete?', description: '...', confirmLabel: 'Delete' });
 *   if (!ok) return;
 */
export function useConfirm() {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState({});
  const resolveRef = useRef(null);

  const confirm = useCallback((options = {}) => {
    setOpts(options);
    setOpen(true);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setOpen(false);
    resolveRef.current?.(true);
  }, []);

  const handleCancel = useCallback(() => {
    setOpen(false);
    resolveRef.current?.(false);
  }, []);

  // Returns a ready-to-render JSX element — just drop it anywhere in the component tree
  const ConfirmDialogComponent = () => {
    // Lazy import to avoid circular deps — ConfirmDialog only renders when needed
    const ConfirmDialog = require('../components/ConfirmDialog').default;
    return (
      <ConfirmDialog
        open={open}
        onOpenChange={(v) => { if (!v) handleCancel(); }}
        title={opts.title || 'Are you sure?'}
        description={opts.description || 'This action cannot be undone.'}
        confirmLabel={opts.confirmLabel || 'Confirm'}
        cancelLabel={opts.cancelLabel || 'Cancel'}
        variant={opts.variant || 'destructive'}
        onConfirm={handleConfirm}
        loading={opts.loading || false}
      />
    );
  };

  return { confirm, ConfirmDialogComponent };
}
