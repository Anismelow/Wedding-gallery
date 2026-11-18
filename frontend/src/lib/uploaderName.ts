import { useSyncExternalStore } from "react";

// El nombre del invitado se guarda en localStorage: es un almacén del
// navegador que sobrevive a cerrar la pestaña y a apagar el móvil.
// Así solo hay que escribirlo una vez.

const KEY = "wg_uploader_name";
const listeners = new Set<() => void>();
// Respaldo en memoria por si el navegador bloquea localStorage
// (pasa en algunos modos de navegación privada).
let memory = "";

export function getUploaderName(): string {
  try {
    return window.localStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
}

export function setUploaderName(name: string) {
  memory = name.trim();
  try {
    window.localStorage.setItem(KEY, memory);
  } catch {
    // Sin localStorage: el nombre vale hasta que se cierre la página.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // "storage" avisa si el nombre se cambia desde otra pestaña.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** El nombre guardado. El componente se repinta solo cuando cambia. */
export function useUploaderName(): string {
  return useSyncExternalStore(subscribe, getUploaderName, () => "");
}
