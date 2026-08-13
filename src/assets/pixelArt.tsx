import type { ImgHTMLAttributes } from "react";
import { pixelIcons, type PixelIconName, type PixelIconUiSize } from "./pixelArtAssets";

type PixelIconProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
	name: PixelIconName;
	alt?: string;
	uiSize?: PixelIconUiSize;
};

export function PixelIcon({
	name,
	className,
	alt = "",
	uiSize = "standard",
	...props
}: PixelIconProps) {
	return (
		<img
			{...props}
			src={pixelIcons[uiSize][name]}
			alt={alt}
			className={className ? `pixel-art-icon ${className}` : "pixel-art-icon"}
			loading="lazy"
			decoding="async"
		/>
	);
}
