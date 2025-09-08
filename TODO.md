# TODO: Fix All Errors in HomeDecor App

## 1. Backend Setup and Errors
- [x] Install backend dependencies (npm install)
- [x] Create .env file with Razorpay keys and other variables
- [x] Update FRONTEND_URL to http://localhost:5175 in .env
- [ ] Ensure MongoDB is running (mongod command or service)
- [ ] Restart backend server to apply .env changes
- [ ] Check backend logs for any errors (CORS, database connection, etc.)

## 2. Frontend Setup and Errors
- [x] Install frontend dependencies (npm install)
- [x] Start frontend server (running on port 5175)
- [ ] Check browser console for any JavaScript errors
- [ ] Ensure all assets (logo.png, etc.) are present

## 3. Razorpay Payment Integration
- [x] Set RAZORPAY_KEY_ID and RAZORPAY_SECRET in .env
- [x] Fixed auth middleware import error in checkout.js
- [x] Fixed Order model field mappings (orderStatus, paymentStatus)
- [x] Fixed address structure in Order creation
- [x] Fixed payment method mapping (razorpay -> UPI)
- [x] Added detailed error logging to checkout.js for debugging 500 errors
- [x] Added Razorpay order creation error handling with cleanup
- [x] Added Order creation error handling with detailed validation logging
- [x] Added comprehensive debugging logs for environment variables, authentication, and database operations
- [x] Added Razorpay instance initialization logging
- [ ] Test payment flow on http://localhost:5175/checkout
- [ ] Verify Razorpay order creation (/api/checkout)
- [ ] Verify payment verification (/api/razorpay/verify)
- [ ] Handle payment success/failure properly

## 4. Google Login Integration
- [ ] Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL in .env
- [ ] Ensure Google OAuth app is configured correctly
- [ ] Test Google login flow
- [ ] Handle Google login errors

## 5. General App Testing
- [ ] Test user registration/login
- [ ] Test cart functionality
- [ ] Test checkout process
- [ ] Test order placement
- [ ] Check for any console errors in browser

## 6. Troubleshooting Steps
- [ ] Kill any conflicting processes on ports 5000, 5173, 5174, 5175
- [ ] Clear browser cache and cookies
- [ ] Check network tab in browser dev tools for failed requests
- [ ] Verify all API endpoints are responding correctly
- [ ] Check MongoDB connection and data

## Notes
- Backend running on port 5000
- Frontend running on port 5175
- Razorpay test keys are set
- Google credentials need to be configured for Google login to work
