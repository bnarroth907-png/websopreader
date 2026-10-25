"use client";

interface UploadControlProps {
  disabled: boolean;
  onFiles: (files: FileList) => void;
}

export function UploadControl({ disabled, onFiles }: UploadControlProps) {
  return (
    <label className="flex w-full cursor-pointer items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
      Upload SOP
      <input
        type="file"
        accept=".md,.txt,.pdf"
        multiple
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          if (event.target.files && event.target.files.length > 0) {
            onFiles(event.target.files);
            event.target.value = "";
          }
        }}
      />
    </label>
  );
}
