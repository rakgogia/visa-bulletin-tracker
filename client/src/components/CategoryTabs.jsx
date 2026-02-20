import { CATEGORIES, CATEGORY_CONFIG } from '../config';

export default function CategoryTabs({ activeCategory, onSwitch }) {
  return (
    <div className="category-tabs">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          className={`tab-btn${cat === activeCategory ? ' active' : ''}`}
          onClick={() => onSwitch(cat)}
        >
          {CATEGORY_CONFIG[cat].label}
        </button>
      ))}
    </div>
  );
}
