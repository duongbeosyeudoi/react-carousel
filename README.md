# Carousel Component

A reusable carousel (slider) component built with React, TypeScript, and Tailwind CSS. Features drag/swipe interactions, auto-slide, infinite looping, and follows Flux architecture.

## Features

- 🎯 Drag and swipe support for desktop and mobile
- ⏱️ Auto-slide every 3 seconds (pauses on hover)
- 🔄 Infinite looping with seamless transitions
- 🖱️ Click cards to navigate to landing pages
- 📍 Progress dots and navigation controls (hidden on mobile)
- 📱 Fully responsive design with automatic breakpoint detection
- 🎨 Smooth animations and transitions
- 📐 Configurable item display size (`size` prop)
- 📏 Adjustable spacing between cards (`spacing` prop)
- 👆 Mobile-optimized touch targets (44px minimum)

## Installation & Running Locally

### Prerequisites

- Node.js (v19 or higher recommended)
- npm or yarn package manager

### Install Dependencies

```bash
pnpm install
```

### Run Development Server

```bash
pnpm run dev
```

The application will start on `http://localhost:5173` (or the next available port).

### Build for Production

```bash
pnpm run build
```

The production build will be generated in the `dist` directory.

### Preview Production Build

```bash
pnpm run preview
```

## Project Structure

```
carousel/
├── src/
│   ├── components/
│   │   └── Carousel/
│   │       ├── Carousel.tsx           # Main container component (orchestrates View + ViewModel)
│   │       ├── CarouselView.tsx        # View layer - handles rendering and DOM events
│   │       ├── CarouselViewModel.ts    # ViewModel + Model - state management and business logic
│   │       ├── CarouselCard.tsx        # Individual card component
│   │       ├── CarouselControls.tsx    # Prev/Next navigation buttons
│   │       ├── CarouselDots.tsx        # Progress indicator dots
│   │       └── index.ts                # Public exports
│   ├── types/
│   │   └── carousel.ts                 # TypeScript type definitions
│   ├── styles/
│   │   └── index.css                   # Global styles and Tailwind imports
│   ├── App.tsx                         # Demo application with sample data
│   └── main.tsx                        # Application entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

### Architecture Overview

The component follows **Flux architecture** with clear separation of concerns:

- **View Layer** (`CarouselView.tsx`, `CarouselCard.tsx`, `CarouselControls.tsx`, `CarouselDots.tsx`):

  - Handles rendering and user interactions
  - Dispatches actions to ViewModel
  - Receives state updates from ViewModel

- **ViewModel + Model Layer** (`CarouselViewModel.ts`):

  - Manages all state (current index, drag state, auto-play state)
  - Contains business logic (slide navigation, drag calculations)
  - Handles side effects (auto-slide timers, hover pause)

- **Main Component** (`Carousel.tsx`):
  - Connects View and ViewModel layers
  - Manages component lifecycle
  - Handles prop validation and configuration

## Drag & Swipe Implementation

### Mouse Drag (Desktop)

The drag interaction is implemented using native mouse events:

1. **`mousedown`**: Captures the initial mouse position (`clientX`) and sets `isDragging` to `true`
2. **`mousemove`**: Calculates the drag offset (`currentX - startX`) and updates the carousel position in real-time
3. **`mouseup`**: Determines if the drag distance exceeds the threshold (40px) and triggers slide change if needed
4. **`mouseleave`**: Handles edge case where mouse leaves the carousel area during drag

**Key Implementation Details:**

- Mouse events are attached to the document for `mousemove` and `mouseup` to ensure drag continues even if cursor leaves the carousel
- `preventDefault()` is called to prevent text selection and other default browser behaviors
- Drag offset is applied directly to CSS `transform` for smooth, GPU-accelerated movement

```typescript
// Simplified drag flow
handleMouseDown → set dragStartX, isDragging = true
handleMouseMove → calculate dragOffset = currentX - dragStartX
handleMouseUp → if |dragOffset| >= 40px → change slide
```

### Touch Swipe (Mobile)

Touch interactions use touch events with similar logic:

1. **`touchstart`**: Captures initial touch position from `touches[0].clientX`
2. **`touchmove`**: Updates drag offset, prevents default scrolling with `preventDefault()`
3. **`touchend`**: Completes the swipe and determines slide change
4. **`touchcancel`**: Handles interruption (e.g., incoming call) by ending the drag

**Key Implementation Details:**

- Touch events use `{ passive: false }` to allow `preventDefault()` and prevent page scrolling
- Only the first touch point (`touches[0]`) is tracked (single-finger swipe)
- Same 40px threshold applies for touch swipes

```typescript
// Unified handler approach
const handleStart = (clientX: number) => { /* ... */ }
const handleMove = (clientX: number) => { /* ... */ }
const handleEnd = () => { /* ... */ }

