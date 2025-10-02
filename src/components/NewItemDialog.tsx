import { FormEvent, useId, useMemo, useRef, useState } from 'react';

import { ItemInput, ProjectItemType } from '../context/ProjectContext';
import { ITEM_TYPE_DEFINITIONS } from '../constants/itemOptions';
import CloseButton from './CloseButton';
import ModalTransition from './ModalTransition';

interface NewItemDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (item: ItemInput) => void | Promise<void>;
}

const defaultState = {
  name: '',
  itemType: 'board' as ProjectItemType,
  variant: ITEM_TYPE_DEFINITIONS[0].variants[0],
  customDetails: '',
};

const getInitialCounts = () =>
  ITEM_TYPE_DEFINITIONS.reduce<Record<ProjectItemType, number>>((accumulator, definition) => {
    accumulator[definition.id] = 0;
    return accumulator;
  }, {} as Record<ProjectItemType, number>);

const extractAspectRatio = (variant: string, fallback = 1) => {
  const match = variant.match(/(\d+(?:\.\d+)?)\s*×\s*(\d+(?:\.\d+)?)/i);
  if (!match) {
    return fallback;
  }

  const [, width, , height] = match;
  const parsedWidth = Number.parseFloat(width);
  const parsedHeight = Number.parseFloat(height);

  if (!Number.isFinite(parsedWidth) || !Number.isFinite(parsedHeight) || parsedHeight === 0) {
    return fallback;
  }

  return parsedWidth / parsedHeight;
};

