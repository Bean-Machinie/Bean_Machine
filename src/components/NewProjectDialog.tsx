import { FormEvent, useEffect, useMemo, useState } from 'react';

import { ItemInput, ProjectItemType } from '../context/ProjectContext';
import { ITEM_TYPE_DEFINITIONS } from '../constants/itemOptions';

interface NewProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; initialItem?: ItemInput }) => void;
}

const emptyFormState = {
  name: '',
  itemName: '',
  itemType: 'board' as ProjectItemType,
  variant: ITEM_TYPE_DEFINITIONS[0].variants[0],
  customDetails: '',
};

function NewProjectDialog({ open, onClose, onCreate }: NewProjectDialogProps) {
  const [formState, setFormState] = useState(emptyFormState);

  useEffect(() => {
    if (open) {
      setFormState(emptyFormState);
    }
  }, [open]);

  const typeDefinition = useMemo(
    () => ITEM_TYPE_DEFINITIONS.find((definition) => definition.id === formState.itemType) ?? ITEM_TYPE_DEFINITIONS[0],
    [formState.itemType],
  );

  useEffect(() => {
    setFormState((state) => ({
      ...state,
      variant: typeDefinition.variants[0],
      customDetails: '',
    }));
  }, [typeDefinition]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = formState.name.trim();
    if (!trimmedName) {
      return;
    }

    const trimmedItemName = formState.itemName.trim();
    let initialItem: ItemInput | undefined;

    if (trimmedItemName) {
      initialItem = {
        name: trimmedItemName,
        type: formState.itemType,
        variant: formState.variant,
        customDetails:
          formState.variant.toLowerCase().includes('custom') || formState.itemType === 'custom'
            ? formState.customDetails.trim() || undefined
            : undefined,
      };
    }

    onCreate({
      name: trimmedName,
      initialItem,
    });
    onClose();
  };

  const showCustomField =
    formState.variant.toLowerCase().includes('custom') || formState.itemType === 'custom';

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-950/95 shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between border-b border-slate-800 px-8 py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300/80">New Project</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Create a tabletop adventure workspace</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700/70 text-slate-300 transition hover:border-slate-500 hover:text-white"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path
                fill="currentColor"
                d="M6.22 6.22a.75.75 0 011.06 0L12 10.94l4.72-4.72a.75.75 0 111.06 1.06L13.06 12l4.72 4.72a.75.75 0 11-1.06 1.06L12 13.06l-4.72 4.72a.75.75 0 11-1.06-1.06L10.94 12 6.22 7.28a.75.75 0 010-1.06z"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-8 px-8 py-6 sm:grid-cols-2">
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-200">
              Project name
              <input
                value={formState.name}
                onChange={(event) => setFormState((state) => ({ ...state, name: event.target.value }))}
                placeholder="e.g. Clockwork Isles Campaign"
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-base text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
                required
              />
            </label>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4">
              <p className="text-sm font-semibold text-slate-200">First item</p>
              <p className="mt-1 text-xs text-slate-400">
                Give your project a head start with the first board, deck, or poster.
              </p>

              <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Item title
                <input
                  value={formState.itemName}
                  onChange={(event) => setFormState((state) => ({ ...state, itemName: event.target.value }))}
                  placeholder="e.g. Encounter Deck"
                  className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              {ITEM_TYPE_DEFINITIONS.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() =>
                    setFormState((state) => ({
                      ...state,
                      itemType: type.id,
                      variant: type.variants[0],
                      customDetails: '',
                    }))
                  }
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    formState.itemType === type.id
                      ? 'border-emerald-500/70 bg-emerald-500/10 text-emerald-100'
                      : 'border-slate-800/80 bg-slate-950/50 text-slate-300 hover:border-slate-600 hover:bg-slate-900'
                  }`}
                >
                  <p className="text-sm font-semibold">{type.name}</p>
                  <p className="mt-1 text-xs text-slate-400">{type.description}</p>
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Format</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {typeDefinition.variants.map((variant) => (
                  <button
                    key={variant}
                    type="button"
                    onClick={() => setFormState((state) => ({ ...state, variant }))}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      formState.variant === variant
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {variant}
                  </button>
                ))}
              </div>

              {showCustomField && (
                <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Custom details
                  <input
                    value={formState.customDetails}
                    onChange={(event) => setFormState((state) => ({ ...state, customDetails: event.target.value }))}
                    placeholder="Add size or notes"
                    className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="sm:col-span-2 flex flex-col gap-3 border-t border-slate-800/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-400">You can add more items or assets after your project is created.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-slate-700/70 px-5 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Create project
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewProjectDialog;
