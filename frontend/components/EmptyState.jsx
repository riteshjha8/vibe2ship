"use client";
/**
 * EmptyState Component
 * 
 * Displays a beautiful, centered empty state with icon, message, and optional action.
 * Used when there's no data to display in a section.
 * 
 * @param {string} icon - Emoji or icon to display
 * @param {string} title - Empty state title
 * @param {string} [message] - Optional detailed message
 * @param {object} [action] - Optional action { label, onClick }
 * @example
 * <EmptyState 
 *   icon="✓"
 *   title="No tasks yet"
 *   message="Create your first task to get started"
 *   action={{ label: "Create Task", onClick: () => {} }}
 * />
 */
export default function EmptyState({ icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-6">
      <div className="text-4xl sm:text-5xl mb-3 sm:mb-4 opacity-60">{icon}</div>
      
      <h3 className="font-display text-base sm:text-lg font-semibold text-slate-300 mb-1 sm:mb-2 text-center">
        {title}
      </h3>
      
      {message && (
        <p className="text-xs sm:text-sm text-slate-500 text-center max-w-sm mb-4 sm:mb-6">
          {message}
        </p>
      )}
      
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg bg-gold-500 hover:bg-gold-600 text-slate-950 font-semibold text-xs sm:text-sm transition transform hover:scale-105 active:scale-95"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
