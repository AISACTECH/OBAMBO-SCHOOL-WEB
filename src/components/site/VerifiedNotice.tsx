export default function VerifiedNotice({ text }: { text?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--color-warning)] bg-[color-mix(in_srgb,var(--color-warning)_10%,transparent)] px-4 py-3 text-sm text-[#8a5b06]">
      <strong>Note:</strong> {text || "Information awaiting school verification. The school administration can update this section at any time from the School Control Center."}
    </div>
  );
}
