# TODO: Add Gmail Registration

## Completed Steps
- [x] Update backend/index.js to configure Passport with Google OAuth 2.0 strategy
- [x] Update User model to include googleId field and make password optional for Google users
- [x] Add Google OAuth routes (/google and /google/callback) to auth.js
- [x] Set up session middleware for Passport

## Remaining Steps
- [x] Test Google OAuth registration flow locally (backend routes responding correctly, redirecting to Google OAuth)
- [ ] Update frontend to add Google login button and handle token from redirect
- [ ] Ensure proper error handling and user feedback on frontend
- [ ] Verify user creation and JWT token issuance for Google users (requires completing OAuth flow)
