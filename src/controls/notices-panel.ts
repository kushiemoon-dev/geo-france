import { NOTICES } from '../config/notices.ts'
import type { Notice } from '../config/notices.ts'
import { DEFAULT_REGION } from '../config/regions.ts'
import noticeMeta from '../config/notice-meta.json' assert { type: 'json' }

const meta = noticeMeta as Record<string, { pages: number | null; bytes: number | null }>

function enrichAndSort(notices: Notice[]): Notice[] {
  return notices
    .map(n => ({
      ...n,
      pages: meta[n.sheet]?.pages ?? undefined,
      bytes: meta[n.sheet]?.bytes ?? undefined,
    }))
    .sort((a, b) => {
      if (a.pages == null && b.pages == null) return 0
      if (a.pages == null) return 1
      if (b.pages == null) return -1
      return b.pages - a.pages
    })
}

function renderNotices(container: HTMLElement, regionId: string): void {
  const raw = NOTICES[regionId] ?? []
  const notices = enrichAndSort(raw)

  const header = container.querySelector('.notices-header') as HTMLElement
  header.textContent = `Notices (${notices.length})`

  const list = container.querySelector('.notices-list') as HTMLElement
  list.innerHTML = ''

  for (const notice of notices) {
    const item = document.createElement('div')
    item.className = 'notices-item'
    item.innerHTML = buildNoticeHtml(notice)
    list.appendChild(item)
  }
}

function buildNoticeHtml(notice: Notice): string {
  const label = `${notice.sheet} - ${notice.name}`
  let badge = ''
  if (notice.pages != null) {
    const cls = notice.pages >= 50 ? 'notice-badge-full' : 'notice-badge-pocket'
    badge = `<span class="notice-badge ${cls}">${notice.pages} p.</span>`
  }
  return `<a href="${notice.url}" target="_blank" rel="noopener noreferrer">${label}${badge}</a>`
}

export function setupNoticesPanel(): void {
  const container = document.createElement('div')
  container.className = 'notices-panel'

  const header = document.createElement('h3')
  header.className = 'notices-header'
  container.appendChild(header)

  const list = document.createElement('div')
  list.className = 'notices-list'
  container.appendChild(list)

  document.body.appendChild(container)

  renderNotices(container, DEFAULT_REGION)

  document.addEventListener('regionchange', ((e: CustomEvent<string>) => {
    renderNotices(container, e.detail)
  }) as EventListener)
}