// Both mouse and touch events call the same handlers
mouseDown → handleStart(e.clientX)
touchStart → handleStart(e.touches[0].clientX)
```

### Transform-Based Positioning

The carousel uses CSS `transform: translateX()` for positioning, which provides:

- **GPU acceleration**: Transforms are handled by the GPU for smooth 60fps animations
- **No layout reflow**: Transforms don't trigger layout calculations
- **Smooth transitions**: CSS transitions handle animation between slides

```typescript
const getTransform = () => {
  // Account for spacing between cards
  const cardWithSpacing = cardWidth + spacing;
  const baseOffset = -(currentIndex + 1) * cardWithSpacing;
  const totalOffset = baseOffset + dragOffset;
  return `translateX(${totalOffset}px)`;
};
```

### Responsive Screen Detection

The carousel uses the `useScreen` hook from `usehooks-ts` to detect screen dimensions:

- **Automatic breakpoint detection**: No manual window resize listeners needed
- **Efficient updates**: Hook handles resize events internally

```typescript
import { useScreen } from "usehooks-ts";

const screen = useScreen();
// screen.width automatically updates on resize
```

## Edge Case Handling

### Infinite Loop

The infinite loop creates a seamless experience when reaching the first or last slide.

**Implementation Strategy:**

1. **Duplicate Slides**: The carousel renders `[lastItem, ...items, firstItem]` to create visual continuity
2. **Index Mapping**: The ViewModel maintains a `currentIndex` (0 to items.length-1) while the View renders with offset
3. **Seamless Transitions**: When transitioning from last→first or first→last, transitions are temporarily disabled to prevent visible jumps

```typescript
// Duplicate items for infinite loop
const duplicatedItems = [items[items.length - 1], ...items, items[0]];

// Transform calculation accounts for duplicate at start
const baseOffset = -(currentIndex + 1) * cardWidth;
```

**How it works:**

- When at slide 0 and going backward, the duplicate last slide is shown, then instantly (no transition) jumps to the real last slide
- When at the last slide and going forward, the duplicate first slide is shown, then instantly jumps to the real first slide
- The `disableTransition` flag ensures these jumps happen without animation

### Preventing Clicks While Dragging

To prevent accidental navigation when users intend to drag:

1. **`hasDragged` Flag**: Tracks if any drag movement occurred (threshold: 5px)
2. **Click Prevention**: Card click handler checks `hasDragged` flag before navigating
3. **Delayed Reset**: After drag ends, `hasDragged` is reset after 100ms to allow queued click events to be ignored

```typescript
// In CarouselCard
const handleClick = () => {
  if (!isDragging && !hasDragged) {
    onClick(); // Only navigate if no drag occurred
  }
};

// In ViewModel
handleDragMove → if |offset| > 5px → set hasDragged = true
handleDragEnd → setTimeout(() => set hasDragged = false, 100)
```

### Pause on Hover

Auto-slide pauses when the user hovers over the carousel to allow interaction without interruption.

**Implementation:**

1. **Hover Detection**: `onMouseEnter` and `onMouseLeave` handlers on the carousel container
2. **State Management**: `isHovered` flag in ViewModel state
3. **Auto-Play Control**: Auto-slide timer checks `isHovered` and `isDragging` before advancing

```typescript
// Auto-slide effect
useEffect(() => {
  if (isAutoPlaying && !isDragging && !isHovered) {
    timer = setInterval(() => nextSlide(), 3000);
  } else {
    clearInterval(timer);
  }
}, [isAutoPlaying, isDragging, isHovered]);
```

**Edge Cases Handled:**

- **Drag during hover**: Auto-play is paused during drag, then resumes if not hovering
- **Rapid hover/unhover**: Timer cleanup prevents multiple timers from running
- **Component unmount**: Cleanup function ensures timer is cleared

### Minimum Drag Distance

The 40px minimum drag distance prevents accidental slide changes from small movements.

**Implementation:**

```typescript
handleDragEnd() {
  const dragDistance = Math.abs(dragOffset);
  if (dragDistance >= 40) {
    // Change slide
  } else {
    // Return to current slide (snap back)
  }
}
```

**Benefits:**

- Prevents accidental slides from minor cursor movements
- Provides visual feedback (drag offset) even if slide doesn't change
- Smooth snap-back animation if threshold not met

### Mouse Leave During Drag

If the mouse leaves the carousel area during a drag, the drag is properly completed:

```typescript
const handleMouseLeave = () => {
  if (isMouseDownRef.current) {
    handleEnd(); // Complete drag even if mouse leaves
  }
};
```

This ensures drags aren't "stuck" if the cursor accidentally leaves the component.

## Responsive Design & Mobile Optimization

### Automatic Responsive Breakpoints

The carousel automatically adjusts based on screen width using the `useScreen` hook:

- **Mobile** (< 640px): Shows 1 full item for optimal viewing
- **Small Tablet** (640-768px): Shows 1.5 items (partial next visible)
- **Tablet** (768-1024px): Shows 2 items
- **Desktop** (> 1024px): Uses the `size` prop (default: 3 items)

### Mobile Touch Optimizations

1. **Enhanced Touch Targets**:

   - Prev/Next buttons are minimum **44×44px** (Apple's recommended touch target size)
   - Expanded hit areas cover the entire leftmost/rightmost 25% of the viewport on mobile
   - Full-height clickable zones for easier tapping

2. **Hidden Progress Dots**:

   - Progress dots are hidden on mobile (`hidden sm:flex`)
   - Prevents accidental taps on small targets
   - Visible and interactive on desktop/tablet

3. **Responsive Spacing**:
   - Spacing between cards is automatically accounted for in width calculations
   - Cards fit perfectly within the viewport regardless of spacing value

### Size and Spacing Props

The `size` prop controls how many items are displayed:

- `"1/1"` - 1 item (full width)
- `"1/2"` - 2 items
- `"1/3"` - 3 items (default)
- `"1/4"` - 4 items
- `"2/3"` - Shows 1.5 items (useful for partial preview)

The `spacing` prop adds gaps between cards:

```tsx
// 16px spacing between cards
<Carousel items={items} size="1/3" spacing={16} />
```

Card width is automatically calculated to fit the specified number of items within the viewport, accounting for spacing.

## Usage

### Basic Usage

```tsx
import { Carousel } from "./components/Carousel";
import { CarouselItem } from "./types/carousel";

