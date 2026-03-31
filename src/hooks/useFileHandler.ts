import { useState, useCallback, type DragEvent, type ChangeEvent } from 'react';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB limit

export function useFileHandler() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    setFileError(null);
    
    if (!file.type.startsWith("image/")) {
      setFileError("Please upload a valid image file (PNG, JPG, HEIC).");
      return;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      setFileError("File is too large. Please upload an image under 10MB.");
      return;
    }

    if (imagePreview) URL.revokeObjectURL(imagePreview);
    
    const url = URL.createObjectURL(file);
    setImageFile(file);
    setImagePreview(url);
  }, [imagePreview]);

  const clearImage = useCallback(() => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    setFileError(null);
  }, [imagePreview]);

  const onDrag = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    if (e.type === "dragleave") setDragActive(false);
  }, []);

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return {
    imageFile,
    imagePreview,
    dragActive,
    fileError,
    onDrag,
    onDrop,
    onFileChange,
    clearImage,
  };
}