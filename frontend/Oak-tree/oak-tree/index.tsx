"use client"

/**
 * Oak Tree Community Visualization Component
 * 
 * A beautiful animated oak tree that visualizes your church/organization's page hierarchy.
 * - Main pages (level 1) grow as sub-branches on the 6 main colored branches
 * - Subpages (level 2+) appear as leaves in the canopy
 * - Seasonal effects (spring/summer/autumn/winter) with automatic detection
 * - Snow effect for winter season
 * 
 * INSTALLATION:
 * 1. Copy this folder (oak-tree) to your components directory
 * 2. Add the CSS from oak-tree.css to your globals.css
 * 3. Import and use: <OakTree pages={pages} onPageClick={handleClick} />
 * 
 * DEPENDENCIES:
 * - React 18+
 * - Tailwind CSS
 * - lucide-react (for X icon in card)
 * - A cn() utility function (or replace with clsx/classnames)
 */

import { useEffect, useState, useMemo, useCallback } from "react"
import { X } from "lucide-react"
import type { Page, OakTreeProps, BranchConfig, SeasonalPalette, Season } from "./types"

// Simple cn utility - replace with your own or use clsx
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

// Seasonal color palettes
const SEASONAL_PALETTES: Record<Season, SeasonalPalette> = {
  spring: {
    leaves: ["#7cb342", "#8bc34a", "#9ccc65", "#aed581", "#c5e1a5"],
    canopyMain: "#689f38",
    canopyLight: "#8bc34a",
    canopyDark: "#558b2f",
    bark: "#5d4037",
    barkLight: "#795548",
    barkDark: "#3e2723",
    leafOpacity: 0.92,
  },
  summer: {
    leaves: ["#2e7d32", "#388e3c", "#43a047", "#4caf50", "#66bb6a"],
    canopyMain: "#2e7d32",
    canopyLight: "#43a047",
    canopyDark: "#1b5e20",
    bark: "#5d4037",
    barkLight: "#6d4c41",
    barkDark: "#3e2723",
    leafOpacity: 1,
  },
  autumn: {
    leaves: ["#e65100", "#ef6c00", "#f57c00", "#ff8f00", "#ffa000", "#bf360c", "#d84315", "#8d6e63"],
    canopyMain: "#e65100",
    canopyLight: "#ff8f00",
    canopyDark: "#bf360c",
    bark: "#5d4037",
    barkLight: "#6d4c41",
    barkDark: "#3e2723",
    leafOpacity: 0.88,
  },
  winter: {
    leaves: ["#90a4ae", "#b0bec5", "#cfd8dc", "#eceff1"],
    canopyMain: "#78909c",
    canopyLight: "#90a4ae",
    canopyDark: "#546e7a",
    bark: "#5d4037",
    barkLight: "#6d4c41",
    barkDark: "#4e342e",
    leafOpacity: 0.5,
  },
}

function getCurrentSeason(): Season {
  const month = new Date().getMonth()
  // Adjust for Southern Hemisphere if needed
  if ([8, 9, 10].includes(month)) return "spring"
  if ([11, 0, 1].includes(month)) return "summer"
  if ([2, 3, 4].includes(month)) return "autumn"
  return "winter"
}

