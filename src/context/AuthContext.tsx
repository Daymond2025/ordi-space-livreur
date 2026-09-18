"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch, ApiRequestError } from "@/lib/api";

export type Utilisateur = {
  id: number;
  nom: string;
  prenom: string | null;
  email: string;
  type_utilisateur: string;
  roles: string[];
  permissions: string[];
};

type SessionResult = { user: Utilisateur; token: string };

export type DonneesInscription = {
  nom: string;
  prenom?: string;
  email: string;
  telephone: string;
  password: string;
  password_confirmation: string;
  // Décision PDG : le livreur manipule l'argent du client à la livraison —
  // ces 4 pièces sont exigées dès l'inscription (pas une étape ultérieure
  // optionnelle) pour pouvoir l'identifier formellement en cas de vol/litige.
  photo: File;
  photo_permis: File;
  photo_cni: File;
  photo_carte_grise: File;
};

type AuthContextValue = {
  user: Utilisateur | null;
  token: string | null;
  pret: boolean;
  demandeOtpUserId: number | null;
  login: (email: string, password: string) => Promise<void>;
  register: (donnees: DonneesInscription) => Promise<void>;
  verifierOtp: (code: string) => Promise<void>;
  annulerOtp: () => void;
  logout: () => Promise<void>;
};

const STOCKAGE_CLE = "ordispace.livreur.session";
const NOM_APPAREIL = "livreur-web";
const ROLES_AUTORISES = ["livreur"];

const AuthContext = createContext<AuthContextValue | null>(null);

function accesRefuseSiRoleInvalide(user: Utilisateur) {
  if (!ROLES_AUTORISES.includes(user.type_utilisateur)) {
    throw new ApiRequestError(
      { code: "ACCES_REFUSE", message: "Ce compte n'a pas accès à l'espace Livreur." },
      403
    );
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Utilisateur | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [pret, setPret] = useState(false);
  const [demandeOtpUserId, setDemandeOtpUserId] = useState<number | null>(null);

  // Lecture localStorage nécessairement différée à after-mount (useEffect) :
  // le rendu serveur n'a pas accès à localStorage, donc le premier rendu
  // client doit rester identique à celui du serveur (session absente) pour
  // éviter une erreur d'hydratation — le flag `pret` distingue "pas encore
  // vérifié" de "vérifié, pas de session". Même pattern que les autres apps.
  useEffect(() => {
    const brut = localStorage.getItem(STOCKAGE_CLE);
    if (brut) {
      try {
        const session = JSON.parse(brut) as SessionResult;
        setUser(session.user);
        setToken(session.token);
      } catch {
        localStorage.removeItem(STOCKAGE_CLE);
      }
    }
    setPret(true);
  }, []);

  function memoriser(session: SessionResult) {
    setUser(session.user);
    setToken(session.token);
    setDemandeOtpUserId(null);
    localStorage.setItem(STOCKAGE_CLE, JSON.stringify(session));
  }

  async function login(email: string, password: string) {
    const reponse = await apiFetch<SessionResult | { requires_2fa: true; user_id: number }>("/auth/login", {
      method: "POST",
      body: { email, password, device_name: NOM_APPAREIL },
    });

    if ("requires_2fa" in reponse) {
      setDemandeOtpUserId(reponse.user_id);
      return;
    }

    accesRefuseSiRoleInvalide(reponse.user);
    memoriser(reponse);
  }

  /**
   * Auto-inscription (POST /auth/register) — voir roles_auto_inscription()
   * côté backend : le Livreur (contrairement au Coordinateur, provisionné
   * par un Administrateur) crée lui-même son compte. type_utilisateur est
   * fixé côté client, pas un choix laissé à l'utilisateur de cette app.
   */
  async function register(donnees: DonneesInscription) {
    // FormData (pas de JSON) : les 4 documents obligatoires sont de vrais
    // fichiers — voir RegisterRequest côté backend. Pas de device_name ici :
    // AuthController::register() nomme le jeton d'après le User-Agent de la
    // requête, pas un champ du corps.
    const formData = new FormData();
    formData.append("nom", donnees.nom);
    if (donnees.prenom) formData.append("prenom", donnees.prenom);
    formData.append("email", donnees.email);
    formData.append("telephone", donnees.telephone);
    formData.append("password", donnees.password);
    formData.append("password_confirmation", donnees.password_confirmation);
    formData.append("type_utilisateur", "livreur");
    formData.append("photo", donnees.photo);
    formData.append("photo_permis", donnees.photo_permis);
    formData.append("photo_cni", donnees.photo_cni);
    formData.append("photo_carte_grise", donnees.photo_carte_grise);

    const reponse = await apiFetch<SessionResult>("/auth/register", { method: "POST", body: formData });

    accesRefuseSiRoleInvalide(reponse.user);
    memoriser(reponse);
  }

  async function verifierOtp(code: string) {
    if (!demandeOtpUserId) return;

    const reponse = await apiFetch<SessionResult>("/auth/verify-otp", {
      method: "POST",
      body: { user_id: demandeOtpUserId, code, device_name: NOM_APPAREIL },
    });

    accesRefuseSiRoleInvalide(reponse.user);
    memoriser(reponse);
  }

  function annulerOtp() {
    setDemandeOtpUserId(null);
  }

  async function logout() {
    if (token) {
      await apiFetch("/auth/logout", { method: "POST", token }).catch(() => {});
    }
    setUser(null);
    setToken(null);
    setDemandeOtpUserId(null);
    localStorage.removeItem(STOCKAGE_CLE);
  }

  return (
    <AuthContext.Provider value={{ user, token, pret, demandeOtpUserId, login, register, verifierOtp, annulerOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth doit être utilisé sous <AuthProvider>.");
  return context;
}
