// Cliente de la API del backend. Es el único archivo que conoce las URLs.

/** Igual que el record PhotoResponse del backend. */
export type Photo = {
  id: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  uploaderName: string | null;
  uploadedAt: string;
};

/** Igual que el PagedModel que devuelve GET /api/photos. */
export type PhotoPage = {
  content: Photo[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
};

export const PAGE_SIZE = 30;

/** Error con el código HTTP. status 0 = no hubo respuesta (sin conexión). */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export const thumbnailUrl = (id: string) => `/api/photos/${id}/thumbnail`;
export const imageUrl = (id: string) => `/api/photos/${id}/image`;
export const downloadUrl = (id: string) => `/api/photos/${id}/download`;

/** El backend responde los errores como ProblemDetail: el texto va en "detail". */
function problemDetail(body: string, fallback: string): string {
  try {
    const parsed: unknown = JSON.parse(body);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "detail" in parsed &&
      typeof parsed.detail === "string"
    ) {
      return parsed.detail;
    }
  } catch {
    // El cuerpo no era JSON: usamos el texto por defecto.
  }
  return fallback;
}

async function request(input: string, init?: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(input, { credentials: "same-origin", ...init });
  } catch {
    throw new ApiError(0, "No se puede conectar. Comprueba tu conexión.");
  }
  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(
      response.status,
      problemDetail(body, "Algo ha fallado. Inténtalo de nuevo."),
    );
  }
  return response;
}

/** Cambia el código del QR por la cookie de acceso. */
export async function enter(code: string): Promise<void> {
  await request("/api/access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
}

export async function fetchPhotos(page: number): Promise<PhotoPage> {
  const response = await request(
    `/api/photos?page=${page}&size=${PAGE_SIZE}`,
  );
  return (await response.json()) as PhotoPage;
}

/**
 * Sube una foto. Se usa XMLHttpRequest y no fetch porque fetch no informa
 * del progreso de subida, y queremos enseñar la barra.
 */
export function uploadPhoto(
  file: File,
  uploaderName: string,
  onProgress: (fraction: number) => void,
): Promise<Photo> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    if (uploaderName) {
      form.append("uploaderName", uploaderName);
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/photos");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(event.loaded / event.total);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText) as Photo);
      } else {
        reject(
          new ApiError(
            xhr.status,
            problemDetail(xhr.responseText, "No se pudo subir la foto."),
          ),
        );
      }
    };
    xhr.onerror = () =>
      reject(new ApiError(0, "Se cortó la conexión mientras se subía."));
    xhr.send(form);
  });
}
