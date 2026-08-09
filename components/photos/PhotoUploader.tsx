"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";

/**
 * Local preview uploader for the MVP.
 *
 * TODO: Upload photo to Supabase Storage via lib/database/photoRepository
 * (upload file → get URL → createPhoto metadata), not from this component.
 */
export function PhotoUploader() {
  const [photos, setPhotos] = useState<string[]>([]);
  const photosRef = useRef<string[]>([]);

  photosRef.current = photos;

  useEffect(() => {
    return () => {
      for (const url of photosRef.current) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // TODO: Upload photo to Supabase Storage
    const urls = acceptedFiles.map((file) => URL.createObjectURL(file));
    setPhotos((prev) => [...prev, ...urls]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
    },
    multiple: true,
  });

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className="cursor-pointer rounded-xl border-2 border-dashed border-slate-700 bg-slate-900 p-10 text-center transition hover:border-blue-500"
      >
        <input {...getInputProps()} />

        {isDragActive ? (
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

      {photos.length > 0 && (
        <>
          <h3 className="text-lg font-semibold">Uploaded Photos</h3>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {photos.map((photo, index) => (
              // Local object URLs — next/image is unnecessary until Storage URLs exist
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo}
                src={photo}
                alt={`Photo ${index + 1}`}
                className="aspect-square rounded-xl border border-slate-700 object-cover"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
