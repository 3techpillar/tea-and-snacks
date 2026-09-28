import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware, requireUser } from "../middleware/auth.middleware";
import { User } from "../models/User.model";

const router = Router();

router.use(authMiddleware);

// Register or update an FCM token for a specific device
router.post("/fcm-token", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userObj = requireUser(req.user);
    const { token, deviceId } = req.body;
    if (!token || !deviceId) {
      res.status(400).json({ error: "token and deviceId are required" });
      return;
    }

    const userId = userObj.id;

    // First, optionally remove this token from ANY other user's profile to prevent duplicates
    await User.updateMany(
      { "fcmDevices.token": token },
      { $pull: { fcmDevices: { token } } }
    );

    // Now, update or push this device to the current user
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const deviceIndex = user.fcmDevices?.findIndex((d: any) => d.deviceId === deviceId) ?? -1;
    if (!user.fcmDevices) {
      user.fcmDevices = [];
    }

    if (deviceIndex > -1) {
      user.fcmDevices[deviceIndex].token = token;
      user.fcmDevices[deviceIndex].lastActive = new Date();
    } else {
      user.fcmDevices.push({ token, deviceId, lastActive: new Date() });
    }

    await user.save();
    res.json({ message: "Token registered successfully" });
  } catch (err) {
    console.error("Error registering FCM token:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Remove an FCM token on logout
router.delete("/fcm-token/:deviceId", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userObj = requireUser(req.user);
    const { deviceId } = req.params;
    const userId = userObj.id;

    await User.updateOne(
      { _id: userId },
      { $pull: { fcmDevices: { deviceId } } }
    );

    res.json({ message: "Token unregistered successfully" });
  } catch (err) {
    console.error("Error unregistering FCM token:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
