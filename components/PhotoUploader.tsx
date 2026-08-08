"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

export default function PhotoUploader() {
  const [photos, setPhotos] = useState<string[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const urls = acceptedFiles.map((file) =>
      URL.createObjectURL(file)
    );

    setPhotos((prev) => [...prev, ...urls]);
  }, []);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
  } = useDropzone({
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
          <p className="text-lg font-semibold">
            Drop the photos here...
          </p>
        ) : (
          <>
            <p className="text-2xl font-bold">
              📷 Upload Photos
            </p>

            <p className="mt-3 text-slate-400">
              Click here or drag photos into this box.
            </p>
          </>
        )}
      </div>

      {photos.length > 0 && (
        <>
          <h3 className="text-lg font-semibold">
            Uploaded Photos
          </h3>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {photos.map((photo, index) => (
              <img
                key={index}
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