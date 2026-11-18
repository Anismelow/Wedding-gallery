"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
} from "react";
import { getUploaderName, setUploaderName } from "@/lib/uploaderName";
import { uploadQueue, type UploadItem } from "@/lib/uploadQueue";
import { UploadPreview, type Pick } from "./UploadPreview";

const EMPTY: UploadItem[] = [];

function statusText(item: UploadItem): string {
  switch (item.status) {
    case "queued":
      return "En cola";
    case "uploading":
      return `Subiendo, ${Math.round(item.progress * 100)} %`;
    case "done":
      return "Subida";
    case "error":
      return item.error ?? "No se subió";
  }
}

function UploadRow({ item }: { item: UploadItem }) {
  const failed = item.status === "error";
  return (
    <li className="py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{item.file.name}</p>
          <p className={failed ? "text-sm text-berry" : "text-sm text-olive"}>
            {statusText(item)}
          </p>
        </div>
        {uploadQueue.canRetry(item) && (
          <button
            type="button"
            onClick={() => uploadQueue.retry(item.id)}
            className="h-11 shrink-0 rounded-full border border-ink px-4"
          >
            Reintentar
          </button>
        )}
      </div>
      {item.status === "uploading" && (
        <div className="mt-1.5 h-0.5 overflow-hidden bg-line">
          <div
            className="h-full bg-ink transition-[width] duration-200"
            style={{ width: `${item.progress * 100}%` }}
          />
        </div>
      )}
    </li>
  );
}

function summary(items: UploadItem[]): string {
  const pending = items.filter(
    (i) => i.status === "queued" || i.status === "uploading",
  ).length;
  const failed = items.filter((i) => i.status === "error").length;
  const done = items.filter((i) => i.status === "done").length;

  if (pending > 0) {
    return `Subiendo ${done + 1} de ${done + pending}. No cierres la página.`;
  }
  if (failed > 0) {
    return failed === 1
      ? "1 foto no se subió."
      : `${failed} fotos no se subieron.`;
  }
  return done === 1 ? "1 foto subida." : `${done} fotos subidas.`;
}

let pickCounter = 0;

const fileInput = "sr-only";
const buttonBase =
  "flex h-14 cursor-pointer items-center justify-center rounded-full text-lg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-ink";

/** Barra fija abajo: siempre a mano del pulgar, con la lista de subidas. */
export function UploadBar() {
  // Fotos elegidas que esperan confirmación (todavía no se han subido).
  const [picks, setPicks] = useState<Pick[]>([]);
  const items = useSyncExternalStore(
    uploadQueue.subscribe,
    uploadQueue.getSnapshot,
    () => EMPTY,
  );
  const working = items.some(
    (i) => i.status === "queued" || i.status === "uploading",
  );
  const retryable = items.filter((i) => uploadQueue.canRetry(i)).length;

  // Si quedan subidas a medias, el navegador pregunta antes de cerrar.
  useEffect(() => {
    if (!working) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [working]);

  // URL.createObjectURL da una dirección temporal a un archivo del móvil
  // para poder pintarlo. Ocupa memoria hasta que se libera con revoke.
  function onPick(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setPicks(
      files.map((file) => ({
        id: `pick-${++pickCounter}`,
        file,
        url: URL.createObjectURL(file),
      })),
    );
    // Se vacía para poder elegir otra vez las mismas fotos.
    event.target.value = "";
  }

  function closePreview() {
    picks.forEach((pick) => URL.revokeObjectURL(pick.url));
    setPicks([]);
  }

  function removePick(id: string) {
    const removed = picks.find((pick) => pick.id === id);
    if (removed) URL.revokeObjectURL(removed.url);
    setPicks(picks.filter((pick) => pick.id !== id));
  }

  function confirm(typedName: string) {
    if (typedName.trim()) setUploaderName(typedName);
    uploadQueue.add(
      picks.map((pick) => pick.file),
      getUploaderName(),
    );
    closePreview();
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto max-w-xl px-4 py-3">
        {items.length > 0 && (
          <section aria-label="Fotos que estás subiendo" className="mb-3">
            <div className="flex items-center justify-between gap-3">
              <p role="status" className="font-medium">
                {summary(items)}
              </p>
              {!working &&
                (retryable > 1 ? (
                  <button
                    type="button"
                    onClick={() => uploadQueue.retryAll()}
                    className="h-11 shrink-0 underline underline-offset-4"
                  >
                    Reintentar todas
                  </button>
                ) : (
                  items.some((i) => i.status === "done") && (
                    <button
                      type="button"
                      onClick={() => uploadQueue.clearFinished()}
                      className="h-11 shrink-0 underline underline-offset-4"
                    >
                      Ocultar
                    </button>
                  )
                ))}
            </div>
            <ul className="max-h-52 divide-y divide-line overflow-y-auto">
              {items
                .filter((i) => i.status !== "done")
                .map((item) => (
                  <UploadRow key={item.id} item={item} />
                ))}
            </ul>
          </section>
        )}

        {/* Cada <label> envuelve a su input: tocarlo abre la cámara o la
            galería del móvil sin una línea de JavaScript. */}
        <div className="flex gap-2">
          <label className={`${buttonBase} flex-1 border border-ink`}>
            Hacer foto
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className={fileInput}
              onChange={onPick}
            />
          </label>
          <label
            className={`${buttonBase} flex-[2] bg-ink font-medium text-paper`}
          >
            Subir fotos
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
              className={fileInput}
              onChange={onPick}
            />
          </label>
        </div>
      </div>

      {picks.length > 0 && (
        <UploadPreview
          picks={picks}
          onRemove={removePick}
          onConfirm={confirm}
          onCancel={closePreview}
        />
      )}
    </div>
  );
}
