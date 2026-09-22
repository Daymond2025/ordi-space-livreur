"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/lib/api";
import { ChampAuth } from "@/components/auth/ChampAuth";
import { SaisieCodeOtp } from "@/components/auth/SaisieCodeOtp";
import { BoutonAuthCompact } from "@/components/auth/BoutonAuthCompact";
import { ChevronLeftIcon } from "@/components/icons";

// Doit correspondre à OTP_LONGUEUR côté backend (app/Helpers/const.php).
const LONGUEUR_CODE = 6;

export function EcranConnexion() {
  const { user, pret, demandeOtpUserId, login, verifierOtp, annulerOtp } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    if (pret && user) router.replace("/");
  }, [pret, user, router]);

  async function onSoumettreConnexion(event: FormEvent) {
    event.preventDefault();
    setErreur(null);

    if (!email.trim() || !motDePasse) {
      setErreur("Entre ton e-mail et ton mot de passe.");
      return;
    }

    setChargement(true);
    try {
      await login(email, motDePasse);
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible de se connecter. Vérifiez votre connexion internet.");
    } finally {
      setChargement(false);
    }
  }

  async function onValiderCode() {
    if (code.length < LONGUEUR_CODE) return;

    setErreur(null);
    setChargement(true);
    try {
      await verifierOtp(code);
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible de vérifier ce code. Vérifiez votre connexion internet.");
    } finally {
      setChargement(false);
    }
  }

  if (demandeOtpUserId) {
    return (
      <main className="bg-gradient-brand-blue mx-auto flex min-h-dvh w-full max-w-xl flex-col text-white md:my-6 md:min-h-[calc(100dvh-3rem)] md:max-h-[calc(100dvh-3rem)] md:overflow-y-auto md:rounded-[2rem] md:shadow-2xl md:shadow-slate-900/15 md:ring-1 md:ring-black/5">
        <div className="relative px-6 pt-6">
          <button
            type="button"
            onClick={() => {
              annulerOtp();
              setCode("");
              setErreur(null);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
        </div>

        <h1 className="mt-3 px-6 text-center text-2xl font-extrabold leading-snug">
          Vérification
          <br />
          de ton identité
        </h1>

        <div className="mt-4 flex justify-center">
          <Image
            src="/images/image sur ecran-verification-otp.png"
            alt=""
            width={260}
            height={170}
            className="h-auto w-[220px] object-contain"
            priority
          />
        </div>

        <div className="relative mt-4 flex flex-1 flex-col rounded-t-[2rem] bg-white px-6 pb-8 pt-7 text-brand-ink">
          <p className="text-center text-sm text-brand-muted">
            Nous avons envoyé un code de vérification par e-mail
            {email ? (
              <>
                {" "}
                à <span className="font-bold text-[color:var(--brand-blue-end)]">{email}</span>
              </>
            ) : null}
            .
          </p>

          <div className="mt-7">
            <SaisieCodeOtp longueur={LONGUEUR_CODE} valeur={code} onChange={setCode} />
          </div>

          {erreur ? <p className="mt-3 text-center text-xs text-rose-500">{erreur}</p> : null}

          <div className="flex-1" />

          <BoutonAuthCompact
            type="button"
            onClick={onValiderCode}
            disabled={code.length < LONGUEUR_CODE}
            chargement={chargement}
            texteChargement="Vérification…"
            className="mt-10"
          >
            Valider
          </BoutonAuthCompact>

          <button
            type="button"
            onClick={() => {
              annulerOtp();
              setCode("");
              setErreur(null);
            }}
            className="mt-4 text-center text-sm font-semibold text-brand-muted underline underline-offset-2"
          >
            Retour à la connexion
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col bg-white pb-10 md:my-6 md:min-h-[calc(100dvh-3rem)] md:max-h-[calc(100dvh-3rem)] md:overflow-y-auto md:rounded-[2rem] md:shadow-2xl md:shadow-slate-900/15 md:ring-1 md:ring-black/5">
      <div className="bg-gradient-brand-blue relative flex flex-col items-center rounded-b-[2.5rem] px-6 pb-6 pt-6 text-white">
        <h1 className="mt-2 text-center text-2xl font-extrabold leading-snug">
          Connecte-toi
          <br />
          a ton espace Livreur
        </h1>

        <Image
          src="/images/mascotte.png"
          alt=""
          width={275}
          height={274}
          className="mt-2 h-[178px] w-[179px] object-contain"
          priority
        />
      </div>

      <form onSubmit={onSoumettreConnexion} className="relative -mt-6 flex flex-1 flex-col rounded-t-[2rem] bg-white px-6 pb-8 pt-5">
        <div className="mx-auto mb-8 h-1.5 w-12 rounded-full bg-brand-line" />

        <h2 className="text-center text-lg font-bold text-brand-ink">Entre tes identifiants</h2>

        <div className="mt-8 flex flex-col gap-3.5">
          <ChampAuth
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="Adresse e-mail"
            autoComplete="email"
            autoFocus
          />
          <ChampAuth
            type="password"
            value={motDePasse}
            onChange={setMotDePasse}
            placeholder="Mot de passe"
            autoComplete="current-password"
            erreur={erreur ?? undefined}
          />
        </div>

        <Link href="/mot-de-passe-oublie" className="mt-3 text-center text-xs font-semibold text-brand-muted underline underline-offset-2">
          Mot de passe oublié ?
        </Link>

        <div className="flex-1" />

        <BoutonAuthCompact chargement={chargement} texteChargement="Vérification…" className="mt-10">
          connexion
        </BoutonAuthCompact>

        <Link href="/inscription" className="mt-4 text-center text-sm font-semibold text-brand-muted underline underline-offset-2">
          Pas encore de compte ? Créer un compte
        </Link>
      </form>
    </main>
  );
}
