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
      filter: "saturate(0) brightness(0) invert(1) sepia(1) saturate(10000%) hue-rotate(180deg) brightness(0.8) contrast(1.2) drop-shadow(0 0 10px rgba(0, 120, 255, 0.8))",
      mixBlendMode: "multiply",
    },
    cyan: {
      filter: "saturate(0) brightness(0) invert(1) sepia(1) saturate(10000%) hue-rotate(160deg) brightness(1) contrast(1.3) drop-shadow(0 0 12px rgba(0, 240, 255, 0.9))",
      mixBlendMode: "multiply",
    }
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div style={{ isolation: "isolate" }} className="relative">
        <img 
          src={cactoGif} 
          alt="Carregando" 
          className={`${sizes[size]} object-contain`}
          style={filterStyles[variant]}
        />
      </div>
      {text && (
        <p className="text-sm text-white/60 animate-pulse">{text}</p>
      )}
    </div>
  );
};
