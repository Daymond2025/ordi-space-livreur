export type Pagination<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
};

export function formaterPrix(prix: string | number): string {
  const nombre = typeof prix === "string" ? parseFloat(prix) : prix;
  return new Intl.NumberFormat("fr-FR").format(nombre);
}

export function formaterDateHeure(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso.replace(" ", "T")));
}

/** "Aujourd'hui à 10:15" / "Hier à 09:15" / "sam 17 jan 26, à 10:15" — écran "Mes paiements". */
export function formaterDateRelative(iso: string): string {
  const date = new Date(iso.replace(" ", "T"));
  const heure = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(date);

  const debutJour = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffJours = Math.round((debutJour(new Date()) - debutJour(date)) / 86_400_000);

  if (diffJours === 0) return `Aujourd'hui à ${heure}`;
  if (diffJours === 1) return `Hier à ${heure}`;

  const jour = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "2-digit", month: "short", year: "2-digit" }).format(date);
  return `${jour}, à ${heure}`;
}

/** "8 Mois" / "2 Ans" — écran "Mon Profil", à partir de User.created_at. */
export function formaterAnciennete(createdAtIso: string): string {
  const debut = new Date(createdAtIso.replace(" ", "T"));
  const mois = Math.max(
    0,
    (Date.now() - debut.getTime()) / (30.44 * 86_400_000) // 30.44 j/mois en moyenne — assez précis pour cet affichage
  );
  const moisEntiers = Math.floor(mois);

  if (moisEntiers < 12) return `${moisEntiers} Mois`;
  const ans = Math.floor(moisEntiers / 12);
  return `${ans} An${ans > 1 ? "s" : ""}`;
}

export type PaiementResume = {
  id: number;
  mode_paiement: "mobile_money" | "especes";
  statut_paiement: "en_attente" | "confirme" | "echoue";
  // Absent du sous-ensemble renvoyé par LivraisonController::formaterMission()
  // — présent seulement sur la liste brute de MoiController::paiements().
  date_paiement?: string | null;
  date_limite_depot: string | null;
  date_depot: string | null;
  // wave_launch_url conservé pour pouvoir réafficher le QR si le livreur
  // quitte l'écran de paiement puis y revient avant confirmation.
  wave_launch_url?: string | null;
};

/** Forme renvoyée par POST /commandes/{id}/paiement/wave (PaiementController::initierPaiementWave). */
export type InitiationPaiementWave = {
  paiement: PaiementResume;
  wave_launch_url: string | null;
};

/**
 * Forme renvoyée par LivraisonController::formaterMission() (index/show) —
 * app Livreur uniquement, distincte de MissionLivreur côté Cordinateur_App_Web
 * (vue coordinateur en lecture seule sur LivreurController::missions()).
 */
export type MissionLivreur = {
  id: number;
  commande_id: number;
  nom_produit: string | null;
  photo: string | null;
  nom_client: string;
  telephone_client: string | null;
  nom_fournisseur: string | null;
  zone_fournisseur: string | null;
  telephone_fournisseur: string | null;
  zone_destination: string | null;
  lien_maps_destination: string | null;
  statut_commande: string;
  statut_livraison: "en_preparation" | "en_attente_livreur" | "assignee" | "en_cours" | "livree" | "echouee";
  colis_recupere_le: string | null;
  livraison_demarree_le: string | null;
  arrivee_le: string | null;
  date_prise_en_charge: string | null;
  retour_necessaire: boolean;
  statut_retour: "en_cours" | "effectue" | null;
  frais_livraison: number;
  montant_produit: number;
  nombre_colis: number;
  montant_total_a_payer: number;
  preuve_livraison: string | null;
  date_livraison_prevue: string | null;
  date_livraison_effective: string | null;
  paiement: PaiementResume | null;
};

export type PaiementLivreur = PaiementResume & {
  commande_id: number;
  montant: number;
  commande?: { lignes: { produit: { nom_produit: string } | null }[] };
};

