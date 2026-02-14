export const loginNotificationTemplate = (
  name: string,
  timestamp: string,
  userAgent: string,
  ipAddress: string,
  location: string,
  brandColor: string = '#032a0d',
) => ({
  subject: 'New Login to Your Pearl of the Orient Account',
  text: `Hi ${name}, we noticed a recent login to your account at ${timestamp}. Device: ${userAgent}. Location: ${location}. IP Address: ${ipAddress}. If this wasn't you, please contact support immediately.`,
  html: `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html dir="ltr" lang="en">
      <head>
        <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
        <meta name="x-apple-disable-message-reformatting" />
      </head>
      <body style="background-color:#ffffff;margin:0;padding:0">
        <table
          border="0"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          role="presentation"
          align="center"
          style="background-color:#ffffff">
          <tbody>
            <tr>
              <td style='color:#24292e;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"'>
                <div
                  style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">
                  New login to your Pearl of the Orient account
                </div>
                <table
                  align="center"
                  width="100%"
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  role="presentation"
                  style="max-width:480px;margin:0 auto;padding:20px 0 48px 0">
                  <tbody>
                    <tr style="width:100%">
                      <td>
                        <img
                          alt="Pearl of the Orient"
                          height="50"
                          src="https://res.cloudinary.com/dovvdfxru/image/upload/v1771102068/samples/logo_hcoa2l.png"
                          style="display:block;outline:none;border:none;text-decoration:none"
                          width="50" />
                          <p
                      style="font-size:24px;line-height:1.25;margin-top:16px;margin-bottom:16px">
                      <strong>@<!-- -->${name}</strong>, we noticed a recent login to your Pearl of the Orient account.
                    </p>
                        <table
                          align="center"
                          width="100%"
                          border="0"
                          cellpadding="0"
                          cellspacing="0"
                          role="presentation"
                          style="padding:24px;border:1px solid #dedede;border-radius:5px;margin:16px 0">
                          <tbody>
                            <tr>
                              <td>
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td style="padding:8px 0">
                                    <p style="font-size:14px;line-height:24px;margin:0;color:#586069;font-weight:600">
                                        Timestamp:
                                      </p>
                                      <p style="font-size:14px;line-height:24px;margin:4px 0 0 0;color:#24292e">
                                        ${timestamp}
                                      </p>
                                      </td>
                                  </tr>
                                  <tr>
                                    <td style="padding:8px 0">
                                      <p style="font-size:14px;line-height:24px;margin:0;color:#586069;font-weight:600">
                                        Device:
                                      </p>
                                      <p style="font-size:14px;line-height:24px;margin:4px 0 0 0;color:#24292e">
                                        ${userAgent}
                                      </p>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style="padding:8px 0">
                                      <p style="font-size:14px;line-height:24px;margin:0;color:#586069;font-weight:600">
                                        Location:
                                      </p>
                                      <p style="font-size:14px;line-height:24px;margin:4px 0 0 0;color:#24292e">
                                        ${location}
                                      </p>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style="padding:8px 0">
                                      <p style="font-size:14px;line-height:24px;margin:0;color:#586069;font-weight:600">
                                        IP Address:
                                      </p>
                                      <p style="font-size:14px;line-height:24px;margin:4px 0 0 0;color:#24292e;font-family:monospace">
                                        ${ipAddress}
                                      </p>
                                      <p style="font-size:12px;line-height:18px;margin:4px 0 0 0;color:#6a737d;font-style:italic">
                                        *Approximate geographic location based on IP address
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <p style="font-size:14px;line-height:24px;margin:0 0 10px 0;color:#24292e">
                                  <strong>If this wasn't you</strong> or if you have additional questions, please contact our support team immediately.
                                </p>
                        <p style="font-size:14px;line-height:24px;text-align:center;margin:16px 0;color:#586069">
                          <a style="color:#0366d6;text-decoration:none;font-size:12px" href="mailto:developer.pearlchaplaincy@gmail.com">Contact developer support</a>
                        </p>
                        <p style="font-size:12px;line-height:24px;color:#6a737d;text-align:center;margin:60px 0 16px 0">
                          Pearl of the Orient · Pasay City, Philippines
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  `,
});
