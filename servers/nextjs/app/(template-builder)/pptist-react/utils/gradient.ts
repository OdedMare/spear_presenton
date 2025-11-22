export type GradientColor = { pos: number; color: string };
export type Gradient = {
  type: "linear" | "radial";
  colors: GradientColor[];
  rotate: number;
};

export const gradientToCss = (gradient?: Gradient) => {
  if (!gradient || !gradient.colors?.length) return undefined;
  const stops = gradient.colors.map((c) => `${c.color} ${c.pos}%`).join(", ");
  if (gradient.type === "radial") {
    return `radial-gradient(circle, ${stops})`;
  }
  const angle = gradient.rotate ?? 0;
  return `linear-gradient(${angle}deg, ${stops})`;
};

