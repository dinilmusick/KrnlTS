import React from 'react';
export function KrnlCarousel({ items, renderItem }: any) {
  if (!items || !items.length) return <div className="krnl-empty">No items available</div>;
  return (
    <div className="krnl-carousel">
      {items.map((item: any, idx: number) => (
        <div key={idx} className="krnl-carousel-item">
          {renderItem ? renderItem(item) : JSON.stringify(item)}
        </div>
      ))}
    </div>
  );
}