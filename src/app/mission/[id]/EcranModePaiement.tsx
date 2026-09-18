"use client";

import QRCode from "qrcode";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { CashIcon, ChevronDownIcon, ChevronLeftIcon, QrCodeIcon, XCircleIcon } from "@/components/icons";
import { formaterPrix, type InitiationPaiementWave, type MissionLivreur, type PaiementResume } from "@/lib/types";
import { EcranLivraisonTerminee } from "./EcranLivraisonTerminee";
import { EcranPaiementEspeces } from "./EcranPaiementEspeces";
import { EcranCommandeAnnulee } from "./EcranCommandeAnnulee";
import { EcranRetourFournisseur } from "./EcranRetourFournisseur";

const DEGRADE_HEADER = "linear-gradient(90deg, #0077FF 0%, #00BFFF 100%)";

/** Bordure en dégradé + radius (border-image ignore le radius) — double fond padding-box/border-box. */
const BORDURE_DEGRADE_BLEUE: CSSProperties = {
  background: `linear-gradient(white, white) padding-box, ${DEGRADE_HEADER} border-box`,
  border: "1px solid transparent",
  boxShadow: "0px 12px 12px 12px rgba(0, 119, 255, 0.08)",
};

/**
 * Numéros marchands de secours si le client n'arrive pas à scanner — donnée
 * d'affichage statique (pas de secret), voir .env.example. Placeholders tant
 * que les vrais numéros ne sont pas renseignés.
 */
const NUMEROS_SECOURS = [
  { label: "Numero Wave", numero: process.env.NEXT_PUBLIC_NUMERO_WAVE, couleur: "#0077FF" },
  { label: "Numero Orange", numero: process.env.NEXT_PUBLIC_NUMERO_ORANGE, couleur: "#FF7900" },
  { label: "Numero Mtn", numero: process.env.NEXT_PUBLIC_NUMERO_MTN, couleur: "#B8A000" },
  { label: "Numero Moov", numero: process.env.NEXT_PUBLIC_NUMERO_MOOV, couleur: "#00A651" },
].filter((n) => n.numero);

/**
 * "Comment paye le client ?" — écran affiché après "Je suis arrivé".
 * "Mobile Money" est branché sur le vrai encaissement Wave (voir
 * PaiementController::initierPaiementWave + WaveWebhookController) : le QR
 * (généré ici à partir de wave_launch_url, Wave ne le fournit pas) est
 * scanné par le client avec son propre téléphone, et le webhook Wave
 * confirme le paiement automatiquement. "Confirmer le paiement" est le seul
 * secours manuel accepté (PaiementController::confirmerManuellement,
 * journalisé) — pour quand le client paie via un des numéros ci-dessous
 * plutôt que de scanner le QR, donc sans webhook possible.
 * "En Espèces" ouvre EcranPaiementEspeces (reproduction du mockup, "Paiement
 * reçu" pas encore branché). "Commande annulée" reste volontairement non
 * branché.
 */
