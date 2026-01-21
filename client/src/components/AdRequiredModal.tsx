import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

interface AdRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  onContinue: () => void;
  onCancel: () => void;
}

export function AdRequiredModal({
  open,
  onOpenChange,
  title,
  message,
  onContinue,
  onCancel,
}: AdRequiredModalProps) {
  function handleContinue() {
    onOpenChange(false);
    onContinue();
  }

  function handleCancel() {
    onOpenChange(false);
    onCancel();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" data-testid="ad-required-modal">
        <DialogHeader>
          <DialogTitle data-testid="text-ad-modal-title">{title}</DialogTitle>
          <DialogDescription data-testid="text-ad-modal-message">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            data-testid="button-ad-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleContinue}
            data-testid="button-ad-continue"
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
