'use client'

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import type { ActivityLanguage, ActivityRecord, PartnerRecord } from '@/lib/types'
import type { Dictionary } from '@/lib/i18n-types'

interface ShowcaseCard {
  id: string
  title: string
  titleEn?: string | null
  sourceName?: string | null
  date?: string | null
  time?: string | null
  location?: string | null
  locationDetail?: string | null
  description?: string | null
  poster?: string | null
  actionUrl?: string | null
  actionLabel: string
  disabledActionLabel: string
  activityLanguage?: ActivityLanguage | null
}

function hasUsableUrl(url?: string | null): url is string {
  return Boolean(url && url.trim() && url.trim() !== '#')
}

function cardMeta(card: ShowcaseCard, copy: Dictionary['home']['upcoming']): string {
  const schedule = [card.date, card.time].filter(Boolean).join(' ')
  const place = [card.location, card.locationDetail].filter(Boolean).join(' · ')
  return [schedule || copy.timeTba, place || copy.placeTba].join(' · ')
}

function showcaseCards(
  activities: ActivityRecord[],
  partners: PartnerRecord[],
  copy: Dictionary['home']['upcoming'],
): ShowcaseCard[] {
  return [
    ...activities.map((activity) => ({
      id: `rainier-${activity.id}`,
      title: activity.title,
      titleEn: activity.titleEn,
      date: activity.date,
      time: activity.time,
      location: activity.location,
      locationDetail: activity.locationDetail,
      description: activity.description,
      poster: activity.poster,
      actionUrl: activity.registerUrl,
      actionLabel: copy.rainierAction,
      disabledActionLabel: copy.rainierDisabled,
      activityLanguage: activity.activityLanguage,
    })),
    ...partners.map((partner) => ({
      id: `partner-${partner.id}`,
      title: partner.eventName,
      titleEn: partner.eventNameEn,
      sourceName: partner.partnerName,
      date: partner.date,
      time: partner.time,
      location: partner.location,
      locationDetail: partner.locationDetail,
      description: partner.description,
      poster: partner.poster,
      actionUrl: partner.url,
      actionLabel: copy.partnerAction,
      disabledActionLabel: copy.partnerDisabled,
      activityLanguage: partner.activityLanguage,
    })),
  ]
}

const CARD_SCROLL_PHASES = 3
const UPCOMING_SCROLL_SPEED = 1.5
const CARD_SCALE = 1.1
const DEFAULT_POSTER_RATIO = 3 / 4
const MIN_COPY_WIDTH = 360
const MIN_CARD_EDGE = 18
const STACK_BREAKPOINT = 900

