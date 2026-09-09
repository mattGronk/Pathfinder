import Image from "next/image";

type ReggieProps = {
  variant?: "hatchling" | "trailblazer";
  message?: string;
  size?: number;
  className?: string;
};

export function Reggie({ variant = "trailblazer", message, size = 180, className = "" }: ReggieProps) {
  const source = variant === "hatchling" ? "/reggie-hatchling.jpg" : "/reggie-trailblazer.jpg";
  const alt = variant === "hatchling"
    ? "Reggie the yellow Pathfinder chick hatching from his shell"
    : "Reggie the yellow Pathfinder chicken pointing the way";
  const height = Math.round(size * 1.5);
  return <figure className={`reggie ${variant} ${className}`.trim()}>
    <Image src={source} width={size} height={height} alt={alt} />
    {message && <figcaption><b>Reggie says</b>{message}</figcaption>}
  </figure>;
}