// 6 main branches - 3 on left side, 3 on right side
// You can customize these labels and colors for your organization
const BRANCH_CONFIG: BranchConfig[] = [
  // LEFT SIDE
  { 
    id: "sections", 
    label: "Sections", 
    side: "left",
    arcStart: { x: 175, y: 300 },
    arcControl1: { x: 100, y: 260 },
    arcControl2: { x: 60, y: 180 },
    arcEnd: { x: 75, y: 120 },
    labelPos: { x: 15, y: 470 },
    color: "#1B5E7A",
    colorLight: "#2E8AAB",
    colorDark: "#0D3D4F",
    description: "Main church sections and departments"
  },
  { 
    id: "choir", 
    label: "Choir", 
    side: "left",
    arcStart: { x: 172, y: 320 },
    arcControl1: { x: 95, y: 290 },
    arcControl2: { x: 55, y: 230 },
    arcEnd: { x: 50, y: 175 },
    labelPos: { x: 15, y: 485 },
    color: "#7B4B94",
    colorLight: "#9B6BB4",
    colorDark: "#5A2B74",
    description: "Music ministry and choir groups"
  },
  { 
    id: "committees", 
    label: "Committees", 
    side: "left",
    arcStart: { x: 168, y: 340 },
    arcControl1: { x: 100, y: 330 },
    arcControl2: { x: 70, y: 280 },
    arcEnd: { x: 60, y: 230 },
    labelPos: { x: 15, y: 500 },
    color: "#2D7D46",
    colorLight: "#4D9D66",
    colorDark: "#1D5D36",
    description: "Church committees and boards"
  },
  // RIGHT SIDE
  { 
    id: "support-teams", 
    label: "Support Teams", 
    side: "right",
    arcStart: { x: 225, y: 300 },
    arcControl1: { x: 300, y: 260 },
    arcControl2: { x: 340, y: 180 },
    arcEnd: { x: 325, y: 120 },
    labelPos: { x: 385, y: 470 },
    color: "#C75B39",
    colorLight: "#E77B59",
    colorDark: "#A73B19",
    description: "Volunteer and support ministries"
  },
  { 
    id: "adult-guilds", 
    label: "Adult Guilds", 
    side: "right",
    arcStart: { x: 228, y: 320 },
    arcControl1: { x: 305, y: 290 },
    arcControl2: { x: 345, y: 230 },
    arcEnd: { x: 350, y: 175 },
    labelPos: { x: 385, y: 485 },
    color: "#8B6914",
    colorLight: "#AB8934",
    colorDark: "#6B4904",
    description: "Adult fellowship and guild groups"
  },
  { 
    id: "youth-guilds", 
    label: "Youth Guilds", 
    side: "right",
    arcStart: { x: 232, y: 340 },
    arcControl1: { x: 300, y: 330 },
    arcControl2: { x: 330, y: 280 },
    arcEnd: { x: 340, y: 230 },
    labelPos: { x: 385, y: 500 },
    color: "#D4851E",
    colorLight: "#F4A53E",
    colorDark: "#B4650E",
    description: "Youth ministry and youth guilds"
  },
]

