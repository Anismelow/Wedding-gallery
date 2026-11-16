"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, enter, fetchPhotos, type Photo } from "@/lib/api";
import { uploadQueue } from "@/lib/uploadQueue";
import { Cover } from "./Cover";
import { Lightbox } from "./Lightbox";
import { Notice } from "./Notice";
import { PhotoGrid } from "./PhotoGrid";
import { UploadBar } from "./UploadBar";

type Status = "loading" | "ready" | "locked" | "offline";

type Album = {
  photos: Photo[];
  total: number;
  nextPage: number;
  hasMore: boolean;
};

const EMPTY_ALBUM: Album = { photos: [], total: 0, nextPage: 0, hasMore: false };

/** Junta dos listas sin repetir fotos (comparando por id). */
function merge(current: Photo[], incoming: Photo[]): Photo[] {
  const known = new Set(current.map((photo) => photo.id));
  return [...current, ...incoming.filter((photo) => !known.has(photo.id))];
}

type Opening =
  | { status: "ready"; album: Album }
  | { status: "locked" | "offline" };

// 1. Entrar: si la URL trae ?code=… (el QR), se cambia por la cookie.
// 2. Pedir la primera página. Un 401 significa "no has escaneado el QR".
async function openAlbum(): Promise<Opening> {
  try {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    if (code) {
      await enter(code).catch((error: unknown) => {
        // Código incorrecto: seguimos, y el 401 de abajo decide.
        if (!(error instanceof ApiError) || error.status !== 401) throw error;
      });
      // Se quita el código de la barra de direcciones para que no se
      // quede en el historial ni viaje en una captura de pantalla.
      url.searchParams.delete("code");
      window.history.replaceState(null, "", url);
    }

    const first = await fetchPhotos(0);
    return {
      status: "ready",
      album: {
        photos: first.content,
        total: first.page.totalElements,
        nextPage: 1,
        hasMore: first.page.totalPages > 1,
      },
    };
  } catch (error) {
    const unauthorized = error instanceof ApiError && error.status === 401;
    return { status: unauthorized ? "locked" : "offline" };
  }
}

export function WeddingApp() {
  const [status, setStatus] = useState<Status>("loading");
  const [album, setAlbum] = useState<Album>(EMPTY_ALBUM);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  const open = useCallback(() => {
    void openAlbum().then((result) => {
      if (result.status === "ready") setAlbum(result.album);
      setStatus(result.status);
    });
  }, []);

  useEffect(open, [open]);

  // Cada foto que termina de subirse se pone la primera de la galería.
  useEffect(
    () =>
      uploadQueue.onUploaded((photo) =>
        setAlbum((current) => ({
          ...current,
          photos: merge([photo], current.photos),
          total: current.total + 1,
        })),
      ),
    [],
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || !album.hasMore) return;
    setLoadingMore(true);
    setLoadError(null);
    try {
      const page = await fetchPhotos(album.nextPage);
      setAlbum((current) => ({
        photos: merge(current.photos, page.content),
        total: page.page.totalElements,
        nextPage: page.page.number + 1,
        hasMore: page.page.number + 1 < page.page.totalPages,
      }));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setStatus("locked");
      } else {
        setLoadError("No se pudieron cargar más fotos.");
      }
    } finally {
      setLoadingMore(false);
    }
  }, [album.hasMore, album.nextPage, loadingMore]);

  // Scroll infinito: cuando el final de la lista asoma, se pide otra página.
  useEffect(() => {
    const element = sentinel.current;
    if (!element || !album.hasMore || loadError) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) void loadMore();
      },
      { rootMargin: "600px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [album.hasMore, loadError, loadMore]);

  if (status === "loading") {
    return (
      <main className="flex min-h-dvh items-center justify-center text-olive">
        <p role="status">Abriendo el álbum…</p>
      </main>
    );
  }

  if (status === "locked") {
    return (
      <Notice title="Escanea el código QR de la boda">
        Esta página solo se abre con el QR que hay en las mesas. Apunta con la
        cámara del móvil y toca el enlace que aparece.
      </Notice>
    );
  }

  if (status === "offline") {
    return (
      <Notice
        title="No se puede abrir el álbum"
        action={
          <button
            type="button"
            onClick={() => {
              setStatus("loading");
              open();
            }}
            className="h-14 rounded-full bg-ink px-8 text-lg font-medium text-paper"
          >
            Reintentar
          </button>
        }
      >
        Comprueba que tienes conexión. Si sigue sin abrirse, inténtalo dentro
        de un rato: tus fotos no se pierden.
      </Notice>
    );
  }

  const count = album.total === 1 ? "1 foto" : `${album.total} fotos`;

  return (
    <>
      <Cover />

      <main className="mx-auto max-w-5xl overflow-x-clip border-t border-line pb-48 pt-12">
        <div className="px-4 pb-10 text-center">
          <h2 className="font-script text-6xl">El álbum</h2>
          {album.total > 0 && (
            <p className="mt-1 font-light text-olive">
              {count}, de la más reciente a la más antigua
            </p>
          )}
        </div>

        {album.photos.length === 0 ? (
          <p className="px-4 text-center text-lg font-light text-olive">
            Todavía no hay fotos. Sube la primera con el botón de abajo.
          </p>
        ) : (
          <PhotoGrid photos={album.photos} onOpen={setOpenIndex} />
        )}

        <div ref={sentinel} />

        {loadingMore && (
          <p role="status" className="px-4 pt-10 text-center text-olive">
            Cargando más fotos…
          </p>
        )}
        {loadError && (
          <div className="px-4 pt-10 text-center">
            <p className="text-berry">{loadError}</p>
            <button
              type="button"
              onClick={() => void loadMore()}
              className="mt-2 h-11 rounded-full border border-ink px-5"
            >
              Reintentar
            </button>
          </div>
        )}
      </main>

      <UploadBar />

      {openIndex !== null && album.photos[openIndex] && (
        <Lightbox
          photos={album.photos}
          index={openIndex}
          onNavigate={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}
