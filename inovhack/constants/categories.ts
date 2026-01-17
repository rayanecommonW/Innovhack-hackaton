// 99+ catégories pour les Pacts
export const CATEGORIES = [
  // Sport & Fitness
  { id: "running", name: "Course à pied" },
  { id: "cycling", name: "Vélo" },
  { id: "swimming", name: "Natation" },
  { id: "gym", name: "Musculation" },
  { id: "yoga", name: "Yoga" },
  { id: "hiking", name: "Randonnée" },
  { id: "football", name: "Football" },
  { id: "basketball", name: "Basketball" },
  { id: "tennis", name: "Tennis" },
  { id: "boxing", name: "Boxe" },
  { id: "martial_arts", name: "Arts martiaux" },
  { id: "dancing", name: "Danse" },
  { id: "stretching", name: "Étirements" },
  { id: "steps", name: "Pas quotidiens" },
  { id: "weight_loss", name: "Perte de poids" },
  { id: "muscle_gain", name: "Prise de muscle" },

  // Productivité
  { id: "work", name: "Travail" },
  { id: "study", name: "Études" },
  { id: "reading", name: "Lecture" },
  { id: "writing", name: "Écriture" },
  { id: "coding", name: "Programmation" },
  { id: "learning", name: "Apprentissage" },
  { id: "language", name: "Langues" },
  { id: "project", name: "Projet perso" },
  { id: "deadline", name: "Deadline" },
  { id: "morning_routine", name: "Routine matinale" },
  { id: "evening_routine", name: "Routine du soir" },
  { id: "planning", name: "Planification" },
  { id: "organization", name: "Organisation" },
  { id: "focus", name: "Concentration" },

  // Bien-être & Santé
  { id: "meditation", name: "Méditation" },
  { id: "sleep", name: "Sommeil" },
  { id: "hydration", name: "Hydratation" },
  { id: "nutrition", name: "Nutrition" },
  { id: "no_sugar", name: "Sans sucre" },
  { id: "vegetarian", name: "Végétarien" },
  { id: "fasting", name: "Jeûne" },
  { id: "vitamins", name: "Vitamines" },
  { id: "mental_health", name: "Santé mentale" },
  { id: "therapy", name: "Thérapie" },
  { id: "journaling", name: "Journal intime" },
  { id: "gratitude", name: "Gratitude" },
  { id: "skincare", name: "Soins de peau" },
  { id: "dental", name: "Hygiène dentaire" },

  // Digital & Tech
  { id: "screen_time", name: "Temps d'écran" },
  { id: "no_phone", name: "Sans téléphone" },
  { id: "no_social", name: "Sans réseaux sociaux" },
  { id: "no_netflix", name: "Sans Netflix" },
  { id: "no_gaming", name: "Sans jeux vidéo" },
  { id: "digital_detox", name: "Détox digitale" },
  { id: "inbox_zero", name: "Inbox Zero" },
  { id: "unsubscribe", name: "Désabonnements" },

  // Finance
  { id: "saving", name: "Épargne" },
  { id: "no_spending", name: "Pas de dépenses" },
  { id: "budget", name: "Budget" },
  { id: "investing", name: "Investissement" },
  { id: "no_impulse", name: "Pas d'achats impulsifs" },
  { id: "side_hustle", name: "Side hustle" },

  // Social
  { id: "family", name: "Famille" },
  { id: "friends", name: "Amis" },
  { id: "networking", name: "Networking" },
  { id: "dating", name: "Rencontres" },
  { id: "volunteering", name: "Bénévolat" },
  { id: "kindness", name: "Actes de bonté" },
  { id: "communication", name: "Communication" },
  { id: "public_speaking", name: "Prise de parole" },

  // Créativité
  { id: "art", name: "Art" },
  { id: "music", name: "Musique" },
  { id: "photography", name: "Photographie" },
  { id: "video", name: "Vidéo" },
  { id: "design", name: "Design" },
  { id: "crafts", name: "Artisanat" },
  { id: "cooking", name: "Cuisine" },
  { id: "baking", name: "Pâtisserie" },
  { id: "gardening", name: "Jardinage" },
  { id: "diy", name: "Bricolage" },

  // Mauvaises habitudes
  { id: "no_smoking", name: "Arrêter de fumer" },
  { id: "no_alcohol", name: "Sans alcool" },
  { id: "no_caffeine", name: "Sans caféine" },
  { id: "no_junk_food", name: "Sans junk food" },
  { id: "no_procrastination", name: "Anti-procrastination" },
  { id: "no_complaining", name: "Pas de plaintes" },
  { id: "no_lying", name: "Pas de mensonges" },
  { id: "no_swearing", name: "Pas de gros mots" },

  // Environnement
  { id: "eco", name: "Écologie" },
  { id: "recycling", name: "Recyclage" },
  { id: "zero_waste", name: "Zéro déchet" },
  { id: "plant_based", name: "Alimentation végétale" },
  { id: "transport", name: "Transport vert" },
  { id: "energy", name: "Économie d'énergie" },

  // Aventure
  { id: "travel", name: "Voyage" },
  { id: "exploration", name: "Exploration" },
  { id: "adventure", name: "Aventure" },
  { id: "bucket_list", name: "Bucket list" },
  { id: "challenge", name: "Défi personnel" },

  // Autre
  { id: "pets", name: "Animaux" },
  { id: "cleaning", name: "Ménage" },
  { id: "declutter", name: "Désencombrement" },
  { id: "car", name: "Voiture" },
  { id: "home", name: "Maison" },
  { id: "other", name: "Autre" },
];

export type CategoryId = typeof CATEGORIES[number]["id"];

// Fonction pour obtenir le nom d'une catégorie par son ID
export function getCategoryName(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.name || id;
}
