import cactoGif from "@/assets/cacto-loading.gif";

interface CactoLoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
  variant?: "default" | "blue" | "cyan";
}

export const CactoLoader = ({ 
  size = "md", 
  text = "Processando...",
  className = "",
  variant = "cyan"
}: CactoLoaderProps) => {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-16 h-16", 
    lg: "w-24 h-24"
  };

  const filterStyles: Record<string, React.CSSProperties> = {
    default: {},
    blue: {
      filter: "invert(1) sepia(1) saturate(5) hue-rotate(180deg) brightness(0.9)",
      mixBlendMode: "screen",
    },
    cyan: {
      filter: "invert(1) sepia(1) saturate(5) hue-rotate(160deg) brightness(1.1) drop-shadow(0 0 8px rgba(0, 240, 255, 0.6))",
      mixBlendMode: "screen",
    }
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <img 
        src={cactoGif} 
        alt="Carregando" 
        className={`${sizes[size]} object-contain`}
        style={filterStyles[variant]}
      />
      {text && (
        <p className="text-sm text-white/60 animate-pulse">{text}</p>
      )}
    </div>
  );
};
