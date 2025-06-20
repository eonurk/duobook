import React from "react";

const FilterControls = ({
	sourceLanguage,
	targetLanguage,
	sortBy,
	availableLanguages,
	onLanguageFilterChange,
	onSortChange,
	idPrefix = "",
}) => {
	return (
		<>
			<div>
				<label
					htmlFor={`${idPrefix}source-language`}
					className="block text-sm font-medium text-gray-700"
				>
					Source Language
				</label>
				<select
					id={`${idPrefix}source-language`}
					value={sourceLanguage}
					onChange={(e) =>
						onLanguageFilterChange(e.target.value, targetLanguage)
					}
					className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
				>
					<option value="">Any</option>
					{availableLanguages.source.map((lang) => (
						<option key={lang} value={lang}>
							{lang}
						</option>
					))}
				</select>
			</div>
			<div>
				<label
					htmlFor={`${idPrefix}target-language`}
					className="block text-sm font-medium text-gray-700"
				>
					Target Language
				</label>
				<select
					id={`${idPrefix}target-language`}
					value={targetLanguage}
					onChange={(e) =>
						onLanguageFilterChange(sourceLanguage, e.target.value)
					}
					className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
				>
					<option value="">Any</option>
					{availableLanguages.target.map((lang) => (
						<option key={lang} value={lang}>
							{lang}
						</option>
					))}
				</select>
			</div>
			<div>
				<label
					htmlFor={`${idPrefix}sort-by`}
					className="block text-sm font-medium text-gray-700"
				>
					Sort By
				</label>
				<select
					id={`${idPrefix}sort-by`}
					value={sortBy}
					onChange={(e) => onSortChange(e.target.value)}
					className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
				>
					<option value="createdAt_desc">Newest</option>
					<option value="createdAt_asc">Oldest</option>
					<option value="likes_desc">Most Popular</option>
					<option value="length_desc">Longest</option>
					<option value="length_asc">Shortest</option>
				</select>
			</div>
		</>
	);
};

export default FilterControls;