/**
 * Une mission livrée, telle que renvoyée dans MoiController::paiements()
 * ("missions") — le gain du livreur est commande.frais_livraison, pas
 * Paiement::montant (l'encaissement client, une notion différente).
 */
export type MissionPaiement = {
  id: number;
  date_livraison_effective: string | null;
  commande: {
    frais_livraison: number;
    lignes: { produit: { fournisseur: { adresse_entreprise: string | null } | null } | null }[];
  };
  adresse: { localite: { nom: string } | null } | null;
};

/**
 * Forme renvoyée par GET /moi/paiements — les gains PROPRES du livreur
 * (frais_livraison sur ses missions livrées). Aucun retrait n'existe dans
 * l'app : solde_total est un cumul qui ne décroît jamais ici ; l'encaissement
 * client (Paiement::montant, le dépôt du cash COD) est une notion séparée,
 * gérée via POST /paiements/{id}/deposer, hors de cet écran.
 */
export type PaiementsLivreur = {
  solde_total: number;
  // Cash COD pas encore reversé à l'entreprise — notion séparée, utilisée par
  // l'écran Space ("X FCFA disponible") et la carte "Espèce à reverser".
  gains_non_deposes: number;
  date_limite_depot_urgente: string | null;
  missions_recues: number;
  missions_validees: number;
  gains_periode: number;
  missions: Pagination<MissionPaiement>;
};

/** Sous-ensemble utile de MoiController::profil() pour le rôle Livreur. */
export type ProfilLivreur = {
  nom: string;
  prenom: string | null;
  telephone: string;
  email: string | null;
  photo: string | null;
  disponible: boolean;
  type_vehicule: string | null;
  zone_couverture: string | null;
  /** Coordinateur qui a validé sa dernière mission — null tant qu'il n'en a aucune. */
  coordinateur: CoordinateurLivreur | null;
  created_at: string;
};

/** Fiche du coordinateur d'un livreur (MoiController::coordinateurDuLivreur()). */
export type CoordinateurLivreur = {
  nom: string;
  photo: string | null;
  telephone: string | null;
  whatsapp_url: string | null;
  adresse: string | null;
  horaires: string | null;
  zone_couverte: string | null;
};

/** Support Ordi'Space, numéro fixé par l'Admin (GET /support). `telephone` est null tant qu'il n'est pas réglé. */
export type SupportOrdiSpace = {
  nom: string;
  telephone: string | null;
  whatsapp_url: string | null;
};

/** Options possibles pour Livreur.type_vehicule (voir TYPES_VEHICULE_LIVREUR côté backend). */
export const TYPES_VEHICULE_LIVREUR = ["moto", "voiture", "tricycle", "velo"] as const;
export type TypeVehiculeLivreur = (typeof TYPES_VEHICULE_LIVREUR)[number];

/** Forme renvoyée par GET /moi/notifications (NotificationOrdispace). */
export type NotificationLivreur = {
  id: number;
  type_notification: string;
  titre: string | null;
  contenu: string;
  lu: boolean;
  date_envoi: string;
};

/** Forme renvoyée par GET /moi/recapitulatif-jour (écran "Livraison terminée !"). */
export type RecapitulatifJour = {
  livraisons_du_jour: number;
  revenu_du_jour: number;
};

/** Copié de Cordinateur_App_Web — forme d'un événement JournalAudit sur GET /commandes/{id}/suivi. */
export type SuiviDonnees = {
  statut_apres?: string;
  livreur_id?: number;
};

export type SuiviEntree = {
  id: number;
  action: string;
  details: string | null;
  date_heure: string;
  donnees: SuiviDonnees | null;
};

/** "+2250711623197" → "+225 07 11 62 31 97" ; tout autre format est laissé tel quel. */
export function formaterTelephone(brut: string): string {
  const chiffres = brut.replace(/[^\d+]/g, "");
  const correspondance = /^\+225(\d{10})$/.exec(chiffres);
  if (!correspondance) return brut;
  return `+225 ${correspondance[1].replace(/(\d{2})(?=\d)/g, "$1 ")}`;
}
