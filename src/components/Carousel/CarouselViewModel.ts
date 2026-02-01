import { useState, useCallback, useRef, useEffect } from "react";
import {
  CarouselState,
  CarouselItem,
  CarouselViewModel as ICarouselViewModel,
} from "../../types/carousel";

const AUTO_SLIDE_INTERVAL = 3000;
const MIN_DRAG_DISTANCE = 40;

export function useCarouselViewModel(
  items: CarouselItem[],
  autoSlideInterval: number = AUTO_SLIDE_INTERVAL,
  minDragDistance: number = MIN_DRAG_DISTANCE,
): ICarouselViewModel {
  const [state, setState] = useState<CarouselState>({
    currentIndex: 0,
    isDragging: false,
    dragStartX: 0,
    dragOffset: 0,
    isAutoPlaying: true,
    isHovered: false,
    hasDragged: false,
  });

  const autoSlideTimerRef = useRef<number | null>(null);
  const totalItems = items.length;
  const nextSlideRef = useRef<() => void>(() => {});

  // Navigate to a specific slide
  const goToSlide = useCallback(
    (index: number) => {
      if (totalItems === 0) return;
      const normalizedIndex = ((index % totalItems) + totalItems) % totalItems;
      setState((prev) => ({
        ...prev,
        currentIndex: normalizedIndex,
        dragOffset: 0,
      }));
    },
    [totalItems],
  );

  // Move to next slide
  const nextSlide = useCallback(() => {
    if (totalItems === 0) return;
    setState((prev) => {
      const nextIndex = (prev.currentIndex + 1) % totalItems;
      return {
        ...prev,
        currentIndex: nextIndex,
        dragOffset: 0,
      };
    });
  }, [totalItems]);

  // Ref to access latest nextSlide in interval

  // Keep nextSlide ref up to date
  useEffect(() => {
    nextSlideRef.current = nextSlide;
  }, [nextSlide]);

  // Move to previous slide
  const prevSlide = useCallback(() => {
    if (totalItems === 0) return;
    setState((prev) => {
      const prevIndex = (prev.currentIndex - 1 + totalItems) % totalItems;
      return {
        ...prev,
        currentIndex: prevIndex,
        dragOffset: 0,
      };
    });
  }, [totalItems]);

  // Initialize drag
  const handleDragStart = useCallback((x: number) => {
    setState((prev) => ({
      ...prev,
      isDragging: true,
      dragStartX: x,
      dragOffset: 0,
      hasDragged: false,
      isAutoPlaying: false, // Pause auto-play during drag
    }));
  }, []);

  // Update drag position
  const handleDragMove = useCallback((x: number) => {
    setState((prev) => {
      if (!prev.isDragging) return prev;
      const offset = x - prev.dragStartX;
      // Mark as dragged if movement exceeds 5px threshold
      const hasDragged = Math.abs(offset) > 5;
      return {
        ...prev,
        dragOffset: offset,
        hasDragged: prev.hasDragged || hasDragged,
      };
    });
  }, []);

  // Complete drag and determine if slide should change
  const handleDragEnd = useCallback(() => {
    setState((prev) => {
      if (!prev.isDragging) return prev;

      const dragDistance = Math.abs(prev.dragOffset);
      let newIndex = prev.currentIndex;
      const hadDragged = prev.hasDragged;

      // Only change slide if drag distance exceeds threshold
      if (dragDistance >= minDragDistance) {
        if (prev.dragOffset > 0) {
          // Dragged right, go to previous slide
          newIndex = (prev.currentIndex - 1 + totalItems) % totalItems;
        } else {
          // Dragged left, go to next slide
          newIndex = (prev.currentIndex + 1) % totalItems;
        }
      }

      // Reset hasDragged after a short delay to prevent accidental clicks
      if (hadDragged) {
        setTimeout(() => {
          setState((current) => ({
            ...current,
            hasDragged: false,
          }));
        }, 100);
      }

      return {
        ...prev,
        isDragging: false,
        dragOffset: 0,
        currentIndex: newIndex,
        // Resume auto-play if not hovered
        isAutoPlaying: !prev.isHovered,
      };
    });
  }, [minDragDistance, totalItems]);

  // Toggle auto-play
  const toggleAutoPlay = useCallback((enable: boolean) => {
    setState((prev) => {
      // Don't enable if hovered or dragging
      const shouldPlay = enable && !prev.isHovered && !prev.isDragging;
      return {
        ...prev,
        isAutoPlaying: shouldPlay,
      };
    });
  }, []);

  // Set hover state
  const setHovered = useCallback((hovered: boolean) => {
    setState((prev) => ({
      ...prev,
      isHovered: hovered,
      // When hover ends, resume auto-play (unless dragging)
      isAutoPlaying: hovered ? false : !prev.isDragging,
    }));
  }, []);

  // Auto-slide effect
  useEffect(() => {
    if (totalItems === 0) return;

    // Clear any existing timer first
    if (autoSlideTimerRef.current !== null) {
      clearInterval(autoSlideTimerRef.current);
      autoSlideTimerRef.current = null;
    }

    // Start timer if conditions are met
    if (state.isAutoPlaying && !state.isDragging && !state.isHovered) {
      autoSlideTimerRef.current = window.setInterval(() => {
        // Use ref to avoid stale closure
        nextSlideRef.current();
      }, autoSlideInterval);
    }

    // Cleanup on unmount or when conditions change
    return () => {
      if (autoSlideTimerRef.current !== null) {
        clearInterval(autoSlideTimerRef.current);
        autoSlideTimerRef.current = null;
      }
    };
  }, [
    state.isAutoPlaying,
    state.isDragging,
    state.isHovered,
    autoSlideInterval,
    totalItems,
  ]);

  return {
    state,
    goToSlide,
    nextSlide,
    prevSlide,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    toggleAutoPlay,
    setHovered,
  };
}
