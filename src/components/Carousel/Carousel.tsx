import { useEffect, useMemo, useRef, useState } from "react";
import { useScreen } from "usehooks-ts";
import { CarouselProps } from "../../types/carousel";
import { useCarouselViewModel } from "./CarouselViewModel";
import { CarouselView } from "./CarouselView";
import { CarouselControls } from "./CarouselControls";
import { CarouselDots } from "./CarouselDots";

const DEFAULT_CARD_WIDTH = 300;
const DEFAULT_VIEWPORT_WIDTH = 750;
const DEFAULT_MIN_DRAG_DISTANCE = 40;
const DEFAULT_SIZE = "1/3"; // Show 3 items by default
const DEFAULT_SPACING = 0; // No spacing by default

export function Carousel({
  items,
  autoSlideInterval = 3000,
  cardWidth,
  viewportWidth: propViewportWidth = DEFAULT_VIEWPORT_WIDTH,
  minDragDistance = DEFAULT_MIN_DRAG_DISTANCE,
  size: propSize = DEFAULT_SIZE,
  spacing = DEFAULT_SPACING,
}: CarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const screen = useScreen();

  // Calculate responsive size directly from screen width (no useEffect needed)
  const responsiveSize = useMemo(() => {
    if (cardWidth) {
      // If cardWidth is explicitly provided, use the prop size
      return propSize;
    }

    if (!screen?.width) {
      // Fallback to prop size if screen width not available yet
      return propSize;
    }

    const screenWidth = screen.width;
    if (screenWidth < 640) {
      // Mobile: show 1 item
      return "1/1";
    } else if (screenWidth < 768) {
      // Small tablet: show 1.5 items (use 2/3 to show partial next)
      return "2/3";
    } else if (screenWidth < 1024) {
      // Tablet: show 2 items
      return "1/2";
    } else {
      // Desktop: use provided size or default
      return propSize;
    }
  }, [screen?.width, propSize, cardWidth]);

  // Detect container width for card width calculation
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerWidth(width);
      }
    };

    // Initial update
    updateContainerWidth();

    // Use ResizeObserver for better performance
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updateContainerWidth);
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      if (resizeObserver && containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

  // Use container width if available, otherwise use prop viewportWidth
  const viewportWidth = containerWidth ?? propViewportWidth;
  const size = responsiveSize;

  // Calculate card width from size if not explicitly provided
  // Account for spacing between cards
  const calculatedCardWidth =
    cardWidth ??
    (() => {
      const [numerator, denominator] = size.split("/").map(Number);
      if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
        return DEFAULT_CARD_WIDTH;
      }
      // Calculate available width after accounting for spacing
      // If showing N items, there are (N-1) gaps between them
      const numberOfItems = denominator;
      const totalSpacing = spacing * (numberOfItems - 1);
      const availableWidth = viewportWidth - totalSpacing;
      return availableWidth / denominator;
    })();
  const viewModel = useCarouselViewModel(
    items,
    autoSlideInterval,
    minDragDistance,
  );
  const transitionTimeoutRef = useRef<number | null>(null);

  // Handle infinite loop transitions
  useEffect(() => {
    if (items.length === 0) return;

    const { currentIndex, isDragging, dragOffset } = viewModel.state;

    // Only handle transitions when not dragging and offset is reset
    if (!isDragging && dragOffset === 0) {
      // If we're at the last item and just moved forward, we need to check
      // if we need to jump to the duplicate at the end
      // This is handled by the ViewModel's nextSlide/prevSlide logic

      // Clean up any pending timeouts
      if (transitionTimeoutRef.current !== null) {
        clearTimeout(transitionTimeoutRef.current);
      }
    }
  }, [
    viewModel.state.currentIndex,
    viewModel.state.isDragging,
    viewModel.state.dragOffset,
    items.length,
  ]);

  // Handle hover state
  const handleMouseEnter = () => {
    viewModel.setHovered(true);
  };

  const handleMouseLeave = () => {
    viewModel.setHovered(false);
  };

  // Handle card click navigation
  const handleCardClick = (landingPage: string) => {
    // Click prevention is handled in CarouselCard component
    window.open(landingPage, "_blank", "noopener,noreferrer");
  };

  // Validate items
  if (items.length < 3) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-500">Carousel requires at least 3 items</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{
        margin: "0 auto",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <CarouselView
        items={items}
        currentIndex={viewModel.state.currentIndex}
        dragOffset={viewModel.state.dragOffset}
        isDragging={viewModel.state.isDragging}
        hasDragged={viewModel.state.hasDragged}
        onDragStart={viewModel.handleDragStart}
        onDragMove={viewModel.handleDragMove}
        onDragEnd={viewModel.handleDragEnd}
        onCardClick={handleCardClick}
        cardWidth={calculatedCardWidth}
        size={size}
        spacing={spacing}
        viewportWidth={viewportWidth}
      />
      <CarouselControls
        onPrev={viewModel.prevSlide}
        onNext={viewModel.nextSlide}
      />
      <CarouselDots
        totalSlides={items.length}
        currentSlide={viewModel.state.currentIndex}
        onDotClick={viewModel.goToSlide}
      />
    </div>
  );
}
