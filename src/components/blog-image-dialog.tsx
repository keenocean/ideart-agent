import { useEffect, useId, useState } from 'react';

import { apiUpload } from '@/lib/api-client';
import {
  BLOG_IMAGE_ALT_MAX_LENGTH,
  BLOG_IMAGE_CAPTION_MAX_LENGTH,
  parseBlogImageAsset,
  type BlogImageAsset,
  type BlogImageRef,
} from '@/lib/blog-images';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type BlogImageLabels = {
  add: string;
  replace: string;
  edit: string;
  remove: string;
  dialogTitle: string;
  dialogDescription: string;
  file: string;
  alt: string;
  altPlaceholder: string;
  caption: string;
  captionPlaceholder: string;
  cancel: string;
  save: string;
  uploading: string;
  slugRequired: string;
  fileRequired: string;
  altRequired: string;
};

type UploadResponse = {
  uploaded: boolean;
  asset: BlogImageAsset;
};

export function BlogImageDialog({
  open,
  onOpenChange,
  assetSlug,
  value,
  onSave,
  labels,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetSlug: string;
  value?: BlogImageRef;
  onSave: (image: BlogImageRef) => void;
  labels: BlogImageLabels;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState('');
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const id = useId();
  const fileId = `${id}-file`;
  const altId = `${id}-alt`;
  const captionId = `${id}-caption`;

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setAlt(value?.alt || '');
    setCaption(value?.caption || '');
    setError('');
  }, [open, value]);

  async function submit() {
    const normalizedSlug = assetSlug.trim();
    const normalizedAlt = alt.trim().replace(/\s+/g, ' ');
    const normalizedCaption = caption.trim().replace(/\s+/g, ' ');
    if (!normalizedAlt) {
      setError(labels.altRequired);
      return;
    }
    if (!file && !value) {
      setError(labels.fileRequired);
      return;
    }

    setUploading(true);
    setError('');
    try {
      let asset = value;
      if (file) {
        if (!normalizedSlug) throw new Error(labels.slugRequired);
        const body = new FormData();
        body.append('file', file);
        body.append('slug', normalizedSlug);
        const result = await apiUpload<UploadResponse>(
          '/api/admin/posts/media',
          body
        );
        const parsed = parseBlogImageAsset(result.asset);
        if (!parsed) throw new Error('Uploaded image metadata is invalid');
        asset = { ...parsed, alt: normalizedAlt };
      }
      if (!asset) throw new Error(labels.fileRequired);
      onSave({
        url: asset.url,
        mimeType: asset.mimeType,
        width: asset.width,
        height: asset.height,
        bytes: asset.bytes,
        alt: normalizedAlt,
        ...(normalizedCaption ? { caption: normalizedCaption } : {}),
      });
      onOpenChange(false);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : 'Upload failed'
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{labels.dialogTitle}</DialogTitle>
          <DialogDescription>{labels.dialogDescription}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {value && (
            <img
              src={value.url}
              alt={value.alt}
              width={value.width}
              height={value.height}
              className="border-border max-h-56 w-full rounded-md border object-contain"
            />
          )}
          <div className="space-y-2">
            <Label htmlFor={fileId}>{labels.file}</Label>
            <Input
              id={fileId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={altId}>{labels.alt}</Label>
            <Input
              id={altId}
              value={alt}
              maxLength={BLOG_IMAGE_ALT_MAX_LENGTH}
              onChange={(event) => setAlt(event.target.value)}
              placeholder={labels.altPlaceholder}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={captionId}>{labels.caption}</Label>
            <Input
              id={captionId}
              value={caption}
              maxLength={BLOG_IMAGE_CAPTION_MAX_LENGTH}
              onChange={(event) => setCaption(event.target.value)}
              placeholder={labels.captionPlaceholder}
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {labels.cancel}
          </Button>
          <Button type="button" disabled={uploading} onClick={submit}>
            {uploading ? labels.uploading : labels.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BlogCoverImageField({
  value,
  onChange,
  assetSlug,
  labels,
}: {
  value: BlogImageRef | null;
  onChange: (value: BlogImageRef | null) => void;
  assetSlug: string;
  labels: BlogImageLabels;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-3">
      {value && (
        <img
          src={value.url}
          alt={value.alt}
          width={value.width}
          height={value.height}
          className="border-border max-h-64 w-full rounded-md border object-contain"
        />
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          {value ? labels.replace : labels.add}
        </Button>
        {value && (
          <>
            <Button type="button" variant="ghost" onClick={() => setOpen(true)}>
              {labels.edit}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-destructive"
              onClick={() => onChange(null)}
            >
              {labels.remove}
            </Button>
          </>
        )}
      </div>
      <BlogImageDialog
        open={open}
        onOpenChange={setOpen}
        assetSlug={assetSlug}
        value={value || undefined}
        onSave={onChange}
        labels={labels}
      />
    </div>
  );
}
