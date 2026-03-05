import { NOTICES } from '../config/notices.ts'
import type { Notice } from '../config/notices.ts'
import { DEFAULT_REGION } from '../config/regions.ts'

function renderNotices(container: HTMLElement, regionId: string): void {
  const notices = NOTICES[regionId] ?? []

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
  return `<a href="${notice.url}" target="_blank" rel="noopener noreferrer">${label}</a>`
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
