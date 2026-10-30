import clsx from 'clsx'
import { useState } from 'react'
import type { TextSymbol } from '../api/types'

interface Props {
  src: string
  symbols: TextSymbol[]
  active: number | null
  onHover: (id: number | null) => void
  showBoxes?: boolean
}

/** Image (full width of its container) with interactive boxes per text symbol; coords are image pixels. */
export function SymbolOverlay({ src, symbols, active, onHover, showBoxes = true }: Props) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  return (
    <div className="relative">
      <img src={src} alt="Predicted GUI" className="block w-full" onLoad={(e) => setSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })} />
      {size &&
        symbols.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-label={`Symbol ${s.id}: ${s.text}`}
            onMouseEnter={() => onHover(s.id)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(s.id)}
            onBlur={() => onHover(null)}
            className={clsx(
              'absolute rounded-[3px] transition',
              active === s.id
                ? 'z-10 bg-brand-500/20 ring-2 ring-brand-500'
                : showBoxes
                  ? s.unchanged
                    ? 'ring-1 ring-zinc-400/60 hover:ring-2'
                    : 'ring-1 ring-emerald-500/70 hover:ring-2'
                  : 'hover:ring-1 hover:ring-brand-400',
            )}
            style={{ left: `${(s.x / size.w) * 100}%`, top: `${(s.y / size.h) * 100}%`, width: `${(s.w / size.w) * 100}%`, height: `${(s.h / size.h) * 100}%` }}
          />
        ))}
    </div>
  )
}

/** Before/after slider for two same-size images. */
export function CompareSlider({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50)
  return (
    <div className="relative select-none">
      <img src={after} alt="Predicted" className="block w-full" />
      <img src={before} alt="Current" className="absolute inset-0 block h-full w-full" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-brand-500" style={{ left: `${pos}%` }}>
        <span className="absolute top-1/2 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand-600 text-[11px] font-bold text-white shadow-lg ring-2 ring-white">⇆</span>
      </div>
      <span className="absolute bottom-3 left-3 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">Current</span>
      <span className="absolute bottom-3 right-3 rounded-md bg-brand-600 px-1.5 py-0.5 text-[10px] font-medium text-white">Predicted</span>
      <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(+e.target.value)} aria-label="Comparison position" className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
    </div>
  )
}
