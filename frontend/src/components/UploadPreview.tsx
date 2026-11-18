"use client";

import { useEffect, useRef, useState } from "react";
import { useUploaderName } from "@/lib/uploaderName";

/** Una foto elegida y la dirección temporal para previsualizarla. */
export type Pick = { id: string; file: File; url: string };

function PreviewTile({ pick, onRemove }: { pick: Pick; onRemove: () => void }) {
  // HEIC no se puede previsualizar fuera de Safari: se enseña el nombre.
  const [failed, setFailed] = useState(false);

  return (
    <li className="relative aspect-square overflow-hidden bg-line">
      {failed ? (
        <span className="flex h-full items-center justify-center break-all px-2 text-center text-sm text-olive">
          {pick.file.name}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={pick.url}
          alt={pick.file.name}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Quitar ${pick.file.name}`}
        className="absolute inset-x-0 bottom-0 h-11 bg-ink/70 text-paper"
      >
        Quitar
      </button>
    </li>
  );
}

/**
 * Paso de confirmación: el invitado ve las fotos que ha elegido y decide
 * si las sube. Nada sale del móvil hasta que toca "Subir".
 */
export function UploadPreview({
  picks,
  onRemove,
  onConfirm,
  onCancel,
}: {
  picks: Pick[];
  onRemove: (id: string) => void;
  onConfirm: (typedName: string) => void;
  onCancel: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const savedName = useUploaderName();

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const one = picks.length === 1;

  return (
    <dialog
      ref={dialog}
      onClose={onCancel}
      aria-labelledby="preview-title"
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-paper text-ink"
    >
      <form
        className="mx-auto flex h-full max-w-xl flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          onConfirm(String(data.get("name") ?? ""));
        }}
      >
        <div className="px-5 pb-4 pt-8 text-center">
          <h2 id="preview-title" className="text-3xl font-light">
            {one ? "¿Subimos esta foto?" : `¿Subimos estas ${picks.length} fotos?`}
          </h2>
          <p className="mt-2 font-light text-olive">
            Todavía no se ha subido nada. Quita las que no te gusten.
          </p>
        </div>

        <ul
          className={`min-h-0 flex-1 content-start gap-3 overflow-y-auto px-5 ${
            one ? "grid grid-cols-1 sm:mx-auto sm:w-96" : "grid grid-cols-2 sm:grid-cols-3"
          }`}
        >
          {picks.map((pick) => (
            <PreviewTile
              key={pick.id}
              pick={pick}
              onRemove={() => onRemove(pick.id)}
            />
          ))}
        </ul>

        <div className="border-t border-line px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
          {!savedName && (
            <div className="mb-3">
              <label htmlFor="preview-name" className="block font-medium">
                Tu nombre
              </label>
              <input
                id="preview-name"
                name="name"
                type="text"
                maxLength={50}
                autoComplete="given-name"
                placeholder="Opcional. Solo te lo pedimos una vez"
                className="h-12 w-full border-b border-ink bg-transparent text-lg placeholder:text-leaf"
              />
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="h-14 flex-1 rounded-full border border-ink text-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              autoFocus
              className="h-14 flex-[2] rounded-full bg-ink text-lg font-medium text-paper"
            >
              {one ? "Subir foto" : `Subir ${picks.length} fotos`}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
