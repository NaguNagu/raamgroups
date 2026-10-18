// Public Firebase web configuration. These identifiers are not server credentials.
export const firebaseConfig = {
  projectId: "sri-raam-rope",
  authDomain: "sri-raam-rope.firebaseapp.com",
  messagingSenderId: "822993063639",
  appId: "1:822993063639:web:94be9ec9b1153e2fbbaa92",
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyBpf9-v7RCUYHr17oz0EKnw6v598ySFTdI",
};
export const adminEmail = "sriraamrope@gmail.com";
export const firebaseConfigured = () => !!firebaseConfig.apiKey;
