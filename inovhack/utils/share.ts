/**
 * Social Sharing Utilities
 * Clean, elegant sharing for PACT app
 */

import { Share, Platform, Alert } from "react-native";
import * as Linking from "expo-linking";

// App store URLs (placeholder - replace with actual URLs when published)
const APP_STORE_URL = "https://apps.apple.com/app/pact";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=app.paact.ios";

// Get the appropriate store URL based on platform
export const getAppStoreUrl = () => {
  return Platform.OS === "ios" ? APP_STORE_URL : PLAY_STORE_URL;
};

// Share challenge invitation
export const shareChallenge = async (challenge: {
  title: string;
  description?: string;
  betAmount?: number;
  inviteCode?: string;
}) => {
  const message = buildChallengeMessage(challenge);

  try {
    const result = await Share.share({
      message,
      title: `Rejoins mon défi sur PACT: ${challenge.title}`,
    });

    return result.action === Share.sharedAction;
  } catch (error) {
    console.error("Error sharing challenge:", error);
    return false;
  }
};

// Share achievement/badge
export const shareAchievement = async (achievement: {
  title: string;
  description: string;
  icon?: string;
}) => {
  const message = `🏆 J'ai débloqué le badge "${achievement.title}" sur PACT!\n\n${achievement.description}\n\nRejoins-moi sur PACT et relève des défis!\n${getAppStoreUrl()}`;

  try {
    const result = await Share.share({
      message,
      title: `Badge débloqué: ${achievement.title}`,
    });

    return result.action === Share.sharedAction;
  } catch (error) {
    console.error("Error sharing achievement:", error);
    return false;
  }
};

// Share stats
export const shareStats = async (stats: {
  wonPacts: number;
  successRate: number;
  currentStreak: number;
  totalEarnings: number;
}) => {
  const message = `📊 Mes stats PACT:\n\n` +
    `✅ ${stats.wonPacts} pacts gagnés\n` +
    `📈 ${stats.successRate}% de réussite\n` +
    `🔥 ${stats.currentStreak} jours de série\n` +
    `💰 ${stats.totalEarnings.toFixed(0)}€ gagnés\n\n` +
    `Rejoins-moi sur PACT et transforme tes objectifs en engagements!\n${getAppStoreUrl()}`;

  try {
    const result = await Share.share({
      message,
      title: "Mes statistiques PACT",
    });

    return result.action === Share.sharedAction;
  } catch (error) {
    console.error("Error sharing stats:", error);
    return false;
  }
};

// Share proof/success
export const shareProofSuccess = async (proof: {
  challengeTitle: string;
  proofType?: string;
}) => {
  const message = `✅ J'ai complété mon défi "${proof.challengeTitle}" sur PACT!\n\n` +
    `Tenir ses engagements, c'est plus facile quand on mise dessus 💪\n\n` +
    `Rejoins-moi sur PACT!\n${getAppStoreUrl()}`;

  try {
    const result = await Share.share({
      message,
      title: `Défi complété: ${proof.challengeTitle}`,
    });

    return result.action === Share.sharedAction;
  } catch (error) {
    console.error("Error sharing proof:", error);
    return false;
  }
};

// Share referral code
export const shareReferralCode = async (referralCode: string, bonusAmount: number = 5) => {
  const message = `🎁 Utilise mon code "${referralCode}" pour recevoir ${bonusAmount}€ de bonus sur PACT!\n\n` +
    `PACT t'aide à tenir tes engagements en misant sur toi-même. ` +
    `Crée des défis, mise de l'argent, et gagne quand tu réussis!\n\n` +
    `Télécharge PACT:\n${getAppStoreUrl()}`;

  try {
    const result = await Share.share({
      message,
      title: "Code parrainage PACT",
    });

    return result.action === Share.sharedAction;
  } catch (error) {
    console.error("Error sharing referral:", error);
    return false;
  }
};

// Share group invite
export const shareGroupInvite = async (group: {
  name: string;
  inviteCode: string;
  memberCount?: number;
}) => {
  const message = `👥 Rejoins mon groupe "${group.name}" sur PACT!\n\n` +
    `Code d'invitation: ${group.inviteCode}\n\n` +
    (group.memberCount ? `Déjà ${group.memberCount} membres!\n\n` : "") +
    `Télécharge PACT et entre ce code:\n${getAppStoreUrl()}`;

  try {
    const result = await Share.share({
      message,
      title: `Rejoins ${group.name} sur PACT`,
    });

    return result.action === Share.sharedAction;
  } catch (error) {
    console.error("Error sharing group invite:", error);
    return false;
  }
};

// Share to specific platform (opens app if installed)
export const shareToTwitter = async (text: string) => {
  const encodedText = encodeURIComponent(text);
  const twitterUrl = `twitter://post?text=${encodedText}`;
  const webUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;

  try {
    const canOpen = await Linking.canOpenURL(twitterUrl);
    if (canOpen) {
      await Linking.openURL(twitterUrl);
    } else {
      await Linking.openURL(webUrl);
    }
    return true;
  } catch (error) {
    console.error("Error sharing to Twitter:", error);
    return false;
  }
};

export const shareToWhatsApp = async (text: string) => {
  const encodedText = encodeURIComponent(text);
  const whatsappUrl = `whatsapp://send?text=${encodedText}`;

  try {
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    if (canOpen) {
      await Linking.openURL(whatsappUrl);
      return true;
    } else {
      Alert.alert(
        "WhatsApp non installé",
        "WhatsApp n'est pas installé sur cet appareil."
      );
      return false;
    }
  } catch (error) {
    console.error("Error sharing to WhatsApp:", error);
    return false;
  }
};

// Build challenge message
function buildChallengeMessage(challenge: {
  title: string;
  description?: string;
  betAmount?: number;
  inviteCode?: string;
}) {
  let message = `🎯 Je te défie sur PACT: "${challenge.title}"\n\n`;

  if (challenge.description) {
    message += `${challenge.description}\n\n`;
  }

  if (challenge.betAmount) {
    message += `💰 Mise: ${challenge.betAmount}€\n\n`;
  }

  if (challenge.inviteCode) {
    message += `📝 Code d'invitation: ${challenge.inviteCode}\n\n`;
  }

  message += `Relève le défi sur PACT!\n${getAppStoreUrl()}`;

  return message;
}
