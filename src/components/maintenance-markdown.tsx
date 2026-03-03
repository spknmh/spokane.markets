"use client";

import ReactMarkdown from "react-markdown";

const defaultBody = "We're working on something great. Check back soon!";

interface MaintenanceMarkdownProps {
  content: string | null;
  className?: string;
}

/** Renders maintenance message body as Markdown. Blockquotes become note-style callouts. */
export function MaintenanceMarkdown({ content, className }: MaintenanceMarkdownProps) {
  const text = content?.trim() || defaultBody;

  return (
    <div
      className={className}
      style={{ wordBreak: "break-word" }}
    >
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p className="mb-3 last:mb-0 text-muted-foreground">{children}</p>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-primary underline underline-offset-4 hover:no-underline"
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-4 border-primary/50 bg-muted/50 pl-4 py-2 rounded-r text-sm text-muted-foreground">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => (
            <ul className="my-3 list-disc list-inside space-y-1 text-muted-foreground">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 list-decimal list-inside space-y-1 text-muted-foreground">
              {children}
            </ol>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
