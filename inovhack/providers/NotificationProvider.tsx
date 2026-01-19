/**
 * Push Notifications Provider
 * Handles Expo push notification registration and management
 */

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "./AuthProvider";

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  isRegistered: boolean;
  registerForPushNotifications: () => Promise<string | null>;
  scheduleLocalNotification: (
    title: string,
    body: string,
    data?: Record<string, unknown>,
    trigger?: Notifications.NotificationTriggerInput
  ) => Promise<string>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  const updateNotificationPreferences = useMutation(api.users.updateNotificationPreferences);

  useEffect(() => {
    // Register for push notifications
    registerForPushNotifications();

    // Listen for notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      }
    );

    // Listen for notification interactions
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        handleNotificationResponse(data);
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  // Save push token when userId changes
  useEffect(() => {
    if (userId && expoPushToken) {
      updateNotificationPreferences({
        userId,
        enabled: true,
        pushToken: expoPushToken,
      }).catch(console.error);
    }
  }, [userId, expoPushToken]);

  const registerForPushNotifications = async (): Promise<string | null> => {
    let token: string | null = null;

    // Push notifications require a physical device
    if (!Device.isDevice) {
      console.log("Push notifications require a physical device (simulator detected)");
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not granted
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Push notification permission not granted");
      return null;
    }

    try {
      // Get Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      // Skip if no valid projectId (development mode)
      if (!projectId || projectId === "your-eas-project-id") {
        console.log("Push notifications: No valid EAS projectId configured (dev mode)");
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      token = tokenData.data;
      setExpoPushToken(token);
      setIsRegistered(true);
    } catch (error: any) {
      // Gracefully handle errors in development
      console.log("Push notifications not available:", error.message || error);
      return null;
    }

    // Configure Android notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#3B82F6",
      });

      // Challenge reminders channel
      await Notifications.setNotificationChannelAsync("challenges", {
        name: "Rappels de defis",
        description: "Rappels pour soumettre vos preuves",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#10B981",
      });

      // Social notifications channel
      await Notifications.setNotificationChannelAsync("social", {
        name: "Activite sociale",
        description: "Notifications de vos amis et reactions",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    return token;
  };

  const handleNotificationResponse = (data: Record<string, unknown>) => {
    // Handle different notification types
    if (data.type === "challenge_reminder") {
      // Navigate to challenge
      console.log("Navigate to challenge:", data.challengeId);
    } else if (data.type === "proof_validated") {
      // Navigate to proof
      console.log("Navigate to proof:", data.proofId);
    } else if (data.type === "friend_request") {
      // Navigate to profile
      console.log("Navigate to friend:", data.fromUserId);
    }
  };

  const scheduleLocalNotification = async (
    title: string,
    body: string,
    data: Record<string, unknown> = {},
    trigger: Notifications.NotificationTriggerInput = null
  ): Promise<string> => {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger,
    });

    return id;
  };

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notification,
        isRegistered,
        registerForPushNotifications,
        scheduleLocalNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}

// Utility functions for sending push notifications from Convex

/**
 * Send push notification to a user
 * Call this from Convex actions/mutations
 */
export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  const message = {
    to: expoPushToken,
    sound: "default",
    title,
    body,
    data,
  };

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
}
