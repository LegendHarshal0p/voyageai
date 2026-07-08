// Supabase Edge Function: send-email
// Deploy with: supabase functions deploy send-email
// Set the Resend key with: supabase secrets set RESEND_API_KEY=re_xxx
//
// Invoke from the client with:
//   await supabase.functions.invoke('send-email', {
//     body: { template: 'welcome', to: 'user@example.com', params: { fullName: 'Alex' } }
//   })

import {
  welcomeEmail,
  tripConfirmationEmail,
  tripReminderEmail,
  packingReminderEmail,
  tripSharedEmail,
  monthlySummaryEmail,
} from "./templates.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_ADDRESS = "VoyageAI <hello@voyageai.example>";

type TemplateName =
  | "welcome"
  | "trip_confirmation"
  | "trip_reminder"
  | "packing_reminder"
  | "trip_shared"
  | "monthly_summary";

function renderTemplate(template: TemplateName, params: Record<string, unknown>) {
  switch (template) {
    case "welcome":
      return { subject: "Welcome to VoyageAI", html: welcomeEmail(params.fullName as string) };
    case "trip_confirmation":
      return {
        subject: `Trip confirmed: ${params.tripTitle}`,
        html: tripConfirmationEmail(params as any),
      };
    case "trip_reminder":
      return {
        subject: `Upcoming trip: ${params.tripTitle}`,
        html: tripReminderEmail(params as any),
      };
    case "packing_reminder":
      return { subject: "Packing reminder", html: packingReminderEmail(params as any) };
    case "trip_shared":
      return {
        subject: `${params.sharedByName} shared a trip with you`,
        html: tripSharedEmail(params as any),
      };
    case "monthly_summary":
      return {
        subject: `Your ${params.month} travel summary`,
        html: monthlySummaryEmail(params as any),
      };
    default:
      throw new Error(`Unknown template: ${template}`);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), { status: 500 });
  }

  try {
    const { template, to, params } = await req.json();
    if (!template || !to) {
      return new Response(JSON.stringify({ error: "Missing template or to" }), { status: 400 });
    }

    const { subject, html } = renderTemplate(template as TemplateName, params ?? {});

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html }),
    });

    if (!resendResponse.ok) {
      const text = await resendResponse.text();
      return new Response(JSON.stringify({ error: `Resend error: ${text}` }), { status: 502 });
    }

    const data = await resendResponse.json();
    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});
