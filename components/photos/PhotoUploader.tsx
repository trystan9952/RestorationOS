"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";

import type { Photo } from "@/lib/domain/Photo";
import { useTwinStore } from "@/lib/store/useTwinStore";

type PhotoUploaderProps = {
  roomId: string;
};

/** Stable empty fallback — never allocate `[]` inside a Zustand selector. */
const EMPTY_PHOTOS: Photo[] = [];

/**
 * Room photo uploader.
 * Local object-URL previews may appear briefly; Supabase is the source of truth after upload.
 *
 * TODO: Future Digital Twin will organize photos by Building → Floor → Room → Wall.
 */
export function PhotoUploader({ roomId }: PhotoUploaderProps) {
  const photosForRoom = useTwinStore((state) => state.photosByRoomId[roomId]);
  const photos = photosForRoom ?? EMPTY_PHOTOS;
  const photoError = useTwinStore((state) => state.photoError);
  const isUploading = useTwinStore((state) => state.isUploadingPhotos);
  const uploadRoomPhotos = useTwinStore((state) => state.uploadRoomPhotos);
  const clearPhotoError = useTwinStore((state) => state.clearPhotoError);

  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const previewUrlsRef = useRef<string[]>([]);

  previewUrlsRef.current = previewUrls;

  useEffect(() => {
    return () => {
      for (const url of previewUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  const clearPreviews = useCallback(() => {
    for (const url of previewUrlsRef.current) {
      URL.revokeObjectURL(url);
    }
    previewUrlsRef.current = [];
    setPreviewUrls([]);
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0 || isUploading) {
        return;
      }

      clearPhotoError();

      const nextPreviews = acceptedFiles.map((file) =>
        URL.createObjectURL(file)
      );
      setPreviewUrls((prev) => [...prev, ...nextPreviews]);

      try {
        await uploadRoomPhotos(roomId, acceptedFiles);
        clearPreviews();
      } catch {
        // photoError is set in the store; keep previews so the user sees what failed
      }
    },
    [
      clearPhotoError,
      clearPreviews,
      isUploading,
      roomId,
      uploadRoomPhotos,
    ]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
    },
    multiple: true,
    disabled: isUploading,
  });

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-xl border-2 border-dashed border-slate-700 bg-slate-900 p-10 text-center transition hover:border-blue-500 ${
          isUploading ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <input {...getInputProps()} />

        {isUploading ? (
          <p className="text-lg font-semibold">Uploading photos...</p>
        ) : isDragActive ? (
          <p className="text-lg font-semibold">Drop the photos here...</p>
        ) : (
          <>
            <p className="text-2xl font-bold">📷 Upload Photos</p>
            <p className="mt-3 text-slate-400">
              Click here or drag photos into this box.
            </p>
          </>
        )}
      </div>

      {photoError ? (
        <p className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300">
          {photoError}
        </p>
      ) : null}

      {previewUrls.length > 0 && (
        <>
          <h3 className="text-lg font-semibold">Uploading preview</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {previewUrls.map((previewUrl, index) => (
              // Local object URLs while upload is in progress
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={previewUrl}
                src={previewUrl}
                alt={`Upload preview ${index + 1}`}
                className="aspect-square rounded-xl border border-slate-700 object-cover opacity-80"
              />
            ))}
          </div>
        </>
      )}

      {photos.length > 0 && (
        <>
          <h3 className="text-lg font-semibold">Uploaded Photos</h3>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {photos.map((photo) => (
              // Persisted Supabase public URLs
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.id}
                src={photo.publicUrl}
                alt={photo.originalFilename}
                className="aspect-square rounded-xl border border-slate-700 object-cover"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
