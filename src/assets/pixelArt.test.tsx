import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PixelIcon } from "./pixelArt";
import { pixelIconMasters, pixelIcons, pixelMascots } from "./pixelArtAssets";

describe("pixel art assets", () => {
	it("resolves approved production icon and mascot assets", () => {
		expect(Object.keys(pixelIconMasters)).toHaveLength(36);
		expect(Object.keys(pixelIcons.standard)).toHaveLength(36);
		expect(pixelMascots.today).toMatch(/sola-today/);
		expect(pixelMascots.history).toMatch(/sola-history/);
		expect(pixelMascots.progress).toMatch(/sola-progress/);
		expect(pixelMascots.celebrate).toMatch(/sola-celebrate/);
	});

	it("renders decorative pixel icons with empty alt text by default", () => {
		const { container } = render(<PixelIcon name="weight" />);

		expect(container.querySelector(".pixel-art-icon")).toBeInTheDocument();
		expect(screen.queryByRole("img")).not.toBeInTheDocument();
	});

	it("renders representative trimmed icons in stable UI display slots", () => {
		const { container } = render(
			<span className="field-icon" aria-hidden="true">
				<PixelIcon name="camera" uiSize="tiny" />
			</span>
		);

		expect(pixelIconMasters.camera).toMatch(/camera/);
		expect(pixelIconMasters.camera).not.toMatch(/ui/);
		expect(pixelIcons.tiny.camera).toMatch(/ui\/24\/camera/);
		expect(pixelIcons.standard.camera).toMatch(/ui\/32\/camera/);
		expect(pixelIcons.medium.camera).toMatch(/ui\/40\/camera/);
		expect(container.querySelector(".field-icon .pixel-art-icon")).toHaveAttribute(
			"src",
			expect.stringContaining("/ui/24/camera")
		);
	});

	it("keeps detailed masters separate from derived UI arrows and logo art", () => {
		expect(pixelIconMasters.arrowLeft).toMatch(/icons\/arrow-left/);
		expect(pixelIconMasters.arrowRight).toMatch(/icons\/arrow-right/);
		expect(pixelIconMasters.sparkles).toMatch(/icons\/sparkles/);
		expect(pixelIcons.standard.arrowLeft).toMatch(/ui\/32\/arrow-left/);
		expect(pixelIcons.standard.arrowRight).toMatch(/ui\/32\/arrow-right/);
		expect(pixelIcons.medium.sparkles).toMatch(/ui\/40\/sparkles/);
	});
});
