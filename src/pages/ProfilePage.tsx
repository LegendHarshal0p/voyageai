import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Profile } from "@/types/models";
import { Upload, User } from "lucide-react";

const BUCKET = "profile-images";

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (data) {
      setProfile(data as Profile);
      setFullName((data as Profile).full_name ?? "");
      if ((data as Profile).avatar_url) {
        const { data: signed } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl((data as Profile).avatar_url!, 3600);
        setAvatarUrl(signed?.signedUrl ?? null);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);
    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }
    setMessage("Profile updated.");
  }

  async function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setError(null);

    try {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
        upsert: true,
      });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: path })
        .eq("id", user.id);
      if (updateError) throw updateError;

      const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
      setAvatarUrl(signed?.signedUrl ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading profile...</p>;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-3xl font-semibold">Profile</h1>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-secondary">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                className="hidden"
                id="avatar-upload"
              />
              <label
                htmlFor="avatar-upload"
                className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-border px-3 text-sm font-medium hover:bg-secondary"
              >
                <Upload className="mr-1 h-4 w-4" />
                {uploading ? "Uploading..." : "Change photo"}
              </label>
            </div>
          </div>

          <form onSubmit={handleSave} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input value={user?.email ?? ""} disabled className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Full name</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {message && <p className="text-sm text-green-600">{message}</p>}
            <Button type="submit" variant="accent" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </form>

          <p className="mt-6 text-xs text-muted-foreground">
            Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
