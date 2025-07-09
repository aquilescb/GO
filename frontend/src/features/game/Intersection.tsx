interface IntersectionProps {
  x: number;
  y: number;
  stoneColor?: "black" | "white";
  onClick: () => void;
}

const Intersection = ({ stoneColor, onClick }: IntersectionProps) => {
  return ( 
        <div
      className="relative w-8 h-8"
      onClick={onClick}
      style={{
        borderTop: "1px solid black",
        borderLeft: "1px solid black",
      }}
    >
      {stoneColor && (
        <div
          className={`absolute w-3.5 h-3.5 rounded-full ${
            stoneColor === "black" ? "bg-black" : "bg-white"
          }`}
          style={{
            top: "-4px",
            left: "-4px",
          }}
        />
      )}
    </div>
  );
};

export default Intersection;
