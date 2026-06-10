/**
 * EMAIL TEMPLATE: Appointment Confirmation (Client Notification)
 * Sent when the client accepts the quote via the acceptance URL.
 * Language: ENGLISH ONLY (forced regardless of user locale)
 */

export interface AppointmentConfirmedTemplateData {
    ownerName: string;
    petNames: string;
    address: string;
    zipCode: string;
    appointmentDate: string | null;
    appointmentTime: string | null;
    finalPrice: number;
    siteUrl: string;
}

export function appointmentConfirmedTemplate(data: AppointmentConfirmedTemplateData): { subject: string; html: string } {
    const { ownerName, petNames, address, zipCode, appointmentDate, appointmentTime, finalPrice, siteUrl } = data;

    const subject = `Appointment Confirmed — Groomers INC. Spa for ${petNames}`;

    const dateDisplay = appointmentDate
        ? new Date(appointmentDate).toLocaleDateString("en-US", {
            weekday: "long", year: "numeric", month: "long", day: "numeric"
          })
        : "To Be Confirmed";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F5;padding:32px 16px;">
<tr><td align="center">

<table width="600" cellpadding="0" cellspacing="0"
  style="max-width:600px;width:100%;background:#FFFFFF;border:4px solid #000;border-radius:16px;overflow:hidden;box-shadow:6px 6px 0 #2ECC71;">

  <!-- HEADER -->
  <tr>
    <td style="background:#2ECC71;padding:28px 30px 24px;text-align:center;border-bottom:3px solid #000;">
      <h1 style="margin:0;font-size:22px;font-weight:900;color:#000;text-transform:uppercase;letter-spacing:-0.5px;">
        Appointment Confirmed!
      </h1>
      <p style="margin:6px 0 0;font-size:11px;font-weight:700;color:#000;text-transform:uppercase;letter-spacing:2px;">
        Groomers, INC. · Mobile Pet Spa · Miami, FL
      </p>
    </td>
  </tr>

  <!-- GREETING -->
  <tr>
    <td style="padding:24px 30px 0;">
      <p style="margin:0;font-size:16px;font-weight:700;color:#111;">
        Hello <strong>${ownerName}</strong>! 🐾
      </p>
      <p style="margin:10px 0 0;font-size:14px;color:#444;line-height:1.6;">
        Your appointment for <strong>${petNames}</strong> has been <strong>confirmed</strong>.
        Our groomer will arrive at your location at the scheduled time. Here are your appointment details:
      </p>
    </td>
  </tr>

  <!-- APPOINTMENT DETAILS CARD -->
  <tr>
    <td style="padding:16px 30px 0;">
      <table width="100%" cellpadding="0" cellspacing="0"
        style="border:2px solid #000;border-radius:12px;overflow:hidden;">

        <tr style="border-bottom:1.5px solid #E0E0E0;">
          <td style="background:#FAFAFA;padding:12px 16px;width:40%;vertical-align:top;">
            <span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#888;display:block;">
              Date
            </span>
            <span style="font-size:14px;font-weight:900;color:#111;">${dateDisplay}</span>
          </td>
          <td style="background:#FAFAFA;padding:12px 16px;border-left:1.5px solid #E0E0E0;vertical-align:top;">
            <span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#888;display:block;">
              Arrival Window
            </span>
            <span style="font-size:14px;font-weight:900;color:#111;">${appointmentTime || "To Be Confirmed"}</span>
          </td>
        </tr>

        <tr style="border-bottom:1.5px solid #E0E0E0;">
          <td colspan="2" style="background:#FAFAFA;padding:12px 16px;vertical-align:top;">
            <span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#888;display:block;">
              Service Address
            </span>
            <span style="font-size:14px;font-weight:900;color:#111;">${address}, FL ${zipCode}</span>
          </td>
        </tr>

        <tr>
          <td colspan="2" style="background:#FAFAFA;padding:12px 16px;">
            <span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#888;display:block;">
              Total Due (Cash Upon Completion)
            </span>
            <span style="font-size:22px;font-weight:900;color:#7C3AED;">$${finalPrice.toFixed(2)}</span>
          </td>
        </tr>

      </table>
    </td>
  </tr>

  <!-- WHAT TO PREPARE -->
  <tr>
    <td style="padding:20px 30px 0;">
      <p style="margin:0;font-size:12px;font-weight:900;text-transform:uppercase;color:#777;letter-spacing:1px;">
        What to have ready:
      </p>
      <ul style="margin:8px 0 0;padding-left:20px;font-size:13px;color:#444;line-height:1.8;">
        <li>Rabies vaccine certificate (required by FL law)</li>
        <li>Cash payment ready for the groomer upon pick-up</li>
        <li>Pet(s) ready and accessible at your address</li>
      </ul>
    </td>
  </tr>

  <!-- CTA -->
  <tr>
    <td style="padding:20px 30px;text-align:center;">
      <a href="${siteUrl}"
        style="display:inline-block;background:#7C3AED;color:#fff;font-size:13px;font-weight:900;
               text-decoration:none;text-transform:uppercase;letter-spacing:1px;
               padding:14px 30px;border:3px solid #000;border-radius:12px;box-shadow:4px 4px 0 #000;">
        Visit Our Website
      </a>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background:#1A1A1A;padding:18px 28px;text-align:center;border-top:3px solid #000;">
      <p style="margin:0;font-size:12px;font-weight:900;color:#7C3AED;text-transform:uppercase;letter-spacing:3px;">
        Groomers, INC.
      </p>
      <p style="margin:4px 0 0;font-size:10px;color:#666;">
        Miami, FL · (786) 568-5000 · groomersincpetspa@gmail.com
      </p>
      <p style="margin:8px 0 0;font-size:9px;color:#444;">
        This is an automated confirmation. Please do not reply directly to this email.
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>

</body>
</html>`;

    return { subject, html };
}
