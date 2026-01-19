/**
 * ProfileImagePicker Component
 * Upload and display profile image with camera/gallery options
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Colors, BorderRadius, Shadows } from "../constants/theme";

interface ProfileImagePickerProps {
  userId: Id<"users">;
  currentImageUrl?: string;
  size?: number;
  onImageUpdated?: (url: string | null) => void;
}

export default function ProfileImagePicker({
  userId,
  currentImageUrl,
  size = 100,
  onImageUpdated,
}: ProfileImagePickerProps) {
  const [uploading, setUploading] = useState(false);

  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const saveProfileImage = useMutation(api.users.saveProfileImage);
  const removeProfileImage = useMutation(api.users.removeProfileImage);

  const pickImage = async (useCamera: boolean) => {
    try {
      // Request permissions
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission requise", "L'accès à la caméra est nécessaire");
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission requise", "L'accès à la galerie est nécessaire");
          return;
        }
      }

      // Launch picker
      const result = await (useCamera
        ? ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          })
        : ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          }));

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Erreur", "Impossible de sélectionner l'image");
    }
  };

  const uploadImage = async (uri: string) => {
    setUploading(true);
    try {
      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Fetch the image and convert to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload to Convex storage
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob,
      });

      const { storageId } = await uploadResponse.json();

      // Save the image reference in the user profile
      const result = await saveProfileImage({
        userId,
        storageId,
      });

      if (result.url && onImageUpdated) {
        onImageUpdated(result.url);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Erreur", "Impossible de téléverser l'image");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    Alert.alert(
      "Supprimer la photo",
      "Voulez-vous vraiment supprimer votre photo de profil ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await removeProfileImage({ userId });
              if (onImageUpdated) {
                onImageUpdated(null);
              }
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer la photo");
            }
          },
        },
      ]
    );
  };

  const showOptions = () => {
    const options: Array<{ text: string; onPress?: () => void; style?: "cancel" | "destructive" }> = [
      { text: "Prendre une photo", onPress: () => { pickImage(true); } },
      { text: "Choisir dans la galerie", onPress: () => { pickImage(false); } },
    ];

    if (currentImageUrl) {
      options.push({ text: "Supprimer la photo", onPress: () => { handleRemoveImage(); }, style: "destructive" });
    }

    options.push({ text: "Annuler", style: "cancel" });

    Alert.alert("Photo de profil", "Choisir une option", options);
  };

  return (
    <TouchableOpacity
      onPress={showOptions}
      disabled={uploading}
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
      activeOpacity={0.8}
    >
      {uploading ? (
        <View style={[styles.loadingContainer, { borderRadius: size / 2 }]}>
          <ActivityIndicator color={Colors.accent} size="small" />
        </View>
      ) : currentImageUrl ? (
        <Image
          source={{ uri: currentImageUrl }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <View style={[styles.placeholder, { borderRadius: size / 2 }]}>
          <Ionicons name="person" size={size * 0.4} color={Colors.textMuted} />
        </View>
      )}

      <View style={[styles.editBadge, { right: 0, bottom: 0 }]}>
        <Ionicons name="camera" size={14} color={Colors.white} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  image: {
    backgroundColor: Colors.surfaceHighlight,
  },
  placeholder: {
    flex: 1,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
  },
  editBadge: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.white,
    ...Shadows.sm,
  },
});
