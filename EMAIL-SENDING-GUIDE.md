# Email Announcement Sending Guide

This guide will help you send the announcement email to your DuoBook users safely and effectively.

## Files Created

1. **user-announcement-email.html** - Beautiful HTML email template
2. **user-announcement-email.txt** - Plain text version (for email clients that don't support HTML)
3. **user-announcement-email.md** - Markdown reference document
4. **scripts/send-announcement-email.js** - Automated sending script

## Before You Send

### 1. Update Placeholder Content

Edit the following files and replace placeholders:

#### In both `.html` and `.txt` files:

- `[App Store Link]` - Your iOS app store URL (or remove if not ready)
- `[Google Play Link]` - Your Android play store URL (or remove if not ready)
- `https://duobook.app` - Your actual website URL
- `support@duobook.co` - Your actual support email
- Social media links in the footer

### 2. Verify Environment Variables

Make sure these are set in your `.env` file:

```env
# Email Configuration
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=your-email@gmail.com
EMAIL_SMTP_PASS=your-app-password
EMAIL_FROM_NAME=DuoBook
EMAIL_FROM_ADDRESS=noreply@duobook.co
```

**Important for Gmail users:**

- Don't use your regular password
- Use an [App Password](https://support.google.com/accounts/answer/185833)
- Enable 2FA on your Google account first

### 3. Choose Your Sending Method

You have several options:

#### Option A: Use the Automated Script (Recommended)

```bash
# Install if not already in package.json
npm install nodemailer

# Send a test email first
node scripts/send-announcement-email.js
```

The script includes:

- ✅ Test mode (sends to one email first)
- ✅ Batch sending (avoids rate limits)
- ✅ Error handling and logging
- ✅ Personalization with user names
- ✅ Progress tracking

#### Option B: Use Your Email Service Provider

If you use services like:

- **SendGrid**
- **Mailchimp**
- **AWS SES**
- **Postmark**

Upload the HTML template to their platform and use their sending tools.

#### Option C: Manual Email Client

For small user bases:

- Copy the HTML from `user-announcement-email.html`
- Paste into your email client
- Send as BCC (never CC - protects user privacy!)

## Step-by-Step Sending Process

### Step 1: Test Send

1. Open `scripts/send-announcement-email.js`
2. Make sure `TEST_MODE: true`
3. Update `TEST_EMAIL` to your personal email
4. Run: `node scripts/send-announcement-email.js`
5. Check your inbox and verify:
   - Email renders correctly
   - Links work
   - Images display (if any)
   - Mobile view looks good

### Step 2: Preview in Multiple Clients

Test the email in:

- Gmail (web)
- Outlook (web)
- Mobile (iOS Mail, Gmail app)
- Dark mode

Tools to help:

- [Litmus](https://www.litmus.com/) - Email testing service
- [Email on Acid](https://www.emailonacid.com/) - Email preview tool
- Your own devices

### Step 3: Production Send

1. Make final edits based on testing
2. Update script: `TEST_MODE: false`
3. Consider the timing:
   - **Best days**: Tuesday, Wednesday, Thursday
   - **Best times**: 9-11 AM or 1-3 PM in your users' timezone
   - **Avoid**: Monday mornings, Friday afternoons, weekends
4. Run the script: `node scripts/send-announcement-email.js`
5. Monitor the console output for errors

### Step 4: Monitor & Follow Up

After sending:

- ✅ Track open rates (if using email service with analytics)
- ✅ Monitor for bounce backs
- ✅ Check support inbox for questions
- ✅ Watch for unsubscribe requests

## Rate Limits & Best Practices

### Gmail Limits

- **Free Gmail**: ~500 emails/day
- **Google Workspace**: ~2,000 emails/day

### Best Practices

1. **Warm up** your email domain if it's new
2. **Authenticate** your domain (SPF, DKIM, DMARC)
3. **Include unsubscribe** link (legally required in many countries)
4. **Personalize** when possible (script does this automatically)
5. **Segment** if you have many users (e.g., active vs inactive)

## Customization Ideas

### A/B Testing Subject Lines

Try different subject lines for different user segments:

1. 🚀 DuoBook Just Got Better: Mobile App + Pro Features!
2. ✨ Big Updates to Your Language Learning Journey
3. 📱 DuoBook is Now on Mobile! Plus More Exciting Features

### Segmentation Ideas

Consider sending different versions to:

- **New users** (< 1 month): Focus on onboarding features
- **Active users**: Focus on new features and mobile app
- **Inactive users**: Focus on what's new since they left
- **Pro users**: Thank them, highlight pro features

## Troubleshooting

### "Connection refused" error

- Check your SMTP credentials
- Verify port number (587 or 465)
- Ensure "Less secure app access" is OFF (use App Password instead)

### "Daily sending limit exceeded"

- Reduce `BATCH_SIZE` in the script
- Increase `BATCH_DELAY`
- Consider spreading sends over multiple days
- Use a professional email service (SendGrid, SES)

### Emails going to spam

- Authenticate your domain (SPF/DKIM)
- Use a proper "From" address (not gmail.com if possible)
- Don't use spam trigger words excessively
- Include plain text version (script does this)
- Add unsubscribe link

### HTML not rendering

- Some email clients strip CSS
- Use inline styles (our template does this)
- Test in multiple clients
- Always include plain text version

## Legal Compliance

### Required Elements (depending on your location):

✅ **CAN-SPAM (USA)**

- Physical mailing address
- Clear "From" line
- Accurate subject line
- Unsubscribe mechanism
- Honor opt-outs within 10 days

✅ **GDPR (Europe)**

- Only email users who consented
- Easy unsubscribe
- Privacy policy link
- Data processing info

✅ **CASL (Canada)**

- Express or implied consent
- Clear sender identification
- Unsubscribe mechanism
- Honor opt-outs immediately

## Advanced: Using Professional Email Services

### SendGrid Setup (Recommended for 1000+ users)

```javascript
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
	to: user.email,
	from: "noreply@duobook.co",
	subject: "DuoBook Updates",
	text: textTemplate,
	html: htmlTemplate,
	trackingSettings: {
		clickTracking: { enable: true },
		openTracking: { enable: true },
	},
};

await sgMail.send(msg);
```

### AWS SES Setup

```javascript
import AWS from "aws-sdk";

const ses = new AWS.SES({ region: "us-east-1" });

await ses
	.sendEmail({
		Source: "noreply@duobook.co",
		Destination: { ToAddresses: [user.email] },
		Message: {
			Subject: { Data: CONFIG.SUBJECT },
			Body: {
				Html: { Data: htmlTemplate },
				Text: { Data: textTemplate },
			},
		},
	})
	.promise();
```

## Support

If you run into issues:

1. Check the console output for specific error messages
2. Verify all environment variables are set correctly
3. Test with a single email first
4. Consider using a professional email service for large sends

## Checklist Before Sending

- [ ] Updated all placeholder text
- [ ] Verified SMTP credentials
- [ ] Sent test email to yourself
- [ ] Checked email in multiple clients
- [ ] Verified all links work
- [ ] Confirmed mobile responsiveness
- [ ] Included unsubscribe link
- [ ] Scheduled send for optimal time
- [ ] Have support team ready for questions

Good luck with your announcement! 🚀