const items: CarouselItem[] = [
  {
    id: 1,
    title: "Slide 1",
    image: "https://example.com/image1.jpg",
    landing_page: "https://example.com/page1",
  },
  {
    id: 2,
    title: "Slide 2",
    image: "https://example.com/image2.jpg",
    landing_page: "https://example.com/page2",
  },
  // ... more items (minimum 3 required)
];

function App() {
  return <Carousel items={items} />;
}
```

### Advanced Usage

```tsx
// Show 3 items with spacing
<Carousel items={items} size="1/3" spacing={16} />

// Show 2 items
<Carousel items={items} size="1/2" spacing={24} />

// Custom card width and spacing
<Carousel items={items} cardWidth={250} spacing={20} />

// Custom auto-slide interval
<Carousel items={items} autoSlideInterval={5000} />

// Full customization
<Carousel
  items={items}
  size="1/4"
  spacing={16}
  autoSlideInterval={4000}
  viewportWidth={900}
  minDragDistance={50}
/>
```

### Responsive Behavior

The carousel automatically adjusts the number of visible items based on screen width:

- **Mobile** (< 640px): 1 item
- **Small Tablet** (640-768px): 1.5 items (shows partial next)
- **Tablet** (768-1024px): 2 items
- **Desktop** (> 1024px): Uses `size` prop (default: 3 items)

You can override this behavior by providing an explicit `cardWidth` prop.

## Component Props

| Prop                | Type             | Default      | Description                                                                                  |
| ------------------- | ---------------- | ------------ | -------------------------------------------------------------------------------------------- |
| `items`             | `CarouselItem[]` | **required** | Array of carousel items (minimum 3)                                                          |
| `autoSlideInterval` | `number`         | `3000`       | Auto-slide interval in milliseconds                                                          |
| `cardWidth`         | `number`         | `undefined`  | Width of each card in pixels (auto-calculated from `size` if not provided)                   |
| `cardHeight`        | `number`         | `300`        | Height of each card in pixels                                                                |
| `viewportWidth`     | `number`         | `750`        | Viewport width in pixels (used when container width not available)                           |
| `minDragDistance`   | `number`         | `40`         | Minimum drag distance to trigger slide change (px)                                           |
| `size`              | `string`         | `"1/3"`      | Fraction string controlling how many items to display (e.g., `"1/3"` = 3 items, `"1/2"` = 2) |
| `spacing`           | `number`         | `0`          | Spacing between cards in pixels                                                              |

## Requirements

- **Minimum 3 items** required for carousel to function
- Cards are **300×300px** each (configurable via `cardWidth` and `cardHeight`)
- Default viewport: **750×300px** (configurable via `viewportWidth`)
- Auto-slide interval: **3 seconds** (configurable via `autoSlideInterval`)
- Responsive breakpoints:
  - **Mobile** (< 640px): Shows 1 item (`size="1/1"`)
  - **Small Tablet** (640-768px): Shows 1.5 items (`size="2/3"`)
  - **Tablet** (768-1024px): Shows 2 items (`size="1/2"`)
  - **Desktop** (> 1024px): Uses provided `size` prop (default: `"1/3"` for 3 items)

## Technical Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **usehooks-ts** - Custom hooks (`useScreen` for responsive breakpoints)
- **No third-party carousel libraries** - Pure React implementation

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT
