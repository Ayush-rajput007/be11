# Email Verification & SMTP Setup

The BE11 sports platform requires email services to handle signup verification codes (OTP) and forgot password resets.

---

## 1. Local Development testing (Console Mock)

By default, if the email credentials are not supplied in `.env`, the server will print verification instructions directly to the server terminal:

```text
======================================================================
[DEVELOPMENT MAIL] EMAIL VERIFICATION CODE
To: player@be11.com
Code: 846201
Verification Link: http://localhost:5173/verify-email?email=player%40be11.com&code=846201
======================================================================
```

Copy the code or click the printed verification link to test the user flow locally without configuring external mail servers.

---

## 2. Production SMTP Setup

To configure a real SMTP provider (e.g., Mailgun, SendGrid, Amazon SES, or Mailtrap for QA testing):

1. Open your SMTP provider credentials settings page.
2. Retrieve the host, port, user, and password.
3. Configure the following variables in **`backend/.env`**:

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_smtp_username
SMTP_PASSWORD=your_smtp_password
EMAIL_FROM=noreply@be11.com
```

4. Restart the backend service. All OTPs and reset PINs will now be dispatched to users' inboxes as HTML emails.
