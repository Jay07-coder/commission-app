const RESEND_KEY = process.env.RESEND_API_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://commission-app-peach.vercel.app";
const LOGO = "https://topagentrealtymi.com/wp-content/uploads/2026/01/Untitled-design-7-1.png";

/** Notify the broker(s) that a transaction is awaiting their approval. No-op until RESEND_API_KEY is set. */
export async function sendApprovalEmail(opts: {
  to: string[];
  property: string;
  agent: string;
  submittedBy: string;
  transactionId: string;
}): Promise<void> {
  if (!RESEND_KEY || opts.to.length === 0) return;
  const link = `${SITE_URL}/app/transactions/${opts.transactionId}`;
  const html = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;margin:0;padding:32px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(16,24,40,0.08);">
      <tr><td align="center" bgcolor="#0f2440" style="background-color:#0f2440;padding:24px 32px;">
        <img src="${LOGO}" alt="Top Agent Realty" width="220" style="display:block;width:220px;max-width:72%;height:auto;" />
      </td></tr>
      <tr><td style="padding:28px 40px 8px 40px;">
        <h1 style="margin:0 0 12px 0;font-size:21px;color:#101828;font-weight:700;text-align:center;">A commission needs your approval</h1>
        <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#475467;">
          A transaction is ready for your review and approval.
        </p>
        <table role="presentation" width="100%" style="font-size:14px;color:#101828;border-collapse:collapse;margin:0 0 20px 0;">
          <tr><td style="padding:6px 0;color:#667085;">Property</td><td style="padding:6px 0;text-align:right;font-weight:600;">${opts.property || "—"}</td></tr>
          <tr><td style="padding:6px 0;color:#667085;">Agent</td><td style="padding:6px 0;text-align:right;font-weight:600;">${opts.agent || "—"}</td></tr>
          <tr><td style="padding:6px 0;color:#667085;">Submitted by</td><td style="padding:6px 0;text-align:right;">${opts.submittedBy || "—"}</td></tr>
        </table>
      </td></tr>
      <tr><td align="center" style="padding:0 40px 28px 40px;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td align="center" bgcolor="#1f6fd0" style="border-radius:8px;">
            <a href="${link}" target="_blank" style="display:inline-block;padding:13px 30px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">Review &amp; approve</a>
          </td>
        </tr></table>
      </td></tr>
    </table>
  </td></tr>
</table>`;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Top Agent Realty <noreply@topagentmi.com>",
        to: opts.to,
        subject: `Approval needed: ${opts.property || opts.agent || "commission transaction"}`,
        html,
      }),
    });
  } catch {
    // never block the workflow on email failure
  }
}
