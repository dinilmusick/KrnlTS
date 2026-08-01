import React, { useState } from 'react';

export interface KrnlCarouselProps {
  label?: string;
  items: any[];
}

export const KrnlCarousel: React.FC<KrnlCarouselProps> = ({
  label,
  items = []
}) => {
  const [index, setIndex] = useState(0);

  if (!items || items.length === 0) {
    return (
      <div className="krnl-form-group">
        {label && <label className="krnl-label">{label}</label>}
        <div className="krnl-carousel-empty">No items to display</div>
      </div>
    );
  }

  const prev = () => setIndex((i) => (i === 0 ? items.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === items.length - 1 ? 0 : i + 1));

  const current = items[index];

  return (
    <div className="krnl-form-group krnl-carousel">
      {label && <label className="krnl-label">{label}</label>}
      <div className="krnl-carousel-card">
        <div className="krnl-carousel-content">
          {typeof current === 'object' ? (
            <pre className="krnl-json-viewer">{JSON.stringify(current, null, 2)}</pre>
          ) : (
            <div>{String(current)}</div>
          )}
        </div>
        <div className="krnl-carousel-nav">
          <button type="button" className="krnl-btn krnl-btn-secondary" onClick={prev}>
            ◀ Prev
          </button>
          <span className="krnl-carousel-counter">
            {index + 1} / {items.length}
          </span>
          <button type="button" className="krnl-btn krnl-btn-secondary" onClick={next}>
            Next ▶
          </button>
        </div>
      </div>
    </div>
  );
};
