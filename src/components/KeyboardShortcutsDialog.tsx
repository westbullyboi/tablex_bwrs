import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
const modKey = isMac ? "⌘" : "Ctrl";

const shortcuts = [
  {
    keys: `${modKey} + Enter`,
    description: "Generate SQL from AI prompt",
    context: "AI Query Bar",
  },
  { keys: "Enter", description: "Save cell edit", context: "Cell Editing" },
  { keys: "Escape", description: "Cancel cell edit", context: "Cell Editing" },
  {
    keys: "Double-click",
    description: "Edit cell / Open table",
    context: "Table",
  },
];

export function KeyboardShortcutsDialog({
  isOpen,
  onClose,
}: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.keys}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex-1">
                <div className="text-[13px]">{shortcut.description}</div>
                <div className="text-[11px] text-[hsl(var(--muted-foreground))]">
                  {shortcut.context}
                </div>
              </div>
              <kbd className="shrink-0 rounded-[var(--radius-sm)] border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-2 py-1 font-[var(--font-mono)] text-[11px]">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
