import { useEffect } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "../lib/firebase";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "../lib/auth-client";
import { toast } from "sonner";

export function useNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !messaging) return;

    let deviceId = localStorage.getItem("fcm_device_id");
    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem("fcm_device_id", deviceId);
    }

    const requestPermissionAndRegister = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          // Replace with actual VAPID key
          const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || "YOUR_VAPID_KEY";
          
          // Inject .env variables into the Service Worker via URL parameters!
          const swUrl = `/firebase-messaging-sw.js?apiKey=${import.meta.env.VITE_FIREBASE_API_KEY}&projectId=${import.meta.env.VITE_FIREBASE_PROJECT_ID}&messagingSenderId=${import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID}&appId=${import.meta.env.VITE_FIREBASE_APP_ID}`;
          
          const registration = await navigator.serviceWorker.register(swUrl);
          
          const token = await getToken(messaging!, { 
            vapidKey,
            serviceWorkerRegistration: registration 
          });

          // Send to backend
          const API_BASE = import.meta.env.VITE_API_URL ?? "";
          await fetch(`${API_BASE}/api/users/fcm-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, deviceId }),
          });
        }
      } catch (err) {
        console.error("Failed to register for notifications:", err);
      }
    };

    requestPermissionAndRegister();

    // Listen for foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Foreground message received:", payload);
      
      // Play sound effect
      try {
        // Play the user's custom wav file
        const soundFile = "/sounds/mixkit-urgent-simple-tone-loop-2976.wav";
          
        const audio = new Audio(soundFile);
        audio.play().catch(e => console.log("Audio blocked by browser", e));
      } catch (err) {
        console.error("Failed to play notification sound", err);
      }

      // Display toast
      toast(payload.notification?.title || "New Notification", {
        description: payload.notification?.body,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [user]);
}
