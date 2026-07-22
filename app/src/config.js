// ⚙️ EDIT THIS: point the app at your computer's LAN IP running the API (port 3000).
// Find it on Windows with `ipconfig` (IPv4 Address), e.g. 192.168.1.5
// Phone and PC must be on the SAME Wi-Fi. Do NOT use "localhost" (that's the phone itself).
// export const API_URL = 'http://172.19.80.1:3000';
export const API_URL = 'http://192.168.1.37:3000';
// Renew/membership opens this site in the browser (Razorpay web checkout). Usually same as API_URL.
export const WEBSITE_URL = API_URL;

// Optional — Google sign-in inside the app. Create OAuth client IDs in Google Cloud Console.
// Leave blank to hide the Google button (email/password still works).
export const GOOGLE_WEB_CLIENT_ID = '';
export const GOOGLE_ANDROID_CLIENT_ID = '';
export const GOOGLE_IOS_CLIENT_ID = '';
