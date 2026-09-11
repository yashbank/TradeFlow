'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Image as ImageIcon, Plus, Trash2, X, Eye, Tag } from 'lucide-react';
import { useToast } from '@/lib/toast/ToastContext';

export type PhotoCategory = 'before' | 'after' | 'damaged_part' | 'permit';

export interface JobPhoto {
  id: string;
  url: string;
  tag: PhotoCategory;
  caption: string;
  timestamp: string;
}

interface JobPhotoGalleryProps {
  initialPhotos?: JobPhoto[];
  readOnly?: boolean;
  onPhotosChange?: (photos: JobPhoto[]) => void;
}

const CATEGORY_LABELS: Record<PhotoCategory, { label: string; color: string }> = {
  before: { label: 'Before Repair', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' },
  after: { label: 'After Repair', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  damaged_part: { label: 'Damaged Part', color: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30' },
  permit: { label: 'Permit & Tag', color: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30' },
};

export function JobPhotoGallery({
  initialPhotos = [],
  readOnly = false,
  onPhotosChange,
}: JobPhotoGalleryProps) {
  const toast = useToast();
  const [photos, setPhotos] = useState<JobPhoto[]>(initialPhotos);
  const [filterTag, setFilterTag] = useState<string>('all');
  const [previewPhoto, setPreviewPhoto] = useState<JobPhoto | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [selectedTag, setSelectedTag] = useState<PhotoCategory>('before');
  const [caption, setCaption] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setFileUrl(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  function handleAddPhoto() {
    if (!fileUrl) {
      toast.error('Image Required', 'Please select a photo to upload.');
      return;
    }

    const newPhoto: JobPhoto = {
      id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      url: fileUrl,
      tag: selectedTag,
      caption: caption.trim() || `${CATEGORY_LABELS[selectedTag].label} photo`,
      timestamp: new Date().toISOString(),
    };

    const updated = [newPhoto, ...photos];
    setPhotos(updated);
    onPhotosChange?.(updated);
    toast.success('Photo Attached', `${CATEGORY_LABELS[selectedTag].label} photo recorded.`);

    // Reset
    setFileUrl('');
    setCaption('');
    setShowAddModal(false);
  }

  function handleDeletePhoto(id: string) {
    const updated = photos.filter((p) => p.id !== id);
    setPhotos(updated);
    onPhotosChange?.(updated);
    toast.info('Photo Removed', 'Attachment removed from order.');
  }

  const filteredPhotos = filterTag === 'all'
    ? photos
    : photos.filter((p) => p.tag === filterTag);

  return (
    <Card className="glass-panel text-card-foreground">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-200/60 dark:border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-sky-500" />
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-zinc-100">
            Work Order Inspection Photos ({photos.length})
          </CardTitle>
        </div>

        {!readOnly && (
          <Button
            size="sm"
            type="button"
            onClick={() => setShowAddModal(true)}
            className="min-h-[36px] text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Attach Photo
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setFilterTag('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              filterTag === 'all'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
            }`}
          >
            All Photos ({photos.length})
          </button>
          {(['before', 'after', 'damaged_part', 'permit'] as PhotoCategory[]).map((tag) => {
            const count = photos.filter((p) => p.tag === tag).length;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setFilterTag(tag)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                  filterTag === tag
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
                }`}
              >
                {CATEGORY_LABELS[tag].label} ({count})
              </button>
            );
          })}
        </div>

        {/* Photos Grid */}
        {filteredPhotos.length === 0 ? (
          <div className="py-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30">
            <ImageIcon className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
              No inspection photos in this view.
            </p>
            {!readOnly && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="mt-2 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
              >
                + Snap or upload first photo
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredPhotos.map((photo) => {
              const meta = CATEGORY_LABELS[photo.tag] || CATEGORY_LABELS.before;
              return (
                <div
                  key={photo.id}
                  className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-slate-900 aspect-square shadow-sm flex flex-col justify-end"
                >
                  {/* Image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Tag Chip */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border backdrop-blur-md bg-black/60 text-white ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>

                  {/* Quick Action Overlay (View / Delete) */}
                  <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => setPreviewPhoto(photo)}
                      title="View Fullscreen"
                      className="p-1 rounded-lg bg-black/60 text-white hover:bg-sky-500 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(photo.id)}
                        title="Delete Photo"
                        className="p-1 rounded-lg bg-black/60 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Caption */}
                  <div className="relative z-10 p-2 text-white">
                    <p className="text-[11px] font-bold truncate">{photo.caption}</p>
                    <p className="text-[9px] text-slate-300">
                      {new Date(photo.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Add Photo Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md shadow-2xl border-sky-500/30 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <Camera className="w-4 h-4" />
                </div>
                <CardTitle className="text-base font-bold">Attach Inspection Photo</CardTitle>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <CardContent className="space-y-3.5 pt-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Photo Stage / Category
                </label>
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value as PhotoCategory)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-sky-500"
                >
                  <option value="before">Before Repair (Initial Site State)</option>
                  <option value="after">After Repair (Completed Workmanship)</option>
                  <option value="damaged_part">Damaged / Defective Part</option>
                  <option value="permit">Permit, Inspection Tag & Meter</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Select Image or Capture with Camera
                </label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-500 file:text-white hover:file:bg-sky-600 text-slate-500 dark:text-zinc-400"
                />
              </div>

              {fileUrl && (
                <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={fileUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Description / Caption (Optional)
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g. Corroded copper coupling under sink"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-slate-900 dark:text-zinc-100"
                />
              </div>
            </CardContent>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddModal(false)}
                className="min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAddPhoto}
                disabled={!fileUrl}
                className="min-h-[44px] font-bold bg-sky-500 hover:bg-sky-600 text-white"
              >
                Save Photo
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Fullscreen Preview Lightbox */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-2xl w-full bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl"
          >
            <div className="relative aspect-video bg-black flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewPhoto.url}
                alt={previewPhoto.caption}
                className="w-full h-full object-contain"
              />
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 text-white hover:bg-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 text-white flex items-center justify-between">
              <div>
                <Badge variant="outline" className="mb-1 text-[10px]">
                  {CATEGORY_LABELS[previewPhoto.tag].label}
                </Badge>
                <h4 className="font-bold text-sm">{previewPhoto.caption}</h4>
              </div>
              <span className="text-xs text-zinc-400">
                {new Date(previewPhoto.timestamp).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
