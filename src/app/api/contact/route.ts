import { Resend } from 'resend';
import { z } from 'zod';
import { siteConfig } from '@/site.config';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const data = schema.parse(await req.json());
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: siteConfig.resend.fromEmail,
      to: siteConfig.resend.toEmail,
      replyTo: data.email,
      subject: `New inquiry from ${data.name} — ${siteConfig.name}`,
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;max-width:600px;">

          <!-- Header -->
          <tr>
            <td style="background-color:#ffffff;padding:24px 32px;text-align:center;border-bottom:3px solid #0A4571;">
              <img src="https://boatwork.co/_next/static/media/logo-boatwork.2eb5069a.svg" alt="Boatwork" width="140" height="auto" style="display:inline-block;border:0;" />
              <p style="color:#64748b;font-size:13px;margin:8px 0 0 0;">Website Inquiry Notification</p>
            </td>
          </tr>

          <!-- Business name bar -->
          <tr>
            <td style="background-color:#1E3A5F;padding:14px 32px;text-align:center;">
              <p style="color:#C9A84C;font-size:14px;font-weight:600;margin:0;letter-spacing:1px;text-transform:uppercase;">${siteConfig.name}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="font-size:16px;color:#1e293b;margin:0 0 8px 0;">You have a new website inquiry.</p>
              <p style="font-size:14px;color:#64748b;margin:0 0 28px 0;">Submitted via the contact form on your Boatwork-powered website.</p>

              <!-- Details table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
                <tr style="background-color:#f8fafc;">
                  <td style="padding:12px 16px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;width:120px;">Name</td>
                  <td style="padding:12px 16px;font-size:15px;color:#1e293b;font-weight:600;">${data.name}</td>
                </tr>
                <tr style="border-top:1px solid #e2e8f0;">
                  <td style="padding:12px 16px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Email</td>
                  <td style="padding:12px 16px;font-size:15px;color:#1e293b;"><a href="mailto:${data.email}" style="color:#00C1BD;text-decoration:none;">${data.email}</a></td>
                </tr>
                <tr style="border-top:1px solid #e2e8f0;background-color:#f8fafc;">
                  <td style="padding:12px 16px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Phone</td>
                  <td style="padding:12px 16px;font-size:15px;color:#1e293b;">${data.phone ? `<a href="tel:${data.phone}" style="color:#00C1BD;text-decoration:none;">${data.phone}</a>` : '<span style="color:#94a3b8;">Not provided</span>'}</td>
                </tr>
              </table>

              <!-- Message -->
              <div style="margin-top:24px;background-color:#f8fafc;border-left:3px solid #C9A84C;padding:20px 20px 20px 24px;border-radius:0 8px 8px 0;">
                <p style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px 0;">Message</p>
                <p style="font-size:15px;color:#1e293b;line-height:1.7;margin:0;">${data.message.replace(/\n/g, '<br>')}</p>
              </div>

              <!-- CTA -->
              <div style="margin-top:28px;text-align:center;">
                <a href="mailto:${data.email}" style="display:inline-block;background-color:#00C1BD;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 28px;border-radius:6px;">Reply to ${data.name} →</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#ffffff;padding:24px 32px;text-align:center;border-bottom:3px solid #0A4571;">
              <p style="font-size:12px;color:#64748b;margin:0;line-height:1.8;">
                This inquiry was submitted through the <strong style="color:#94a3b8;">${siteConfig.name}</strong> website,<br>
                powered by <a href="https://boatwork.co" style="color:#94a3b8;">Boatwork</a> — the marine professional platform.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });

    return Response.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: (err as z.ZodError).issues[0]?.message ?? 'Validation error' }, { status: 400 });
    return Response.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
