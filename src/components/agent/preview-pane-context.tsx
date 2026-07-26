import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

export interface PreviewImage {
  src: string;
  alt?: string;
  name?: string;
}

interface PreviewPaneState {
  open: boolean;
  setOpen: (v: boolean) => void;
  image: PreviewImage | null;
  images: PreviewImage[];
  setImages: (images: PreviewImage[]) => void;
  openImage: (image: PreviewImage) => void;
  clearImage: () => void;
}

const PreviewPaneCtx = createContext<PreviewPaneState | null>(null);

export function PreviewPaneProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState<PreviewImage | null>(null);
  const [images, setImages] = useState<PreviewImage[]>([]);
  const openImage = useCallback((nextImage: PreviewImage) => {
    setImage(nextImage);
    setOpen(true);
  }, []);
  const clearImage = useCallback(() => setImage(null), []);
  const value = useMemo(
    () => ({ open, setOpen, image, images, setImages, openImage, clearImage }),
    [open, image, images, openImage, clearImage]
  );
  return (
    <PreviewPaneCtx.Provider value={value}>{children}</PreviewPaneCtx.Provider>
  );
}

export function usePreviewPane(): PreviewPaneState {
  return (
    useContext(PreviewPaneCtx) ?? {
      open: false,
      setOpen: () => {},
      image: null,
      images: [],
      setImages: () => {},
      openImage: () => {},
      clearImage: () => {},
    }
  );
}
