"use client";

type Props = {
  actif: boolean;
  chargement?: boolean;
  onChange: (valeur: boolean) => void;
  /** "sombre" (défaut) pour un fond dégradé (Space, avatar) ; "clair" sur un fond blanc/translucide (Mon Profil, pastille "En ligne"). */
  variante?: "sombre" | "clair";
  /** Taille du variant "clair" — 53x28 (Mon Profil) par défaut, 34x18 (pastille "En ligne" sur Space). */
  taille?: "normale" | "petite";
};

const TAILLES = {
  normale: { largeur: 53, hauteur: 28, pastille: 22, marge: 3 },
  petite: { largeur: 34, hauteur: 18, pastille: 14, marge: 2 },
};

/** Toggle "En ligne / Hors ligne" — écran Space (en-tête + pastille) et "Mon Profil". */
export function InterrupteurDisponibilite({ actif, chargement, onChange, variante = "sombre", taille = "normale" }: Props) {
  if (variante === "clair") {
    const { largeur, hauteur, pastille, marge } = TAILLES[taille];
    return (
      <button
        type="button"
        disabled={chargement}
        onClick={() => onChange(!actif)}
        aria-pressed={actif}
        className="relative shrink-0 transition-colors disabled:opacity-60"
        style={{
          width: largeur,
          height: hauteur,
          borderRadius: hauteur / 2,
          background: actif ? "rgba(190, 255, 229, 1)" : "rgba(229, 231, 235, 1)",
          border: `1px solid ${actif ? "rgba(137, 247, 206, 1)" : "rgba(209, 213, 219, 1)"}`,
        }}
      >
        <span
          className="absolute top-1/2 rounded-full shadow transition-all"
          style={{
            left: actif ? largeur - pastille - marge : marge,
            transform: "translateY(-50%)",
            height: pastille,
            width: pastille,
            background: actif ? "rgba(35, 231, 85, 1)" : "rgba(255, 255, 255, 1)",
          }}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={chargement}
      onClick={() => onChange(!actif)}
      aria-pressed={actif}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${actif ? "bg-emerald-400" : "bg-white/30"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${actif ? "translate-x-[22px]" : "translate-x-0.5"}`}
      />
    </button>
  );
}
