import { ImageResponse } from "next/og";
import { IconArt } from "@/lib/iconArt";

const SIZES = [192, 512] as const;

export function generateStaticParams() {
  return SIZES.map((size) => ({ size: String(size) }));
}

export const dynamicParams = false;

export async function GET(_request: Request, ctx: RouteContext<"/pwa-icon/[size]">) {
  const size = Number((await ctx.params).size);
  return new ImageResponse(<IconArt size={size} />, { width: size, height: size });
}
