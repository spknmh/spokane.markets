"use client";

type BulkActionButtonProps = {
  label: string;
  confirmMessage: string;
  className?: string;
  formAction: (formData: FormData) => void | Promise<void>;
};

export function BulkActionButton({
  label,
  confirmMessage,
  className,
  formAction,
}: BulkActionButtonProps) {
  return (
    <button
      type="submit"
      formAction={formAction}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      className={className}
    >
      {label}
    </button>
  );
}
