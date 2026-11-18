// Los textos de la portada, en un solo sitio.
// Para cambiar un nombre o la frase, solo se toca este archivo.
export const wedding = {
  names: ["Arelis", "Francisco"],
  date: "2026-12-12",
  intro:
    "No hay fotógrafo: el álbum lo hacemos entre todos. Sube las fotos que hagas y mira las de los demás.",
} as const;

export function formatWeddingDate(): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${wedding.date}T00:00:00Z`));
}
