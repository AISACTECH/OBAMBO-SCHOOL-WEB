const LABELS: Record<string, string> = {
  normal: "Normal",
  important: "Important",
  urgent: "Urgent",
  emergency: "Emergency",
};

export default function PriorityBadge({ priority }: { priority: string }) {
  return <span className={`badge badge-${priority}`}>{LABELS[priority] || priority}</span>;
}
