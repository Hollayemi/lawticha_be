// lib/email/templates.ts
const BRAND_NAME = 'LawTicha';
const BRAND_COLOR = '#82212D';
const BRAND_COLOR_LIGHT = '#FDF2F4';
const BRAND_COLOR_DARK = '#5C1420';

export function baseLayout(opts: {
    preheader?: string;
    heading: string;
    bodyHtml: string;
    ctaLabel?: string;
    ctaUrl?: string;
    userName?: string;
}): string {
    const { 
        preheader = '', 
        heading, 
        bodyHtml, 
        ctaLabel, 
        ctaUrl,
        userName 
    } = opts;

    const greeting = userName 
        ? `Hello ${userName},` 
        : 'Hello,';

    const cta = ctaLabel && ctaUrl
        ? `
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
          <tr>
            <td style="border-radius: 8px; background: ${BRAND_COLOR}; box-shadow: 0 4px 12px rgba(130, 33, 45, 0.3);">
              <a href="${ctaUrl}" target="_blank"
                 style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600;
                        color: #ffffff; text-decoration: none; border-radius: 8px; letter-spacing: 0.3px;
                        transition: all 0.3s;">
                ${ctaLabel}
              </a>
            </td>
          </tr>
        </table>
        <div style="margin-top: 8px; padding: 12px 16px; background: ${BRAND_COLOR_LIGHT}; border-radius: 6px; border-left: 3px solid ${BRAND_COLOR};">
          <p style="font-size: 12px; color: #6b7280; margin: 0; word-break: break-all;">
            <span style="font-weight: 600;">Or copy this link:</span><br/>
            <a href="${ctaUrl}" style="color: ${BRAND_COLOR}; text-decoration: underline; word-break: break-all;">${ctaUrl}</a>
          </p>
        </div>`
        : '';

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${BRAND_NAME}</title>
  </head>
  <body style="margin: 0; padding: 0; background: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, Helvetica, sans-serif;">
    <!-- Preheader text -->
    <span style="display: none; font-size: 1px; color: #f4f5f7; opacity: 0; visibility: hidden;">${preheader}</span>
    
    <!-- Main container -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f4f5f7; padding: 40px 0;">
      <tr>
        <td align="center">
          <!-- Outer card -->
          <table role="presentation" width="520" cellpadding="0" cellspacing="0"
                 style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);">
            
            <!-- Header with logo -->
            <tr>
              <td style="background: ${BRAND_COLOR}; padding: 28px 32px; text-align: center;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                  <tr>
                    <td style="vertical-align: middle; padding-right: 12px;">
                      <img src="https://lawticha.com/images/icon.jpg" 
                           alt="${BRAND_NAME}" 
                           width="48" 
                           height="48" 
                           style="display: block; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,0.2);" />
                    </td>
                    <td style="vertical-align: middle;">
                      <span style="color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">${BRAND_NAME}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <!-- Main content -->
            <tr>
              <td style="padding: 40px 36px;">
                <!-- Greeting -->
                <p style="font-size: 15px; color: #374151; margin: 0 0 8px; font-weight: 500;">
                  ${greeting}
                </p>
                
                <!-- Heading -->
                <h1 style="font-size: 22px; color: #111827; margin: 8px 0 20px; font-weight: 700; letter-spacing: -0.3px;">
                  ${heading}
                </h1>
                
                <!-- Body content -->
                <div style="font-size: 15px; line-height: 1.7; color: #374151;">
                  ${bodyHtml}
                </div>
                
                <!-- CTA Button -->
                ${cta}
                
                <!-- Divider -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0 16px;">
                  <tr>
                    <td style="border-top: 1px solid #e5e7eb;"></td>
                  </tr>
                </table>
                
                <!-- Footer note -->
                <p style="font-size: 13px; color: #6b7280; margin: 0; line-height: 1.6;">
                  This email was sent to you by ${BRAND_NAME}. If you have any questions, 
                  please <a href="mailto:support@lawticha.com" style="color: ${BRAND_COLOR}; text-decoration: none; font-weight: 500;">contact our support team</a>.
                </p>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="padding: 20px 36px; background: #f9fafb; border-top: 1px solid #f3f4f6;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size: 12px; color: #9ca3af; line-height: 1.6;">
                      &copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
                      <br/>
                      If you didn't expect this email, you can safely ignore it.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top: 8px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                        <tr>
                          <td style="padding: 0 8px;">
                            <a href="#" style="color: #9ca3af; text-decoration: none; font-size: 11px;">Privacy Policy</a>
                          </td>
                          <td style="color: #d1d5db;">|</td>
                          <td style="padding: 0 8px;">
                            <a href="#" style="color: #9ca3af; text-decoration: none; font-size: 11px;">Terms of Service</a>
                          </td>
                          <td style="color: #d1d5db;">|</td>
                          <td style="padding: 0 8px;">
                            <a href="#" style="color: #9ca3af; text-decoration: none; font-size: 11px;">Unsubscribe</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}