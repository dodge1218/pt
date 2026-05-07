type AgentAttributionProps = {
  createdByAgent: boolean;
  agentName?: string | null;
  approvedAt?: Date | string | null;
  compact?: boolean;
};

export function AgentAttribution({
  createdByAgent,
  agentName,
  approvedAt,
  compact = false,
}: AgentAttributionProps) {
  if (!createdByAgent) return null;

  const label = compact
    ? agentName
      ? `Agent: ${agentName}`
      : "Agent"
    : agentName
      ? `Agent-created by ${agentName}`
      : "Agent-created";
  const title = approvedAt
    ? `Human approved ${new Date(approvedAt).toLocaleString()}`
    : "Created by an authorized agent";

  return (
    <span
      title={title}
      className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-300"
    >
      <span aria-hidden="true">🤖</span>
      <span>{label}</span>
    </span>
  );
}
