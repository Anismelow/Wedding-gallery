import type { ReactNode } from "react";
import { Sprig } from "./Sprig";

/** Pantalla completa para cuando no se puede enseñar la galería. */
export function Notice({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-8 text-center">
      <Sprig className="w-44 text-leaf" />
      <h1 className="mt-8 text-3xl font-light leading-snug">{title}</h1>
      <p className="mt-5 max-w-[32ch] text-lg font-light leading-relaxed text-olive">
        {children}
      </p>
      {action && <div className="mt-8">{action}</div>}
    </main>
  );
}
