import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface FixedAlarmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FixedAlarmModal({ open, onOpenChange }: FixedAlarmModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="fixed-alarm-modal">
        <DialogHeader>
          <DialogTitle data-testid="text-modal-title">Alert triggered</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground" data-testid="text-modal-description">
              <p>
                This alert was triggered, but system notifications and sounds are limited in the web (PWA) version, especially on iOS.
              </p>
              <p>
                If you did not hear a sound or receive a system notification, this is a platform limitation — not an app issue.
              </p>
              <p>
                For reliable alerts, the native mobile app will be required.
              </p>
              <p>
                You can keep the app open for better reliability.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            data-testid="button-modal-ok"
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
