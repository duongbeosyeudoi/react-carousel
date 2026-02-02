# Carousel Component - Developer Guide

Welcome! This guide will help you understand the carousel component codebase. Let's break it down step by step.

## 📋 Table of Contents

1. [High-Level Overview](#high-level-overview)
2. [Architecture Pattern](#architecture-pattern)
3. [File Structure & Responsibilities](#file-structure--responsibilities)
4. [Key Concepts Explained](#key-concepts-explained)
5. [Data Flow](#data-flow)
6. [Important Implementation Details](#important-implementation-details)
7. [How to Extend](#how-to-extend)

---

## High-Level Overview

This is a **reusable carousel component** that displays a horizontal list of cards. Key features:

- ✅ **Desktop**: Shows 2.5 cards (center card full-size, side cards smaller with 50% opacity)
- ✅ **Mobile**: Shows 1 full-width card
- ✅ **Drag/Swipe**: Users can drag on desktop or swipe on mobile
- ✅ **Auto-play**: Automatically slides every 3 seconds (pauses on hover)
- ✅ **Infinite Loop**: Seamlessly loops from last → first and first → last
- ✅ **Click Navigation**: Click cards to open landing pages

---

## Architecture Pattern

The component follows **Flux Architecture** with clear separation:

```
┌─────────────────────────────────────────┐
│         Carousel.tsx (Orchestrator)     │
│  - Connects View + ViewModel            │
│  - Handles props & configuration        │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼──────┐  ┌──────▼──────────┐
│   View      │  │   ViewModel     │
│   Layer     │  │   + Model       │
│             │  │                 │
│ - Rendering │  │ - State Mgmt    │
│ - DOM Events│  │ - Business Logic│
│ - UI        │  │ - Side Effects  │
└─────────────┘  └─────────────────┘
```

### Why Flux?

- **Separation of Concerns**: UI logic separate from business logic
- **Testability**: Easy to test ViewModel independently
- **Maintainability**: Clear responsibilities for each layer
- **Scalability**: Easy to add features without breaking existing code

---

## File Structure & Responsibilities

### 1. `Carousel.tsx` - Main Container Component

**Role**: Orchestrator that connects everything together

**Key Responsibilities**:

- ✅ Receives props from parent (`items`, `viewportWidth`, `spacing`, etc.)
- ✅ Calculates responsive card width based on screen size
- ✅ Detects container width using `ResizeObserver`
- ✅ Instantiates `useCarouselViewModel` hook (state management)
- ✅ Renders child components: `CarouselView`, `CarouselControls`, `CarouselDots`
- ✅ Handles hover events (pauses auto-play)

**Key Code Sections**:

```typescript
// Responsive size calculation
const responsiveSize = useMemo(() => {
  if (screenWidth < 640) return "1/1"; // Mobile: 1 card
  else if (screenWidth < 768) return "2/3"; // Tablet: 1.5 cards
  else if (screenWidth < 1024) return "1/2"; // Tablet: 2 cards
  else return propSize; // Desktop: use prop
}, [screen?.width]);

// Card width calculation for desktop (2.5 cards)
const calculatedCardWidth =
  cardWidth ??
  (() => {
    if (!isMobile) {
      // For 2.5 cards: viewportWidth = 2.5 * cardWidth + 1.5 * spacing
      const totalSpacing = spacing * 1.5;
      return (viewportWidth - totalSpacing) / 2.5;
    }
    // ... mobile calculation
  })();
```

---

### 2. `CarouselViewModel.ts` - State Management & Business Logic

**Role**: Manages all state and business logic (the "brain" of the carousel)

**Key State Properties**:

```typescript
interface CarouselState {
  currentIndex: number; // Which card is currently shown (0-based)
  isDragging: boolean; // Is user currently dragging?
  dragStartX: number; // X position when drag started
  dragOffset: number; // Current drag offset in pixels
  isAutoPlaying: boolean; // Should auto-slide be active?
  isHovered: boolean; // Is mouse hovering over carousel?
  hasDragged: boolean; // Did user drag (to prevent accidental clicks)?
}
```

**Key Functions**:

1. **`nextSlide()`**: Moves to next card (with modulo for infinite loop)
2. **`prevSlide()`**: Moves to previous card
3. **`goToSlide(index)`**: Jumps to specific card
4. **`handleDragStart(x)`**: Initializes drag (pauses auto-play)
5. **`handleDragMove(x)`**: Updates drag offset as user moves
6. **`handleDragEnd()`**: Completes drag, determines if slide should change

**Auto-Play Logic**:

```typescript
useEffect(() => {
  // Clear existing timer
  if (autoSlideTimerRef.current) {
    clearInterval(autoSlideTimerRef.current);
  }

  // Start timer if conditions met
  if (state.isAutoPlaying && !state.isDragging && !state.isHovered) {
    autoSlideTimerRef.current = window.setInterval(() => {
      nextSlideRef.current(); // Use ref to avoid stale closure
    }, autoSlideInterval);
  }

  return () => {
    // Cleanup on unmount
    if (autoSlideTimerRef.current) {
      clearInterval(autoSlideTimerRef.current);
    }
  };
}, [state.isAutoPlaying, state.isDragging, state.isHovered]);
```

**Why `nextSlideRef`?**

- Prevents stale closures in `setInterval`
- Ensures we always call the latest `nextSlide` function

---

### 3. `CarouselView.tsx` - View Layer (Rendering & DOM Events)

**Role**: Handles rendering and user interactions (mouse/touch events)

**Key Responsibilities**:

- ✅ Renders the carousel cards using `duplicatedItems` array
- ✅ Calculates CSS `transform` to position cards correctly
- ✅ Handles mouse/touch events for drag/swipe
- ✅ Manages seamless infinite loop transitions
- ✅ Determines which images to lazy-load

**Important Concepts**:

#### A. Duplicated Items Array

```typescript
// For infinite loop, we duplicate items:
const duplicatedItems = [
  items[items.length - 1], // Duplicate last at START
  ...items, // All real items
  items[0], // Duplicate first at END
  items[1] || items[0], // Duplicate second at END (for 2.5 card view)
];
```

**Why?** This allows seamless looping:

- When at last item → show duplicate first at end → then jump to real first
- When at first item → show duplicate last at start → then jump to real last

#### B. Transform Calculation (Desktop - Centered Layout)

```typescript
const getTransform = () => {
  const cardWithSpacing = cardWidth + spacing;

  // Position of current card's left edge in duplicated array
  let currentCardLeftPosition = (currentIndex + 1) * cardWithSpacing;

  // Center offset: move card left by (viewportWidth/2 - cardWidth/2)
  const centerOffset = viewportWidth / 2 - cardWidth / 2;

  // Final offset: position card, then center it
  const baseOffset = -currentCardLeftPosition + centerOffset;

  // Add drag offset for smooth dragging
  return `translateX(${baseOffset + dragOffset}px)`;
};
```

**Visual Explanation**:

```
Viewport: [    750px    ]
Cards:    [300px][300px][300px]...
          └─┘
          This card's left edge position

          Then we center it:
          [  ←centerOffset→  ]
          [     └─┘          ]
          Center card in viewport
```

#### C. Drag/Swipe Event Handlers

```typescript
// Mouse events
container.addEventListener("mousedown", handleMouseDown);
document.addEventListener("mousemove", handleMouseMove);
document.addEventListener("mouseup", handleMouseUp);

// Touch events (mobile)
container.addEventListener("touchstart", handleTouchStart);
container.addEventListener("touchmove", handleTouchMove);
container.addEventListener("touchend", handleTouchEnd);
```

**Flow**:

1. **Start**: Capture initial X position → call `onDragStart(x)`
2. **Move**: Calculate offset → call `onDragMove(x)` → update `dragOffset`
3. **End**: If offset > threshold → change slide → call `onDragEnd()`

#### D. Seamless Loop Transitions

```typescript
useEffect(() => {
  const jumpedFromLastToFirst =
    prevIndex === items.length - 1 && currentIndex === 0;
  const jumpedFromFirstToLast =
    prevIndex === 0 && currentIndex === items.length - 1;

  if (jumpedFromLastToFirst || jumpedFromFirstToLast) {
    // Temporarily disable transition for instant jump
    setDisableTransition(true);

    requestAnimationFrame(() => {
      // Re-enable after jump completes
      setDisableTransition(false);
    });
  }
}, [currentIndex]);
```

**Why?** When looping, we need to instantly jump to the duplicate item, then seamlessly transition to the real item.

---

### 4. `CarouselCard.tsx` - Individual Card Component

**Role**: Renders a single carousel card

**Key Features**:

- ✅ **Lazy Loading**: Uses `useIntersectionObserver` to load images only when visible
- ✅ **Scale & Opacity**: Desktop side cards are 85% scale and 50% opacity
- ✅ **Click Prevention**: Prevents navigation if user was dragging

**Key Code**:

```typescript
// Desktop side cards styling
const scale = isDesktop && !isCenter ? 0.85 : 1;
const opacity = isDesktop && !isCenter ? 0.5 : 1;

// Lazy loading
const { ref, isIntersecting } = useIntersectionObserver({
  threshold: 0.01,
  rootMargin: "50px", // Start loading 50px before visible
});

useEffect(() => {
  if (shouldLoad || isIntersecting) {
    setImageSrc(item.image); // Load image
  }
}, [shouldLoad, isIntersecting]);
```

---

### 5. `CarouselControls.tsx` - Navigation Buttons

**Role**: Renders Previous/Next buttons

**Key Features**:

- ✅ Large touch targets on mobile (44px minimum)
- ✅ Expanded hit area on mobile (25% of viewport width)
- ✅ Hidden on very small screens

---

### 6. `CarouselDots.tsx` - Progress Indicators

**Role**: Shows pagination dots

**Key Features**:

- ✅ Hidden on mobile (to avoid interference with touch)
- ✅ Clickable to jump to specific slide

---

## Key Concepts Explained

### 1. Infinite Loop Implementation

**Problem**: How to loop seamlessly without visible jumps?

**Solution**: Duplicate items at start and end, then use modulo arithmetic for logical index:

```typescript
// Logical index (what user sees)
currentIndex: 0, 1, 2, ..., items.length - 1

// Physical array (what we render)
[duplicateLast, item0, item1, ..., itemN, duplicateFirst, duplicateSecond]
     ↑                                    ↑
  Index 0                            Index N+1
```

**When looping**:

- Last → First: Show duplicate first at end → jump to real first
- First → Last: Show duplicate last at start → jump to real last

### 2. Drag vs Click Detection

**Problem**: How to distinguish between drag and click?

**Solution**: Track `hasDragged` flag:

```typescript
// In handleDragMove
const hasDragged = Math.abs(offset) > 5; // 5px threshold
setState((prev) => ({ ...prev, hasDragged: prev.hasDragged || hasDragged }));

// In handleDragEnd
if (hadDragged) {
  setTimeout(() => {
    setState((current) => ({ ...current, hasDragged: false }));
  }, 100); // Reset after 100ms
}

// In CarouselCard
const handleClick = () => {
  if (!isDragging && !hasDragged) {
    onClick(); // Only navigate if not dragging
  }
};
```

### 3. Responsive Card Width Calculation

**Desktop (2.5 cards)**:

```
viewportWidth = 2.5 × cardWidth + 1.5 × spacing
cardWidth = (viewportWidth - 1.5 × spacing) / 2.5
```

**Mobile (1 card)**:

```
cardWidth = viewportWidth (full width)
```

### 4. Centered Layout Transform

**Goal**: Center the current card, show 2.5 cards total

**Calculation**:

1. Find current card's left edge position: `(currentIndex + 1) × cardWithSpacing`
2. Calculate center offset: `viewportWidth / 2 - cardWidth / 2`
3. Apply transform: `translateX(-position + centerOffset)`

---

## Data Flow

### User Drags Card

```
1. User mousedown/touchstart
   ↓
2. CarouselView.handleStart(x)
   ↓
3. CarouselViewModel.handleDragStart(x)
   ↓
4. State updates: { isDragging: true, dragStartX: x }
   ↓
5. CarouselView re-renders with new dragOffset
   ↓
6. Transform updates: translateX(baseOffset + dragOffset)
   ↓
7. User mousemove/touchmove
   ↓
8. CarouselViewModel.handleDragMove(x)
   ↓
9. State updates: { dragOffset: x - dragStartX }
   ↓
10. User mouseup/touchend
    ↓
11. CarouselViewModel.handleDragEnd()
    ↓
12. If dragDistance > threshold:
    - Update currentIndex
    - Reset dragOffset
    ↓
13. CarouselView re-renders with new currentIndex
```

### Auto-Play Cycle

```
1. useEffect detects isAutoPlaying === true
   ↓
2. setInterval(() => nextSlideRef.current(), 3000)
   ↓
3. nextSlide() updates currentIndex
   ↓
4. CarouselView re-renders with new transform
   ↓
5. After 3 seconds, repeat
```

---

## Important Implementation Details

### 1. Why `useRef` for `nextSlide`?

```typescript
const nextSlideRef = useRef<() => void>(() => {});

useEffect(() => {
  nextSlideRef.current = nextSlide; // Always latest version
}, [nextSlide]);

// In setInterval
autoSlideTimerRef.current = window.setInterval(() => {
  nextSlideRef.current(); // Uses latest, not stale closure
}, autoSlideInterval);
```

**Problem**: `setInterval` captures the `nextSlide` function at creation time. If `nextSlide` changes, the interval still uses the old version.

**Solution**: Store latest version in `ref`, which doesn't trigger re-renders but always has current value.

### 2. Why `disableTransition`?

When looping, we need to:

1. Show duplicate item (with transition)
2. Instantly jump to real item (without transition)
3. Resume normal transitions

```typescript
style={{
  transitionDuration: disableTransition ? "0ms" : "300ms"
}}
```

### 3. Lazy Loading Strategy

```typescript
const getShouldLoadImage = useMemo(() => {
  return (index: number): boolean => {
    const displayIndex = currentIndex + 1;
    const distanceFromCurrent = Math.abs(index - displayIndex);
    const maxDistance = cardsInViewport + preloadBuffer; // +1 for smooth transitions
    return distanceFromCurrent <= maxDistance;
  };
}, [currentIndex, cardWidth, viewportWidth]);
```

**Strategy**: Load current card + adjacent cards (1 on each side) for smooth transitions.

---

## How to Extend

### Add a New Feature: Keyboard Navigation

1. **Add to ViewModel** (`CarouselViewModel.ts`):

```typescript
const handleKeyPress = useCallback(
  (key: string) => {
    if (key === "ArrowLeft") prevSlide();
    if (key === "ArrowRight") nextSlide();
  },
  [prevSlide, nextSlide]
);
```

2. **Add to View** (`CarouselView.tsx`):

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      onKeyPress(e.key);
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [onKeyPress]);
```

3. **Connect in Main** (`Carousel.tsx`):

```typescript
<CarouselView
  // ... existing props
  onKeyPress={viewModel.handleKeyPress}
/>
```

### Modify Card Styling

Edit `CarouselCard.tsx`:

- Change `scale` value (currently 0.85 for side cards)
- Change `opacity` value (currently 0.5 for side cards)
- Modify card layout/structure

### Change Auto-Play Behavior

Edit `CarouselViewModel.ts`:

- Modify `autoSlideInterval` default
- Change pause/resume logic
- Add pause on focus/blur

---

## Common Questions

### Q: Why duplicate items at start and end?

**A**: To create seamless infinite loop. When at last item, we show duplicate first at end, then instantly jump to real first (user doesn't see the jump).

### Q: Why use `transform: translateX()` instead of changing `left`?

**A**: `transform` is GPU-accelerated and doesn't trigger layout reflow, making animations smoother.

### Q: Why `hasDragged` with setTimeout?

**A**: To prevent accidental clicks after drag. We reset `hasDragged` after 100ms to allow normal clicks again.

### Q: How does responsive sizing work?

**A**: `useScreen` hook detects screen width, `useMemo` calculates responsive size, `ResizeObserver` tracks container width changes.
