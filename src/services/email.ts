import { supabase } from "@/lib/supabase";

type EmailTemplate =
  | "welcome"
  | "trip_confirmation"
  | "trip_reminder"
  | "packing_reminder"
  | "trip_shared"
  | "monthly_summary";

/**
 * Sends an email via the `send-email` Supabase Edge Function, which calls Resend
 * server-side (the Resend API key must never be exposed to the client).
 * Requires the edge function to be deployed and RESEND_API_KEY configured as a secret.
 */
export async function sendEmail(
  template: EmailTemplate,
  to: string,
  params: Record<string, unknown>
): Promise<{ error: string | null }> {
  const { error } = await supabase.functions.invoke("send-email", {
    body: { template, to, params },
  });

  if (error) {
    console.error("Failed to send email:", error);
    return { error: error.message };
  }

  return { error: null };
}
