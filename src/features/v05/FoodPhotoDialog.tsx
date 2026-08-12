import { useEffect, useRef } from "react";
import { ImageOff, Trash2 } from "lucide-react";
import { formatFriendlyDate } from "./date";
import { foodPhotoAlt } from "./foodPhoto";
import type { V05FoodPhotoWithUrl } from "./types";

export function FoodPhotoDialog({
	photo,
	isDeleting,
	onClose,
	onDelete,
	position,
	total,
	canGoPrevious = false,
	canGoNext = false,
	onPrevious,
	onNext
}: {
	photo: V05FoodPhotoWithUrl;
	isDeleting: boolean;
	onClose: () => void;
	onDelete: () => void;
	position?: number;
	total?: number;
	canGoPrevious?: boolean;
	canGoNext?: boolean;
	onPrevious?: () => void;
	onNext?: () => void;
}) {
	const closeButtonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		closeButtonRef.current?.focus();

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") onClose();
			if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) {
				return;
			}
			if (event.key === "ArrowLeft" && canGoPrevious) onPrevious?.();
			if (event.key === "ArrowRight" && canGoNext) onNext?.();
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [canGoNext, canGoPrevious, onClose, onNext, onPrevious]);

	return (
		<div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
			<section
				className="photo-dialog"
				role="dialog"
				aria-modal="true"
				aria-labelledby="photo-dialog-title"
				onMouseDown={(event) => event.stopPropagation()}
			>
				<div className="section-heading compact">
					<div>
						<p className="eyebrow">{formatFriendlyDate(photo.entry_date)}</p>
						<h3 id="photo-dialog-title">{photo.meal_type ?? "Food photo"}</h3>
					</div>
					<button
						type="button"
						className="text-button"
						onClick={onClose}
						ref={closeButtonRef}
					>
						Close
					</button>
				</div>
				{total && total > 1 ? (
					<div className="photo-dialog-nav" aria-label="Photo navigation">
						<button
							type="button"
							aria-label="Previous photo"
							disabled={!canGoPrevious}
							onClick={onPrevious}
						>
							&lt;
						</button>
						<span>{position} of {total}</span>
						<button
							type="button"
							aria-label="Next photo"
							disabled={!canGoNext}
							onClick={onNext}
						>
							&gt;
						</button>
					</div>
				) : null}
				<div className="photo-dialog-image">
					{photo.signedUrl ? (
						<img
							className="detail-photo-image"
							src={photo.signedUrl}
							alt={foodPhotoAlt(photo)}
						/>
					) : (
						<span className="photo-fallback">
							<ImageOff aria-hidden="true" size={28} />
							Preview unavailable
						</span>
					)}
				</div>
				{photo.note ? <p className="photo-dialog-note">{photo.note}</p> : null}
				<button
					type="button"
					className="text-button danger-button"
					disabled={isDeleting}
					onClick={onDelete}
				>
					<Trash2 aria-hidden="true" size={16} />
					{isDeleting ? "Deleting..." : "Delete photo"}
				</button>
			</section>
		</div>
	);
}
