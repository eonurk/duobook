import React from "react";
import { Button } from "./button";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
	const getPageNumbers = () => {
		const pageNumbers = [];
		const maxPagesToShow = 5;

		if (totalPages <= 1) return [];

		if (totalPages <= maxPagesToShow) {
			for (let i = 1; i <= totalPages; i++) {
				pageNumbers.push(i);
			}
		} else {
			let startPage = Math.max(2, currentPage - 1);
			let endPage = Math.min(totalPages - 1, currentPage + 1);

			if (currentPage <= 3) {
				startPage = 2;
				endPage = 4;
			} else if (currentPage >= totalPages - 2) {
				startPage = totalPages - 3;
				endPage = totalPages - 1;
			}

			pageNumbers.push(1);
			if (startPage > 2) {
				pageNumbers.push("...");
			}

			for (let i = startPage; i <= endPage; i++) {
				pageNumbers.push(i);
			}

			if (endPage < totalPages - 1) {
				pageNumbers.push("...");
			}
			pageNumbers.push(totalPages);
		}
		return pageNumbers;
	};

	const pages = getPageNumbers();

	if (totalPages <= 1) {
		return null;
	}

	return (
		<div className="flex justify-center items-center gap-1 sm:gap-2 overflow-x-auto py-2">
			<Button
				variant="outline"
				onClick={() => onPageChange(currentPage - 1)}
				disabled={currentPage === 1}
				size="sm"
				className="flex-shrink-0"
			>
				Previous
			</Button>
			{pages.map((page, index) =>
				typeof page === "number" ? (
					<Button
						key={index}
						variant={currentPage === page ? "default" : "outline"}
						onClick={() => onPageChange(page)}
						size="sm"
						className="flex-shrink-0"
					>
						{page}
					</Button>
				) : (
					<span
						key={index}
						className="px-2 py-2 text-sm text-gray-700 flex-shrink-0"
					>
						{page}
					</span>
				)
			)}
			<Button
				variant="outline"
				onClick={() => onPageChange(currentPage + 1)}
				disabled={currentPage === totalPages}
				size="sm"
				className="flex-shrink-0"
			>
				Next
			</Button>
		</div>
	);
};

export default Pagination;
