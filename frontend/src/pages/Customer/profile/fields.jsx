// Shared form pieces for the My Profile tabs.

export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[13px] font-medium text-secondary">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-text-muted">{hint}</span>}
    </label>
  );
}

export function Panel({ title, description, children, action = null }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-body text-xl font-medium text-secondary">{title}</h2>
          {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Notice({ tone = 'error', children }) {
  const classes =
    tone === 'success'
      ? 'border-success/20 bg-success-light text-success'
      : 'border-danger/20 bg-danger-light text-danger';
  return <p className={`rounded-xl border px-4 py-3 text-sm ${classes}`}>{children}</p>;
}

export function SaveButton({ isSaving, children = 'Save Changes', ...props }) {
  return (
    <button
      type="submit"
      disabled={isSaving}
      className="rounded-xl bg-secondary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary disabled:opacity-60"
      {...props}
    >
      {isSaving ? 'Saving…' : children}
    </button>
  );
}
