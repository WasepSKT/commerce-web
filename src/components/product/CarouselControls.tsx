/**
 * Carousel navigation controls component
 */

interface CarouselControlsProps {
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  brandColor?: string;
}

export default function CarouselControls({
  onPrev,
  onNext,
  canPrev,
  canNext,
  brandColor = '#7A1316',
}: CarouselControlsProps) {
  return (
    <>
      <button
        aria-label="Previous"
        onClick={onPrev}
        disabled={!canPrev}
        className={`absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full shadow-md flex items-center justify-center ${!canPrev ? 'opacity-40 cursor-not-allowed' : ''
          }`}
        style={{ background: '#ffffff' }}
      >
        <svg className="w-4 h-4" style={{ color: brandColor }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        aria-label="Next"
        onClick={onNext}
        disabled={!canNext}
        className={`absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full shadow-md flex items-center justify-center ${!canNext ? 'opacity-40 cursor-not-allowed' : ''
          }`}
        style={{ background: '#ffffff' }}
      >
        <svg className="w-4 h-4" style={{ color: brandColor }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
    </>
  );
}

