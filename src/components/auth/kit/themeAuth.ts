// Thème des écrans de connexion/inscription de cette app (kit
// d'authentification : CadreAuth, MascotteVivante, DecorAuth…). Chaque app a
// le sien : couleurs, décor animé, accessoire de la mascotte et répliques.

export type ThemeAuth = {
  espace: string;
  slogan: string;
  degrade: string;
  halos: [string, string, string];
  accent: string;
  accentFin: string;
  accentHalo: string;
  accentOmbre: string;
  decor: "constellation" | "etincelles" | "colis" | "route" | "etiquettes" | "engrenages" | "bulles" | "radar";
  posture: "flotte" | "roule";
  accessoire: "aucun" | "engrenage" | "logo" | "radar" | "etoile" | "coeur" | "colis" | "casque";
  logo?: string;
  confettis: string[];
  badge: string;
  repliques: {
    salut: string;
    repos: string;
    telephone: string;
    telephoneOk: string;
    email: string;
    emailOk: string;
    mdp: string;
    erreur: string;
    code: string;
    succes: string;
    nom: string;
  };
};

export const THEME_AUTH: ThemeAuth = {
  "espace": "Livreur",
  "slogan": "Accepte tes missions, livre et suis tes gains en direct.",
  "degrade": "linear-gradient(160deg,#ea580c 0%,#f97316 35%,#0077ff 100%)",
  "halos": [
    "rgba(253,186,116,0.4)",
    "rgba(56,189,248,0.35)",
    "rgba(255,255,255,0.15)"
  ],
  "accent": "#f97316",
  "accentFin": "#0ea5e9",
  "accentHalo": "rgba(249,115,22,0.16)",
  "accentOmbre": "rgba(249,115,22,0.38)",
  "decor": "route",
  "posture": "roule",
  "accessoire": "aucun",
  "confettis": [
    "#f97316",
    "#fdba74",
    "#0ea5e9",
    "#ffffff",
    "#facc15"
  ],
  "badge": "Connexion sécurisée · code WhatsApp",
  "repliques": {
    "telephone": "Ton numéro WhatsApp 📱",
    "telephoneOk": "Parfait, je t'envoie le code 🚀",
    "email": "Ton adresse e-mail 📧",
    "emailOk": "Cet e-mail me va ✅",
    "mdp": "Je ne regarde pas 🙈",
    "code": "Regarde WhatsApp 💬",
    "salut": "Prêt pour la route ? 🛵",
    "repos": "Des livraisons t'attendent 📍",
    "erreur": "Oups… petit détour 😅",
    "succes": "En route ! 🚀",
    "nom": "Comment tu t'appelles ? ✍️"
  }
};
