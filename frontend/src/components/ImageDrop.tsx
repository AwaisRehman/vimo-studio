import clsx from 'clsx'
import { RefreshCw, UploadCloud } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface Props {
  file: File | null
  onChange: (f: File) => void
  label?: string
  height?: string
}

/** Drag-and-drop / click / paste image picker with live preview. */
export function ImageDrop({ file, onChange, label = 'Upload screenshot', height = 'h-40' }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) return setUrl(null)
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])

  const accept = (f?: File | null) => {
    if (f && f.type.startsWith('image/')) onChange(f)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={() => input.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        accept(e.dataTransfer.files?.[0])
      }}
      onPaste={(e) => accept(e.clipboardData.files?.[0])}
      className={clsx(
        'group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        over ? 'border-brand-500 bg-brand-500/5' : 'border-line bg-surface-2 hover:border-brand-400',
        height,
      )}
    >
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => accept(e.target.files?.[0])} />
      {url ? (
        <>
          <img src={url} alt={file?.name} className="h-full w-full object-contain p-2" />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
            <span className="truncate">{file?.name}</span>
            <span className="flex items-center gap-1"><RefreshCw className="size-3" /> Replace</span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-1.5 px-4 text-center">
          <UploadCloud className="size-5 text-brand-500" />
          <p className="text-xs font-medium text-fg">{label}</p>
          <p className="text-[11px] text-subtle">Drop, click or paste · PNG/JPG</p>
        </div>
      )}
    </div>
  )
}
