# Oak Tree Component - Usage Guide

A beautiful animated oak tree that visualizes your community/organization's page hierarchy.

## Installation

1. **Copy the folder** - Copy the entire `oak-tree` folder to your `components` directory

2. **Add CSS animations** - Add the contents of `oak-tree.css` to your `globals.css`:

```css
/* Add to your globals.css */
@keyframes leaf-grow {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes branch-grow {
  0% { stroke-dasharray: 0 1000; opacity: 0; }
  100% { stroke-dasharray: 1000 0; opacity: 1; }
}

@keyframes snowfall {
  0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
  10% { opacity: 0.8; }
  90% { opacity: 0.8; }
  100% { transform: translateY(600px) rotate(360deg); opacity: 0; }
}

.animate-leaf-grow {
  animation: leaf-grow 0.6s ease-out forwards;
  transform-origin: center;
}

.animate-branch-grow {
  animation: branch-grow 0.8s ease-out forwards;
}

.animate-snowfall {
  animation: snowfall linear infinite;
}
```

3. **Install dependencies** (if not already installed):
```bash
npm install lucide-react
```

## Basic Usage

```tsx
import { OakTree } from "@/components/oak-tree"
import type { Page } from "@/components/oak-tree"

export default function CommunitiesPage() {
  const pages: Page[] = [
    // Main pages (level 1) - grow as sub-branches
    { id: "1", title: "Men's Guild", branch: "adult-guilds", slug: "mens-guild", level: 1 },
    { id: "2", title: "Women's Guild", branch: "adult-guilds", slug: "womens-guild", level: 1 },
    
    // Subpages (level 2+) - appear as leaves
    { id: "3", title: "Monthly Meeting", branch: "adult-guilds", slug: "mens-guild/meetings", level: 2 },
    { id: "4", title: "Events", branch: "adult-guilds", slug: "mens-guild/events", level: 2 },
  ]

  const handlePageClick = (page: Page) => {
    // Navigate to the page
    router.push(`/communities/${page.slug}`)
  }

  return (
    <OakTree 
      pages={pages} 
      onPageClick={handlePageClick}
      season="auto" // or "spring" | "summer" | "autumn" | "winter"
      showSnow={false} // optional, defaults to true in winter
    />
  )
}
```

## Available Branch IDs

The tree has 6 main branches (3 on each side). Use these IDs in your page data:

| Branch ID | Label | Side | Color |
|-----------|-------|------|-------|
| `sections` | Sections | Left | Teal |
| `choir` | Choir | Left | Purple |
| `committees` | Committees | Left | Green |
| `support-teams` | Support Teams | Right | Coral |
| `adult-guilds` | Adult Guilds | Right | Gold |
| `youth-guilds` | Youth Guilds | Right | Orange |

## Page Data Structure

```ts
interface Page {
  id: string        // Unique identifier
  title: string     // Display name
  branch: string    // One of the 6 branch IDs above
  slug: string      // URL slug for navigation
  level: number     // 1 = main page (branch), 2+ = subpage (leaf)
}
```

## Customizing Branches

To change the branch labels, colors, or descriptions, edit the `BRANCH_CONFIG` array in `index.tsx`:

```ts
const BRANCH_CONFIG: BranchConfig[] = [
  { 
    id: "sections", 
    label: "Your Label",  // Change this
    side: "left",
    // ... arc coordinates
    color: "#1B5E7A",     // Main color
    colorLight: "#2E8AAB", // Highlight color
    colorDark: "#0D3D4F", // Shadow color
    description: "Your description"
  },
  // ... more branches
]
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pages` | `Page[]` | `[]` | Array of pages to display |
| `onPageClick` | `(page: Page) => void` | - | Callback when a page/leaf is clicked |
| `season` | `"spring" \| "summer" \| "autumn" \| "winter" \| "auto"` | `"auto"` | Season affects colors |
| `showSnow` | `boolean` | `true` in winter | Show falling snow effect |
| `className` | `string` | - | Additional CSS classes |

## How It Works

1. **Adding a main page (level 1)** - Grows a sub-branch on the corresponding main branch
2. **Adding a subpage (level 2+)** - Grows a leaf in the canopy with the branch's color
3. **Clicking a branch** - Opens an info card showing all pages in that branch
4. **Clicking a leaf** - Triggers the `onPageClick` callback
5. **Seasonal changes** - Colors automatically adjust based on season