export function EcranModePaiement({
  mission,
  onRetour,
  onRetourAccueil,
}: {
  mission: MissionLivreur;
  onRetour: () => void;
  onRetourAccueil: () => void;
}) {
  const { token } = useAuth();
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [waveLaunchUrl, setWaveLaunchUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [paiement, setPaiement] = useState<PaiementResume | null>(null);
  const [numerosOuverts, setNumerosOuverts] = useState(true);
  const [especes, setEspeces] = useState(false);
  const [annulationOuverte, setAnnulationOuverte] = useState(false);
  const [retourEnCours, setRetourEnCours] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reprend un paiement Wave en_attente déjà initié (le livreur a quitté
  // l'écran puis y revient) — sans ça, re-cliquer "Mobile Money" échoue avec
  // "déjà réglée" et le QR est perdu sans aucun moyen d'y revenir.
  useEffect(() => {
    if (!token) return;
    let annule = false;

    apiFetch<PaiementResume>(`/commandes/${mission.commande_id}/paiement`, { token })
      .then((donnees) => {
        if (annule) return;
        if (donnees.mode_paiement === "mobile_money" && donnees.wave_launch_url) {
          setPaiement(donnees);
          setWaveLaunchUrl(donnees.wave_launch_url);
        }
      })
      .catch(() => {});

    return () => {
      annule = true;
    };
  }, [token, mission.commande_id]);

  async function onChoisirMobileMoney() {
    if (!token || chargement) return;
    setErreur(null);
    setChargement(true);
    try {
      const donnees = await apiFetch<InitiationPaiementWave>(`/commandes/${mission.commande_id}/paiement/wave`, {
        method: "POST",
        token,
      });
      setPaiement(donnees.paiement);
      setWaveLaunchUrl(donnees.wave_launch_url);
    } catch (e) {
      // Message générique peu utile ici ("Les données envoyées ne sont pas
      // valides.") : WaveCheckoutService renvoie toujours la vraie raison
      // dans error.fields.wave (non configuré, montant hors bornes, Wave
      // injoignable) — même correctif que sur EcranInscription.
      const messageDeChamp = e instanceof ApiRequestError ? e.fields?.wave?.[0] : undefined;
      setErreur(messageDeChamp ?? (e instanceof ApiRequestError ? e.message : "Impossible de démarrer le paiement Wave. Réessayez."));
    } finally {
      setChargement(false);
    }
  }

  // Génère le QR à partir du lien Wave dès qu'il est disponible (rien à
  // faire si null : "Réessayer" réinitialise qrDataUrl lui-même).
  useEffect(() => {
    if (!waveLaunchUrl) return;
    let annule = false;
    QRCode.toDataURL(waveLaunchUrl, { margin: 1, width: 240 }).then((url) => {
      if (!annule) setQrDataUrl(url);
    });
    return () => {
      annule = true;
    };
  }, [waveLaunchUrl]);

  // Vérifie périodiquement le statut — seul le webhook Wave le fait
  // progresser (voir WaveWebhookController), ce polling ne fait que lire.
  useEffect(() => {
    if (!token || !paiement || paiement.statut_paiement !== "en_attente") return;

    intervalRef.current = setInterval(() => {
      apiFetch<PaiementResume>(`/commandes/${mission.commande_id}/paiement`, { token }).then(setPaiement);
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [token, paiement, mission.commande_id]);

  async function onConfirmerManuellement() {
    if (!token || !paiement || chargement) return;
    setErreur(null);
    setChargement(true);
    try {
      const misAJour = await apiFetch<PaiementResume>(`/paiements/${paiement.id}/confirmer-manuellement`, {
        method: "POST",
        token,
      });
      setPaiement(misAJour);
    } catch (e) {
      const messageDeChamp = e instanceof ApiRequestError ? e.fields?.paiement?.[0] : undefined;
      setErreur(messageDeChamp ?? (e instanceof ApiRequestError ? e.message : "Impossible de confirmer le paiement. Réessayez."));
    } finally {
      setChargement(false);
    }
  }

  if (paiement?.statut_paiement === "confirme") {
    return <EcranLivraisonTerminee mission={mission} onRetour={onRetour} onRetourAccueil={onRetourAccueil} />;
  }

  if (especes) {
    return <EcranPaiementEspeces mission={mission} onRetour={() => setEspeces(false)} onRetourAccueil={onRetourAccueil} />;
  }

  if (retourEnCours) {
    return <EcranRetourFournisseur mission={mission} onRetour={() => setRetourEnCours(false)} onRetourAccueil={onRetourAccueil} />;
  }

  const enAffichageQr = Boolean(waveLaunchUrl);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#f2f5fa]">
      <div className="relative shrink-0 rounded-b-[30px] px-4 pb-16 pt-4 text-white" style={{ background: DEGRADE_HEADER }}>
        <button
          type="button"
          onClick={onRetour}
          aria-label="Retour"
          className="absolute left-4 top-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">Paiement</p>
          <p className="mt-1 text-xl font-extrabold">{enAffichageQr ? "Mobile Money" : "Comment paye le client ?"}</p>
        </div>
      </div>

      {erreur ? <p className="px-6 pt-4 text-center text-xs text-rose-500">{erreur}</p> : null}

      {waveLaunchUrl ? (
        <div
          className="relative z-10 -mt-8 mx-4 mb-6 flex flex-col rounded-[27px] bg-white px-5 pb-6 pt-5"
          style={{ boxShadow: "0px 12px 12px 12px rgba(0, 119, 255, 0.08)" }}
        >
          {paiement?.statut_paiement === "echoue" ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-500">
                <XCircleIcon className="h-7 w-7" />
              </span>
              <p className="text-base font-extrabold text-brand-ink">Le paiement a échoué</p>
              <p className="text-sm text-brand-muted">Le client peut réessayer, ou choisis un autre mode de paiement.</p>
              <button
                type="button"
                onClick={() => {
                  setWaveLaunchUrl(null);
                  setQrDataUrl(null);
                  setPaiement(null);
                }}
                className="mt-2 rounded-full px-5 py-2.5 text-sm font-bold text-white"
                style={{ background: DEGRADE_HEADER }}
              >
                Réessayer
              </button>
            </div>
          ) : (
            <>
              <p className="text-center text-xs text-brand-muted">Montant total payer</p>
              <p className="text-center text-2xl font-extrabold text-brand-ink">{formaterPrix(mission.montant_total_a_payer)} F</p>

              <div className="mx-auto mt-4 flex h-[240px] w-[240px] items-center justify-center rounded-3xl bg-[#F5F7FA] p-4">
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- data URI générée localement, pas une image distante.
                  <img src={qrDataUrl} alt="QR code de paiement Wave" className="h-full w-full rounded-xl" />
                ) : (
                  <p className="text-xs text-brand-muted">Génération du QR…</p>
                )}
              </div>

              <p className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-brand-muted">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[color:var(--brand-blue-end)]" />
                En attente du paiement…
              </p>

              {NUMEROS_SECOURS.length > 0 ? (
                <div className="mt-5 rounded-2xl bg-[#F5F7FA] p-3">
                  <button
                    type="button"
                    onClick={() => setNumerosOuverts((v) => !v)}
                    className="flex w-full items-center justify-between gap-2 text-left"
                  >
                    <p className="text-sm font-bold text-brand-ink">Si le client n&apos;arrive pas à scanner</p>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-brand-muted">
                      <ChevronDownIcon className={`h-4 w-4 transition-transform ${numerosOuverts ? "rotate-180" : ""}`} />
                    </span>
                  </button>

                  {numerosOuverts ? (
                    <div className="mt-3 flex flex-col gap-2">
                      {NUMEROS_SECOURS.map((n) => (
                        <div key={n.label} className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5 text-xs">
                          <span className="text-brand-muted">{n.label}</span>
                          <a href={`tel:${n.numero}`} className="font-extrabold" style={{ color: n.couleur }}>
                            {n.numero}
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <button
                type="button"
                disabled={chargement}
                onClick={onConfirmerManuellement}
                className="mt-5 h-12 rounded-full text-sm font-bold text-white disabled:opacity-60"
                style={{ background: DEGRADE_HEADER }}
              >
                {chargement ? "Confirmation…" : "Confirmer le paiement"}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3 px-4 pt-5">
          <div
            className="relative z-10 -mt-16 flex h-[153px] flex-col items-center justify-center rounded-[27px]"
            style={{ background: "rgba(15, 27, 47, 1)" }}
          >
            <p className="text-xs text-white/60">Montant total à encaisser</p>
            <p className="mt-2 text-[32px] font-extrabold leading-none text-white">{formaterPrix(mission.montant_total_a_payer)} F</p>
          </div>

          <button
            type="button"
            disabled={chargement}
            onClick={onChoisirMobileMoney}
            className="flex h-[95px] items-center gap-3 rounded-[18px] bg-white px-4 text-left disabled:opacity-60"
            style={BORDURE_DEGRADE_BLEUE}
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white" style={{ background: DEGRADE_HEADER }}>
              <QrCodeIcon className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-base font-extrabold text-brand-ink">{chargement ? "Préparation…" : "Mobile Money"}</p>
              <p className="mt-0.5 text-xs font-semibold text-[color:var(--brand-blue-end)]">Wave - Orange - Moov - MTN</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setEspeces(true)}
            className="flex h-[95px] items-center gap-3 rounded-[18px] bg-white px-4 text-left"
            style={BORDURE_DEGRADE_BLEUE}
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-brand-green text-white">
              <CashIcon className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-base font-extrabold text-brand-ink">En Espèces</p>
              <p className="mt-0.5 text-xs font-semibold text-[color:var(--brand-blue-end)]">
                En cash <span className="font-normal text-brand-muted">(Tu dois faire un dépôt rapidement)</span>
              </p>
            </div>
          </button>
        </div>
      )}

      <div className="mt-auto pb-8 pt-10 text-center">
        <button type="button" onClick={() => setAnnulationOuverte(true)} className="text-sm font-bold" style={{ color: "rgba(255, 0, 0, 1)" }}>
          Commande annulée
        </button>
      </div>

      {annulationOuverte ? (
        <EcranCommandeAnnulee
          mission={mission}
          onFermer={() => setAnnulationOuverte(false)}
          onAnnulee={(destination) => {
            setAnnulationOuverte(false);
            if (destination === "retour") {
              setRetourEnCours(true);
            } else {
              onRetourAccueil();
            }
          }}
        />
      ) : null}
    </div>
  );
}
