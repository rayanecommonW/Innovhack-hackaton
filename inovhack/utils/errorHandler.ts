/**
 * Error Handler Utility
 * Converts raw API/Convex errors into user-friendly messages
 */

// Common error patterns and their friendly messages
const ERROR_MESSAGES: Record<string, string> = {
  // Balance errors
  "solde insuffisant": "Solde insuffisant. Recharge ton compte pour continuer.",
  "balance": "Solde insuffisant. Recharge ton compte.",

  // Auth errors
  "utilisateur non trouvé": "Problème de connexion. Reconnecte-toi.",
  "non connecté": "Tu dois te connecter pour faire ça.",
  "not authenticated": "Tu dois te connecter.",

  // Group errors
  "membre du groupe": "Tu dois être membre du groupe.",
  "déjà membre": "Tu es déjà membre de ce groupe.",
  "groupe non trouvé": "Ce groupe n'existe plus.",
  "quitter le groupe": "Tu ne peux pas quitter ce groupe pour le moment.",
  "pacts actifs": "Tu as des pacts en cours. Termine-les d'abord.",
  "autre admin": "Tu dois nommer un autre admin avant de partir.",

  // Pact errors
  "pact non trouvé": "Ce pact n'existe plus.",
  "déjà commencé": "Ce pact a déjà commencé.",
  "déjà participé": "Tu participes déjà à ce pact.",
  "déjà rejoint": "Tu as déjà rejoint ce pact.",
  "ton propre pact": "Tu ne peux pas rejoindre ton propre pact.",
  "ne peux plus le rejoindre": "Tu ne peux plus rejoindre ce pact.",
  "pact est terminé": "Ce pact est terminé.",
  "n'accepte plus": "Ce pact n'accepte plus de participants.",
  "mise minimum": "La mise est trop faible.",
  "mise maximum": "La mise est trop élevée.",

  // Proof errors
  "preuve non trouvée": "Cette preuve n'existe plus.",
  "déjà voté": "Tu as déjà voté.",
  "délai de soumission": "Le délai pour soumettre ta preuve est dépassé.",
  "pourras soumettre": "Tu pourras soumettre ta preuve à la fin du pact.",

  // Friend errors
  "déjà amis": "Vous êtes déjà amis.",
  "demande déjà envoyée": "Demande déjà envoyée.",

  // Generic
  "network": "Problème de connexion. Vérifie ton internet.",
  "timeout": "La requête a pris trop de temps. Réessaie.",
};

/**
 * Extract a clean, user-friendly error message from raw API errors
 */
export const getErrorMessage = (error: unknown): string => {
  let rawMessage = "";

  if (error instanceof Error) {
    rawMessage = error.message;
  } else if (typeof error === "string") {
    rawMessage = error;
  } else {
    return "Une erreur est survenue. Réessaie.";
  }

  const lowerMessage = rawMessage.toLowerCase();

  // Check for known error patterns
  for (const [pattern, friendlyMessage] of Object.entries(ERROR_MESSAGES)) {
    if (lowerMessage.includes(pattern.toLowerCase())) {
      return friendlyMessage;
    }
  }

  // Extract message from Convex error format
  // Pattern: "Uncaught Error: [actual message] at handler..."
  const uncaughtMatch = rawMessage.match(/Uncaught Error:\s*([^]+?)(?:\s+at\s+|$)/);
  if (uncaughtMatch) {
    const extracted = uncaughtMatch[1].trim();
    // Check if the extracted message matches any pattern
    for (const [pattern, friendlyMessage] of Object.entries(ERROR_MESSAGES)) {
      if (extracted.toLowerCase().includes(pattern.toLowerCase())) {
        return friendlyMessage;
      }
    }
    // Return cleaned extracted message
    return extracted.replace(/\s+at\s+handler.*$/, "").trim();
  }

  // Remove technical prefixes
  let cleanMessage = rawMessage
    .replace(/\[CONVEX[^\]]*\]/g, "")
    .replace(/\[Request ID:[^\]]*\]/g, "")
    .replace(/Server Error/g, "")
    .replace(/Uncaught Error:/g, "")
    .replace(/at handler.*$/s, "")
    .replace(/Called by client.*$/s, "")
    .trim();

  // If still contains technical stuff, return generic message
  if (cleanMessage.includes("CONVEX") ||
      cleanMessage.includes("handler") ||
      cleanMessage.includes("../convex/") ||
      cleanMessage.length < 3) {
    return "Une erreur est survenue. Réessaie.";
  }

  return cleanMessage;
};

/**
 * Show a user-friendly error alert
 */
export const showErrorAlert = (
  error: unknown,
  title: string = "Oups!",
  Alert: { alert: (title: string, message: string) => void }
): void => {
  const message = getErrorMessage(error);
  Alert.alert(title, message);
};
