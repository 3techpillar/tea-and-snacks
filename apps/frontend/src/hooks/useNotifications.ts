import { useEffect } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "../lib/firebase";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "../lib/auth-client";
import { toast } from "sonner";
import { useNotificationStore, resolveNotificationUrl } from "@/lib/notification-store";
import { apiClient } from "@/lib/api-client";

/**
 * Explicitly requests push notification permission from the user.
 * Call this from a user gesture (like a button click or form submit).
 */
export async function requestPushPermission(): Promise<boolean> {
  if (!messaging || typeof window === "undefined" || !("Notification" in window)) return false;

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      let deviceId = localStorage.getItem("fcm_device_id");
      if (!deviceId) {
        deviceId = uuidv4();
        localStorage.setItem("fcm_device_id", deviceId);
      }

      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || "YOUR_VAPID_KEY";
      
      const swUrl = `/firebase-messaging-sw.js?apiKey=${import.meta.env.VITE_FIREBASE_API_KEY}&projectId=${import.meta.env.VITE_FIREBASE_PROJECT_ID}&messagingSenderId=${import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID}&appId=${import.meta.env.VITE_FIREBASE_APP_ID}`;
      
      const registration = await navigator.serviceWorker.register(swUrl);
      
      const token = await getToken(messaging, { 
        vapidKey,
        serviceWorkerRegistration: registration 
      });

      // Only hit backend if token is new or hasn't been registered yet
      const registeredToken = localStorage.getItem("fcm_registered_token");
      if (token && token !== registeredToken) {
        await apiClient.post("/api/users/fcm-token", { token, deviceId });
        localStorage.setItem("fcm_registered_token", token);
      }
      return true;
    }
    return false;
  } catch (err) {
    console.error("Failed to register for notifications:", err);
    return false;
  }
}

/**
 * Disables push notifications for this device by removing the token from the backend.
 */
export async function disablePushNotifications(): Promise<void> {
  const deviceId = localStorage.getItem("fcm_device_id");
  if (deviceId) {
    try {
      await apiClient.delete(`/api/users/fcm-token/${deviceId}`);
      localStorage.removeItem("fcm_registered_token");
    } catch (e) {
      console.error("Failed to unregister FCM token", e);
    }
  }
}

export function useNotifications() {
  const { user } = useAuth();
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    if (!user || !messaging) return;

    // Quietly check if permission is already granted. If it is, register in background.
    // If it's not granted, we do NOT ask here, because the browser will block it on load.
    if ("Notification" in window && Notification.permission === "granted") {
      requestPushPermission();
    }

    // Listen for foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Foreground message received:", payload);
      
      const title = payload.notification?.title || "New Notification";
      const body = payload.notification?.body || "";
      const data = payload.data || {};

      // Add to in-app notification store
      addNotification({
        title,
        body,
        type: data.type,
        orderId: data.orderId,
      });

      // Resolve URL on the frontend based on type + user role
      const url = resolveNotificationUrl(
        { type: data.type, orderId: data.orderId },
        user.role,
        user.vendorId,
      );

      // Play sound effect
      try {
        const soundFile = "/sounds/mixkit-urgent-simple-tone-loop-2976.wav";
        const audio = new Audio(soundFile);
        audio.play().catch(e => console.log("Audio blocked by browser", e));
      } catch (err) {
        console.error("Failed to play notification sound", err);
      }

      // Display toast notification with clickable "View" action
      toast(title, {
        description: body,
        action: url
          ? {
              label: "View",
              onClick: () => {
                window.location.href = url;
              },
            }
          : undefined,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [user, addNotification]);
}
