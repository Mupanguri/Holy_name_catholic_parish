// Oak Tree Types
// Copy this file to: components/oak-tree/types.ts

export interface Page {
  id: string
  title: string
  branch: string // Must match one of the branch IDs: "sections" | "choir" | "committees" | "support-teams" | "adult-guilds" | "youth-guilds"
  slug: string
  level: number // 1 = main page (grows branch), 2+ = subpage (grows leaf)
}

export interface OakTreeProps {
  /** Array of pages to display on the tree */
  pages?: Page[]
  /** Callback when a page/leaf is clicked */
  onPageClick?: (page: Page) => void
  /** Season affects colors - "auto" uses current date */
  season?: "spring" | "summer" | "autumn" | "winter" | "auto"
  /** Show falling snow effect (defaults to true in winter) */
  showSnow?: boolean
  /** Additional CSS classes */
  className?: string
}

export interface BranchConfig {
  id: string
  label: string
  side: "left" | "right"
  arcStart: { x: number; y: number }
  arcControl1: { x: number; y: number }
  arcControl2: { x: number; y: number }
  arcEnd: { x: number; y: number }
  labelPos: { x: number; y: number }
  color: string
  colorLight: string
  colorDark: string
  description: string
}

export interface SeasonalPalette {
  leaves: string[]
  canopyMain: string
  canopyLight: string
  canopyDark: string
  bark: string
  barkLight: string
  barkDark: string
  leafOpacity: number
}

export type Season = "spring" | "summer" | "autumn" | "winter"
