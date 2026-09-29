import { Loader2 } from "lucide-react";

interface LoaderProps {
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

export function Loader({ text = "Loading...", className = "", fullScreen = false }: LoaderProps) {
  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 text-muted-foreground ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      {text && <p className="text-sm font-medium animate-pulse">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return (
    <div className="flex w-full items-center justify-center p-8">
      {content}
    </div>
  );
}
