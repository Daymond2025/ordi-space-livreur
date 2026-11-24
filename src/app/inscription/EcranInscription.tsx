"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/lib/api";
import { ChampDocument } from "@/components/auth/ChampDocument";
import { CadreAuth } from "@/components/auth/kit/CadreAuth";
import { ChampFlottant, IconePersonne } from "@/components/auth/kit/ChampFlottant";
import { BoutonAuth, BoutonRetour, Etapes, MessageErreur } from "@/components/auth/kit/BoutonAuth";
import type { HumeurMascotte } from "@/components/auth/kit/MascotteVivante";
import { THEME_AUTH } from "@/components/auth/kit/themeAuth";

/**
 * Numéro inconnu à l'écran /connexion — finalise la création du compte par
 * téléphone+OTP (uniformisation de l'auth, voir TelephoneAuthController::
 * inscrire()). Décision PDG inchangée : le livreur manipule l'argent du
 * client à la livraison — les 4 documents restent obligatoires dès
 * l'inscription (voir InscrireTelephoneRequest côté backend).
 */
export function EcranInscription() {
  const { inscrireParTelephone } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const telephone = searchParams.get("telephone") ?? "";

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPermis, setPhotoPermis] = useState<File | null>(null);
  const [photoCni, setPhotoCni] = useState<File | null>(null);
  const [photoCarteGrise, setPhotoCarteGrise] = useState<File | null>(null);
  const [erreursDocuments, setErreursDocuments] = useState<Record<string, string>>({});
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [compteurErreurs, setCompteurErreurs] = useState(0);
  const [focus, setFocus] = useState(false);
  const r = THEME_AUTH.repliques;

  // Efface l'erreur d'un document dès qu'il est choisi — sinon le contour
  // rouge et le message restent affichés jusqu'à la prochaine soumission,
  // alors que le champ est déjà valide.
  function choisirDocument(champ: string, setter: (fichier: File | null) => void) {
    return (fichier: File | null) => {
      setter(fichier);
      if (fichier) {
        setErreursDocuments((erreurs) => {
          if (!(champ in erreurs)) return erreurs;
          const reste = { ...erreurs };
          delete reste[champ];
          return reste;
        });
      }
    };
  }

  async function onSoumettre(event: FormEvent) {
    event.preventDefault();
    setErreur(null);
    setErreursDocuments({});

    if (!telephone) {
      setCompteurErreurs((n) => n + 1);
      setErreur("Numéro manquant — recommence depuis l'écran de connexion.");
      return;
    }
    if (!nom.trim()) {
      setCompteurErreurs((n) => n + 1);
      setErreur("Le nom est requis.");
      return;
    }

    const documentsManquants: Record<string, string> = {};
    if (!photo) documentsManquants.photo = "Photo de profil requise.";
    if (!photoPermis) documentsManquants.photo_permis = "Photo du permis requise.";
    if (!photoCni) documentsManquants.photo_cni = "Photo de la CNI requise.";
    if (!photoCarteGrise) documentsManquants.photo_carte_grise = "Photo de la carte grise requise.";
    if (Object.keys(documentsManquants).length > 0) {
      setErreursDocuments(documentsManquants);
      setCompteurErreurs((n) => n + 1);
      setErreur("Ajoute les documents manquants pour continuer.");
      return;
    }

    setChargement(true);
    try {
      const resultat = await inscrireParTelephone(
        telephone,
        nom,
        prenom.trim() || undefined,
        photo as File,
        photoPermis as File,
        photoCni as File,
        photoCarteGrise as File
      );
      const params = new URLSearchParams({ telephone, user_id: String(resultat.userId) });
      if (resultat.codeDebug) params.set("code_debug", resultat.codeDebug);

      router.push(`/connexion/verification?${params.toString()}`);
    } catch (e) {
      if (e instanceof ApiRequestError && e.fields) {
        const champsDocuments = ["photo", "photo_permis", "photo_cni", "photo_carte_grise"];
        const documentsEnErreur: Record<string, string> = {};
        for (const champ of champsDocuments) {
          if (e.fields[champ]?.[0]) documentsEnErreur[champ] = e.fields[champ][0];
        }
        if (Object.keys(documentsEnErreur).length > 0) setErreursDocuments(documentsEnErreur);
      }

      setCompteurErreurs((n) => n + 1);
      const premierMessageDeChamp = e instanceof ApiRequestError ? Object.values(e.fields ?? {})[0]?.[0] : undefined;
      setErreur(premierMessageDeChamp ?? (e instanceof ApiRequestError ? e.message : "Impossible de créer le compte. Vérifiez votre connexion internet."));
    } finally {
      setChargement(false);
    }
  }

  const nbDocuments = [photo, photoPermis, photoCni, photoCarteGrise].filter(Boolean).length;
  let humeur: HumeurMascotte = "repos";
  let bulle = r.nom;
  if (erreur) {
    humeur = "erreur";
    bulle = r.erreur;
  } else if (nom.trim() && nbDocuments === 4) {
    humeur = "saisie";
    bulle = "Dossier complet, on démarre ? 🏁";
  } else if (nbDocuments > 0) {
    humeur = "saisie";
    bulle = `${nbDocuments}/4 documents, continue ! 📄`;
  } else if (focus) {
    humeur = "saisie";
  }

  return (
    <CadreAuth humeur={humeur} bulle={bulle} declencheur={compteurErreurs}>
      <form onSubmit={onSoumettre} className="flex flex-1 flex-col" noValidate>
        <div className="flex items-center gap-3">
          <BoutonRetour onClick={() => router.back()} />
          <div className="flex-1">
            <Etapes etapes={["Numéro", "Dossier", "Code"]} active={1} />
          </div>
        </div>

        <h2 className="mt-5 text-center text-3xl font-black text-slate-900">Crée ton compte</h2>
        <p className="mt-1.5 text-center text-sm text-slate-500">
          Espace Livreur
          {telephone ? <span className="font-bold text-[var(--auth-accent)]"> · +{telephone.replace(/^\+/, "")}</span> : null}
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <ChampFlottant
            type="text"
            label="Nom"
            value={nom}
            onChange={(v) => {
              setNom(v);
              setErreur(null);
            }}
            icone={<IconePersonne />}
            valide={nom.trim().length > 1}
            enErreur={Boolean(erreur) && !nom.trim()}
            declencheurErreur={compteurErreurs}
            autoComplete="family-name"
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
          />
          <ChampFlottant
            type="text"
            label="Prénom (optionnel)"
            value={prenom}
            onChange={setPrenom}
            icone={<IconePersonne />}
            autoComplete="given-name"
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
          />
        </div>

        <div className="mt-8 flex items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-slate-900">Tes documents</h3>
            <p className="mt-1 text-xs text-slate-500">
              Requis pour vérifier ton identité, puisque tu géreras de l&apos;argent en espèces à la livraison.
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-extrabold tabular-nums ${
              nbDocuments === 4 ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
            }`}
          >
            {nbDocuments}/4
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--auth-accent),var(--auth-accent-fin))] transition-all duration-500"
            style={{ width: `${(nbDocuments / 4) * 100}%` }}
          />
        </div>

        <div className="mt-4 flex flex-col gap-2.5">
          <ChampDocument label="Photo de profil" fichier={photo} onChange={choisirDocument("photo", setPhoto)} erreur={erreursDocuments.photo} />
          <ChampDocument
            label="Permis de conduire"
            fichier={photoPermis}
            onChange={choisirDocument("photo_permis", setPhotoPermis)}
            erreur={erreursDocuments.photo_permis}
          />
          <ChampDocument label="Carte d'identité (CNI)" fichier={photoCni} onChange={choisirDocument("photo_cni", setPhotoCni)} erreur={erreursDocuments.photo_cni} />
          <ChampDocument
            label="Carte grise"
            sousLabel="Du véhicule que tu utiliseras"
            fichier={photoCarteGrise}
            onChange={choisirDocument("photo_carte_grise", setPhotoCarteGrise)}
            erreur={erreursDocuments.photo_carte_grise}
          />
        </div>

        <MessageErreur erreur={erreur} />

        <BoutonAuth type="submit" chargement={chargement} texteChargement="Création…" className="mt-8">
          Créer mon compte
        </BoutonAuth>

        <Link href="/connexion" className="mt-4 text-center text-sm font-bold text-[var(--auth-accent)] underline-offset-2 hover:underline">
          Déjà un compte ? Se connecter
        </Link>
      </form>
    </CadreAuth>
  );
}
