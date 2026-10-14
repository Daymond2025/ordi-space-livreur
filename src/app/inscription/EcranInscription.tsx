"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/lib/api";
import { ChampAuth } from "@/components/auth/ChampAuth";
import { ChampDocument } from "@/components/auth/ChampDocument";
import { BoutonAuthCompact } from "@/components/auth/BoutonAuthCompact";
import { ChevronLeftIcon } from "@/components/icons";

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
      setErreur("Numéro manquant — recommence depuis l'écran de connexion.");
      return;
    }
    if (!nom.trim()) {
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

      const premierMessageDeChamp = e instanceof ApiRequestError ? Object.values(e.fields ?? {})[0]?.[0] : undefined;
      setErreur(premierMessageDeChamp ?? (e instanceof ApiRequestError ? e.message : "Impossible de créer le compte. Vérifiez votre connexion internet."));
    } finally {
      setChargement(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col bg-white pb-10 md:my-6 md:min-h-[calc(100dvh-3rem)] md:max-h-[calc(100dvh-3rem)] md:overflow-y-auto md:rounded-[2rem] md:shadow-2xl md:shadow-slate-900/15 md:ring-1 md:ring-black/5">
      <div className="bg-gradient-brand-blue relative flex flex-col items-center rounded-b-[2.5rem] px-6 pb-6 pt-6 text-white">
        <button type="button" onClick={() => router.back()} className="absolute left-4 top-6 flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>

        <h1 className="mt-2 text-center text-2xl font-extrabold leading-snug">
          Crée ton compte
          <br />
          Livreur
        </h1>

        <Image
          src="/images/mascotte.png"
          alt=""
          width={275}
          height={274}
          className="mt-2 h-[130px] w-[131px] object-contain"
          priority
        />
      </div>

      <form onSubmit={onSoumettre} className="relative -mt-6 flex flex-1 flex-col rounded-t-[2rem] bg-white px-6 pb-8 pt-5">
        <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-brand-line" />

        <h2 className="text-center text-lg font-bold text-brand-ink">Tes informations</h2>
        {telephone ? (
          <p className="mt-1 text-center text-sm font-semibold text-[color:var(--brand-blue-end)]">+{telephone.replace(/^\+/, "")}</p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3.5">
          <ChampAuth type="text" value={nom} onChange={setNom} placeholder="Nom" autoComplete="family-name" autoFocus />
          <ChampAuth type="text" value={prenom} onChange={setPrenom} placeholder="Prénom (optionnel)" autoComplete="given-name" />
        </div>

        <h2 className="mt-8 text-center text-lg font-bold text-brand-ink">Tes documents</h2>
        <p className="mt-1.5 text-center text-xs text-brand-muted">
          Requis pour vérifier ton identité, puisque tu géreras de l&apos;argent en espèces à la livraison.
        </p>

        <div className="mt-4 flex flex-col gap-2.5">
          <ChampDocument
            label="Photo de profil"
            fichier={photo}
            onChange={choisirDocument("photo", setPhoto)}
            erreur={erreursDocuments.photo}
          />
          <ChampDocument
            label="Permis de conduire"
            fichier={photoPermis}
            onChange={choisirDocument("photo_permis", setPhotoPermis)}
            erreur={erreursDocuments.photo_permis}
          />
          <ChampDocument
            label="Carte d'identité (CNI)"
            fichier={photoCni}
            onChange={choisirDocument("photo_cni", setPhotoCni)}
            erreur={erreursDocuments.photo_cni}
          />
          <ChampDocument
            label="Carte grise"
            sousLabel="Du véhicule que tu utiliseras"
            fichier={photoCarteGrise}
            onChange={choisirDocument("photo_carte_grise", setPhotoCarteGrise)}
            erreur={erreursDocuments.photo_carte_grise}
          />
        </div>

        {erreur ? <p className="mt-4 text-center text-xs text-rose-500">{erreur}</p> : null}

        <BoutonAuthCompact chargement={chargement} texteChargement="Création…" className="mt-6">
          créer mon compte
        </BoutonAuthCompact>

        <Link href="/connexion" className="mt-4 text-center text-sm font-semibold text-brand-muted underline underline-offset-2">
          Déjà un compte ? Se connecter
        </Link>
      </form>
    </main>
  );
}
