import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { analyzeDocumentImage } from "@/services/groq";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TravelDocument, DocumentCategory } from "@/types/models";
import { Upload, Trash2, FileText } from "lucide-react";

const BUCKET = "documents";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function DocumentsSection({ tripId }: { tripId: string }) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<TravelDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const { data } = await supabase
      .from("documents")
      .select("*")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: false });
    const docs = (data as TravelDocument[]) ?? [];
    setDocuments(docs);
    setLoading(false);

    const urlEntries = await Promise.all(
      docs.map(async (d) => {
        const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(d.file_path, 3600);
        return [d.id, signed?.signedUrl ?? ""] as const;
      })
    );
    setUrls(Object.fromEntries(urlEntries));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setError(null);
    setUploading(true);

    try {
      const path = `${user.id}/${tripId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);
      if (uploadError) throw uploadError;

      let extractedText: string | null = null;
      let aiSummary: string | null = null;
      let category: DocumentCategory = "other";
      let visionErrorMessage: string | null = null;

      if (file.type.startsWith("image/")) {
        try {
          const base64 = await fileToBase64(file);
          const analysis = await analyzeDocumentImage(base64, file.type);
          extractedText = analysis.extractedText;
          aiSummary = analysis.summary;
          category = analysis.suggestedCategory;
        } catch (visionErr) {
          // The file still gets saved even if vision analysis fails — but we
          // surface the reason instead of hiding it, since this is almost
          // always a Groq model deprecation and silently failing makes that
          // impossible to diagnose.
          visionErrorMessage =
            visionErr instanceof Error ? visionErr.message : "AI analysis failed for an unknown reason.";
          console.error("Vision analysis failed:", visionErr);
        }
      }

      const { error: insertError } = await supabase.from("documents").insert({
        trip_id: tripId,
        user_id: user.id,
        file_path: path,
        file_name: file.name,
        category,
        extracted_text: extractedText,
        ai_summary: aiSummary,
      });
      if (insertError) throw insertError;

      if (visionErrorMessage) {
        setError(`File uploaded, but AI analysis failed: ${visionErrorMessage}`);
      }

      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(doc: TravelDocument) {
    await supabase.storage.from(BUCKET).remove([doc.file_path]);
    await supabase.from("documents").delete().eq("id", doc.id);
    load();
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Travel documents</CardTitle>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="doc-upload"
          />
          <label
            htmlFor="doc-upload"
            className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-border bg-transparent px-3 text-sm font-medium hover:bg-secondary"
          >
            <Upload className="mr-1 h-4 w-4" />
            {uploading ? "Uploading..." : "Upload"}
          </label>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-xs text-muted-foreground">
          Upload passports, visas, tickets, hotel bookings, or receipts. Images are automatically
          OCR'd and summarized with Groq Vision.
        </p>
        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="rounded-md border border-border p-3">
                <div className="flex items-start justify-between">
                  <a
                    href={urls[doc.id]}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 font-medium hover:underline"
                  >
                    <FileText className="h-4 w-4 text-accent" />
                    {doc.file_name}
                  </a>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">
                      {doc.category.replace("_", " ")}
                    </span>
                    <button onClick={() => handleDelete(doc)} aria-label="Delete document">
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                    </button>
                  </div>
                </div>
                {doc.ai_summary && (
                  <p className="mt-2 text-sm text-muted-foreground">{doc.ai_summary}</p>
                )}
                {doc.extracted_text && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-accent">
                      View extracted text
                    </summary>
                    <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
                      {doc.extracted_text}
                    </p>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
