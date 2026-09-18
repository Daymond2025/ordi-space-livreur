"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiRequestError } from "@/lib/api";
import type { ProfilLivreur } from "@/lib/types";
import { ChampAuth } from "@/components/auth/ChampAuth";
import { ChevronLeftIcon, CheckCircleIcon } from "@/components/icons";

/**
 * "Modifier mon profil" — aucun mockup fourni pour cet écran (seule la
 * fonctionnalité a été demandée) : gabarit maison cohérent avec le reste de
 * l'app (mêmes champs ChampAuth que connexion/inscription). Branché sur
 * PATCH /moi/profil (MoiController::modifierProfil()), déjà générique à tous
 * les rôles — le mot de passe n'est envoyé que si un nouveau est saisi.
 */
export function EcranModifierProfil() {
  const { token } = useAuth();
  const router = useRouter();

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasseActuel, setMotDePasseActuel] = useState("");
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState("");
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreurGenerale, setErreurGenerale] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiFetch<ProfilLivreur>("/moi/profil", { token }).then((profil) => {
      setNom(profil.nom);
      setPrenom(profil.prenom ?? "");
      setTelephone(profil.telephone ?? "");
      setEmail(profil.email ?? "");
    });
  }, [token]);

  async function onSoumettre(event: FormEvent) {
    event.preventDefault();
    if (!token) return;

    setErreurs({});
    setErreurGenerale(null);
    setSucces(false);

    if (nouveauMotDePasse && nouveauMotDePasse !== confirmationMotDePasse) {
      setErreurs({ nouveau_mot_de_passe: "Les mots de passe ne correspondent pas." });
      return;
    }

    setChargement(true);
    try {
      await apiFetch("/moi/profil", {
        method: "PATCH",
        token,
        body: {
          nom,
          prenom: prenom.trim() || null,
          telephone: telephone.trim() || null,
          email,
          ...(nouveauMotDePasse
            ? {
                mot_de_passe_actuel: motDePasseActuel,
                nouveau_mot_de_passe: nouveauMotDePasse,
                nouveau_mot_de_passe_confirmation: confirmationMotDePasse,
              }
            : {}),
        },
      });
      setSucces(true);
      setMotDePasseActuel("");
      setNouveauMotDePasse("");
      setConfirmationMotDePasse("");
    } catch (e) {
      if (e instanceof ApiRequestError && e.fields) {
        const aplati: Record<string, string> = {};
        for (const [champ, messages] of Object.entries(e.fields)) aplati[champ] = messages[0];
        setErreurs(aplati);
      } else {
        setErreurGenerale(e instanceof ApiRequestError ? e.message : "Impossible d'enregistrer. Vérifiez votre connexion internet.");
      }
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#f2f5fa]">
      <div className="flex items-center gap-3 bg-white px-4 py-4">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Retour"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f5fa] text-brand-ink"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <p className="text-base font-extrabold text-brand-ink">Modifier mon profil</p>
      </div>

      <form onSubmit={onSoumettre} className="flex flex-1 flex-col gap-3.5 px-4 py-5">
        <ChampAuth type="text" value={nom} onChange={setNom} placeholder="Nom" autoComplete="family-name" erreur={erreurs.nom} />
        <ChampAuth type="text" value={prenom} onChange={setPrenom} placeholder="Prénom" autoComplete="given-name" erreur={erreurs.prenom} />
        <ChampAuth type="tel" value={telephone} onChange={setTelephone} placeholder="Téléphone" autoComplete="tel" erreur={erreurs.telephone} />
        <ChampAuth type="email" value={email} onChange={setEmail} placeholder="Adresse e-mail" autoComplete="email" erreur={erreurs.email} />

        <p className="mt-3 text-sm font-extrabold text-brand-ink">Changer le mot de passe</p>
        <p className="-mt-2 text-xs text-brand-muted">Laisse ces champs vides pour ne pas le modifier.</p>
        <ChampAuth
          type="password"
          value={motDePasseActuel}
          onChange={setMotDePasseActuel}
          placeholder="Mot de passe actuel"
          autoComplete="current-password"
          erreur={erreurs.mot_de_passe_actuel}
        />
        <ChampAuth
          type="password"
          value={nouveauMotDePasse}
          onChange={setNouveauMotDePasse}
          placeholder="Nouveau mot de passe"
          autoComplete="new-password"
          erreur={erreurs.nouveau_mot_de_passe}
        />
        <ChampAuth
          type="password"
          value={confirmationMotDePasse}
          onChange={setConfirmationMotDePasse}
          placeholder="Confirmer le nouveau mot de passe"
          autoComplete="new-password"
        />

        {erreurGenerale ? <p className="text-center text-xs text-rose-500">{erreurGenerale}</p> : null}
        {succes ? (
          <p className="flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-emerald-600">
            <CheckCircleIcon className="h-4 w-4" /> Profil mis à jour.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={chargement}
          className="bg-gradient-brand-blue mt-4 h-12 w-full rounded-full text-sm font-extrabold text-white transition-opacity disabled:opacity-60"
        >
          {chargement ? "Enregistrement…" : "Enregistrer les modifications"}
        </button>
      </form>
    </div>
  );
}
