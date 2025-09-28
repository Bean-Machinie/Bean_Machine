import { ChangeEvent, useMemo, useState } from 'react';

import { AssetInput, ProjectAsset } from '../context/ProjectContext';

interface ImageAssetBrowserProps {
  open: boolean;
  assets: ProjectAsset[];
  onClose: () => void;
  onAddAssets: (assets: AssetInput[]) => void;
  onRemoveAssets: (assetIds: string[]) => void;
  onLocateAsset: (assetId: string) => void;
}

function ImageAssetBrowser({ open, assets, onClose, onAddAssets, onRemoveAssets, onLocateAsset }: ImageAssetBrowserProps) {
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [previewAssetId, setPreviewAssetId] = useState<string | null>(null);

  const previewAsset = useMemo(() => assets.find((asset) => asset.id === previewAssetId) ?? null, [assets, previewAssetId]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    const mapped: AssetInput[] = files.map((file) => ({
      name: file.name.replace(/\.[^.]+$/, ''),
      url: URL.createObjectURL(file),
    }));

    onAddAssets(mapped);
    event.target.value = '';
  };

  const toggleSelected = (assetId: string) => {
    setSelectedAssets((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId],
    );
  };

  const clearStateAndClose = () => {
    setSelectedAssets([]);
    setPreviewAssetId(null);
    onClose();
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur">
      <div className="flex h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/95 shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between border-b border-slate-800 px-8 py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300/80">Image Library</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Manage your project visuals</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (selectedAssets.length === 1) {
                  onLocateAsset(selectedAssets[0]);
                }
              }}
              disabled={selectedAssets.length !== 1}
              className="rounded-full border border-slate-700/70 px-4 py-2 text-xs font-semibold text-slate-300 transition disabled:cursor-not-allowed disabled:opacity-50 hover:border-emerald-500 hover:text-emerald-200"
            >
              Locate usage
            </button>
            <button
              type="button"
              onClick={() => onRemoveAssets(selectedAssets)}
              disabled={selectedAssets.length === 0}
              className="rounded-full border border-rose-500/60 px-4 py-2 text-xs font-semibold text-rose-200 transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-rose-500/10"
            >
              Delete selected
            </button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400">
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
              Add images
            </label>
            <button
              type="button"
              onClick={clearStateAndClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700/70 text-slate-300 transition hover:border-slate-500 hover:text-white"
              aria-label="Close image library"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M6.22 6.22a.75.75 0 011.06 0L12 10.94l4.72-4.72a.75.75 0 111.06 1.06L13.06 12l4.72 4.72a.75.75 0 11-1.06 1.06L12 13.06l-4.72 4.72a.75.75 0 11-1.06-1.06L10.94 12 6.22 7.28a.75.75 0 010-1.06z"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {assets.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700/70 bg-slate-900/50 p-12 text-center">
                <p className="text-lg font-semibold text-slate-200">No images yet</p>
                <p className="mt-2 max-w-md text-sm text-slate-400">
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
                        selected ? 'border-emerald-500/70' : 'border-slate-800/80'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewAssetId(asset.id)}
                        className="relative block h-40 w-full overflow-hidden bg-slate-900/80"
                      >
                        <img
                          src={asset.url}
                          alt={asset.name}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      </button>
                      <div className="flex items-center justify-between gap-2 border-t border-slate-800/80 bg-slate-900/80 px-3 py-3">
                        <p className="truncate text-xs font-semibold text-slate-200" title={asset.name}>
                          {asset.name}
                        </p>
                        <button
                          type="button"
                          onClick={() => toggleSelected(asset.id)}
                          className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition ${
                            selected
                              ? 'border-emerald-500/70 bg-emerald-500/20 text-emerald-200'
                              : 'border-slate-700/70 text-slate-300 hover:border-emerald-500 hover:text-emerald-200'
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

          <div className="hidden w-64 border-l border-slate-800/80 bg-slate-950/90 p-6 lg:block">
            <h3 className="text-sm font-semibold text-slate-200">Preview</h3>
            {previewAsset ? (
              <div className="mt-4 space-y-3">
                <div className="overflow-hidden rounded-xl border border-slate-800/80">
                  <img src={previewAsset.url} alt={previewAsset.name} className="w-full" />
                </div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Title</p>
                <p className="text-sm font-semibold text-white">{previewAsset.name}</p>
              </div>
            ) : (
              <p className="mt-4 text-xs text-slate-500">Select an asset to see a larger preview.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageAssetBrowser;
