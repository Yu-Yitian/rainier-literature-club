/* eslint-disable @next/next/no-img-element */

'use client'

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'
import type { ActivityLanguage } from '@/lib/types'
import type { Dictionary } from '@/lib/i18n-types'

export interface GalleryPoster {
  id: string
  title: string
  date: string | null
  poster: string
  categoryName: string
  categoryColor: string
  subType?: string | null
  description?: string | null
  activityLanguage?: ActivityLanguage | null
}

interface PhotoWallProps {
  events: GalleryPoster[]
  copy: Dictionary['home']['gallery']
  activityLanguageCopy: Dictionary['activityLanguage']
  allowFallback: boolean
}

type GalleryStyle = CSSProperties & {
  '--gallery-duration'?: string
  '--poster-rotation'?: string
  '--detail-poster-ratio'?: string
}

const FALLBACK_EVENTS: GalleryPoster[] = [
  { id: 'fallback-0', title: '再建社群 · Vol.1', date: '2026-01-01', poster: 'https://res.cloudinary.com/dpprzfwjf/image/upload/v1781833693/%E5%85%B3%E4%BA%8E%E6%88%91%E4%BB%AC/recommunity%E6%B5%B7%E6%8A%A5_a4kbsc.jpg', categoryName: '', categoryColor: '#8FA499' },
  { id: 'fallback-1', title: '红楼梦共读', date: '2026-04-01', poster: 'https://res.cloudinary.com/dpprzfwjf/image/upload/v1781833714/%E5%85%B3%E4%BA%8E%E6%88%91%E4%BB%AC/%E9%9B%A8%E5%B1%B1%E5%89%8D%E7%BA%A2%E6%A5%BC%E6%A2%A6_%E7%BB%BF_1_dhrm2g.png', categoryName: '', categoryColor: '#8FA499' },
  { id: 'fallback-2', title: '乱讲PPT之夜', date: '2026-03-01', poster: 'https://res.cloudinary.com/dpprzfwjf/image/upload/v1781833705/%E5%85%B3%E4%BA%8E%E6%88%91%E4%BB%AC/%E9%9B%A8%E5%B1%B1%E5%89%8D-%E5%A5%87%E6%80%AA%E7%9A%84%E7%9F%A5%E8%AF%861_w99jma.png', categoryName: '', categoryColor: '#8FA499' },
  { id: 'fallback-3', title: '冷门学科分享大会', date: '2026-02-01', poster: 'https://res.cloudinary.com/dpprzfwjf/image/upload/v1781833687/%E5%85%B3%E4%BA%8E%E6%88%91%E4%BB%AC/%E5%86%B7%E9%97%A8%E5%AD%A6%E7%A7%91%E5%88%86%E4%BA%AB%E5%A4%A7%E4%BC%9A_revised_l3lr61.jpg', categoryName: '', categoryColor: '#8FA499' },
  { id: 'fallback-4', title: '存在主义咖啡馆', date: '2026-03-01', poster: 'https://res.cloudinary.com/dpprzfwjf/image/upload/v1781833682/%E5%85%B3%E4%BA%8E%E6%88%91%E4%BB%AC/%E5%AD%98%E5%9C%A8%E4%B8%BB%E4%B9%89%E5%92%96%E5%95%A1%E9%A6%86_dt35nm.jpg', categoryName: '', categoryColor: '#8FA499' },
  { id: 'fallback-5', title: '扎十一惹对谈', date: '2026-04-01', poster: 'https://res.cloudinary.com/dpprzfwjf/image/upload/v1781833677/%E5%85%B3%E4%BA%8E%E6%88%91%E4%BB%AC/164891774916865_.pic_hd_k3z4sd.jpg', categoryName: '', categoryColor: '#8FA499' },
  { id: 'fallback-6', title: '三小时Zoom共读·白先勇', date: '2026-05-01', poster: 'https://res.cloudinary.com/dpprzfwjf/image/upload/v1781833930/ZOOM%E5%85%B1%E8%AF%BB02-%E7%99%BD%E5%85%88%E5%8B%87%E7%89%88%E6%9C%AC2_piqvbb.jpg', categoryName: '', categoryColor: '#8FA499' },
  { id: 'fallback-7', title: '马克思主题共读', date: '2026-05-01', poster: 'https://res.cloudinary.com/dpprzfwjf/image/upload/v1781833675/%E5%85%B3%E4%BA%8E%E6%88%91%E4%BB%AC/WechatIMG17903_nmcrrm.jpg', categoryName: '', categoryColor: '#8FA499' },
]

