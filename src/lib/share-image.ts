import { toPng } from 'html-to-image';

export async function generateShareImage(node: HTMLElement): Promise<File> {
  const dataUrl = await toPng(node, { width: 1080, height: 1080, pixelRatio: 1 });
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], 'meeply-share.png', { type: 'image/png' });
}

export async function shareImage(file: File): Promise<void> {
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Meeply' });
  } else {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meeply-share.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
