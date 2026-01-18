import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImagePlus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { CreateNoteInput } from "@/types/Note";

interface NoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (note: CreateNoteInput) => void;
}

function getCurrentUTCDate(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentUTCTime(): string {
  const now = new Date();
  const hours = String(now.getUTCHours()).padStart(2, "0");
  const minutes = String(now.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function NoteModal({ open, onOpenChange, onSave }: NoteModalProps) {
  const [text, setText] = useState("");
  const [imageData, setImageData] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    if (!text.trim()) return;

    const note: CreateNoteInput = {
      dateUTC: getCurrentUTCDate(),
      timeUTC: getCurrentUTCTime(),
      text: text.trim().slice(0, 500),
      imageData,
      createdAt: new Date().toISOString(),
    };

    onSave(note);
    setText("");
    setImageData(undefined);
    onOpenChange(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageData(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageData(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    setText("");
    setImageData(undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
          <DialogDescription>
            Create a quick note. Current UTC time will be captured automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="note-text">Note (max 500 characters)</Label>
            <Textarea
              id="note-text"
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 500))}
              placeholder="Enter your note..."
              rows={4}
              className="mt-1"
              dir="auto"
              data-testid="input-home-note-text"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {text.length}/500 characters
            </p>
          </div>

          <div>
            <Label>Image (optional)</Label>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageSelect}
              className="hidden"
              data-testid="input-home-note-image"
            />
            {imageData ? (
              <div className="relative mt-2 inline-block">
                <img
                  src={imageData}
                  alt="Attached"
                  className="max-h-32 rounded-md border"
                  data-testid="preview-note-image"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={handleRemoveImage}
                  data-testid="button-remove-image"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 gap-2"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-attach-image"
              >
                <ImagePlus className="w-4 h-4" />
                Attach Image
              </Button>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} data-testid="button-cancel-home-note">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!text.trim()} data-testid="button-save-home-note">
              Save Note
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