const ROTATIONS = [-2.4, 1.7, -1.1, 2.2, -1.8, 1.2, -2, 1.5]
const POSTER_WIDTHS = [240, 360, 480, 640] as const
const DETAIL_POSTER_WIDTHS = [480, 720, 960] as const
const CLOUDINARY_UPLOAD_PATH = '/image/upload/'

function cloudinaryGalleryUrl(src: string, width: number): string {
  try {
    const url = new URL(src)
    if (url.hostname !== 'res.cloudinary.com' || !url.pathname.includes(CLOUDINARY_UPLOAD_PATH)) {
      return src
    }

    const transformation = `c_fill,g_auto,ar_3:4,w_${width},f_auto,q_auto`
    url.pathname = url.pathname.replace(
      CLOUDINARY_UPLOAD_PATH,
      `${CLOUDINARY_UPLOAD_PATH}${transformation}/`,
    )
    return url.toString()
  } catch {
    return src
  }
}

function galleryPosterSrcSet(src: string): string | undefined {
  const urls = POSTER_WIDTHS.map((width) => cloudinaryGalleryUrl(src, width))
  if (urls.every((url) => url === src)) return undefined
  return urls.map((url, index) => `${url} ${POSTER_WIDTHS[index]}w`).join(', ')
}

function cloudinaryDetailUrl(src: string, width: number): string {
  try {
    const url = new URL(src)
    if (url.hostname !== 'res.cloudinary.com' || !url.pathname.includes(CLOUDINARY_UPLOAD_PATH)) {
      return src
    }

    const transformation = `c_limit,w_${width},f_auto,q_auto`
    url.pathname = url.pathname.replace(
      CLOUDINARY_UPLOAD_PATH,
      `${CLOUDINARY_UPLOAD_PATH}${transformation}/`,
    )
    return url.toString()
  } catch {
    return src
  }
}

function detailPosterSrcSet(src: string): string | undefined {
  const urls = DETAIL_POSTER_WIDTHS.map((width) => cloudinaryDetailUrl(src, width))
  if (urls.every((url) => url === src)) return undefined
  return urls.map((url, index) => `${url} ${DETAIL_POSTER_WIDTHS[index]}w`).join(', ')
}

function Paragraphs({ text }: { text?: string | null }) {
  if (!text) return null

  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => <p key={index}>{paragraph}</p>)
}

function PosterSequence({
  events,
  duplicate,
  selectedId,
  onSelect,
  copy,
}: {
  events: GalleryPoster[]
  duplicate?: boolean
  selectedId?: string
  onSelect: (event: GalleryPoster, opener: HTMLButtonElement) => void
  copy: Dictionary['home']['gallery']
}) {
  return (
    <div
      className="event-gallery-sequence"
      role={duplicate ? undefined : 'list'}
      aria-hidden={duplicate || undefined}
    >
      {events.map((event, index) => {
        const style: GalleryStyle = {
          '--poster-rotation': `${ROTATIONS[index % ROTATIONS.length]}deg`,
        }
        const canOpen = Boolean(event.categoryName)
        const image = (
          <div className="event-gallery-image-frame">
            <img
              src={cloudinaryGalleryUrl(event.poster, 480)}
              srcSet={galleryPosterSrcSet(event.poster)}
              sizes="(max-width: 639px) 42vw, (max-width: 1023px) 27vw, 210px"
              alt={duplicate ? '' : event.title}
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          </div>
        )

        return (
          <div
            key={`${event.id}-${index}`}
            className="event-gallery-card"
            role={duplicate ? undefined : 'listitem'}
            style={style}
          >
            {canOpen ? (
              <button
                type="button"
                className="event-gallery-poster-button"
                aria-label={duplicate ? undefined : `${copy.viewDetails}: ${event.title}`}
                aria-expanded={duplicate ? undefined : selectedId === event.id}
                aria-controls={duplicate ? undefined : 'event-gallery-dialog'}
                tabIndex={duplicate ? -1 : undefined}
                onClick={(clickEvent) => onSelect(event, clickEvent.currentTarget)}
              >
                {image}
              </button>
            ) : image}
          </div>
        )
      })}
    </div>
  )
}

