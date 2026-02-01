interface CarouselDotsProps {
  totalSlides: number;
  currentSlide: number;
  onDotClick: (index: number) => void;
}

export function CarouselDots({
  totalSlides,
  currentSlide,
  onDotClick,
}: CarouselDotsProps) {
  if (totalSlides === 0) return null;

  return (
    <div className="hidden sm:flex absolute bottom-4 left-1/2 -translate-x-1/2 z-10 gap-2">
      {Array.from({ length: totalSlides }).map((_, index) => (
        <button
          key={index}
          onClick={() => onDotClick(index)}
          className={`w-2.5 h-2.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white ${
            index === currentSlide
              ? "bg-white w-8"
              : "bg-white/50 hover:bg-white/75"
          }`}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  );
}
