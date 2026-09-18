"use client";

import { useRouter } from "next/navigation";
import { ChevronLeftIcon, PhoneFilledIcon, PinIcon, TruckIcon } from "@/components/icons";
import { formaterPrix, type MissionLivreur } from "@/lib/types";

const DEGRADE_HEADER = "linear-gradient(90deg, #0077FF 0%, #00BFFF 100%)";
const DEGRADE_LIVREUR = "linear-gradient(273.52deg, #FFCC00 -3.09%, #FF7800 98.47%)";

/**
 * Fond de carte décoratif — pendant de FondCarteDecoratif
 * (EcranItineraireRecuperation) pour la phase client : même limite, aucune
 * coordonnée réelle (pas de tracking GPS live pour cette v1), avec en plus
 * l'étiquette "Client {nom}" au-dessus du repère, comme sur le mockup.
 */
function FondCarteDecoratif({ nomClient }: { nomClient: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#E4EBF5]">
      <svg viewBox="0 0 402 420" className="absolute inset-0 h-full w-full text-[#C7D3E3]" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M0 90h402M0 220h402M70 0v420M300 0v130M300 130h102" />
        <path d="M150 130 250 130 250 260" />
      </svg>

      <svg viewBox="0 0 402 420" className="absolute inset-0 h-full w-full text-[color:var(--brand-blue-end)]" fill="none">
        <path d="M150 130 Q210 190 240 230 T280 300" strokeWidth={3} strokeLinecap="round" strokeDasharray="2 10" stroke="currentColor" />
      </svg>

      <div className="absolute flex -translate-x-1/2 flex-col items-center" style={{ top: "20%", left: "35%" }}>
        <span className="whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold text-white shadow" style={{ background: DEGRADE_HEADER }}>
          Client {nomClient}
        </span>
        <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-brand-line bg-white shadow-md">
          <PinIcon className="h-4 w-4 text-brand-ink" />
        </span>
      </div>

      <div className="absolute" style={{ top: "71%", left: "68%" }}>
        <span
          className="flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white shadow-lg"
          style={{ background: DEGRADE_HEADER }}
        >
          <TruckIcon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

/**
 * Itinéraire vers le client (phase livraison d'une mission en_cours, après
 * colis_recupere_le + livraison_demarree_le) — carte décorative, mais
 * "Appelle" et "Je suis arrivé" sont fonctionnels. "Je suis arrivé" appelle
 * POST /livraisons/{id}/arriver (persisté en arrivee_le), qui donne accès à
 * l'écran "Comment paye le client ?".
 */
export function EcranSuiviLivraison({
  mission,
  onArrive,
}: {
  mission: MissionLivreur;
  onArrive: () => void;
}) {
  const router = useRouter();
  const telephone = mission.telephone_client;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="relative z-10 flex shrink-0 items-center gap-3 px-4 py-3 text-white" style={{ background: DEGRADE_HEADER }}>
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Retour"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <p className="flex-1 text-center text-sm font-extrabold">En route pour livraison</p>
        <div className="h-9 w-9 shrink-0" />
      </div>

      <div className="relative flex-1">
        <FondCarteDecoratif nomClient={mission.nom_client} />
      </div>

      <div
        className="relative z-10 mx-[22px] mb-6 mt-4 shrink-0 rounded-[27px] bg-white px-5 pb-5 pt-4"
        style={{ boxShadow: "0px 12px 12px 12px rgba(0, 119, 255, 0.08)" }}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-brand-muted">Livraison chez</p>
          <span className="rounded-full px-3 py-1 text-[11px] font-bold text-white" style={{ background: DEGRADE_HEADER }}>
            En Route
          </span>
        </div>

        <div className="mt-2 flex items-start gap-3 rounded-2xl bg-[#F5F7FA] p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-brand-blue text-xs font-bold text-white">
            {mission.nom_client.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-brand-ink">{mission.nom_client}</p>
            <p className="mt-0.5 flex items-start gap-1 text-xs text-brand-muted">
              <PinIcon className="mt-0.5 h-3 w-3 shrink-0" />
              <span>Lieu : {mission.zone_destination ?? "—"}</span>
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-blue-50 p-2">
            <p className="text-[10px] text-brand-muted">Prix total produit</p>
            <p className="mt-0.5 text-xs font-extrabold text-[color:var(--brand-blue-end)]">{formaterPrix(mission.montant_produit)} FCFA</p>
            <p className="text-[10px] text-brand-muted">{mission.nombre_colis} Colis</p>
          </div>
          <div className="rounded-xl bg-rose-50 p-2">
            <p className="text-[10px] text-brand-muted">Frais de livraison</p>
            <p className="mt-0.5 text-xs font-extrabold text-rose-500">{formaterPrix(mission.frais_livraison)} FCFA</p>
            <p className="text-[10px] text-brand-muted">1 Course</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-2">
            <p className="text-[10px] text-brand-muted">Total à payer</p>
            <p className="mt-0.5 text-xs font-extrabold text-emerald-600">{formaterPrix(mission.montant_total_a_payer)} FCFA</p>
            <p className="text-[10px] text-brand-muted">À la livraison</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-brand-muted">Distance : —</span>
          <span className="font-bold text-[color:var(--brand-blue-end)]">Arrivée dans —</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#EEF1F6]">
          <div className="h-full w-1/2 rounded-full" style={{ background: DEGRADE_HEADER }} />
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onArrive}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white"
            style={{ background: DEGRADE_LIVREUR }}
          >
            Je suis arrivé
          </button>

          {telephone ? (
            <a
              href={`tel:${telephone}`}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white"
              style={{ background: DEGRADE_HEADER }}
            >
              <PhoneFilledIcon className="h-3.5 w-3.5" />
              Appelle
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
