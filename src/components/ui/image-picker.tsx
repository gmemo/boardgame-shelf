import { useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { compressImage } from '../../lib/image-utils';
import IconButton from './icon-button';

interface ImagePickerProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

export default function ImagePicker({ value, onChange }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const dataUrl = await compressImage(file);
      onChange(dataUrl);
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />

      {value ? (
        <div className="relative rounded-2xl overflow-hidden">
          <img
            src={value}
            alt="Game"
            className="w-full aspect-[4/3] object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <IconButton
              size="sm"
              onClick={() => onChange(null)}
              className="bg-black/50 text-white hover:bg-black/70"
            >
              <X size={16} />
            </IconButton>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-text-secondary hover:border-primary hover:text-primary transition-colors"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Camera size={32} strokeWidth={1.5} />
              <span className="text-sm">Add Photo</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