function PosterRow({
  events,
  direction,
  selectedId,
  onSelect,
  copy,
}: {
  events: GalleryPoster[]
  direction: 'left' | 'right'
  selectedId?: string
  onSelect: (event: GalleryPoster, opener: HTMLButtonElement) => void
  copy: Dictionary['home']['gallery']
}) {
  const style: GalleryStyle = {
    '--gallery-duration': `${Math.max(52, events.length * 7)}s`,
  }

  return (
    <div className="event-gallery-row">
      <div className={`event-gallery-track event-gallery-track--${direction}`} style={style}>
        <PosterSequence events={events} selectedId={selectedId} onSelect={onSelect} copy={copy} />
        <PosterSequence events={events} duplicate selectedId={selectedId} onSelect={onSelect} copy={copy} />
      </div>
    </div>
  )
}

export default function PhotoWall({ events, copy, activityLanguageCopy, allowFallback }: PhotoWallProps) {
  const posters = events.length > 0 ? events : allowFallback ? FALLBACK_EVENTS : []
  const [isMobileGallery, setIsMobileGallery] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<GalleryPoster | null>(null)
  const [posterRatio, setPosterRatio] = useState(3 / 4)
  const [compactHeader, setCompactHeader] = useState(false)
  const [detailImageLoaded, setDetailImageLoaded] = useState(false)
  const [detailPlaceholderSrc, setDetailPlaceholderSrc] = useState('')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const openerRef = useRef<HTMLButtonElement | null>(null)
  const detailDescriptionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)')
    const updateLayout = () => setIsMobileGallery(media.matches)

    updateLayout()
    media.addEventListener('change', updateLayout)
    return () => media.removeEventListener('change', updateLayout)
  }, [])

  useEffect(() => {
    if (!selectedEvent) return

    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [selectedEvent])

  useEffect(() => {
    if (!selectedEvent) return

    let resetFrame = 0
    let measureFrame = 0

    const measureTextLayout = () => {
      window.cancelAnimationFrame(resetFrame)
      window.cancelAnimationFrame(measureFrame)
      setCompactHeader(false)

      resetFrame = window.requestAnimationFrame(() => {
        measureFrame = window.requestAnimationFrame(() => {
          const description = detailDescriptionRef.current
          const isStacked = window.matchMedia('(max-width: 900px)').matches
          if (!description || isStacked) return
          setCompactHeader(description.scrollHeight > description.clientHeight + 1)
        })
      })
    }

    measureTextLayout()
    window.addEventListener('resize', measureTextLayout)

    return () => {
      window.removeEventListener('resize', measureTextLayout)
      window.cancelAnimationFrame(resetFrame)
      window.cancelAnimationFrame(measureFrame)
    }
  }, [posterRatio, selectedEvent])

  const selectEvent = (event: GalleryPoster, opener: HTMLButtonElement) => {
    openerRef.current = opener
    setPosterRatio(3 / 4)
    setCompactHeader(false)
    setDetailImageLoaded(false)
    setDetailPlaceholderSrc(opener.querySelector('img')?.currentSrc || cloudinaryGalleryUrl(event.poster, 480))
    setSelectedEvent(event)
  }

  const closeDialog = () => {
    dialogRef.current?.close()
  }

  const handleDialogClose = () => {
    setSelectedEvent(null)
    window.requestAnimationFrame(() => openerRef.current?.focus({ preventScroll: true }))
  }

  const handleDialogMouseDown = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) closeDialog()
  }

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== 'Escape') return
    event.preventDefault()
    closeDialog()
  }

  const detailStyle: GalleryStyle = {
    '--detail-poster-ratio': String(posterRatio),
  }
  const rowCount = isMobileGallery ? 3 : 2
  const posterRows = Array.from({ length: rowCount }, (_, rowIndex) => (
    posters.filter((_, posterIndex) => posterIndex % rowCount === rowIndex)
  ))

  if (posters.length === 0) {
    return <p className="event-gallery-empty">{copy.empty}</p>
  }

  return (
    <div className={`event-gallery ${selectedEvent ? 'is-detail-open' : ''}`} aria-label={copy.aria}>
      {posterRows.map((rowEvents, rowIndex) => (
        <PosterRow
          key={`${rowCount}-${rowIndex}`}
          events={rowEvents}
          direction={rowIndex % 2 === 0 ? 'left' : 'right'}
          selectedId={selectedEvent?.id}
          onSelect={selectEvent}
          copy={copy}
        />
      ))}

      {selectedEvent && (
        <dialog
          ref={dialogRef}
          id="event-gallery-dialog"
          className="event-gallery-dialog"
          aria-labelledby="event-gallery-dialog-title"
          aria-describedby={selectedEvent.description ? 'event-gallery-dialog-description' : undefined}
          onClose={handleDialogClose}
          onKeyDown={handleDialogKeyDown}
          onMouseDown={handleDialogMouseDown}
        >
          <article
            className={`event-gallery-detail-card ${compactHeader ? 'is-compact-header' : ''}`}
            style={detailStyle}
          >
            <button
              type="button"
              className="event-gallery-dialog-close"
              aria-label={`${copy.closeDetails}: ${selectedEvent.title}`}
              onClick={closeDialog}
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 3L15 15M15 3L3 15" stroke="currentColor" strokeWidth="1" />
              </svg>
            </button>

            <div
              className={`event-gallery-detail-poster ${detailImageLoaded ? 'is-loaded' : ''}`}
            >
              <img
                className="event-gallery-detail-poster-placeholder"
                src={detailPlaceholderSrc}
                alt=""
                aria-hidden="true"
                draggable={false}
              />
              <img
                className="event-gallery-detail-poster-full"
                src={cloudinaryDetailUrl(selectedEvent.poster, 960)}
                srcSet={detailPosterSrcSet(selectedEvent.poster)}
                sizes="(max-width: 900px) calc(100vw - 24px), min(52vw, 675px)"
                alt={`${selectedEvent.title} ${copy.posterAlt}`}
                decoding="async"
                draggable={false}
                onLoad={(loadEvent) => {
                  const image = loadEvent.currentTarget
                  if (image.naturalWidth > 0 && image.naturalHeight > 0) {
                    setPosterRatio(image.naturalWidth / image.naturalHeight)
                    setDetailImageLoaded(true)
                  }
                }}
              />
            </div>

            <div className="event-gallery-detail-copy">
              <header className="event-gallery-detail-header">
                <span
                  className="event-gallery-detail-category"
                  style={{
                    color: selectedEvent.categoryColor,
                    backgroundColor: `${selectedEvent.categoryColor}18`,
                  }}
                >
                  {selectedEvent.subType || selectedEvent.categoryName}
                </span>
                <h2 id="event-gallery-dialog-title">{selectedEvent.title}</h2>
                {selectedEvent.date && <time dateTime={selectedEvent.date}>{selectedEvent.date}</time>}
                {selectedEvent.activityLanguage && (
                  <span className="event-gallery-detail-language">
                    {activityLanguageCopy[selectedEvent.activityLanguage]}
                  </span>
                )}
              </header>

              {selectedEvent.description && (
                <div
                  ref={detailDescriptionRef}
                  id="event-gallery-dialog-description"
                  className="event-gallery-detail-description"
                >
                  <Paragraphs text={selectedEvent.description} />
                </div>
              )}
            </div>
          </article>
        </dialog>
      )}
    </div>
  )
}
