import { useState, useEffect } from "react";
import { useIntersectionObserver } from "usehooks-ts";
import { CarouselItem } from "../../types/carousel";

interface CarouselCardProps {
  item: CarouselItem;
  isDragging: boolean;
  hasDragged: boolean;
  onClick: () => void;
  size: string;
  cardWidth: number;
  shouldLoad?: boolean; // Whether this image should be loaded
  isCenter?: boolean; // Whether this card is the center card (desktop)
  isDesktop?: boolean; // Whether we're on desktop
}

export function CarouselCard({
  item,
  isDragging,
  hasDragged,
  onClick,
  size,
  cardWidth,
  shouldLoad = true,
  isCenter = false,
  isDesktop = false,
}: CarouselCardProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(
    shouldLoad ? item.image : null,
  );
  const [isInView, setIsInView] = useState(shouldLoad);

  // Use Intersection Observer hook for lazy loading
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.01, // Trigger when any part is visible
    rootMargin: "50px", // Start loading 50px before entering viewport
    freezeOnceVisible: true, // Stop observing once visible
    initialIsIntersecting: shouldLoad, // If shouldLoad is true, consider it initially intersecting
  });

  // Load image when intersecting or if shouldLoad is true
  useEffect(() => {
    if (shouldLoad || isIntersecting) {
      setImageSrc(item.image);
      setIsInView(true);
    }
  }, [item.image, shouldLoad, isIntersecting]);

  const handleClick = () => {
    // Prevent navigation if user was dragging or has dragged
    if (!isDragging && !hasDragged) {
      onClick();
    }
  };

  // Calculate scale and opacity for desktop side cards
  const scale = isDesktop && !isCenter ? 0.85 : 1; // Side cards are 85% size
  const opacity = isDesktop && !isCenter ? 0.5 : 1; // Side cards have 50% opacity

  return (
    <div
      className="flex-shrink-0 cursor-pointer select-none"
      onClick={handleClick}
      style={{
        cursor: isDragging ? "grabbing" : "grab",
        width: `${cardWidth}px`,
        minWidth: `${cardWidth}px`,
        transform: `scale(${scale})`,
        opacity: opacity,
        transition: "transform 0.3s ease-out, opacity 0.3s ease-out",
        transformOrigin: "center center",
      }}
    >
      <div className="w-full h-full relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={item.title}
            className="w-full h-full object-cover"
            draggable={false}
            loading={shouldLoad ? "eager" : "lazy"}
          />
        ) : (
          <div
            ref={ref}
            className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center"
            aria-label={`Loading ${item.title}`}
          >
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        {isInView && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <h3 className="text-white font-semibold text-lg">{item.title}</h3>
          </div>
        )}
      </div>
    </div>
  );
}
