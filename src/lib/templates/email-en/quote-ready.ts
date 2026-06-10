/**
 * EMAIL TEMPLATE: Quote Ready (Client Notification)
 * Sent when the admin sets a final price and dispatches the quote email.
 * Language: ENGLISH ONLY (forced regardless of user locale)
 */

export interface QuoteReadyTemplateData {
    ownerName: string;
    petNames: string;        // e.g. "Buddy, Luna"
    petWeights: string;      // e.g. "Buddy: 22 lbs, Luna: 14 lbs"
    servicesHtml: string;    // pre-built HTML list of services + prices
    finalPrice: number;
    acceptUrl: string;
}

export function quoteReadyTemplate(data: QuoteReadyTemplateData): { subject: string; html: string } {
    const { ownerName, petNames, petWeights, servicesHtml, finalPrice, acceptUrl } = data;

    const subject = `Your Official Groomers INC. Spa Quote — ${petNames}`;

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
  style="max-width:600px;width:100%;background:#FFFFFF;border:4px solid #000;border-radius:16px;overflow:hidden;box-shadow:6px 6px 0 #7C3AED;">

  <!-- HEADER -->
  <tr>
    <td style="background:#7C3AED;padding:28px 30px 24px;text-align:center;border-bottom:3px solid #000;">
      <h1 style="margin:0;font-size:22px;font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:-0.5px;">
        Groomers, INC.
      </h1>
      <p style="margin:6px 0 0;font-size:11px;font-weight:700;color:#C4B5FD;text-transform:uppercase;letter-spacing:2px;">
        Mobile Pet Grooming Spa · Miami, FL
      </p>
    </td>
  </tr>

  <!-- BADGE -->
  <tr>
    <td style="padding:24px 30px 0;text-align:center;">
      <div style="display:inline-block;background:#2ECC71;color:#000;font-size:10px;font-weight:900;
                  text-transform:uppercase;letter-spacing:2px;padding:5px 16px;
                  border:2px solid #000;border-radius:100px;box-shadow:3px 3px 0 #000;">
        ✦ Your Quote Is Ready
      </div>
    </td>
  </tr>

  <!-- GREETING -->
  <tr>
    <td style="padding:20px 30px 0;">
      <p style="margin:0;font-size:16px;font-weight:700;color:#111;">
        Hello <strong>${ownerName}</strong>!
      </p>
      <p style="margin:10px 0 0;font-size:14px;color:#444;line-height:1.6;">
        Your mobile spa quote for <strong>${petNames}</strong> has been reviewed by our grooming specialist.
        Here is your official price breakdown:
      </p>
    </td>
  </tr>

  <!-- SERVICE BREAKDOWN -->
  <tr>
    <td style="padding:16px 30px 0;">
      <div style="background:#FAFAFA;border:2px solid #000;border-radius:12px;padding:18px 20px;">
        ${servicesHtml}
        <div style="border-top:1.5px solid #E0E0E0;margin-top:14px;padding-top:12px;
                    display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:11px;font-weight:700;text-transform:uppercase;color:#777;">Official Final Price</span>
          <span style="font-size:22px;font-weight:900;color:#7C3AED;">$${finalPrice.toFixed(2)}</span>
        </div>
      </div>
      <p style="margin:8px 0 0;font-size:11px;color:#888;">
        * Price includes travel surcharge and weight-based rate (${petWeights}).
        Payment is <strong>Cash Only</strong> upon service completion.
      </p>
    </td>
  </tr>

  <!-- CTA BUTTON -->
  <tr>
    <td style="padding:24px 30px;text-align:center;">
      <a href="${acceptUrl}"
        style="display:inline-block;background:#2ECC71;color:#000;font-size:15px;font-weight:900;
               text-decoration:none;text-transform:uppercase;letter-spacing:1px;
               padding:16px 36px;border:3px solid #000;border-radius:12px;
               box-shadow:4px 4px 0 #000;">
        ✓ Accept Quote &amp; Confirm Appointment
      </a>
      <p style="margin:12px 0 0;font-size:11px;color:#888;">
        Clicking the button confirms your appointment slot. Our groomer will arrive at your location.
      </p>
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
        This is an automated message. Please do not reply directly to this email.
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