function clamp(min: number, value: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function availableCardWidth(viewportWidth: number): number {
  const horizontalInset = clamp(36, viewportWidth * 0.08, 144)
  return Math.min(viewportWidth - horizontalInset, 1240)
}

function resolvedCardHeight(viewportWidth: number, viewportHeight: number): number {
  if (viewportHeight === 0) return 0

  if (viewportWidth <= STACK_BREAKPOINT) {
    const deckTop = clamp(170, viewportHeight * 0.22, 220)
    return Math.max(0, viewportHeight - deckTop - 38)
  }

  const deckTop = clamp(210, viewportHeight * 0.25, 280)
  const deckBottom = clamp(52, viewportHeight * 0.07, 76)
  const preferredHeight = clamp(360, viewportHeight * 0.58, 620)
  return Math.max(0, Math.min(preferredHeight, viewportHeight - deckTop - deckBottom))
}

function resolvedCardScale(viewportWidth: number, viewportHeight: number, cardHeight: number): number {
  if (viewportWidth <= STACK_BREAKPOINT || viewportHeight === 0 || cardHeight === 0) return 1

  const deckTop = clamp(210, viewportHeight * 0.25, 280)
  const deckBottom = clamp(52, viewportHeight * 0.07, 76)
  const horizontalScale = (viewportWidth - MIN_CARD_EDGE * 2) / availableCardWidth(viewportWidth)
  const verticalScale = (viewportHeight - deckTop - deckBottom) / cardHeight

  return Math.min(CARD_SCALE, horizontalScale, verticalScale)
}

function shouldStackCard(viewportWidth: number, posterRatio: number, cardHeight: number): boolean {
  if (viewportWidth === 0) return false
  if (viewportWidth <= STACK_BREAKPOINT) return true
  if (cardHeight === 0) return false
  return posterRatio * cardHeight + MIN_COPY_WIDTH > availableCardWidth(viewportWidth)
}

function handleBodyKeyDown(event: KeyboardEvent<HTMLDivElement>) {
  const body = event.currentTarget
  const maxScroll = body.scrollHeight - body.clientHeight
  let nextScroll: number | null = null

  switch (event.key) {
    case 'ArrowDown':
      nextScroll = body.scrollTop + 40
      break
    case 'ArrowUp':
      nextScroll = body.scrollTop - 40
      break
    case 'PageDown':
    case ' ':
      nextScroll = body.scrollTop + body.clientHeight * 0.9
      break
    case 'PageUp':
      nextScroll = body.scrollTop - body.clientHeight * 0.9
      break
    case 'Home':
      nextScroll = 0
      break
    case 'End':
      nextScroll = maxScroll
      break
    default:
      return
  }

  const target = clamp(0, nextScroll, maxScroll)
  if (Math.abs(target - body.scrollTop) < 1) return
  event.preventDefault()
  body.scrollTop = target
}

function cardMotion(progress: number, index: number, total: number) {
  const phase = progress * total * CARD_SCROLL_PHASES - index * CARD_SCROLL_PHASES

  if (phase <= 0) return { phase, x: 112, opacity: 0, scale: 0.96 }
  if (phase < 1) {
    const eased = 1 - (1 - phase) ** 3
    return {
      phase,
      x: 112 * (1 - eased),
      opacity: Math.min(1, phase * 4),
      scale: 0.96 + eased * 0.04,
    }
  }
  if (phase <= 2) return { phase, x: 0, opacity: 1, scale: 1 }
  if (phase < 3) {
    const exit = phase - 2
    return {
      phase,
      x: -112 * exit ** 3,
      opacity: Math.min(1, (1 - exit) * 4),
      scale: 1 - exit * 0.04,
    }
  }

  return { phase, x: -112, opacity: 0, scale: 0.96 }
}

export default function UpcomingShowcase({
  activities,
  partners,
  copy,
  activityLanguageCopy,
}: {
  activities: ActivityRecord[]
  partners: PartnerRecord[]
  copy: Dictionary['home']['upcoming']
  activityLanguageCopy: Dictionary['activityLanguage']
}) {
  const sectionRef = useRef<HTMLElement>(null)
  const frameRef = useRef<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [gridProgress, setGridProgress] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [viewportWidth, setViewportWidth] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)
  const [posterRatios, setPosterRatios] = useState<Record<string, number>>({})
  const [flowProgress, setFlowProgress] = useState(0)
  const cards = showcaseCards(activities, partners, copy)
  const cardHeight = resolvedCardHeight(viewportWidth, viewportHeight)
  const cardScale = resolvedCardScale(viewportWidth, viewportHeight, cardHeight)
  const isFlowLayout = cards.some((card) => (
    shouldStackCard(viewportWidth, posterRatios[card.id] ?? DEFAULT_POSTER_RATIO, cardHeight)
  ))

  useEffect(() => {
    const update = () => {
      frameRef.current = null
      const section = sectionRef.current
      if (!section) return

      const bounds = section.getBoundingClientRect()
      const nextViewportHeight = window.innerHeight
      const scrollRange = Math.max(1, section.offsetHeight - nextViewportHeight)
      const flowLayoutActive = section.classList.contains('is-flow')
      setProgress(Math.max(0, Math.min(1, -bounds.top / scrollRange)))
      setGridProgress(clamp(
        0,
        ((nextViewportHeight - bounds.top) / nextViewportHeight)
          * (flowLayoutActive ? 1 : UPCOMING_SCROLL_SPEED),
        1,
      ))
      setViewportWidth(window.innerWidth)
      setViewportHeight(nextViewportHeight)

      if (flowLayoutActive) {
        const cardsInFlow = Array.from(section.querySelectorAll<HTMLElement>('.home-upcoming-card'))
        const viewportCenter = nextViewportHeight / 2
        let activeCard: HTMLElement | null = null
        let activeDistance = Number.POSITIVE_INFINITY

        for (const card of cardsInFlow) {
          const cardBounds = card.getBoundingClientRect()
          const distance = Math.abs(cardBounds.top + cardBounds.height / 2 - viewportCenter)
          if (distance < activeDistance) {
            activeCard = card
            activeDistance = distance
          }
        }

        if (activeCard && cards.length > 0) {
          const cardBounds = activeCard.getBoundingClientRect()
          const index = Number(activeCard.dataset.upcomingIndex ?? 0)
          const cardProgress = clamp(0, (viewportCenter - cardBounds.top) / Math.max(1, cardBounds.height), 1)
          setFlowProgress(clamp(0, (index + cardProgress) / cards.length, 1))
        }
      }
    }

    const requestUpdate = () => {
      if (frameRef.current === null) frameRef.current = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current)
    }
  }, [cards.length])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReducedMotion(media.matches)
    updatePreference()
    media.addEventListener('change', updatePreference)
    return () => media.removeEventListener('change', updatePreference)
  }, [])

  if (cards.length === 0) return null

  const displayedProgress = isFlowLayout ? flowProgress : progress
  const renderProgress = () => (
    <div className="home-upcoming-progress" aria-hidden="true">
      {cards.map((card, index) => {
        const segmentProgress = Math.max(0, Math.min(1, displayedProgress * cards.length - index))
        return (
          <span className="home-upcoming-progress-segment" key={card.id}>
            <span
              className="home-upcoming-progress-fill"
              style={{ transform: `scaleX(${segmentProgress})` }}
            />
          </span>
        )
      })}
    </div>
  )

  return (
    <section
      ref={sectionRef}
      className={`home-upcoming-section${isFlowLayout ? ' is-flow' : ''}`}
      style={{
        '--home-upcoming-steps': cards.length * CARD_SCROLL_PHASES / UPCOMING_SCROLL_SPEED + 1,
        '--home-upcoming-grid-progress': gridProgress,
        ...(cardHeight > 0 ? { '--home-upcoming-card-height': `${cardHeight}px` } : {}),
      } as CSSProperties}
      aria-labelledby="home-upcoming-title"
      data-od-id="home-upcoming"
    >
      <div className="home-upcoming-sticky">
        <div className="home-container home-upcoming-heading-group">
          <div className="home-section-meta">
            <p>{copy.eyebrow}</p>
            <span>{copy.index}</span>
          </div>

          <header className="home-upcoming-heading">
            <h2 id="home-upcoming-title">{copy.title}</h2>
          </header>
        </div>

        <div className="home-upcoming-grid" aria-hidden="true">
          <span className="home-upcoming-grid-layer home-upcoming-grid-horizontal home-upcoming-grid-from-left" />
          <span className="home-upcoming-grid-layer home-upcoming-grid-horizontal home-upcoming-grid-from-right" />
          <span className="home-upcoming-grid-layer home-upcoming-grid-vertical home-upcoming-grid-from-top" />
          <span className="home-upcoming-grid-layer home-upcoming-grid-vertical home-upcoming-grid-from-bottom" />
        </div>

        {isFlowLayout && viewportWidth > 700 && renderProgress()}

        <div className="home-upcoming-deck">
          {cards.map((card, index) => {
            const motion = cardMotion(progress, index, cards.length)
            const canInteract = isFlowLayout || reducedMotion || (motion.phase > 0.55 && motion.phase < 2.45)
            const actionUrl = hasUsableUrl(card.actionUrl) ? card.actionUrl : null
            const posterRatio = posterRatios[card.id] ?? DEFAULT_POSTER_RATIO

            return (
              <article
                key={card.id}
                className={`home-upcoming-card${isFlowLayout ? ' is-stacked' : ''}`}
                data-upcoming-index={index}
                style={{
                  '--home-upcoming-poster-ratio': posterRatio,
                  ...(!isFlowLayout ? {
                    opacity: motion.opacity,
                    pointerEvents: canInteract ? 'auto' : 'none',
                    transform: `translate3d(calc(-50% + ${motion.x}vw), -50%, 0) scale(${motion.scale * cardScale})`,
                    zIndex: Math.round(100 - Math.abs(1 - motion.phase) * 10),
                  } : {}),
                } as CSSProperties}
                aria-hidden={!canInteract}
                inert={!canInteract}
              >
                <div className="home-upcoming-poster">
                  {card.poster ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={card.poster}
                      alt={`${card.title} ${copy.posterAlt}`}
                      onLoad={({ currentTarget }) => {
                        const ratio = currentTarget.naturalWidth / currentTarget.naturalHeight
                        if (!Number.isFinite(ratio) || ratio <= 0) return
                        setPosterRatios((current) => (
                          current[card.id] === ratio
                            ? current
                            : { ...current, [card.id]: ratio }
                        ))
                      }}
                    />
                  ) : (
                    <div className="home-upcoming-poster-placeholder" aria-hidden="true">
                      <span>Rainier Literature Society</span>
                      <strong>雨山前</strong>
                    </div>
                  )}
                </div>

                <div className="home-upcoming-copy">
                  <header className="home-upcoming-copy-heading">
                    <p className="home-upcoming-count">
                      {String(index + 1).padStart(2, '0')} / {String(cards.length).padStart(2, '0')}
                    </p>
                    {card.sourceName && (
                      <p className="home-upcoming-source">{copy.partnerSource} · {card.sourceName}</p>
                    )}
                    {card.activityLanguage && (
                      <p className="home-upcoming-source">{activityLanguageCopy[card.activityLanguage]}</p>
                    )}
                    <h3>{card.title}</h3>
                    <p className="home-upcoming-meta">{cardMeta(card, copy)}</p>
                  </header>

                  <div
                    className="home-upcoming-body"
                    role="region"
                    aria-label={`${card.title} ${copy.bodyAria}`}
                    tabIndex={card.description && canInteract ? 0 : -1}
                    onKeyDown={handleBodyKeyDown}
                  >
                    {card.description && <p className="home-upcoming-description">{card.description}</p>}
                  </div>

                  {actionUrl ? (
                    <a className="home-upcoming-action" href={actionUrl} target="_blank" rel="noreferrer">
                      <span>{card.actionLabel}</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    <span className="home-upcoming-action is-disabled" aria-disabled="true">
                      <span>{card.disabledActionLabel}</span>
                      <span aria-hidden="true">···</span>
                    </span>
                  )}
                </div>
              </article>
            )
          })}
        </div>

        {!isFlowLayout && renderProgress()}
      </div>
    </section>
  )
}
