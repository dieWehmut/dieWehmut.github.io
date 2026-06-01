import type { SiteProfile } from '../../types/content'
import { siteConfig } from './config'

export const siteProfile: SiteProfile = {
  title: siteConfig.title,
  subtitle: siteConfig.subtitle,
  description: siteConfig.description,
  owner: siteConfig.owner,
  email: siteConfig.email,
  startedAt: siteConfig.startedAt,
  links: siteConfig.links,
}
