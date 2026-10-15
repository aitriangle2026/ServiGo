import { useEffect, useState } from 'react';
import { FiMapPin, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { userService } from '@/services/userService';
import { Field, Notice, Panel, SaveButton } from './fields';
import { inputClass } from './inputClass';

const EMPTY = { label: 'Home', addressLine: '', city: '' };

/**
 * The same saved addresses the booking page offers at checkout.
 *
 * @param {{ onChange?: (addresses: object[]) => void }} props — lets the page
 *   keep its completion score in step.
 */
export default function AddressesTab({ onChange }) {
  const [addresses, setAddresses] = useState(null);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null); // 'new' or an address id
  const [form, setForm] = useState(EMPTY);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    userService
      .listAddresses()
      .then((response) => {
        if (!cancelled) setAddresses(response?.data || []);
      })
      .catch(() => {
        if (!cancelled) {
          setAddresses([]);
          setError('Could not load your addresses.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const apply = (response) => {
    const list = response?.data || [];
    setAddresses(list);
    onChange?.(list);
  };

  const run = async (action) => {
    setError('');
    setIsSaving(true);
    try {
      apply(await action());
      return true;
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not update your addresses.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (address) => {
    setEditingId(address?._id || 'new');
    setForm(address ? { label: address.label, addressLine: address.addressLine, city: address.city || '' } : EMPTY);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.addressLine.trim()) {
      setError('Enter the street address.');
      return;
    }
    const ok = await run(() =>
      editingId === 'new' ? userService.addAddress(form) : userService.updateAddress(editingId, form)
    );
    if (ok) setEditingId(null);
  };

  return (
    <Panel
      title="Addresses"
      description="Saved addresses you can pick when booking."
      action={
        editingId === null && (
          <button
            type="button"
            onClick={() => startEdit(null)}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-[13px] font-medium text-secondary hover:border-primary hover:text-primary"
          >
            <FiPlus /> Add address
          </button>
        )
      }
    >
      <div className="space-y-4">
        {error && <Notice>{error}</Notice>}

        {editingId !== null && (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-surface-warm p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
              <Field label="Label">
                <input
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="Home, Office…"
                  className={inputClass}
                />
              </Field>
              <Field label="City">
                <input
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="e.g. Colombo 03"
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Street address">
              <input
                value={form.addressLine}
                onChange={(e) => setForm((f) => ({ ...f, addressLine: e.target.value }))}
                placeholder="No. 15, Galle Road"
                className={inputClass}
              />
            </Field>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="rounded-xl border border-border bg-surface px-5 py-3 text-sm font-medium text-secondary hover:bg-surface-warm"
              >
                Cancel
              </button>
              <SaveButton isSaving={isSaving}>{editingId === 'new' ? 'Add address' : 'Save address'}</SaveButton>
            </div>
          </form>
        )}

        {addresses === null && <div className="h-24 animate-pulse rounded-xl bg-surface-warm" />}

        {addresses?.length === 0 && editingId === null && (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-muted">
            No saved addresses yet. Add one to book faster.
          </p>
        )}

        {addresses?.map((address) => (
          <div key={address._id} className="flex items-start gap-4 rounded-xl border border-border p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-warm text-secondary">
              <FiMapPin />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-secondary">
                {address.label || 'Address'}
                {address.isDefault && (
                  <span className="rounded-md bg-success-light px-2 py-0.5 text-[11px] font-medium text-success">Default</span>
                )}
              </p>
              <p className="mt-0.5 text-[13px] text-text-muted">
                {[address.addressLine, address.city].filter(Boolean).join(', ')}
              </p>
              {!address.isDefault && (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => run(() => userService.updateAddress(address._id, { isDefault: true }))}
                  className="mt-2 text-xs font-medium text-primary hover:underline disabled:opacity-50"
                >
                  Make default
                </button>
              )}
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => startEdit(address)}
                aria-label={`Edit ${address.label}`}
                className="grid h-9 w-9 place-items-center rounded-full text-secondary hover:bg-surface-warm"
              >
                <FiEdit2 size={14} />
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => {
                  if (window.confirm(`Remove "${address.label}"?`)) run(() => userService.deleteAddress(address._id));
                }}
                aria-label={`Delete ${address.label}`}
                className="grid h-9 w-9 place-items-center rounded-full text-danger hover:bg-danger-light disabled:opacity-50"
              >
                <FiTrash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
