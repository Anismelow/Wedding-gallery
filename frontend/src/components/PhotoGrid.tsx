"use client";

import { useState, useSyncExternalStore } from "react";
import { thumbnailUrl, type Photo } from "@/lib/api";

// Cuántas columnas caben: 2 en móvil, 3 en tablet, 4 en ordenador.
const TABLET = "(min-width: 640px)";
const DESKTOP = "(min-width: 1024px)";

function subscribeToWidth(onChange: () => void) {
  const queries = [window.matchMedia(TABLET), window.matchMedia(DESKTOP)];
  queries.forEach((query) => query.addEventListener("change", onChange));
  return () =>
    queries.forEach((query) => query.removeEventListener("change", onChange));
}

function columnCount(): number {
  if (window.matchMedia(DESKTOP).matches) return 4;
  if (window.matchMedia(TABLET).matches) return 3;
  return 2;
}

// Cada foto queda un poco torcida, como copias en papel dejadas sobre una
// mesa. El ángulo sale del id: es "aleatorio" pero siempre el mismo para
// la misma foto, así que no baila al recargar.
const TILTS = [-2.4, 1.6, -0.8, 2.2, -1.5, 0.7, -2, 1.1];

function tiltOf(id: string): number {
  let sum = 0;
  for (const char of id) sum += char.charCodeAt(0);
  return TILTS[sum % TILTS.length];
}

function extensionOf(filename: string): string {
  return filename.split(".").pop()?.toUpperCase() ?? "";
}

function PhotoPrint({ photo, onOpen }: { photo: Photo; onOpen: () => void }) {
  // Si el navegador no sabe pintar la imagen (pasa con HEIC fuera de
  // Safari), se enseña una ficha con el tipo de archivo en vez de un
  // icono roto.
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const label = photo.uploaderName
    ? `Abrir foto de ${photo.uploaderName}`
    : "Abrir foto";

  return (
    <li style={{ transform: `rotate(${tiltOf(photo.id)}deg)` }}>
      <button
        type="button"
        onClick={onOpen}
        aria-label={label}
        className="block w-full bg-print p-1.5 text-left shadow-print"
      >
        {failed ? (
          <span className="flex aspect-square flex-col items-center justify-center gap-1 bg-line px-2 text-center text-olive">
            <span className="text-xl font-medium">
              {extensionOf(photo.originalFilename)}
            </span>
            <span className="text-sm">Toca para descargar</span>
          </span>
        ) : (
          // <img> normal a propósito: next/image pediría la foto desde el
          // servidor de Next, sin la cookie de acceso del invitado.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl(photo.id)}
            alt=""
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={`block min-h-24 w-full bg-line transition-opacity duration-500 motion-reduce:transition-none ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
        {/* El margen de abajo de la copia, con el nombre de quien la hizo. */}
        <span className="block truncate px-1 pb-1 pt-2 text-sm text-olive">
          {photo.uploaderName ?? " "}
        </span>
      </button>
    </li>
  );
}

/**
 * Las fotos se reparten en columnas por turnos (la 1.ª a la columna 1,
 * la 2.ª a la 2, la 3.ª otra vez a la 1…). Cada una conserva su forma,
 * y las columnas pares empiezan más abajo para romper la cuadrícula.
 */
export function PhotoGrid({
  photos,
  onOpen,
}: {
  photos: Photo[];
  onOpen: (index: number) => void;
}) {
  const columns = useSyncExternalStore(subscribeToWidth, columnCount, () => 2);

  const lanes: { photo: Photo; index: number }[][] = Array.from(
    { length: columns },
    () => [],
  );
  photos.forEach((photo, index) => lanes[index % columns].push({ photo, index }));

  return (
    <div className="flex items-start gap-4 px-5 sm:gap-6 sm:px-8">
      {lanes.map((lane, laneIndex) => (
        <ul
          key={laneIndex}
          className={`flex min-w-0 flex-1 flex-col gap-5 sm:gap-7 ${
            laneIndex % 2 === 1 ? "mt-12" : ""
          }`}
        >
          {lane.map(({ photo, index }) => (
            <PhotoPrint key={photo.id} photo={photo} onOpen={() => onOpen(index)} />
          ))}
        </ul>
      ))}
    </div>
  );
}
