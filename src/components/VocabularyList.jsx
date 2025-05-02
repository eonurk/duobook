import React from "react";
import "./VocabularyList.css"; // We'll create this CSS file next

function VocabularyList({ vocabulary }) {
	if (!vocabulary || vocabulary.length === 0) {
		return null; // Don't render if no vocabulary
	}

	return (
		<div className="vocabulary-section">
			<h4 className="vocabulary-title">Key Vocabulary</h4>
			<ul className="vocabulary-list">
				{vocabulary.map((item, index) => (
					<li key={index} className="vocabulary-item">
						<span className="vocab-word">{item.word}:</span>
						<span className="vocab-translation">{item.translation}</span>
					</li>
				))}
			</ul>
		</div>
	);
}

export default VocabularyList;
