interface CarouselControlsProps {
  onPrev: () => void;
  onNext: () => void;
}

export function CarouselControls({ onPrev, onNext }: CarouselControlsProps) {
  return (
    <>
      {/* Previous button with expanded hit area */}
      <button
        onClick={onPrev}
        className="absolute left-0 top-0 bottom-0 w-1/4 sm:w-auto sm:left-2 z-10 flex items-center justify-start sm:justify-center sm:top-1/2 sm:-translate-y-1/2 sm:bottom-auto focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Previous slide"
      >
        {/* Visible button icon - centered in hit area on mobile, positioned on desktop */}
        <div className="ml-2 sm:ml-0 bg-white/80 hover:bg-white rounded-full p-3 shadow-lg transition-all hover:scale-110 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <svg
            className="w-6 h-6 text-gray-800"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </div>
      </button>

      {/* Next button with expanded hit area */}
      <button
        onClick={onNext}
        className="absolute right-0 top-0 bottom-0 w-1/4 sm:w-auto sm:right-2 z-10 flex items-center justify-end sm:justify-center sm:top-1/2 sm:-translate-y-1/2 sm:bottom-auto focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Next slide"
      >
        {/* Visible button icon - centered in hit area on mobile, positioned on desktop */}
        <div className="mr-2 sm:mr-0 bg-white/80 hover:bg-white rounded-full p-3 shadow-lg transition-all hover:scale-110 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <svg
            className="w-6 h-6 text-gray-800"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </button>
    </>
  );
}
