import { useState } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { invoiceService } from '@/services/invoiceService';
import { formatCurrency } from '@/utils/formatCurrency';

const EMPTY_ITEM = { description: '', amount: '' };

export default function InvoiceComposer({ conversationId, isOpen, onClose, onSent }) {
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [notes, setNotes] = useState('');
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (index) => setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

  const reset = () => {
    setItems([{ ...EMPTY_ITEM }]);
    setNotes('');
    setProposedDate('');
    setProposedTime('');
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanItems = items
      .map((it) => ({ description: it.description.trim(), amount: Number(it.amount) }))
      .filter((it) => it.description);

    if (cleanItems.length === 0) {
      setError('Add at least one line item.');
      return;
    }
    if (cleanItems.some((it) => !it.amount || it.amount <= 0)) {
      setError('Every item needs an amount greater than 0.');
      return;
    }

    setIsSaving(true);
    try {
      const { data } = await invoiceService.create(conversationId, {
        items: cleanItems,
        notes,
        proposedDate: proposedDate || null,
        proposedTime,
      });
      onSent?.(data);
      handleClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not send this invoice.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Send an invoice" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-xl border border-danger/20 bg-danger-light p-3 text-sm text-danger">{error}</p>}

        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex items-end gap-2">
              <Input
                label={index === 0 ? 'Description' : undefined}
                placeholder="e.g. Pipe replacement"
                value={item.description}
                onChange={(e) => updateItem(index, 'description', e.target.value)}
                containerClassName="flex-1"
              />
              <Input
                label={index === 0 ? 'Amount (LKR)' : undefined}
                type="number"
                min="0"
                placeholder="0"
                value={item.amount}
                onChange={(e) => updateItem(index, 'amount', e.target.value)}
                containerClassName="w-32"
              />
              <button
                type="button"
                onClick={() => removeItem(index)}
                disabled={items.length === 1}
                aria-label="Remove item"
                className="mb-3 grid h-11 w-11 shrink-0 place-items-center rounded-xl text-text-muted hover:bg-slate-100 hover:text-danger disabled:opacity-30"
              >
                <FaTrash size={13} />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <FaPlus size={11} /> Add another item
        </button>

        <div className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2">
          <Input
            label="Proposed date (optional)"
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={proposedDate}
            onChange={(e) => setProposedDate(e.target.value)}
          />
          <Input
            label="Proposed time (optional)"
            type="time"
            value={proposedTime}
            onChange={(e) => setProposedTime(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-secondary">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="2"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-[15px] text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Anything the customer should know about this quote?"
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-slate-50 p-3 text-sm">
          <span className="text-text-muted">Total to customer</span>
          <span className="font-display text-lg font-bold text-secondary">{formatCurrency(subtotal)}</span>
        </div>

        <Button type="submit" variant="primary" fullWidth isLoading={isSaving}>
          Send invoice
        </Button>
      </form>
    </Modal>
  );
}