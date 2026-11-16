import { ApiError, uploadPhoto, type Photo } from "./api";

// La cola de subida vive FUERA de React: es un objeto normal que avisa a
// quien esté suscrito cada vez que cambia. React la lee con
// useSyncExternalStore (ver UploadTray).

export type UploadStatus = "queued" | "uploading" | "done" | "error";

export type UploadItem = {
  id: string;
  file: File;
  uploaderName: string;
  status: UploadStatus;
  /** De 0 a 1. */
  progress: number;
  error?: string;
  /** Intentos automáticos ya gastados. */
  attempts: number;
};

// Las mismas reglas que valida el backend. Comprobarlas también aquí evita
// subir 50 MB para recibir un "no" al final (fail fast). El backend sigue
// validando: lo que llega del navegador nunca es de fiar.
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "heic", "heif"];
const MAX_BYTES = 50 * 1024 * 1024;
// Dos subidas a la vez: más rápido que una, sin ahogar una conexión móvil.
const CONCURRENCY = 2;
// Si se corta la conexión, se reintenta sola una vez antes de dar error.
const AUTO_RETRIES = 1;

function validate(file: File): string | undefined {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return "Este formato no se admite. Sube fotos JPG, PNG, WEBP o HEIC.";
  }
  if (file.size > MAX_BYTES) {
    return "La foto pesa más de 50 MB.";
  }
  return undefined;
}

class UploadQueue {
  private items: UploadItem[] = [];
  private listeners = new Set<() => void>();
  private uploadedListeners = new Set<(photo: Photo) => void>();
  private counter = 0;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => this.items;

  /** Avisa cuando una foto termina de subirse (para añadirla a la galería). */
  onUploaded(listener: (photo: Photo) => void) {
    this.uploadedListeners.add(listener);
    return () => {
      this.uploadedListeners.delete(listener);
    };
  }

  add(files: File[], uploaderName: string) {
    const added = files.map((file): UploadItem => {
      const error = validate(file);
      return {
        id: `upload-${++this.counter}`,
        file,
        uploaderName,
        status: error ? "error" : "queued",
        progress: 0,
        error,
        attempts: 0,
      };
    });
    this.set([...this.items, ...added]);
    this.pump();
  }

  retry(id: string) {
    this.update(id, { status: "queued", progress: 0, error: undefined, attempts: 0 });
    this.pump();
  }

  retryAll() {
    this.set(
      this.items.map((item) =>
        item.status === "error" && !validate(item.file)
          ? { ...item, status: "queued", progress: 0, error: undefined, attempts: 0 }
          : item,
      ),
    );
    this.pump();
  }

  /** Quita de la lista lo que ya está subido. */
  clearFinished() {
    this.set(this.items.filter((item) => item.status !== "done"));
  }

  /** ¿Se puede reintentar? Un formato no admitido fallará siempre. */
  canRetry(item: UploadItem) {
    return item.status === "error" && validate(item.file) === undefined;
  }

  // Arranca subidas mientras queden huecos libres.
  private pump() {
    const active = this.items.filter((i) => i.status === "uploading").length;
    const waiting = this.items.filter((i) => i.status === "queued");
    for (const item of waiting.slice(0, Math.max(0, CONCURRENCY - active))) {
      void this.run(item);
    }
  }

  private async run(item: UploadItem) {
    this.update(item.id, { status: "uploading", progress: 0 });
    try {
      const photo = await uploadPhoto(item.file, item.uploaderName, (progress) =>
        this.update(item.id, { progress }),
      );
      this.update(item.id, { status: "done", progress: 1 });
      this.uploadedListeners.forEach((listener) => listener(photo));
    } catch (error) {
      const apiError =
        error instanceof ApiError
          ? error
          : new ApiError(0, "No se pudo subir la foto.");
      const networkCut = apiError.status === 0;
      if (networkCut && item.attempts < AUTO_RETRIES) {
        this.update(item.id, {
          status: "queued",
          progress: 0,
          attempts: item.attempts + 1,
        });
      } else {
        this.update(item.id, { status: "error", error: apiError.message });
      }
    }
    this.pump();
  }

  private update(id: string, changes: Partial<UploadItem>) {
    this.set(
      this.items.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
  }

  // Siempre se crea un array NUEVO: React compara referencias para saber
  // si tiene que volver a pintar.
  private set(items: UploadItem[]) {
    this.items = items;
    this.listeners.forEach((listener) => listener());
  }
}

export const uploadQueue = new UploadQueue();
