import { Film } from "lucide-react";

export function EmptyState({
  message,
  icon: Icon = Film,
  children,
}: {
  message: string;
  icon?: typeof Film;
  children?: React.ReactNode;
}) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
      <Icon className="size-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {children}
    </div>
  );
}
