import { useRef, useState } from "react";
import { FileText, ImageIcon, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type PendingFile = {
  id: string;
  file: File;
  progress: number;
  previewUrl?: string | undefined;
  error?: string | undefined;
};

const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/heic", "application/pdf"];
const MAX_SIZE = 20 * 1024 * 1024;

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploader({
  files,
  onChange,
  disabled,
}: {
  files: PendingFile[];
  onChange: (next: PendingFile[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next: PendingFile[] = [];
    for (const file of Array.from(list)) {
      const invalid =
        !ACCEPTED.includes(file.type) && !file.name.toLowerCase().endsWith(".pdf")
          ? "Unsupported file type"
          : file.size > MAX_SIZE
            ? "File is larger than 20 MB"
            : undefined;
      next.push({
        id: crypto.randomUUID(),
        file,
        progress: 0,
        error: invalid,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      });
    }
    onChange([...files, ...next]);
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!disabled) addFiles(event.dataTransfer.files);
        }}
        className={cn(
          "surface-card flex flex-col items-center gap-3 border-dashed px-6 py-10 text-center transition-colors",
          dragging && "border-primary bg-primary-soft/60",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <div className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
          <UploadCloud className="size-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            Drag & drop your documents here
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Images and PDF files, up to 20 MB each
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
          Choose files
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {files.length > 0 ? (
        <ul className="space-y-3">
          {files.map((item) => (
            <li key={item.id} className="surface-card flex items-center gap-4 p-3">
              {item.previewUrl ? (
                <img
                  src={item.previewUrl}
                  alt={`Preview of ${item.file.name}`}
                  className="size-12 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                  {item.file.type.startsWith("image/") ? (
                    <ImageIcon className="size-5" />
                  ) : (
                    <FileText className="size-5" />
                  )}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{item.file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(item.file.size)}</p>
                {item.error ? (
                  <p className="mt-1 text-xs text-destructive">{item.error}</p>
                ) : (
                  <Progress value={item.progress} className="mt-2 h-1.5" />
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${item.file.name}`}
                onClick={() => onChange(files.filter((entry) => entry.id !== item.id))}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}