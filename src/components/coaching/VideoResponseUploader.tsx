// Coach video response: upload to private Supabase Storage bucket
// (coach-response-videos/{memberUserId}/{checkInId}.ext) or paste a private link.
import { useRef, useState } from "react";
import { Upload, Link2, X, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const MAX_MB = 250;
const ALLOWED = ["video/mp4", "video/quicktime", "video/webm"];

export function VideoResponseUploader({ memberUserId, checkInId, videoPath, videoUrl, onChange }: {
  memberUserId: string;
  checkInId: string;
  videoPath: string | null;
  videoUrl: string | null;
  onChange: (v: { video_storage_path: string | null; video_url: string | null }) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [link, setLink] = useState(videoUrl ?? "");

  const upload = async (file: File) => {
    if (!ALLOWED.includes(file.type)) return toast({ title: "Unsupported format", description: "Use MP4, MOV, or WebM.", variant: "destructive" });
    if (file.size > MAX_MB * 1024 * 1024) return toast({ title: "File too large", description: `Max ${MAX_MB}MB.`, variant: "destructive" });
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "mp4";
      const path = `${memberUserId}/${checkInId}.${ext}`;
      const { error } = await supabase.storage.from("coach-response-videos").upload(path, file, { upsert: true });
      if (error) throw error;
      onChange({ video_storage_path: path, video_url: null });
      toast({ title: "Video uploaded" });
    } catch (e) {
      toast({ title: "Upload failed", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const hasVideo = !!videoPath || !!videoUrl;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h3 className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5"><Video className="h-3.5 w-3.5" /> Video Response (optional)</h3>
      {hasVideo ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-primary truncate">{videoPath ?? videoUrl}</span>
          <button onClick={() => onChange({ video_storage_path: null, video_url: null })} aria-label="Remove video">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <>
          <button disabled={uploading} onClick={() => fileRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:border-primary/50">
            <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : `Upload video (MP4/MOV/WebM, ≤${MAX_MB}MB)`}
          </button>
          <input ref={fileRef} type="file" accept={ALLOWED.join(",")} className="hidden"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-lg border border-border px-2.5">
              <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Or paste a private video link"
                className="w-full bg-transparent py-2 text-sm focus:outline-none" />
            </div>
            <button onClick={() => link.trim() && onChange({ video_storage_path: null, video_url: link.trim() })}
              className="px-3 rounded-lg border border-border text-xs text-muted-foreground">Attach</button>
          </div>
        </>
      )}
    </div>
  );
}
