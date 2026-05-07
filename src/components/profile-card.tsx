import Link from "next/link";

interface ProfileCardProps {
  user: {
    id: string;
    name: string | null;
    image: string | null;
    github: string | null;
    headline?: string | null;
  };
  action?: React.ReactNode;
}

export function ProfileCard({ user, action }: ProfileCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      {user.image ? (
        <img src={user.image} alt="" className="w-9 h-9 rounded-full" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-[hsl(var(--secondary))] flex items-center justify-center text-sm">
          {(user.name || "?")[0]}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <Link href={`/profile/${user.id}`} className="text-sm font-medium hover:underline">
          {user.name || user.github || "Anonymous"}
        </Link>
        {user.headline && (
          <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{user.headline}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
