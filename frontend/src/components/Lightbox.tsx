"use client";

import { useEffect, useRef, useState } from "react";
import {
  ApiError,
  deletePhoto,
  downloadUrl,
  imageUrl,
  type Photo,
} from "@/lib/api";

const dateFormat = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** ¿Este móvil puede compartir archivos con su menú nativo? */
function canShareFiles(): boolean {
  if (typeof navigator === "undefined" || !navigator.canShare) return false;
  const probe = new File([], "foto.jpg", { type: "image/jpeg" });
  return navigator.canShare({ files: [probe] });
}

function ShareButton({ photo }: { photo: Photo }) {
  const [state, setState] = useState<"idle" | "busy" | "failed">("idle");

  async function share() {
    setState("busy");
    try {
      const response = await fetch(imageUrl(photo.id));
      if (!response.ok) throw new Error("download failed");
      const file = new File([await response.blob()], photo.originalFilename, {
        type: photo.contentType,
      });
      await navigator.share({ files: [file] });
      setState("idle");
    } catch (error) {
      // AbortError = el invitado cerró el menú de compartir: no es un fallo.
      const cancelled = error instanceof DOMException && error.name === "AbortError";
      setState(cancelled ? "idle" : "failed");
    }
  }

  return (
    <button
      type="button"
      onClick={() => void share()}
      disabled={state === "busy"}
      className="h-14 flex-1 rounded-full border border-paper text-lg disabled:opacity-60"
    >
      {state === "busy"
        ? "Preparando…"
        : state === "failed"
          ? "No se pudo. Descárgala"
          : "Compartir"}
    </button>
  );
}

function Picture({ photo }: { photo: Photo }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <p className="max-w-xs px-6 text-center text-lg text-line">
        Este navegador no puede mostrar esta foto ({photo.originalFilename}).
        Descárgala para verla.
      </p>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl(photo.id)}
      alt={photo.uploaderName ? `Foto de ${photo.uploaderName}` : "Foto de la boda"}
      onError={() => setFailed(true)}
      className="max-h-full max-w-full border-[6px] border-print object-contain"
    />
  );
}

export function Lightbox({
  photos,
  index,
  onNavigate,
  onDeleted,
  onClose,
}: {
  photos: Photo[];
  index: number;
  onNavigate: (index: number) => void;
  onDeleted: (id: string) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  // Dónde empezó el dedo, para saber si ha deslizado a un lado.
  const touchStartX = useRef<number | null>(null);
  const photo = photos[index];
  // Borrar pide confirmación. Se guarda el id (y no un simple true/false)
  // para que la pregunta desaparezca sola al pasar a otra foto.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const confirming = confirmingId === photo.id;

  async function remove() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deletePhoto(photo.id);
      onDeleted(photo.id);
      setConfirmingId(null);
    } catch (error) {
      // 404 = ya estaba borrada: para el invitado es lo mismo que borrarla.
      if (error instanceof ApiError && error.status === 404) {
        onDeleted(photo.id);
        setConfirmingId(null);
      } else {
        setDeleteError(
          error instanceof ApiError ? error.message : "No se pudo borrar la foto.",
        );
      }
    } finally {
      setDeleting(false);
    }
  }
  const hasPrevious = index > 0;
  const hasNext = index < photos.length - 1;

  // <dialog> con showModal() ya trae lo difícil hecho: atrapa el foco,
  // se cierra con Escape y bloquea lo que hay detrás.
  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowLeft" && hasPrevious) onNavigate(index - 1);
      if (event.key === "ArrowRight" && hasNext) onNavigate(index + 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, hasPrevious, hasNext, onNavigate]);

  const arrow =
    "flex h-12 w-12 items-center justify-center rounded-full bg-ink/60 text-2xl text-paper disabled:opacity-0";

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-label="Foto ampliada"
      className="on-dark m-0 h-dvh max-h-none w-screen max-w-none bg-transparent text-paper"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <p className="min-w-0 truncate">
            {photo.uploaderName && (
              <span className="font-medium">{photo.uploaderName}, </span>
            )}
            <span className="text-line">
              {dateFormat.format(new Date(photo.uploadedAt))}
            </span>
          </p>
          <div className="flex shrink-0 items-center">
            {photo.mine && !confirming && (
              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setConfirmingId(photo.id);
                }}
                className="h-11 rounded-full px-3 underline underline-offset-4"
              >
                Borrar
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-full px-3 underline underline-offset-4"
            >
              Cerrar
            </button>
          </div>
        </div>

        <div
          className="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center"
          onTouchStart={(event) => {
            touchStartX.current = event.touches[0].clientX;
          }}
          onTouchEnd={(event) => {
            if (touchStartX.current === null) return;
            const moved = event.changedTouches[0].clientX - touchStartX.current;
            touchStartX.current = null;
            // Menos de 50 px se considera un toque, no un deslizamiento.
            if (moved > 50 && hasPrevious) onNavigate(index - 1);
            if (moved < -50 && hasNext) onNavigate(index + 1);
          }}
        >
          {/* key: al cambiar de foto se crea un componente nuevo, así el
              "no se pudo mostrar" de una foto no se hereda en la siguiente. */}
          <Picture key={photo.id} photo={photo} />
          <button
            type="button"
            aria-label="Foto anterior"
            disabled={!hasPrevious}
            onClick={() => onNavigate(index - 1)}
            className={`${arrow} absolute left-2`}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Foto siguiente"
            disabled={!hasNext}
            onClick={() => onNavigate(index + 1)}
            className={`${arrow} absolute right-2`}
          >
            ›
          </button>
        </div>

        {confirming ? (
          <div className="mx-auto w-full max-w-md px-4 pb-6 pt-3 text-center">
            <p role="alert" className="text-lg">
              {deleteError ?? "¿Borrar esta foto? No se puede deshacer."}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmingId(null)}
                disabled={deleting}
                className="h-14 flex-1 rounded-full border border-paper text-lg disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void remove()}
                disabled={deleting}
                className="h-14 flex-1 rounded-full bg-berry text-lg font-medium text-white disabled:opacity-60"
              >
                {deleting ? "Borrando…" : "Borrar foto"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-md gap-2 px-4 pb-6 pt-3">
            {canShareFiles() && <ShareButton key={photo.id} photo={photo} />}
            <a
              href={downloadUrl(photo.id)}
              className="flex h-14 flex-[2] items-center justify-center rounded-full bg-paper text-lg font-medium text-ink"
            >
              Descargar original
            </a>
          </div>
        )}
      </div>
    </dialog>
  );
}
