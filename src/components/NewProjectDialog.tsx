import { FormEvent, useEffect, useId, useMemo, useRef, useState } from 'react';

import { ItemInput, ProjectItemType } from '../context/ProjectContext';
import { ITEM_TYPE_DEFINITIONS } from '../constants/itemOptions';
import CloseButton from './CloseButton';
import ModalTransition from './ModalTransition';

interface NewProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; initialItem?: ItemInput }) => void | Promise<void>;
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
  const titleId = useId();
  const nameInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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

    try {
      const result = onCreate({
        name: trimmedName,
        initialItem,
      });

      if (result && typeof (result as Promise<unknown>).then === 'function') {
        await result;
      }

      onClose();
    } catch (error) {
      console.error('Failed to create project', error);
    }
  };

  const showCustomField =
    formState.variant.toLowerCase().includes('custom') || formState.itemType === 'custom';

  return (
    <ModalTransition
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      initialFocusRef={nameInputRef}
      overlayClassName="bg-overlay/80 p-4"
      panelClassName="flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-border bg-surface-elevated/95 shadow-2xl shadow-black/60"
    >
      <div className="flex items-center justify-between border-b border-border/70 px-8 py-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent/70">New Project</p>
          <h2 id={titleId} className="mt-2 text-2xl font-semibold text-text-primary">
            Create a tabletop adventure workspace
          </h2>
        </div>
        <CloseButton onClick={onClose} label="Close new project dialog" className="ml-2 shrink-0" />
      </div>

      <form onSubmit={handleSubmit} className="grid flex-1 gap-8 px-8 py-6 sm:grid-cols-2">
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-text-secondary">
            Project name
            <input
              value={formState.name}
              ref={nameInputRef}
              onChange={(event) => setFormState((state) => ({ ...state, name: event.target.value }))}
              placeholder="e.g. Clockwork Isles Campaign"
              className="mt-2 w-full rounded-xl border border-border bg-surface-muted/60 px-4 py-2 text-base text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
              required
            />
          </label>

          <div className="rounded-2xl border border-border/80 bg-surface-muted/40 p-4">
            <p className="text-sm font-semibold text-text-secondary">First item</p>
            <p className="mt-1 text-xs text-text-muted">
              Give your project a head start with the first board, deck, or poster.
            </p>

            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">
              Item title
              <input
                value={formState.itemName}
                onChange={(event) => setFormState((state) => ({ ...state, itemName: event.target.value }))}
                placeholder="e.g. Encounter Deck"
                className="mt-2 w-full rounded-lg border border-border bg-surface-muted/60 px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
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
                    ? 'border-accent/70 bg-accent/10 text-text-primary'
                    : 'border-border/80 bg-surface/50 text-text-secondary hover:border-border/60 hover:bg-surface-muted'
                }`}
              >
                <p className="text-sm font-semibold text-text-primary">{type.name}</p>
                <p className="mt-1 text-xs text-text-muted">{type.description}</p>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-border/80 bg-surface/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">Format</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {typeDefinition.variants.map((variant) => (
                <button
                  key={variant}
                  type="button"
                  onClick={() => setFormState((state) => ({ ...state, variant }))}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    formState.variant === variant
                      ? 'bg-accent text-accent-contrast'
                      : 'bg-surface-muted text-text-secondary hover:bg-surface-muted/80'
                  }`}
                >
                  {variant}
                </button>
              ))}
            </div>

            {showCustomField && (
              <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">
                Custom details
                <input
                  value={formState.customDetails}
                  onChange={(event) => setFormState((state) => ({ ...state, customDetails: event.target.value }))}
                  placeholder="Add size or notes"
                  className="mt-2 w-full rounded-lg border border-border bg-surface-muted/60 px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
                />
              </label>
            )}
          </div>
        </div>

        <div className="sm:col-span-2 flex flex-col gap-3 border-t border-border/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-text-muted">You can add more items or assets after your project is created.</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-border/70 px-5 py-2 text-sm font-semibold text-text-secondary transition hover:border-accent hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-contrast transition hover:bg-accent-strong"
            >
              Create project
            </button>
          </div>
        </div>
      </form>
    </ModalTransition>
  );
}

export default NewProjectDialog;
