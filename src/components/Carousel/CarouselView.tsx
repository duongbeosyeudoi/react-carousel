import { useRef, useEffect, useState, useMemo } from "react";
import { CarouselItem } from "../../types/carousel";
import { CarouselCard } from "./CarouselCard";

interface CarouselViewProps {
  items: CarouselItem[];
  currentIndex: number;
  dragOffset: number;
  isDragging: boolean;
  hasDragged: boolean;
  onDragStart: (x: number) => void;
  onDragMove: (x: number) => void;
  onDragEnd: () => void;
  onCardClick: (landingPage: string) => void;
  cardWidth: number;
  size: string;
  spacing: number;
  viewportWidth: number;
}

export function CarouselView({
  items,
  currentIndex,
  dragOffset,
  isDragging,
  hasDragged,
  onDragStart,
  onDragMove,
  onDragEnd,
  onCardClick,
  cardWidth,
  size,
  spacing,
  viewportWidth,
}: CarouselViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const isMouseDownRef = useRef(false);
  const [disableTransition, setDisableTransition] = useState(false);
  const prevIndexRef = useRef(currentIndex);

  // Create duplicated items for infinite loop
  const duplicatedItems =
    items.length > 0 ? [items[items.length - 1], ...items, items[0]] : [];

  // Calculate which images should be loaded based on visibility
  // Preload current + adjacent images (1 on each side) for smooth transitions
  const getShouldLoadImage = useMemo(() => {
    if (items.length === 0) return () => false;

    // Calculate how many cards fit in viewport (with some buffer for smooth transitions)
    const cardWithSpacing = cardWidth + spacing;
    const cardsInViewport = Math.ceil(viewportWidth / cardWithSpacing);
    // Preload 1 extra card on each side for smooth transitions
    const preloadBuffer = 1;

    return (index: number): boolean => {
      // The display index is currentIndex + 1 (because duplicate at start)
      const displayIndex = currentIndex + 1;

      // Calculate distance from current position
      const distanceFromCurrent = Math.abs(index - displayIndex);

      // Load images that are visible or within preload buffer
      const maxDistance = cardsInViewport + preloadBuffer;

      return distanceFromCurrent <= maxDistance;
    };
  }, [items.length, currentIndex, cardWidth, spacing, viewportWidth]);

  // Calculate transform offset
  const getTransform = () => {
    if (items.length === 0) return "translateX(0px)";

    // Calculate the total width of one card including spacing
    // CSS gap handles spacing between cards, so we need to account for it
    const cardWithSpacing = cardWidth + spacing;

    // To position the current card at the start of the visible area:
    // - We have a duplicate at index 0
    // - Real cards start at index 1
    // - Offset = -(currentIndex + 1) * cardWithSpacing to position current card at viewport start
    // - The gap CSS property will automatically add spacing between cards
    const baseOffset = -(currentIndex + 1) * cardWithSpacing;
    // Add drag offset for smooth dragging
    const totalOffset = baseOffset + dragOffset;

    return `translateX(${totalOffset}px)`;
  };

  // Handle mouse/touch start
  const handleStart = (clientX: number) => {
    isMouseDownRef.current = true;
    onDragStart(clientX);
  };

  // Handle mouse/touch move
  const handleMove = (clientX: number) => {
    if (isMouseDownRef.current) {
      onDragMove(clientX);
    }
  };

  // Handle mouse/touch end
  const handleEnd = () => {
    if (isMouseDownRef.current) {
      isMouseDownRef.current = false;
      onDragEnd();
    }
  };

  // Mouse event handlers
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      handleStart(e.clientX);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isMouseDownRef.current) {
        e.preventDefault();
        handleMove(e.clientX);
      }
    };

    const handleMouseUp = () => {
      handleEnd();
    };

    const handleMouseLeave = () => {
      if (isMouseDownRef.current) {
        handleEnd();
      }
    };

    container.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [onDragStart, onDragMove, onDragEnd]);

  // Touch event handlers
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        handleStart(touch.clientX);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isMouseDownRef.current) {
        e.preventDefault();
        const touch = e.touches[0];
        if (touch) {
          handleMove(touch.clientX);
        }
      }
    };

    const handleTouchEnd = () => {
      handleEnd();
    };

    container.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [onDragStart, onDragMove, onDragEnd]);

  // Handle infinite loop seamless transitions
  useEffect(() => {
    if (items.length === 0 || isDragging || dragOffset !== 0) return;

    const prevIndex = prevIndexRef.current;
    const slideContainer = slideContainerRef.current;

    if (!slideContainer) return;

    // Check if we need to jump (when transitioning from last to first or first to last)
    const jumpedFromLastToFirst =
      prevIndex === items.length - 1 && currentIndex === 0;
    const jumpedFromFirstToLast =
      prevIndex === 0 && currentIndex === items.length - 1;

    if (jumpedFromLastToFirst || jumpedFromFirstToLast) {
      // Disable transition temporarily for seamless jump
      setDisableTransition(true);

      // Use requestAnimationFrame to ensure the jump happens after render
      requestAnimationFrame(() => {
        // The transform will be recalculated, creating seamless loop
        setDisableTransition(false);
      });
    }

    prevIndexRef.current = currentIndex;
  }, [currentIndex, isDragging, dragOffset, items.length]);

  if (items.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center">
        <p className="text-gray-500">No items to display</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-[300px] sm:h-[300px] overflow-hidden relative"
      style={{
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      <div
        ref={slideContainerRef}
        className="flex h-full transition-transform duration-300 ease-out"
        style={{
          transform: getTransform(),
          transitionDuration: isDragging || disableTransition ? "0ms" : "300ms",
          gap: `${spacing}px`,
        }}
      >
        {duplicatedItems.map((item, index) => (
          <CarouselCard
            key={`${item.id}-${index}`}
            item={item}
            isDragging={isDragging}
            hasDragged={hasDragged}
            onClick={() => {
              onCardClick(item.landing_page);
            }}
            size={size}
            cardWidth={cardWidth}
            shouldLoad={getShouldLoadImage(index)}
          />
        ))}
      </div>
    </div>
  );
}
