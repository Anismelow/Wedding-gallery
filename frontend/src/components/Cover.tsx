"use client";

import { useState } from "react";
import { setUploaderName, useUploaderName } from "@/lib/uploaderName";
import { formatWeddingDate, wedding } from "@/lib/wedding";
import { Sprig } from "./Sprig";

/** El nombre se pide una vez; después solo se enseña, con opción de cambiarlo. */
function UploaderName() {
  const name = useUploaderName();
  const [editing, setEditing] = useState(false);

  if (name && !editing) {
    return (
      <p className="text-olive">
        Tus fotos saldrán a nombre de{" "}
        <span className="font-medium text-ink">{name}</span>.{" "}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-ink underline underline-offset-4"
        >
          Cambiar nombre
        </button>
      </p>
    );
  }

  return (
    <form
      className="mx-auto max-w-xs text-left"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setUploaderName(String(data.get("name") ?? ""));
        setEditing(false);
      }}
    >
      <label htmlFor="uploader-name" className="block font-medium">
        Tu nombre
      </label>
      <p id="uploader-name-hint" className="text-sm text-olive">
        Aparecerá junto a tus fotos. Solo te lo pedimos una vez.
      </p>
      <div className="mt-2 flex gap-2">
        <input
          id="uploader-name"
          name="name"
          type="text"
          maxLength={50}
          defaultValue={name}
          autoComplete="given-name"
          aria-describedby="uploader-name-hint"
          className="h-12 min-w-0 flex-1 border-b border-ink bg-transparent text-lg placeholder:text-leaf"
          placeholder="Por ejemplo, Tía Juana"
        />
        <button
          type="submit"
          className="h-12 shrink-0 rounded-full border border-ink px-5 font-medium"
        >
          Guardar
        </button>
      </div>
    </form>
  );
}

export function Cover() {
  const [first, second] = wedding.names;

  return (
    <header className="mx-auto max-w-xl px-6 pb-12 pt-16 text-center sm:pt-24">
      <h1 className="font-script text-7xl leading-[1.05] sm:text-8xl">
        {first}
        <span className="block py-1 text-5xl leading-tight text-leaf">y</span>
        {second}
      </h1>

      <Sprig className="mx-auto mt-8 w-52 text-leaf" />

      <p className="mt-6 text-lg tracking-wide text-olive">
        {formatWeddingDate()}
      </p>

      <p className="mx-auto mt-8 max-w-[30ch] text-xl font-light leading-relaxed">
        {wedding.intro}
      </p>

      <div className="mt-10">
        <UploaderName />
      </div>
    </header>
  );
}
