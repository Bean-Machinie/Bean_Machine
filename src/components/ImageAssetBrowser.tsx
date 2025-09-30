import { ChangeEvent, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { AssetInput, ProjectAsset } from '../context/ProjectContext';
import CloseButton from './CloseButton';
import ModalTransition from './ModalTransition';

interface ImageAssetBrowserProps {
  open: boolean;
  assets: ProjectAsset[];
  onClose: () => void;
  onAddAssets: (assets: AssetInput[]) => void | Promise<void>;
  onRemoveAssets: (assetIds: string[]) => void | Promise<void>;
  onLocateAsset: (assetId: string) => void;
}

function ImageAssetBrowser({ open, assets, onClose, onAddAssets, onRemoveAssets, onLocateAsset }: ImageAssetBrowserProps) {
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [previewAssetId, setPreviewAssetId] = useState<string | null>(null);

  const headingId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const previewAsset = useMemo(() => assets.find((asset) => asset.id === previewAssetId) ?? null, [assets, previewAssetId]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    const mapped: AssetInput[] = files.map((file) => ({
      name: file.name.replace(/\.[^.]+$/, ''),
      url: URL.createObjectURL(file),
    }));

    try {
      const result = onAddAssets(mapped);
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        await result;
      }
    } catch (error) {
      console.error('Failed to add assets', error);
    }
    event.target.value = '';
  };

  const toggleSelected = useCallback((assetId: string) => {
    setSelectedAssets((prev) => (prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]));
  }, []);

  useEffect(() => {
    if (selectedAssets.length === 0) {
      return;
    }

    setSelectedAssets((prev) => {
      const filtered = prev.filter((id) => assets.some((asset) => asset.id === id));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [assets, selectedAssets.length]);

  const clearStateAndClose = useCallback(() => {
    setSelectedAssets([]);
    setPreviewAssetId(null);
    onClose();
  }, [onClose]);

  const handleLocateSelected = useCallback(() => {
    if (selectedAssets.length === 1) {
      onLocateAsset(selectedAssets[0]);
    }
  }, [onLocateAsset, selectedAssets]);

  const handleRemoveSelected = useCallback(async () => {
    if (selectedAssets.length > 0) {
      try {
        const result = onRemoveAssets(selectedAssets);
        if (result && typeof (result as Promise<unknown>).then === 'function') {
          await result;
        }
        setSelectedAssets([]);
      } catch (error) {
        console.error('Failed to remove assets', error);
      }
    }
  }, [onRemoveAssets, selectedAssets]);

  const handlePreview = useCallback((assetId: string) => {
    setPreviewAssetId(assetId);
  }, []);

  const selectedCount = selectedAssets.length;

  return (
    <ModalTransition
      open={open}
      onClose={clearStateAndClose}
      labelledBy={headingId}
      initialFocusRef={closeButtonRef}
      overlayClassName="bg-overlay/80 p-6"
      panelClassName="flex h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-border bg-surface-elevated/95 shadow-2xl shadow-black/60"
    >
      <div className="flex items-center justify-between border-b border-border/70 px-8 py-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent/70">Image Library</p>
          <h2 id={headingId} className="mt-1 text-xl font-semibold text-text-primary">
            Manage your project visuals
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLocateSelected}
            disabled={selectedCount !== 1}
            className="rounded-full border border-border/70 px-4 py-2 text-xs font-semibold text-text-secondary transition disabled:cursor-not-allowed disabled:opacity-50 hover:border-accent hover:text-accent/80"
          >
            Locate usage
          </button>
          <button
            type="button"
            onClick={handleRemoveSelected}
            disabled={selectedCount === 0}
            className="rounded-full border border-rose-500/60 px-4 py-2 text-xs font-semibold text-rose-200 transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-rose-500/10"
          >
            Delete selected
          </button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-accent-contrast transition hover:bg-accent-strong">
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
            Add images
          </label>
          <CloseButton ref={closeButtonRef} onClick={clearStateAndClose} label="Close image library" className="ml-1 shrink-0" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {assets.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-surface-muted/50 p-12 text-center">
              <p className="text-lg font-semibold text-text-secondary">No images yet</p>
              <p className="mt-2 max-w-md text-sm text-text-muted">
                Use the "Add images" button to import concept art, icons, or reference boards for this project.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {assets.map((asset) => {
                const selected = selectedAssets.includes(asset.id);
                return (
                  <div
                    key={asset.id}
                    className={`group relative overflow-hidden rounded-2xl border transition ${
                      selected ? 'border-accent/70' : 'border-border/80'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handlePreview(asset.id)}
                      className="relative block h-40 w-full overflow-hidden bg-surface-muted/80"
                    >
                      <img
                        src={asset.url}
                        alt={asset.name}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition duration-300 will-change-transform group-hover:scale-105"
                      />
                    </button>
                    <div className="flex items-center justify-between gap-2 border-t border-border/80 bg-surface-muted/80 px-3 py-3">
                      <p className="truncate text-xs font-semibold text-text-secondary" title={asset.name}>
                        {asset.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => toggleSelected(asset.id)}
                        className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition ${
                          selected
                            ? 'border-accent/70 bg-accent/20 text-accent/80'
                            : 'border-border/70 text-text-secondary hover:border-accent hover:text-accent/80'
                        }`}
                      >
                        {selected ? '✓' : '+'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="hidden w-64 border-l border-border/80 bg-surface-elevated/90 p-6 lg:block">
          <h3 className="text-sm font-semibold text-text-secondary">Preview</h3>
          {previewAsset ? (
            <div className="mt-4 space-y-3">
              <div className="overflow-hidden rounded-xl border border-border/80">
                <img src={previewAsset.url} alt={previewAsset.name} className="w-full" />
              </div>
              <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Title</p>
              <p className="text-sm font-semibold text-text-primary">{previewAsset.name}</p>
            </div>
          ) : (
            <p className="mt-4 text-xs text-text-muted">Select an asset to see a larger preview.</p>
          )}
        </div>
      </div>
    </ModalTransition>
  );
}

export default ImageAssetBrowser;
