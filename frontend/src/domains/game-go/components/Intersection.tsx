interface IntersectionProps {
  x: number;
  y: number;
  stoneColor?: "black" | "white";
  onClick: () => void;
}

const Intersection = ({stoneColor, onClick }: IntersectionProps) => {
  return (
    <div
      className="relative w-8 h-8"
      onClick={onClick}
    >
      {/* Línea horizontal y vertical */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-black" />
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-black" />
      </div>

      {/* Piedra centrada en la intersección */}
      {stoneColor && (
        <div
          className={`absolute w-4 h-4 rounded-full ${
            stoneColor === "black" ? "bg-black" : "bg-white"
          } top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`}
        />
      )}
    </div>
  );
};

export default Intersection;
