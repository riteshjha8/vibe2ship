"use client";
/**
 * LoadingSpinner Component
 * 
 * Beautiful, animated loading indicator with multiple variants.
 * Supports different sizes and text styles.
 * 
 * @param {string} [variant='ring'] - 'ring', 'dots', 'pulse', 'bars'
 * @param {string} [size='md'] - 'sm', 'md', 'lg'
 * @param {string} [text] - Optional loading text
 * @example
 * <LoadingSpinner variant="ring" size="md" text="Loading..." />
 */
export default function LoadingSpinner({ variant = "ring", size = "md", text = "" }) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      {/* Ring Spinner (default) */}
      {variant === "ring" && (
        <div className={`${sizeClasses[size]} relative`}>
          <div className="absolute inset-0 rounded-full border-2 border-slate-700/30"></div>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold-400 border-r-gold-300 animate-spin"></div>
        </div>
      )}

      {/* Dots Spinner */}
      {variant === "dots" && (
        <div className="flex gap-1.5 items-center justify-center">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`${size === "sm" ? "w-1.5 h-1.5" : size === "lg" ? "w-3 h-3" : "w-2 h-2"} rounded-full bg-gold-400`}
              style={{
                animation: `pulse 1.4s infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Pulse Spinner */}
      {variant === "pulse" && (
        <div className={`${sizeClasses[size]} rounded-full bg-gold-400/20 animate-pulse`}></div>
      )}

      {/* Bars Spinner */}
      {variant === "bars" && (
        <div className="flex gap-1 items-end">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`bg-gradient-to-t from-gold-400 to-gold-300 ${
                size === "sm" ? "w-1 h-3" : size === "lg" ? "w-2 h-6" : "w-1.5 h-4"
              }`}
              style={{
                animation: `scale-y 0.8s infinite`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Loading Text */}
      {text && (
        <p className={`${textSizeClasses[size]} text-slate-400 font-medium text-center max-w-xs`}>
          {text}
        </p>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes scale-y {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
