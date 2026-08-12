"use client";

import { useEffect, useState } from "react";

export default function DataSaverToggle({ compact = false }: { compact?: boolean }) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("stmarks-data-saver") === "1";
    document.documentElement.classList.toggle("data-saver", stored);
    if (stored) {
      const timer = window.setTimeout(() => setOn(true), 0);
      return () => window.clearTimeout(timer);
    }
  }, []);

  function toggle() {
    const next = !on;
    setOn(next);
    localStorage.setItem("stmarks-data-saver", next ? "1" : "0");
    document.documentElement.classList.toggle("data-saver", next);
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={on}
      title="Reduce images and animations to save mobile data"
      className={`btn ${on ? "btn-secondary" : "btn-outline"} ${compact ? "!px-2.5 !py-1.5 text-xs" : "text-xs"}`}
    >
      <span aria-hidden>📶</span>
      Data Saver {on ? "ON" : "OFF"}
    </button>
  );
}
