(() => {
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
  const hero = document.querySelector('.home-hero')
  const landscape = document.querySelector('.home-hero-landscape')
  const nav = document.querySelector('.site-nav')
  const modal = document.querySelector('#static-subscribe-modal')

  if (hero && landscape && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    hero.addEventListener('pointermove', (event) => {
      if (reducedMotion.matches) return
      const bounds = hero.getBoundingClientRect()
      const x = -clamp((event.clientX / innerWidth) * 2 - 1, -1, 1) * 18
      const y = -clamp(((event.clientY - bounds.top) / bounds.height) * 2 - 1, -1, 1) * 18
      landscape.style.setProperty('--mountain-x', `${x.toFixed(2)}px`)
      landscape.style.setProperty('--mountain-y', `${y.toFixed(2)}px`)
    })
    hero.addEventListener('pointerleave', () => {
      landscape.style.setProperty('--mountain-x', '0px')
      landscape.style.setProperty('--mountain-y', '0px')
    })
  }

  const mobileMenu = document.querySelector('#site-mobile-menu')
  const menuButton = document.querySelector('.site-nav-hamburger')
  const setMenu = (open) => {
    if (!mobileMenu || !menuButton) return
    mobileMenu.style.opacity = open ? '1' : '0'
    mobileMenu.style.pointerEvents = open ? 'auto' : 'none'
    mobileMenu.setAttribute('aria-hidden', String(!open))
    menuButton.setAttribute('aria-expanded', String(open))
    const bars = menuButton.querySelectorAll('span')
    if (bars[0]) bars[0].style.transform = open ? 'rotate(45deg) translateY(8px)' : ''
    if (bars[1]) bars[1].style.opacity = open ? '0' : '1'
    if (bars[2]) bars[2].style.transform = open ? 'rotate(-45deg) translateY(-8px)' : ''
  }
  menuButton?.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'))
  mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)))

  const setModal = (open) => {
    if (!modal) return
    modal.hidden = !open
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) setTimeout(() => modal.querySelector('input')?.focus(), 180)
  }
  document.querySelectorAll('[data-od-id="home-join-cta"], .site-nav-subscribe').forEach((button) => {
    button.addEventListener('click', () => setModal(true))
  })
  modal?.querySelector('.subscribe-modal-close')?.addEventListener('click', () => setModal(false))
  modal?.addEventListener('click', (event) => {
    if (event.target === modal) setModal(false)
  })
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setModal(false)
      setMenu(false)
    }
  })
  modal?.querySelector('form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    const feedback = modal.querySelector('.subscribe-modal-feedback')
    feedback.hidden = false
    feedback.textContent = 'This static preview does not submit data.'
  })

  const carousel = document.querySelector('.home-carousel-frame > div')
  if (carousel) {
    const images = [...carousel.querySelectorAll(':scope > img')]
    const arrows = [...carousel.querySelectorAll(':scope > button')]
    const dots = [...carousel.querySelectorAll(':scope > div button')]
    let current = 0
    let paused = false
    const show = (index) => {
      current = (index + images.length) % images.length
      images.forEach((image, i) => { image.style.opacity = i === current ? '1' : '0' })
      dots.forEach((dot, i) => {
        dot.style.width = i === current ? '20px' : '8px'
        dot.style.background = i === current ? '#fff' : 'rgba(255,255,255,.5)'
      })
    }
    carousel.addEventListener('mouseenter', () => {
      paused = true
      arrows.forEach((button) => {
        button.style.opacity = '1'
        button.style.pointerEvents = 'auto'
      })
    })
    carousel.addEventListener('mouseleave', () => {
      paused = false
      arrows.forEach((button) => {
        button.style.opacity = '0'
        button.style.pointerEvents = 'none'
      })
    })
    arrows[0]?.addEventListener('click', () => show(current - 1))
    arrows[1]?.addEventListener('click', () => show(current + 1))
    dots.forEach((dot, i) => dot.addEventListener('click', () => show(i)))
    show(0)
    setInterval(() => { if (!paused) show(current + 1) }, 4000)
  }

  const offerScene = document.querySelector('.home-offer-scroll-scene')
  const offerList = offerScene?.querySelector('.home-offer-list')
  const offerRows = offerList ? [...offerList.querySelectorAll('.home-offer-row')] : []
  const updateOffers = () => {
    if (!offerScene || !offerList || offerRows.length !== 3 || reducedMotion.matches) return
    const collapsed = offerRows.map((row) => {
      const number = row.querySelector('.home-offer-num')
      const name = row.querySelector('.home-offer-name')
      const styles = getComputedStyle(row)
      return Math.ceil(Math.max(number?.getBoundingClientRect().height || 0, name?.getBoundingClientRect().height || 0) + parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom))
    })
    const expandable = Math.max(0, offerList.clientHeight - collapsed.reduce((sum, value) => sum + value, 0))
    const distance = Math.max(1, offerScene.offsetHeight - innerHeight)
    const progress = clamp(-offerScene.getBoundingClientRect().top / distance)
    const position = progress * 2
    const weights = position <= 1 ? [1 - position, position, 0] : [0, 2 - position, position - 1]
    offerRows.forEach((row, i) => {
      row.style.height = `${collapsed[i] + expandable * weights[i]}px`
      row.style.setProperty('--offer-weight', String(weights[i]))
    })
  }

  const upcoming = document.querySelector('.home-upcoming-section')
  const upcomingCard = upcoming?.querySelector('.home-upcoming-card')
  const updateUpcoming = () => {
    if (!upcoming || !upcomingCard) return
    const mobile = innerWidth <= 900
    upcoming.classList.toggle('is-flow', mobile)
    upcomingCard.classList.toggle('is-stacked', mobile)
    if (mobile) {
      upcomingCard.style.opacity = '1'
      upcomingCard.style.pointerEvents = 'auto'
      upcomingCard.style.transform = ''
      upcomingCard.setAttribute('aria-hidden', 'false')
      return
    }
    const top = clamp(innerHeight * 0.25, 210, 280)
    const bottom = clamp(innerHeight * 0.07, 52, 76)
    const cardHeight = Math.max(360, Math.min(620, innerHeight * 0.58, innerHeight - top - bottom))
    upcoming.style.setProperty('--home-upcoming-card-height', `${cardHeight}px`)
    const bounds = upcoming.getBoundingClientRect()
    const range = Math.max(1, upcoming.offsetHeight - innerHeight)
    const progress = clamp(-bounds.top / range)
    upcoming.style.setProperty('--home-upcoming-grid-progress', String(clamp((innerHeight - bounds.top) / innerHeight)))
    const phase = progress * 3
    let x = 0
    let opacity = 1
    let scale = 1
    if (phase <= 0) {
      x = 112
      opacity = 0
      scale = 0.96
    } else if (phase < 1) {
      const eased = 1 - (1 - phase) ** 3
      x = 112 * (1 - eased)
      opacity = Math.min(1, phase * 4)
      scale = 0.96 + eased * 0.04
    } else if (phase > 2 && phase < 3) {
      const exit = phase - 2
      x = -112 * exit ** 3
      opacity = Math.min(1, (1 - exit) * 4)
      scale = 1 - exit * 0.04
    } else if (phase >= 3) {
      x = -112
      opacity = 0
      scale = 0.96
    }
    const interactive = phase > 0.55 && phase < 2.45
    upcomingCard.style.opacity = String(opacity)
    upcomingCard.style.pointerEvents = interactive ? 'auto' : 'none'
    upcomingCard.style.transform = `translate3d(calc(-50% + ${x}vw), -50%, 0) scale(${scale})`
    upcomingCard.setAttribute('aria-hidden', String(!interactive))
    const fill = upcoming.querySelector('.home-upcoming-progress-fill')
    if (fill) fill.style.transform = `scaleX(${progress})`
  }

  let frame = 0
  const update = () => {
    frame = 0
    updateOffers()
    updateUpcoming()
    if (nav && hero) nav.classList.toggle('site-nav--hero', hero.getBoundingClientRect().bottom > nav.offsetHeight)
  }
  const requestUpdate = () => {
    if (!frame) frame = requestAnimationFrame(update)
  }
  addEventListener('scroll', requestUpdate, { passive: true })
  addEventListener('resize', requestUpdate)
  document.fonts?.ready.then(update)
  update()
})()
