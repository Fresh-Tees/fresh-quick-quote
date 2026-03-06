"use client";

const PRINT_AREAS = [
  { src: "/placement-guidance/Max_Print_Area_Caps.png", label: "Caps", dimensions: "12 × 6" },
  { src: "/placement-guidance/Max_Print_Area_Tops_1.png", label: "Tops – front/back", dimensions: "38 × 43" },
  { src: "/placement-guidance/Max_Print_Area_Tops_2.png", label: "Tops – sleeve", dimensions: "8 × 43" },
  { src: "/placement-guidance/Max_Print_Area_Tops_3.png", label: "Tops – tank" },
  { src: "/placement-guidance/Max_Print_Area_Tops_4.png", label: "Tops – hoodie back" },
  { src: "/placement-guidance/Max_Print_Area_Totes.png", label: "Totes", dimensions: "28 × 30" },
];

const PLACEMENTS = [
  { src: "/placement-guidance/Print_Position_Front_Large.png", label: "Front – large" },
  { src: "/placement-guidance/Print_Position_Front_LHC.png", label: "Front – left chest" },
  { src: "/placement-guidance/Print_Position_Front_RHC.png", label: "Front – right chest" },
  { src: "/placement-guidance/Print_Position_Front_Top.png", label: "Front – top" },
  { src: "/placement-guidance/Print_Position_Back_Large.png", label: "Back – large" },
  { src: "/placement-guidance/Print_Position_Back_Nape.png", label: "Back – nape" },
  { src: "/placement-guidance/Print_Position_Back_Top.png", label: "Back – top" },
  { src: "/placement-guidance/Print_Position_Sleeve.png", label: "Sleeve" },
];

export function PlacementGuidancePage({ onReady }: { onReady: () => void }) {
  return (
    <div className="min-h-screen flex flex-col pb-24">
      <div className="max-w-3xl mx-auto px-6 py-12 flex-1">
        <h2 className="font-display font-bold text-2xl md:text-3xl text-off-black mb-2">
          Placement & print area guide
        </h2>
        <p className="font-body text-off-black/80 text-base mb-10">
          Use these as a reference for where and how large you can print on your garments.
        </p>

        <section className="mb-12">
          <h3 className="font-display font-semibold text-lg text-off-black mb-4">Placements</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLACEMENTS.map(({ src, label }) => (
              <div key={src} className="rounded-lg border border-off-black/10 overflow-hidden bg-off-white/30">
                <img
                  src={src}
                  alt={label}
                  className="w-full h-auto object-contain aspect-square bg-off-white min-h-[120px]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <p className="font-body text-sm text-off-black px-3 py-2">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h3 className="font-display font-semibold text-lg text-off-black mb-4">Print areas (max dimensions)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRINT_AREAS.map(({ src, label, dimensions }) => (
              <div key={src} className="rounded-lg border border-off-black/10 overflow-hidden bg-off-white/30">
                <img
                  src={src}
                  alt={label}
                  className="w-full h-auto object-contain aspect-square bg-off-white min-h-[120px]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <p className="font-body text-sm text-off-black px-3 py-2">
                  {label}
                  {dimensions && <span className="text-off-black/70 ml-1">({dimensions})</span>}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-off-black/10 bg-white py-4 px-6 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div className="max-w-3xl mx-auto flex justify-center">
          <button
            type="button"
            onClick={onReady}
            className="px-8 py-3.5 rounded-lg font-body font-medium text-base bg-burnt-orange text-white hover:bg-burnt-orange/90 focus:outline-none focus:ring-2 focus:ring-burnt-orange focus:ring-offset-2"
          >
            I&apos;m ready to go
          </button>
        </div>
      </div>
    </div>
  );
}
