// Featherless AI integration
// API compatible OpenAI

const FEATHERLESS_API_KEY = "rc_bc15b2d842faf40974eabdc44aa0a2f876fa31d247713bc2a50633fe582cad56";
const FEATHERLESS_API_URL = "https://api.featherless.ai/v1/chat/completions";

// Modèle à utiliser
const MODEL = "meta-llama/Meta-Llama-3.1-8B-Instruct";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callAI(messages: Message[]): Promise<string> {
  const response = await fetch(FEATHERLESS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${FEATHERLESS_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Featherless AI error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Générer des idées de défis basées sur une catégorie
export async function generateChallengeIdeas(category: string): Promise<{
  title: string;
  description: string;
  goal: string;
  goalValue: number;
  goalUnit: string;
}[]> {
  const prompt = `Tu es un assistant qui génère des défis pour une app de paris entre amis.
Catégorie: ${category}

Génère 3 défis créatifs et réalisables. Pour chaque défi, donne:
- title: titre court et accrocheur
- description: description du défi
- goal: objectif à atteindre (ex: "Faire 10000 pas par jour")
- goalValue: valeur numérique de l'objectif (ex: 10000)
- goalUnit: unité de mesure (ex: "pas")

Réponds UNIQUEMENT avec un JSON array valide, sans texte avant ou après.`;

  const response = await callAI([
    { role: "system", content: "Tu réponds uniquement en JSON valide." },
    { role: "user", content: prompt },
  ]);

  try {
    return JSON.parse(response);
  } catch {
    // Fallback hardcodé si l'IA échoue
    return getHardcodedChallenges(category);
  }
}

// Déterminer le type de preuve requis pour un défi
export async function determineProofRequirements(
  goal: string,
  goalValue: number,
  goalUnit: string
): Promise<{
  proofType: string;
  proofDescription: string;
  proofValidationCriteria: string;
}> {
  const prompt = `Tu dois déterminer comment valider un défi.

Objectif: ${goal}
Valeur cible: ${goalValue} ${goalUnit}

Détermine:
- proofType: type de preuve ("screenshot", "photo", "number", "text")
- proofDescription: ce que l'utilisateur doit fournir (ex: "Screenshot de votre compteur de pas montrant le total")
- proofValidationCriteria: critère de validation (ex: "Le nombre affiché doit être >= 10000")

Réponds UNIQUEMENT avec un JSON object valide.`;

  const response = await callAI([
    { role: "system", content: "Tu réponds uniquement en JSON valide." },
    { role: "user", content: prompt },
  ]);

  try {
    return JSON.parse(response);
  } catch {
    // Fallback hardcodé
    return {
      proofType: "screenshot",
      proofDescription: `Capture d'écran montrant que vous avez atteint ${goalValue} ${goalUnit}`,
      proofValidationCriteria: `La valeur affichée doit être >= ${goalValue} ${goalUnit}`,
    };
  }
}

// Valider une preuve soumise
export async function validateProof(
  proofContent: string,
  proofValue: number | undefined,
  proofDescription: string,
  proofValidationCriteria: string,
  goalValue: number
): Promise<{
  approved: boolean;
  comment: string;
}> {
  // Pour la démo, on simplifie la validation
  // Si une valeur numérique est fournie, on compare directement
  if (proofValue !== undefined) {
    const approved = proofValue >= goalValue;
    return {
      approved,
      comment: approved
        ? `Bravo! Vous avez atteint ${proofValue}, objectif de ${goalValue} validé!`
        : `Dommage! Vous avez ${proofValue}, il fallait ${goalValue}.`,
    };
  }

  // Sinon on demande à l'IA (pour les screenshots/photos)
  const prompt = `Tu dois valider une preuve pour un défi.

Preuve requise: ${proofDescription}
Critère de validation: ${proofValidationCriteria}
Contenu soumis: ${proofContent}

La preuve est-elle valide? Réponds avec un JSON:
{
  "approved": true/false,
  "comment": "Explication courte"
}`;

  const response = await callAI([
    { role: "system", content: "Tu réponds uniquement en JSON valide." },
    { role: "user", content: prompt },
  ]);

  try {
    return JSON.parse(response);
  } catch {
    // Fallback: on approuve pour la démo
    return {
      approved: true,
      comment: "Preuve validée automatiquement (mode démo)",
    };
  }
}

// Défis hardcodés par catégorie (fallback)
function getHardcodedChallenges(category: string) {
  const challenges: Record<string, typeof defaultChallenges> = {
    sport: [
      {
        title: "10K Steps Challenge",
        description: "Marche 10 000 pas chaque jour pendant une semaine",
        goal: "Faire 10000 pas par jour",
        goalValue: 10000,
        goalUnit: "pas",
      },
      {
        title: "Morning Runner",
        description: "Cours 5km avant 8h du matin",
        goal: "Courir 5km le matin",
        goalValue: 5,
        goalUnit: "km",
      },
      {
        title: "Pump It Up",
        description: "Fais 100 pompes dans la journée",
        goal: "Faire 100 pompes",
        goalValue: 100,
        goalUnit: "pompes",
      },
    ],
    procrastination: [
      {
        title: "Deep Work",
        description: "2 heures de travail concentré sans distraction",
        goal: "Travailler 2h sans interruption",
        goalValue: 2,
        goalUnit: "heures",
      },
      {
        title: "Inbox Zero",
        description: "Vide ta boîte mail avant midi",
        goal: "0 mails non lus",
        goalValue: 0,
        goalUnit: "mails",
      },
      {
        title: "Task Crusher",
        description: "Termine 5 tâches de ta todo list",
        goal: "Compléter 5 tâches",
        goalValue: 5,
        goalUnit: "tâches",
      },
    ],
    screen_time: [
      {
        title: "Digital Detox",
        description: "Moins de 2h de téléphone dans la journée",
        goal: "Maximum 2h d'écran",
        goalValue: 2,
        goalUnit: "heures",
      },
      {
        title: "No Social",
        description: "Pas de réseaux sociaux pendant 24h",
        goal: "0 minute sur les réseaux",
        goalValue: 0,
        goalUnit: "minutes",
      },
      {
        title: "Phone Free Dinner",
        description: "Dîner sans toucher ton téléphone",
        goal: "Repas sans téléphone",
        goalValue: 1,
        goalUnit: "repas",
      },
    ],
    social: [
      {
        title: "Talk to Strangers",
        description: "Engage la conversation avec 3 inconnus",
        goal: "Parler à 3 inconnus",
        goalValue: 3,
        goalUnit: "personnes",
      },
      {
        title: "Compliment Spree",
        description: "Fais 5 compliments sincères aujourd'hui",
        goal: "Faire 5 compliments",
        goalValue: 5,
        goalUnit: "compliments",
      },
      {
        title: "Reconnect",
        description: "Appelle un ami que tu n'as pas vu depuis longtemps",
        goal: "Appeler 1 ami",
        goalValue: 1,
        goalUnit: "appel",
      },
    ],
  };

  const defaultChallenges = [
    {
      title: "Daily Challenge",
      description: "Relève le défi du jour",
      goal: "Compléter le défi",
      goalValue: 1,
      goalUnit: "défi",
    },
  ];

  return challenges[category] || defaultChallenges;
}

// Sélectionner automatiquement la catégorie basée sur le titre du défi
export async function selectCategoryFromTitle(
  title: string,
  availableCategories: { id: string; name: string }[]
): Promise<string> {
  const categoryList = availableCategories
    .map((c) => `${c.id}: ${c.name}`)
    .join("\n");

  const prompt = `Tu dois déterminer la catégorie la plus appropriée pour ce défi.

Titre du défi: "${title}"

Catégories disponibles:
${categoryList}

Réponds UNIQUEMENT avec l'ID de la catégorie (ex: "running", "meditation", "coding").
Pas de texte supplémentaire, juste l'ID.`;

  try {
    const response = await callAI([
      { role: "system", content: "Tu réponds uniquement avec l'ID de catégorie demandé, sans explication." },
      { role: "user", content: prompt },
    ]);

    const categoryId = response.trim().toLowerCase().replace(/['"]/g, "");

    // Vérifier que la catégorie existe
    const exists = availableCategories.some((c) => c.id === categoryId);
    if (exists) {
      return categoryId;
    }

    // Fallback: chercher une correspondance partielle
    const partial = availableCategories.find((c) =>
      categoryId.includes(c.id) || c.id.includes(categoryId)
    );
    if (partial) {
      return partial.id;
    }

    return "other";
  } catch {
    return "other";
  }
}

// Générer les critères de preuve basé sur le titre uniquement
export async function generateProofFromTitle(title: string): Promise<{
  proofType: string;
  proofDescription: string;
  proofValidationCriteria: string;
}> {
  const prompt = `Tu dois déterminer comment valider ce défi basé sur son titre.

Titre du défi: "${title}"

Détermine:
- proofType: type de preuve ("screenshot", "photo", "number", "text")
- proofDescription: ce que l'utilisateur doit fournir (ex: "Photo de vous en train de courir")
- proofValidationCriteria: critère de validation (ex: "La photo doit montrer l'activité en cours")

Réponds UNIQUEMENT avec un JSON object valide.`;

  const response = await callAI([
    { role: "system", content: "Tu réponds uniquement en JSON valide." },
    { role: "user", content: prompt },
  ]);

  try {
    return JSON.parse(response);
  } catch {
    return {
      proofType: "photo",
      proofDescription: "Photo ou screenshot prouvant que tu as réalisé le défi",
      proofValidationCriteria: "La preuve doit montrer clairement la réalisation du défi",
    };
  }
}

// Codes promo sponsors hardcodés
export const SPONSOR_PROMOS: Record<
  string,
  { sponsor: string; code: string; discount: string }
> = {
  procrastination: {
    sponsor: "Notion",
    code: "BETWIN2024",
    discount: "3 mois gratuits",
  },
  sport: {
    sponsor: "Basic-Fit",
    code: "FITWIN50",
    discount: "50% sur l'abonnement",
  },
  screen_time: {
    sponsor: "Headspace",
    code: "MINDFUL30",
    discount: "30 jours gratuits",
  },
  social: {
    sponsor: "Bumble BFF",
    code: "SOCIAL2024",
    discount: "1 mois premium",
  },
};
