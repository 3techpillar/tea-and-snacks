import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging, MulticastMessage } from "firebase-admin/messaging";
import path from "path";
import { User } from "../models/User.model";

// Initialize Firebase Admin only if it hasn't been initialized yet
if (!getApps().length) {
  try {
    // In production or local dev with GOOGLE_APPLICATION_CREDENTIALS set,
    // this will automatically find the credentials.
    // If you are passing a specific path, you can set FIREBASE_SERVICE_ACCOUNT_PATH in .env
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const absolutePath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      initializeApp({
        credential: cert(absolutePath),
      });
    } else {
      initializeApp();
    }
    console.log("Firebase Admin initialized successfully.");
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

export type NotificationPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

/**
 * Sends a notification to all active devices of a specific user.
 */
export async function sendToUser(userId: string, payload: NotificationPayload): Promise<void> {
  try {
    const user = await User.findById(userId);
    if (!user || !user.fcmDevices || user.fcmDevices.length === 0) return;

    const tokens = user.fcmDevices.map((d: any) => d.token);
    await sendToTokens(tokens, payload, userId);
  } catch (err) {
    console.error(`Error sending notification to user ${userId}:`, err);
  }
}

/**
 * Sends a notification to all active devices of a specific vendor.
 */
export async function sendToVendor(vendorId: string, payload: NotificationPayload): Promise<void> {
  try {
    const vendors = await User.find({ vendorId, role: "vendor" });
    const tokens = vendors.flatMap(v => v.fcmDevices?.map((d: any) => d.token) ?? []);
    if (tokens.length === 0) return;

    await sendToTokens(tokens, payload);
  } catch (err) {
    console.error(`Error sending notification to vendor ${vendorId}:`, err);
  }
}

/**
 * Sends a notification to all active devices of all admins.
 */
export async function sendToAdmins(payload: NotificationPayload): Promise<void> {
  try {
    const admins = await User.find({ role: "admin" });
    const tokens = admins.flatMap(a => a.fcmDevices?.map((d: any) => d.token) ?? []);
    if (tokens.length === 0) return;

    await sendToTokens(tokens, payload);
  } catch (err) {
    console.error(`Error sending notification to admins:`, err);
  }
}

/**
 * Core function to send multicast messages and auto-clean dead tokens.
 */
async function sendToTokens(tokens: string[], payload: NotificationPayload, userIdContext?: string) {
  if (tokens.length === 0) return;

  const message: MulticastMessage = {
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: payload.data,
    tokens: tokens,
  };

  const response = await getMessaging().sendEachForMulticast(message);
  
  if (response.failureCount > 0) {
    const failedTokens: string[] = [];
    response.responses.forEach((resp: any, idx: number) => {
      if (!resp.success) {
        const errCode = resp.error?.code;
        // If token is dead/unregistered, queue for deletion
        if (
          errCode === "messaging/invalid-registration-token" ||
          errCode === "messaging/registration-token-not-registered"
        ) {
          failedTokens.push(tokens[idx]);
        }
      }
    });

    if (failedTokens.length > 0) {
      console.log(`Cleaning up ${failedTokens.length} dead FCM tokens...`);
      await User.updateMany(
        { "fcmDevices.token": { $in: failedTokens } },
        { $pull: { fcmDevices: { token: { $in: failedTokens } } } }
      );
    }
  }
}