function NewItemDialog({ open, onClose, onSubmit }: NewItemDialogProps) {
  const [formState, setFormState] = useState(defaultState);
  const [creationCounts, setCreationCounts] = useState<Record<ProjectItemType, number>>(getInitialCounts);
  const [isPreviewFlipped, setPreviewFlipped] = useState(false);
  const titleId = useId();
  const initialFieldRef = useRef<HTMLInputElement | null>(null);

  const typeDefinition = useMemo(
    () => ITEM_TYPE_DEFINITIONS.find((definition) => definition.id === formState.itemType) ?? ITEM_TYPE_DEFINITIONS[0],
    [formState.itemType],
  );

  const defaultName = useMemo(() => {
    const currentCount = creationCounts[typeDefinition.id] ?? 0;
    return `${typeDefinition.name} #${currentCount + 1}`;
  }, [creationCounts, typeDefinition]);

  const previewAspectRatio = useMemo(() => {
    if (formState.itemType === 'board') {
      return extractAspectRatio(formState.variant, 1);
    }

    if (formState.itemType === 'cardDeck') {
      return extractAspectRatio(formState.variant, 2.5 / 3.5);
    }

    if (formState.itemType === 'questPoster') {
      return extractAspectRatio(formState.variant, Math.SQRT2);
    }

    return 1;
  }, [formState.itemType, formState.variant]);

  const resetForm = () => {
    setFormState(defaultState);
    setPreviewFlipped(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = formState.name.trim();
    const finalName = trimmedName || defaultName;

    try {
      const result = onSubmit({
        name: finalName,
        type: formState.itemType,
        variant: formState.variant,
        customDetails:
          formState.variant.toLowerCase().includes('custom') || formState.itemType === 'custom'
            ? formState.customDetails.trim() || undefined
            : undefined,
      });

      if (result && typeof (result as Promise<unknown>).then === 'function') {
        await result;
      }

      setCreationCounts((counts) => ({
        ...counts,
        [formState.itemType]: (counts[formState.itemType] ?? 0) + 1,
      }));

      resetForm();
      onClose();
    } catch (error) {
      console.error('Failed to add item', error);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const showCustomField =
    formState.variant.toLowerCase().includes('custom') || formState.itemType === 'custom';

  return (
    <ModalTransition
      open={open}
      onClose={handleClose}
      labelledBy={titleId}
      overlayClassName="bg-overlay/80 p-4"
      panelClassName="w-full max-w-5xl rounded-3xl border border-border bg-surface-elevated/95 shadow-2xl shadow-black/60 focus:outline-none"
      initialFocusRef={initialFieldRef}
    >
      <form onSubmit={handleSubmit} className="grid h-[540px] w-full grid-cols-[0.32fr_0.68fr] overflow-hidden rounded-[26px]">
        <aside className="flex h-full flex-col border-r border-border/70 bg-surface px-6 py-6">
          <h2 id={titleId} className="text-sm font-semibold uppercase tracking-[0.3em] text-text-muted">
            Pick an Item:
          </h2>
          <div className="mt-3 h-px w-full bg-border/60" aria-hidden="true" />
          <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
            {ITEM_TYPE_DEFINITIONS.map((type) => {
              const isActive = formState.itemType === type.id;

              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    setFormState((state) => ({
                      ...state,
                      itemType: type.id,
                      variant: type.variants[0],
                      customDetails: '',
                      name: state.itemType === type.id ? state.name : '',
                    }));
                    setPreviewFlipped(false);
                  }}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition-all duration-200 ${
                    isActive
                      ? 'border-accent/70 bg-accent/10 text-text-primary shadow-lg shadow-accent/10'
                      : 'border-transparent bg-transparent text-text-secondary hover:border-border/60 hover:bg-surface-muted/70'
                  }`}
                >
                  <p className="text-sm font-semibold text-text-primary">{type.name}</p>
                  <p className="mt-1 text-xs text-text-muted">{type.description}</p>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="relative flex h-full flex-col bg-surface-elevated/70 px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent/70">New Item</p>
              <h3 className="mt-2 text-3xl font-semibold text-text-primary">{typeDefinition.name}</h3>
            </div>
            <CloseButton onClick={handleClose} label="Close new item dialog" className="h-8 w-8 rounded-full" />
          </div>

          <div className="mt-6 flex flex-col gap-6 overflow-hidden">
            <label className="text-sm font-semibold text-text-secondary">
              Item Name
              <input
                ref={initialFieldRef}
                value={formState.name}
                onChange={(event) => setFormState((state) => ({ ...state, name: event.target.value }))}
                placeholder={defaultName}
                className="mt-2 w-full rounded-xl border border-border bg-surface-muted/60 px-4 py-2 text-base text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
              />
            </label>

            <div className="flex items-start gap-6">
              <div className="group relative flex-1">
                <button
                  type="button"
                  onClick={() => setPreviewFlipped((state) => !state)}
                  onMouseLeave={() => setPreviewFlipped(false)}
                  className="group/preview relative block w-full overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-surface-muted via-surface to-surface-elevated/60 p-6 text-left transition-shadow duration-300 [perspective:1600px]"
                >
                  <div
                    className={`relative mx-auto flex h-full w-full items-center justify-center rounded-2xl bg-surface-muted/40 p-6 transition-transform duration-500 ease-out [transform-style:preserve-3d] ${
                      isPreviewFlipped ? '[transform:rotateY(180deg)]' : ''
                    } group-hover/preview:shadow-[0_0_35px_rgba(56,189,248,0.35)]`}
                    style={{
                      aspectRatio: previewAspectRatio,
                    }}
                  >
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl border border-border/70 bg-gradient-to-br from-surface via-surface-elevated/80 to-surface-muted/70 text-center text-text-primary"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <span className="text-xs uppercase tracking-[0.3em] text-text-muted">Front</span>
                      <span className="text-lg font-semibold">{typeDefinition.name}</span>
                      <span className="text-xs text-text-muted">{formState.variant}</span>
                    </div>
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl border border-border/70 bg-gradient-to-br from-surface-elevated/80 via-surface to-surface-muted/80 text-center text-text-primary [transform:rotateY(180deg)]"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <span className="text-xs uppercase tracking-[0.3em] text-text-muted">Back</span>
                      <span className="text-sm text-text-secondary">Preview the reverse details</span>
                    </div>
                  </div>
                </button>
              </div>

              <div className="flex w-14 flex-col items-center gap-3 pt-2">
                <button
                  type="button"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border/70 bg-surface-muted text-2xl font-semibold text-text-secondary transition hover:border-accent hover:text-accent"
                  aria-label="Utility action"
                >
                  +
                </button>
              </div>
            </div>

            <label className="text-sm font-semibold text-text-secondary">
              Subtype
              <select
                value={formState.variant}
                onChange={(event) => {
                  setFormState((state) => ({ ...state, variant: event.target.value }));
                  setPreviewFlipped(false);
                }}
                className="mt-2 w-full rounded-xl border border-border bg-surface-muted/60 px-4 py-2 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
              >
                {typeDefinition.variants.map((variant) => (
                  <option key={variant} value={variant}>
                    {variant}
                  </option>
                ))}
              </select>
            </label>

            {showCustomField && (
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">
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

          <div className="mt-auto flex items-center justify-between pt-6">
            <p className="text-xs text-text-muted">You can refine this item's layout once it's added.</p>
            <button
              type="submit"
              className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-accent-contrast transition hover:bg-accent-strong"
            >
              Add Item
            </button>
          </div>
        </section>
      </form>
    </ModalTransition>
  );
}

export default NewItemDialog;
