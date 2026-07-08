// Email templates for VoyageAI, rendered as inline-styled HTML for maximum client compatibility.
// Used by the send-email Supabase Edge Function. Keep this file dependency-free (Deno-compatible).

const wrapper = (title: string, bodyHtml: string) => `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#f4f1ea;font-family:-apple-system,Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f1ea;padding:32px 0;">
      <tr>
        <td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background-color:#1b3a4b;padding:24px 32px;">
                <span style="color:#f4f1ea;font-size:20px;font-weight:600;">VoyageAI</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-size:22px;color:#1b1512;">${title}</h1>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#f4f1ea;color:#8a7f70;font-size:12px;">
                VoyageAI · Plan Less. Travel More.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

const button = (href: string, label: string) => `
  <a href="${href}" style="display:inline-block;margin-top:20px;padding:12px 24px;background-color:#d97b4f;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">
    ${label}
  </a>
`;

export function welcomeEmail(fullName: string) {
  return wrapper(
    `Welcome, ${fullName} 👋`,
    `<p style="color:#4a4038;line-height:1.6;">
       Thanks for joining VoyageAI. You can now generate full AI-powered itineraries, track trip
       budgets, and keep every travel document in one place.
     </p>
     ${button("https://app.voyageai.example/dashboard", "Go to your dashboard")}`
  );
}

export function tripConfirmationEmail(params: {
  fullName: string;
  tripTitle: string;
  destination: string;
  startDate: string;
  endDate: string;
}) {
  return wrapper(
    "Your trip is booked in VoyageAI",
    `<p style="color:#4a4038;line-height:1.6;">
       Hi ${params.fullName}, your trip <strong>${params.tripTitle}</strong> to
       <strong>${params.destination}</strong> is saved, running from
       ${params.startDate} to ${params.endDate}.
     </p>
     ${button("https://app.voyageai.example/trips", "View your itinerary")}`
  );
}

export function tripReminderEmail(params: { fullName: string; tripTitle: string; daysUntil: number }) {
  return wrapper(
    `${params.tripTitle} is coming up`,
    `<p style="color:#4a4038;line-height:1.6;">
       Hi ${params.fullName}, your trip <strong>${params.tripTitle}</strong> starts in
       ${params.daysUntil} day${params.daysUntil === 1 ? "" : "s"}. Now's a good time to double-check
       your packing list and documents.
     </p>
     ${button("https://app.voyageai.example/trips", "Review trip details")}`
  );
}

export function packingReminderEmail(params: { fullName: string; tripTitle: string; itemsRemaining: number }) {
  return wrapper(
    "Packing reminder",
    `<p style="color:#4a4038;line-height:1.6;">
       Hi ${params.fullName}, you still have ${params.itemsRemaining} unpacked item${
         params.itemsRemaining === 1 ? "" : "s"
       } on your list for <strong>${params.tripTitle}</strong>.
     </p>
     ${button("https://app.voyageai.example/trips", "Open packing list")}`
  );
}

export function tripSharedEmail(params: { recipientName: string; sharedByName: string; tripTitle: string }) {
  return wrapper(
    `${params.sharedByName} shared a trip with you`,
    `<p style="color:#4a4038;line-height:1.6;">
       Hi ${params.recipientName}, ${params.sharedByName} shared their trip
       <strong>${params.tripTitle}</strong> with you on VoyageAI.
     </p>
     ${button("https://app.voyageai.example/trips", "View shared trip")}`
  );
}

export function monthlySummaryEmail(params: {
  fullName: string;
  month: string;
  tripCount: number;
  totalSpent: number;
}) {
  return wrapper(
    `Your ${params.month} travel summary`,
    `<p style="color:#4a4038;line-height:1.6;">
       Hi ${params.fullName}, in ${params.month} you took <strong>${params.tripCount}</strong> trip${
         params.tripCount === 1 ? "" : "s"
       } and spent <strong>$${params.totalSpent.toFixed(2)}</strong>.
     </p>
     ${button("https://app.voyageai.example/analytics", "See full analytics")}`
  );
}
