import clsx from 'clsx'
import { Check } from 'lucide-react'
import { samples, type Sample } from '../data/samples'

/** Thumbnail gallery of built-in demo screens. */
export function SamplePicker({ selected, onPick }: { selected?: string; onPick: (s: Sample) => void }) {
  return (
    <div className="grid max-w-[440px] grid-cols-4 gap-2">
      {samples.map((s) => {
        const on = selected === s.id
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onPick(s)}
            title={s.name}
            className={clsx(
              'group relative overflow-hidden rounded-lg bg-surface-2 ring-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
              on ? 'ring-2 ring-brand-500' : 'ring-line hover:ring-brand-400',
            )}
          >
            <img src={s.src} alt={s.name} className="aspect-[540/1170] w-full object-cover object-top" loading="lazy" />
            <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/75 to-transparent px-1 pb-1 pt-4 text-[10px] font-medium text-white">{s.name.split(' · ')[0]}</span>
            {on && (
              <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-brand-600 text-white">
                <Check className="size-2.5" />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