// Snowflake component
function Snowflake({ delay, x, duration, size }: { delay: number; x: number; duration: number; size: number }) {
  return (
    <circle
      cx={x}
      cy={-10}
      r={size}
      fill="white"
      opacity={0.8}
      className="animate-snowfall"
      style={{
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    />
  )
}

// Oak Leaf SVG
function OakLeaf({
  x,
  y,
  color,
  rotation = 0,
  scale = 1,
  opacity = 1,
  title,
  onClick,
  isNew = false,
  delay = 0,
}: {
  x: number
  y: number
  color: string
  rotation?: number
  scale?: number
  opacity?: number
  title: string
  onClick?: () => void
  isNew?: boolean
  delay?: number
}) {
  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scale})`}
      className={cn(
        "cursor-pointer transition-all duration-300 hover:scale-110 origin-center",
        isNew && "animate-leaf-grow"
      )}
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
    >
      <path
        d={`
          M0,-12
          C2,-10 4,-8 3,-6
          C5,-5 6,-3 5,-1
          C7,0 7,2 5,3
          C6,5 5,7 3,7
          C3,9 2,11 0,12
          C-2,11 -3,9 -3,7
          C-5,7 -6,5 -5,3
          C-7,2 -7,0 -5,-1
          C-6,-3 -5,-5 -3,-6
          C-4,-8 -2,-10 0,-12
          Z
        `}
        fill={color}
        opacity={opacity}
        stroke={color}
        strokeWidth="0.5"
      />
      <line x1="0" y1="-10" x2="0" y2="10" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />
      <title>{title}</title>
    </g>
  )
}

// Arc Branch with thick tapered shape
function ArcBranch({
  start,
  control1,
  control2,
  end,
  color,
  colorLight,
  colorDark,
  startThickness,
  endThickness,
  isNew = false,
  delay = 0,
  onClick,
  isHovered = false,
}: {
  start: { x: number; y: number }
  control1: { x: number; y: number }
  control2: { x: number; y: number }
  end: { x: number; y: number }
  color: string
  colorLight: string
  colorDark: string
  startThickness: number
  endThickness: number
  isNew?: boolean
  delay?: number
  onClick?: () => void
  isHovered?: boolean
}) {
  const getPerp = (p1: { x: number; y: number }, p2: { x: number; y: number }, thickness: number) => {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const len = Math.sqrt(dx * dx + dy * dy)
    return { x: (-dy / len) * thickness, y: (dx / len) * thickness }
  }

  const perpStart = getPerp(start, control1, startThickness)
  const perpMid = getPerp(control1, control2, (startThickness + endThickness) / 2)
  const perpEnd = getPerp(control2, end, endThickness)

  return (
    <g 
      className={cn(
        "cursor-pointer transition-all duration-300",
        isNew && "animate-branch-grow"
      )} 
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
    >
      {isHovered && (
        <path
          d={`M${start.x},${start.y} C${control1.x},${control1.y} ${control2.x},${control2.y} ${end.x},${end.y}`}
          fill="none"
          stroke={colorLight}
          strokeWidth={startThickness * 2.5}
          strokeLinecap="round"
          opacity={0.35}
          filter="blur(6px)"
        />
      )}
      
      <path
        d={`
          M${start.x + perpStart.x},${start.y + perpStart.y}
          C${control1.x + perpMid.x},${control1.y + perpMid.y} 
           ${control2.x + perpEnd.x * 0.7},${control2.y + perpEnd.y * 0.7} 
           ${end.x + perpEnd.x * 0.5},${end.y + perpEnd.y * 0.5}
          L${end.x - perpEnd.x * 0.5},${end.y - perpEnd.y * 0.5}
          C${control2.x - perpEnd.x * 0.7},${control2.y - perpEnd.y * 0.7} 
           ${control1.x - perpMid.x},${control1.y - perpMid.y} 
           ${start.x - perpStart.x},${start.y - perpStart.y}
          Z
        `}
        fill={color}
      />
      
      <path
        d={`
          M${start.x + perpStart.x * 0.7},${start.y + perpStart.y * 0.7}
          C${control1.x + perpMid.x * 0.6},${control1.y + perpMid.y * 0.6} 
           ${control2.x + perpEnd.x * 0.5},${control2.y + perpEnd.y * 0.5} 
           ${end.x + perpEnd.x * 0.3},${end.y + perpEnd.y * 0.3}
        `}
        fill="none"
        stroke={colorLight}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      
      <path
        d={`M${start.x},${start.y} C${control1.x},${control1.y} ${control2.x},${control2.y} ${end.x},${end.y}`}
        fill="none"
        stroke={colorDark}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />
      
      <path
        d={`
          M${start.x - perpStart.x * 0.5},${start.y - perpStart.y * 0.5}
          C${control1.x - perpMid.x * 0.4},${control1.y - perpMid.y * 0.4} 
           ${control2.x - perpEnd.x * 0.3},${control2.y - perpEnd.y * 0.3} 
           ${end.x - perpEnd.x * 0.2},${end.y - perpEnd.y * 0.2}
        `}
        fill="none"
        stroke={colorDark}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.25"
      />
    </g>
  )
}

// Sub-branch component
function SubBranch({
  startX,
  startY,
  angle,
  length,
  color,
  colorLight,
  colorDark,
  isNew = false,
  delay = 0,
}: {
  startX: number
  startY: number
  angle: number
  length: number
  color: string
  colorLight: string
  colorDark: string
  isNew?: boolean
  delay?: number
}) {
  const rad = (angle * Math.PI) / 180
  const endX = startX + Math.cos(rad) * length
  const endY = startY - Math.sin(rad) * length
  const midX = (startX + endX) / 2 + Math.sin(rad) * (length * 0.1)
  const midY = (startY + endY) / 2 - Math.cos(rad) * (length * 0.08)

  return (
    <g className={cn(isNew && "animate-branch-grow")} style={{ animationDelay: `${delay}ms` }}>
      <path d={`M${startX},${startY} Q${midX},${midY} ${endX},${endY}`} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <path d={`M${startX},${startY} Q${midX},${midY} ${endX},${endY}`} fill="none" stroke={colorLight} strokeWidth="2" strokeLinecap="round" opacity="0.4" transform="translate(-1, -1)" />
      <path d={`M${startX},${startY} Q${midX},${midY} ${endX},${endY}`} fill="none" stroke={colorDark} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" transform="translate(1, 1)" />
    </g>
  )
}

// Branch Info Card
function BranchInfoCard({
  branch,
  pages,
  onClose,
  onPageClick,
  palette,
}: {
  branch: BranchConfig
  pages: Page[]
  onClose: () => void
  onPageClick?: (page: Page) => void
  palette: SeasonalPalette
}) {
  const mainPages = pages.filter(p => p.level === 1)
  const subPages = pages.filter(p => p.level >= 2)

  return (
    <div 
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-80 max-w-[90vw]"
      style={{ filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.3))" }}
    >
      <div className="rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <div className="p-4 text-white" style={{ backgroundColor: branch.color }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">{branch.label}</h3>
              <p className="text-sm opacity-90 mt-0.5">{branch.description}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex gap-4 mt-3 pt-3 border-t border-white/20">
            <div className="text-center">
              <div className="text-2xl font-bold">{mainPages.length}</div>
              <div className="text-xs opacity-75">Pages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{subPages.length}</div>
              <div className="text-xs opacity-75">Subpages</div>
            </div>
          </div>
        </div>
        
        <div className="p-4 max-h-64 overflow-y-auto">
          {mainPages.length === 0 && subPages.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              No pages in this branch yet. Add a page to grow this branch!
            </p>
          ) : (
            <div className="space-y-3">
              {mainPages.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pages (Branches)</h4>
                  <ul className="space-y-1.5">
                    {mainPages.map(page => (
                      <li key={page.id}>
                        <button
                          onClick={() => onPageClick?.(page)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 group"
                        >
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: branch.color }} />
                          <span className="text-sm font-medium">{page.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {subPages.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Subpages (Leaves)</h4>
                  <ul className="space-y-1">
                    {subPages.map((page, idx) => (
                      <li key={page.id}>
                        <button
                          onClick={() => onPageClick?.(page)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 group"
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" className="flex-shrink-0">
                            <path
                              d="M6,0 C7,1 8,2.5 7.5,4 C9,3.5 10,4 10.5,5 C10,6 9,6.5 7.5,6.5 C8,8 7.5,9.5 6,10.5 C4.5,9.5 4,8 4.5,6.5 C3,6.5 2,6 1.5,5 C2,4 3,3.5 4.5,4 C4,2.5 5,1 6,0 Z"
                              fill={palette.leaves[idx % palette.leaves.length]}
                            />
                          </svg>
                          <span className="text-sm text-gray-600 dark:text-gray-400">{page.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Main Oak Tree Component
export function OakTree({
  pages = [],
  onPageClick,
  season = "auto",
  showSnow,
  className,
}: OakTreeProps) {
  const [mounted, setMounted] = useState(false)
  const [newItems, setNewItems] = useState<Set<string>>(new Set())
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
  const [hoveredBranch, setHoveredBranch] = useState<string | null>(null)

  const currentSeason = season === "auto" ? getCurrentSeason() : season
  const palette = SEASONAL_PALETTES[currentSeason]
  const isSnowing = showSnow ?? currentSeason === "winter"

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const pageIds = new Set(pages.map((p) => p.id))
    setNewItems(pageIds)
    const timer = setTimeout(() => setNewItems(new Set()), 1000)
    return () => clearTimeout(timer)
  }, [pages.length])

  const pagesByBranch = useMemo(() => {
    const grouped: Record<string, Page[]> = {}
    pages.forEach((page) => {
      if (!grouped[page.branch]) grouped[page.branch] = []
      grouped[page.branch].push(page)
    })
    return grouped
  }, [pages])

  const mainPages = pages.filter((p) => p.level === 1)
  const subPages = pages.filter((p) => p.level >= 2)

  const snowflakes = useMemo(() => {
    if (!isSnowing) return []
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: 50 + Math.random() * 300,
      delay: Math.random() * 8,
      duration: 4 + Math.random() * 4,
      size: 1 + Math.random() * 2,
    }))
  }, [isSnowing])

  const handlePageClick = useCallback((page: Page) => {
    onPageClick?.(page)
  }, [onPageClick])

  const handleBranchClick = useCallback((branchId: string) => {
    setSelectedBranch(prev => prev === branchId ? null : branchId)
  }, [])

  if (!mounted) return null

  const selectedBranchConfig = selectedBranch ? BRANCH_CONFIG.find(b => b.id === selectedBranch) : null

  const getBezierPoint = (t: number, p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }) => {
    const u = 1 - t
    return {
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    }
  }

  return (
    <div className={cn("relative w-full max-w-3xl mx-auto", className)}>
      {/* Season Badge */}
      <div className="absolute top-4 left-4 z-10">
        <span className="px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-lg" style={{ backgroundColor: palette.canopyDark }}>
          {currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)}
        </span>
      </div>

      {/* Stats */}
      <div className="absolute top-4 right-4 z-10 text-right space-y-1">
        <div className="text-sm text-gray-500"><span className="font-bold text-gray-900 dark:text-white">{mainPages.length}</span> branches</div>
        <div className="text-sm text-gray-500"><span className="font-bold text-gray-900 dark:text-white">{subPages.length}</span> leaves</div>
      </div>

      {/* Branch Info Card */}
      {selectedBranchConfig && (
        <>
          <div className="absolute inset-0 z-40 bg-black/20 backdrop-blur-[2px] rounded-2xl" onClick={() => setSelectedBranch(null)} />
          <BranchInfoCard
            branch={selectedBranchConfig}
            pages={pagesByBranch[selectedBranchConfig.id] || []}
            onClose={() => setSelectedBranch(null)}
            onPageClick={handlePageClick}
            palette={palette}
          />
        </>
      )}

      {/* Main SVG */}
      <svg viewBox="0 0 400 600" className="w-full h-auto" style={{ minHeight: 550 }}>
        <defs>
          <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={palette.barkDark} />
            <stop offset="30%" stopColor={palette.bark} />
            <stop offset="70%" stopColor={palette.barkLight} />
            <stop offset="100%" stopColor={palette.barkDark} />
          </linearGradient>
          
          <linearGradient id="tapRootGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={palette.bark} />
            <stop offset="60%" stopColor={palette.barkDark} />
            <stop offset="100%" stopColor={palette.barkDark} stopOpacity="0" />
          </linearGradient>
          
          <linearGradient id="sideRootGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor={palette.bark} stopOpacity="0.8" />
            <stop offset="100%" stopColor={palette.barkDark} stopOpacity="0" />
          </linearGradient>

          <linearGradient id="soilGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8B7355" />
            <stop offset="50%" stopColor="#6B5344" />
            <stop offset="100%" stopColor="#4A3728" />
          </linearGradient>
          
          <pattern id="sandTexture" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.8" fill="#A89070" opacity="0.3" />
            <circle cx="5" cy="3" r="0.6" fill="#C4A882" opacity="0.25" />
            <circle cx="3" cy="6" r="0.7" fill="#9A8060" opacity="0.3" />
            <circle cx="7" cy="5" r="0.5" fill="#B8A070" opacity="0.2" />
          </pattern>
          
          <pattern id="rockTexture" x="0" y="0" width="20" height="15" patternUnits="userSpaceOnUse">
            <ellipse cx="5" cy="5" rx="4" ry="3" fill="#7A6B5A" opacity="0.4" />
            <ellipse cx="15" cy="10" rx="3" ry="2.5" fill="#6A5B4A" opacity="0.35" />
            <ellipse cx="10" cy="3" rx="2" ry="1.5" fill="#8A7B6A" opacity="0.3" />
          </pattern>

          <radialGradient id="canopyGrad1" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor={palette.canopyLight} />
            <stop offset="100%" stopColor={palette.canopyMain} />
          </radialGradient>
          <radialGradient id="canopyGrad2" cx="30%" cy="50%" r="50%">
            <stop offset="0%" stopColor={palette.canopyMain} />
            <stop offset="100%" stopColor={palette.canopyDark} />
          </radialGradient>
          <radialGradient id="canopyGrad3" cx="70%" cy="50%" r="50%">
            <stop offset="0%" stopColor={palette.canopyLight} />
            <stop offset="100%" stopColor={palette.canopyMain} />
          </radialGradient>
        </defs>

        {/* SOIL AND GROUND */}
        <rect x="0" y="510" width="400" height="90" fill="url(#soilGrad)" />
        <rect x="0" y="510" width="400" height="90" fill="url(#sandTexture)" />
        <rect x="0" y="520" width="400" height="80" fill="url(#rockTexture)" />
        
        {/* Surface rocks */}
        <ellipse cx="80" cy="525" rx="18" ry="10" fill="#7D6E5D" />
        <ellipse cx="82" cy="523" rx="15" ry="7" fill="#8D7E6D" />
        <ellipse cx="320" cy="530" rx="22" ry="12" fill="#6D5E4D" />
        <ellipse cx="318" cy="527" rx="18" ry="8" fill="#7D6E5D" />
        <ellipse cx="150" cy="535" rx="12" ry="7" fill="#8D7E6D" />
        <ellipse cx="260" cy="540" rx="15" ry="8" fill="#7D6E5D" />
        <ellipse cx="55" cy="545" rx="10" ry="6" fill="#6D5E4D" />
        <ellipse cx="350" cy="550" rx="14" ry="7" fill="#8D7E6D" />
        
        {/* Pebbles */}
        <circle cx="120" cy="520" r="4" fill="#9D8E7D" />
        <circle cx="280" cy="518" r="3" fill="#8D7E6D" />
        <circle cx="180" cy="525" r="3.5" fill="#7D6E5D" />
        <circle cx="220" cy="522" r="2.5" fill="#9D8E7D" />

        <ellipse cx="200" cy="520" rx="80" ry="15" fill="rgba(0,0,0,0.2)" />
        <ellipse cx="200" cy="512" rx="100" ry="8" fill="#5D6B3D" opacity="0.4" />

        {/* ROOT SYSTEM */}
        <path d="M200,515 Q200,545 198,570 Q197,590 200,600" fill="none" stroke="url(#tapRootGrad)" strokeWidth="28" strokeLinecap="round" />
        <path d="M193,520 Q192,545 191,570 Q190,590 193,600" fill="none" stroke={palette.barkLight} strokeWidth="4" strokeLinecap="round" opacity="0.3" />
        
        <path d="M185,525 Q140,540 80,560 Q40,575 10,600" fill="none" stroke="url(#sideRootGrad)" strokeWidth="12" strokeLinecap="round" />
        <path d="M175,535 Q130,555 90,575 Q60,590 40,600" fill="none" stroke="url(#sideRootGrad)" strokeWidth="8" strokeLinecap="round" />
        <path d="M180,545 Q150,560 120,580 Q100,592 85,600" fill="none" stroke="url(#sideRootGrad)" strokeWidth="6" strokeLinecap="round" />
        
        <path d="M215,525 Q260,540 320,560 Q360,575 390,600" fill="none" stroke="url(#sideRootGrad)" strokeWidth="12" strokeLinecap="round" />
        <path d="M225,535 Q270,555 310,575 Q340,590 360,600" fill="none" stroke="url(#sideRootGrad)" strokeWidth="8" strokeLinecap="round" />
        <path d="M220,545 Q250,560 280,580 Q300,592 315,600" fill="none" stroke="url(#sideRootGrad)" strokeWidth="6" strokeLinecap="round" />
        
        <path d="M170,550 Q135,565 100,590" fill="none" stroke={palette.barkDark} strokeWidth="2" opacity="0.3" />
        <path d="M230,550 Q265,565 300,590" fill="none" stroke={palette.barkDark} strokeWidth="2" opacity="0.3" />
        <path d="M160,560 Q120,580 80,600" fill="none" stroke={palette.barkDark} strokeWidth="1.5" opacity="0.2" />
        <path d="M240,560 Q280,580 320,600" fill="none" stroke={palette.barkDark} strokeWidth="1.5" opacity="0.2" />

        {/* MAIN TRUNK */}
        <path d="M155,520 Q148,440 165,380 Q170,340 175,300 L225,300 Q230,340 235,380 Q252,440 245,520 Z" fill="url(#trunkGrad)" />

        {/* Trunk bark texture */}
        <path d="M165,510 Q162,440 170,370 Q168,330 175,305" stroke={palette.barkDark} strokeWidth="2" fill="none" opacity="0.4" />
        <path d="M185,515 Q183,450 188,390 Q185,345 190,305" stroke={palette.barkDark} strokeWidth="1.5" fill="none" opacity="0.3" />
        <path d="M215,515 Q217,450 212,390 Q215,345 210,305" stroke={palette.barkDark} strokeWidth="1.5" fill="none" opacity="0.3" />
        <path d="M235,510 Q238,440 230,370 Q232,330 225,305" stroke={palette.barkDark} strokeWidth="2" fill="none" opacity="0.4" />
        
        {/* Knot holes */}
        <ellipse cx="180" cy="420" rx="5" ry="8" fill={palette.barkDark} opacity="0.6" />
        <ellipse cx="215" cy="380" rx="4" ry="6" fill={palette.barkDark} opacity="0.5" />
        <ellipse cx="190" cy="470" rx="3" ry="5" fill={palette.barkDark} opacity="0.4" />

        {/* Surface roots */}
        <path d="M155,515 Q130,520 100,518" fill="none" stroke={palette.bark} strokeWidth="10" strokeLinecap="round" />
        <path d="M160,518 Q145,525 120,528" fill="none" stroke={palette.bark} strokeWidth="6" strokeLinecap="round" />
        <path d="M245,515 Q270,520 300,518" fill="none" stroke={palette.bark} strokeWidth="10" strokeLinecap="round" />
        <path d="M240,518 Q255,525 280,528" fill="none" stroke={palette.bark} strokeWidth="6" strokeLinecap="round" />

        {/* MAIN BRANCHES */}
        {BRANCH_CONFIG.map((branchConfig, idx) => {
          const branchPages = pagesByBranch[branchConfig.id] || []
          const mainBranchPages = branchPages.filter((p) => p.level === 1)
          const hasPages = mainBranchPages.length > 0
          
          const baseThickness = hasPages ? 16 : 10
          const endThickness = hasPages ? 6 : 4
          const isHovered = hoveredBranch === branchConfig.id

          return (
            <g key={branchConfig.id} onMouseEnter={() => setHoveredBranch(branchConfig.id)} onMouseLeave={() => setHoveredBranch(null)}>
              <ArcBranch
                start={branchConfig.arcStart}
                control1={branchConfig.arcControl1}
                control2={branchConfig.arcControl2}
                end={branchConfig.arcEnd}
                color={branchConfig.color}
                colorLight={branchConfig.colorLight}
                colorDark={branchConfig.colorDark}
                startThickness={baseThickness}
                endThickness={endThickness}
                isNew={mainBranchPages.some((p) => newItems.has(p.id))}
                delay={idx * 80}
                onClick={() => handleBranchClick(branchConfig.id)}
                isHovered={isHovered}
              />

              {mainBranchPages.map((page, pageIdx) => {
                const t = 0.3 + (pageIdx * 0.2)
                const point = getBezierPoint(t, branchConfig.arcStart, branchConfig.arcControl1, branchConfig.arcControl2, branchConfig.arcEnd)
                const subLength = 18 + Math.random() * 10
                const baseAngle = branchConfig.side === "left" ? 140 : 40
                const subAngle = baseAngle + (pageIdx - 1) * 20

                return (
                  <SubBranch
                    key={page.id}
                    startX={point.x}
                    startY={point.y}
                    angle={subAngle}
                    length={subLength}
                    color={branchConfig.color}
                    colorLight={branchConfig.colorLight}
                    colorDark={branchConfig.colorDark}
                    isNew={newItems.has(page.id)}
                    delay={idx * 80 + pageIdx * 50}
                  />
                )
              })}
            </g>
          )
        })}

        {/* CANOPY */}
        <ellipse cx="200" cy="175" rx="175" ry="150" fill="url(#canopyGrad1)" opacity={palette.leafOpacity * 0.75} />
        <ellipse cx="90" cy="180" rx="100" ry="95" fill="url(#canopyGrad2)" opacity={palette.leafOpacity * 0.8} />
        <ellipse cx="310" cy="175" rx="100" ry="90" fill="url(#canopyGrad3)" opacity={palette.leafOpacity * 0.8} />
        <ellipse cx="200" cy="130" rx="140" ry="100" fill="url(#canopyGrad1)" opacity={palette.leafOpacity * 0.85} />
        <ellipse cx="130" cy="155" rx="85" ry="75" fill="url(#canopyGrad2)" opacity={palette.leafOpacity * 0.78} />
        <ellipse cx="270" cy="150" rx="90" ry="78" fill="url(#canopyGrad3)" opacity={palette.leafOpacity * 0.78} />
        <ellipse cx="200" cy="85" rx="95" ry="65" fill="url(#canopyGrad1)" opacity={palette.leafOpacity * 0.9} />
        <ellipse cx="155" cy="105" rx="65" ry="55" fill="url(#canopyGrad2)" opacity={palette.leafOpacity * 0.72} />
        <ellipse cx="250" cy="100" rx="70" ry="58" fill="url(#canopyGrad3)" opacity={palette.leafOpacity * 0.72} />
        <ellipse cx="65" cy="165" rx="55" ry="65" fill="url(#canopyGrad2)" opacity={palette.leafOpacity * 0.65} />
        <ellipse cx="335" cy="160" rx="58" ry="68" fill="url(#canopyGrad3)" opacity={palette.leafOpacity * 0.65} />
        <ellipse cx="55" cy="210" rx="50" ry="55" fill="url(#canopyGrad2)" opacity={palette.leafOpacity * 0.55} />
        <ellipse cx="345" cy="205" rx="52" ry="58" fill="url(#canopyGrad3)" opacity={palette.leafOpacity * 0.55} />

        {/* Snow on canopy */}
        {isSnowing && (
          <>
            <ellipse cx="200" cy="70" rx="65" ry="20" fill="rgba(255,255,255,0.7)" />
            <ellipse cx="140" cy="110" rx="50" ry="15" fill="rgba(255,255,255,0.6)" />
            <ellipse cx="260" cy="105" rx="55" ry="16" fill="rgba(255,255,255,0.6)" />
            <ellipse cx="200" cy="115" rx="80" ry="18" fill="rgba(255,255,255,0.5)" />
            <ellipse cx="100" cy="175" rx="35" ry="12" fill="rgba(255,255,255,0.5)" />
            <ellipse cx="300" cy="170" rx="40" ry="13" fill="rgba(255,255,255,0.5)" />
          </>
        )}

        {/* Falling snowflakes */}
        {isSnowing && snowflakes.map((flake) => (
          <Snowflake key={flake.id} x={flake.x} delay={flake.delay} duration={flake.duration} size={flake.size} />
        ))}

        {/* Leaves for subpages */}
        {subPages.map((page, index) => {
          const branchConfig = BRANCH_CONFIG.find(b => b.id === page.branch)
          const leafColor = branchConfig ? branchConfig.colorLight : palette.leaves[index % palette.leaves.length]
          const goldenAngle = index * 137.508
          const rad = (goldenAngle * Math.PI) / 180
          const ring = Math.floor(index / 8)
          const radius = 35 + ring * 20 + (index % 8) * 5
          const x = 200 + Math.cos(rad) * radius
          const y = 150 + Math.sin(rad) * radius * 0.55
          const rotation = Math.random() * 360
          const scale = 0.8 + Math.random() * 0.4

          return (
            <OakLeaf
              key={page.id}
              x={x}
              y={y}
              color={leafColor}
              rotation={rotation}
              scale={scale}
              opacity={palette.leafOpacity * 0.9}
              title={page.title}
              onClick={() => handlePageClick(page)}
              isNew={newItems.has(page.id)}
              delay={index * 40}
            />
          )
        })}

        {/* LABELS WITH TRACE LINES */}
        {BRANCH_CONFIG.map((branchConfig) => {
          const isLeft = branchConfig.side === "left"
          const branchPoint = {
            x: branchConfig.arcStart.x + (isLeft ? -15 : 15),
            y: branchConfig.arcStart.y - 10
          }
          
          return (
            <g key={`label-${branchConfig.id}`}>
              <path
                d={`M${branchConfig.labelPos.x + (isLeft ? 50 : -50)},${branchConfig.labelPos.y - 4} Q${isLeft ? branchConfig.labelPos.x + 80 : branchConfig.labelPos.x - 80},${(branchConfig.labelPos.y + branchPoint.y) / 2} ${branchPoint.x},${branchPoint.y}`}
                fill="none"
                stroke={branchConfig.color}
                strokeWidth="0.5"
                opacity="0.18"
              />
              
              <circle cx={branchPoint.x} cy={branchPoint.y} r="2" fill={branchConfig.color} opacity="0.25" />
              
              <text
                x={branchConfig.labelPos.x}
                y={branchConfig.labelPos.y}
                fill={branchConfig.color}
                fontSize="10"
                fontWeight="600"
                textAnchor={isLeft ? "start" : "end"}
                className="cursor-pointer select-none hover:opacity-80 transition-opacity"
                onClick={() => handleBranchClick(branchConfig.id)}
              >
                {branchConfig.label}
              </text>
              
              <circle
                cx={isLeft ? branchConfig.labelPos.x - 6 : branchConfig.labelPos.x + 6}
                cy={branchConfig.labelPos.y - 3}
                r="3"
                fill={branchConfig.color}
                opacity="0.7"
                className="cursor-pointer"
                onClick={() => handleBranchClick(branchConfig.id)}
              />
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// Re-export types
export type { Page, OakTreeProps, BranchConfig, SeasonalPalette, Season }
