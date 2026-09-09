'use client'

import { useEffect, useRef, useState } from 'react'
import type { Dictionary } from '@/lib/i18n-types'

const IMAGES = [
  'https://res.cloudinary.com/dpprzfwjf/image/upload/v1781833719/%E5%85%B3%E4%BA%8E%E6%88%91%E4%BB%AC/DSC_0610_houpbq.jpg',
  'https://res.cloudinary.com/dpprzfwjf/image/upload/v1781833717/%E5%85%B3%E4%BA%8E%E6%88%91%E4%BB%AC/DSC_0856_cnk2ay.jpg',
  'https://res.cloudinary.com/dpprzfwjf/image/upload/v1781833711/%E5%85%B3%E4%BA%8E%E6%88%91%E4%BB%AC/DSC_0453_rsdwg8.jpg',
  'https://res.cloudinary.com/dpprzfwjf/image/upload/v1781833710/%E5%85%B3%E4%BA%8E%E6%88%91%E4%BB%AC/DSC_0792_watermarked_ur6aqr.jpg',
]

const INTERVAL = 4000

export default function ImageCarousel({ copy }: { copy: Dictionary['carousel'] }) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (paused) return
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % IMAGES.length)
    }, INTERVAL)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [paused])

  useEffect(() => {
    if (!paused) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setCurrent((c) => (c - 1 + IMAGES.length) % IMAGES.length)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        setCurrent((c) => (c + 1) % IMAGES.length)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [paused])

  return (
    <div
      style={{ position: 'relative', width: '100%', aspectRatio: '3/2', overflow: 'hidden', borderRadius: 'var(--container-radius)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {IMAGES.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={`${copy.imageAlt} ${i + 1}`}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: i === current ? 1 : 0,
            transition: 'opacity 0.8s ease-in-out',
          }}
        />
      ))}

      {[
        { direction: 'previous', label: copy.previous, side: 'left', icon: '‹' },
        { direction: 'next', label: copy.next, side: 'right', icon: '›' },
      ].map(({ direction, label, side, icon }) => (
        <button
          key={direction}
          type="button"
          aria-label={label}
          onClick={() => {
            setCurrent((c) => direction === 'previous'
              ? (c - 1 + IMAGES.length) % IMAGES.length
              : (c + 1) % IMAGES.length)
          }}
          style={{
            position: 'absolute',
            top: '50%',
            [side]: '16px',
            transform: 'translateY(-50%)',
            width: '42px',
            height: '42px',
            display: 'grid',
            placeItems: 'center',
            padding: 0,
            border: '1px solid rgba(255,255,255,0.45)',
            borderRadius: '50%',
            background: 'rgba(28,34,32,0.42)',
            color: '#fff',
            fontFamily: 'var(--font-label)',
            fontSize: '34px',
            fontWeight: 300,
            lineHeight: 1,
            cursor: 'pointer',
            opacity: paused ? 1 : 0,
            pointerEvents: paused ? 'auto' : 'none',
            transition: 'opacity 0.25s ease, background 0.25s ease',
            zIndex: 10,
          }}
        >
          <span aria-hidden="true" style={{ transform: 'translateY(-1px)' }}>{icon}</span>
        </button>
      ))}

      {/* Dot indicators */}
      <div
        style={{
          position: 'absolute',
          bottom: '14px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '8px',
          zIndex: 10,
        }}
      >
        {IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`${copy.goTo} ${i + 1}`}
            style={{
              width: i === current ? '20px' : '8px',
              height: '8px',
              borderRadius: '4px',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              background: i === current ? '#fff' : 'rgba(255,255,255,0.5)',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  )
}
