import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  className,
  children,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="mt-2 text-muted-foreground max-w-2xl">{description}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
