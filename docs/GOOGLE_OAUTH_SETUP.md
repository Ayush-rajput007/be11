# Google OAuth 2.0 Integration Setup

This guide provides steps to configure Google Single Sign-On (SSO) authentication for the BE11 sports platform.

---

## 1. Google Cloud Console Setup

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project named **BE11 Sports**.
3. Navigate to **APIs & Services** > **OAuth consent screen**:
   - Select **External** User Type.
   - Enter your App name (e.g. `BE11`), user support email, and developer contact details.
   - Complete the scopes step (make sure `auth/userinfo.email` and `auth/userinfo.profile` are active).
4. Navigate to **APIs & Services** > **Credentials**:
   - Click **Create Credentials** and choose **OAuth client ID**.
   - Set **Application type** to **Web application**.
   - Enter name (e.g. `BE11 Web Client`).

---

## 2. Authorized Origins & Redirect URIs

### Local Development Configuration
- **Authorized JavaScript origins**:
  - `http://localhost:5173` (Vite dev server)
- **Authorized redirect URIs**:
  - `http://localhost:5000/api/v1/auth/google/callback`

### Production Configuration
- **Authorized JavaScript origins**:
  - `https://be11.com`
  - `https://your-production-app.vercel.app`
- **Authorized redirect URIs**:
  - `https://api.be11.com/api/v1/auth/google/callback`

---

## 3. Environment Configurations

After creating the OAuth client, Google provides a Client ID and Client Secret. Place these inside the respective environment files:

### Backend `.env`
```env
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/v1/auth/google/callback
```

### Frontend `.env`
```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
```

---

## 4. Google 401 "invalid_client" Troubleshooting

If you see an error dialog stating `invalid_client` or `The OAuth client was not found`:
1. Check that the value inside `VITE_GOOGLE_CLIENT_ID` matches your Google Console client ID.
2. Confirm the environment files (`.env` in frontend) are loaded and the dev servers are restarted after edits.
3. Verify that the request is originating from an approved Authorized origin in the settings (e.g., `http://localhost:5173`).
