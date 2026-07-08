type SheetState = 'closed' | 'peek' | 'half' | 'full'

const STATE_ORDER: SheetState[] = ['closed', 'peek', 'half', 'full']

const STATE_CLASS: Record<SheetState, string> = {
  closed: '',
  peek: 'sheet-peek',
  half: 'sheet-half',
  full: 'sheet-full',
}

export function setupBottomSheet() {
  const sheet = document.createElement('div')
  sheet.className = 'bottom-sheet'
  sheet.innerHTML = `
    <div class="bottom-sheet-handle"><div class="bottom-sheet-handle-bar"></div></div>
    <div class="bottom-sheet-peek"></div>
    <div class="bottom-sheet-content"></div>
  `
  document.body.appendChild(sheet)

  const handle = sheet.querySelector('.bottom-sheet-handle') as HTMLElement
  const peekEl = sheet.querySelector('.bottom-sheet-peek') as HTMLElement
  const contentEl = sheet.querySelector('.bottom-sheet-content') as HTMLElement

  let currentState: SheetState = 'closed'
  let dragStartY = 0
  let dragStartTranslate = 0

  function getTranslateY(): number {
    const vh = window.innerHeight
    switch (currentState) {
      case 'closed': return vh
      case 'peek': return vh - 80
      case 'half': return vh * 0.5
      case 'full': return vh * 0.1
    }
  }

  function applyState(state: SheetState) {
    currentState = state
    for (const cls of Object.values(STATE_CLASS)) {
      if (cls) sheet.classList.remove(cls)
    }
    const cls = STATE_CLASS[state]
    if (cls) sheet.classList.add(cls)
  }

  function resolveStateFromDrag(currentY: number): SheetState {
    const idx = STATE_ORDER.indexOf(currentState)
    const dragDelta = currentY - dragStartTranslate
    const stateHeight = getStateSpan(currentState)
    const ratio = Math.abs(dragDelta) / stateHeight

    if (ratio < 0.3) return currentState

    if (dragDelta < 0 && idx < STATE_ORDER.length - 1) {
      return STATE_ORDER[idx + 1]
    }
    if (dragDelta > 0 && idx > 0) {
      return STATE_ORDER[idx - 1]
    }
    return currentState
  }

  function getStateSpan(state: SheetState): number {
    const vh = window.innerHeight
    switch (state) {
      case 'closed': return 80
      case 'peek': return vh * 0.5 - (vh - 80)
      case 'half': return vh * 0.4
      case 'full': return vh * 0.1
    }
    return vh * 0.3
  }

  function onTouchStart(e: TouchEvent) {
    dragStartY = e.touches[0].clientY
    dragStartTranslate = getTranslateY()
    sheet.classList.add('sheet-dragging')
  }

  function onTouchMove(e: TouchEvent) {
    e.preventDefault()
    const deltaY = e.touches[0].clientY - dragStartY
    const newY = Math.max(window.innerHeight * 0.1, dragStartTranslate + deltaY)
    sheet.style.transform = `translateY(${newY}px)`
  }

  function onTouchEnd(e: TouchEvent) {
    sheet.classList.remove('sheet-dragging')
    sheet.style.transform = ''

    const endY = e.changedTouches[0].clientY
    const deltaY = endY - dragStartY
    const currentTranslate = dragStartTranslate + deltaY

    const nextState = resolveStateFromDrag(currentTranslate)
    applyState(nextState)
  }

  handle.addEventListener('touchstart', onTouchStart, { passive: true })
  handle.addEventListener('touchmove', onTouchMove, { passive: false })
  handle.addEventListener('touchend', onTouchEnd, { passive: true })

  return {
    setPeekContent(html: string) {
      peekEl.innerHTML = html
    },
    setFullContent(html: string) {
      contentEl.innerHTML = html
    },
    open() {
      applyState('peek')
    },
    close() {
      applyState('closed')
    },
  }
}
