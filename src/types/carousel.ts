export interface CarouselItem {
  id: number;
  title: string;
  image: string;
  landing_page: string;
}

export interface CarouselState {
  currentIndex: number;
  isDragging: boolean;
  dragStartX: number;
  dragOffset: number;
  isAutoPlaying: boolean;
  isHovered: boolean;
  hasDragged: boolean;
}

export interface CarouselProps {
  items: CarouselItem[];
  autoSlideInterval?: number;
  cardWidth?: number;
  cardHeight?: number;
  viewportWidth?: number;
  minDragDistance?: number;
  size?: string; // e.g., "1/3" for 3 items, "1/2" for 2 items, "1/4" for 4 items
  spacing?: number; // Spacing between cards in pixels (default: 0)
}

export interface CarouselViewModel {
  state: CarouselState;
  goToSlide: (index: number) => void;
  nextSlide: () => void;
  prevSlide: () => void;
  handleDragStart: (x: number) => void;
  handleDragMove: (x: number) => void;
  handleDragEnd: () => void;
  toggleAutoPlay: (enable: boolean) => void;
  setHovered: (hovered: boolean) => void;
}
