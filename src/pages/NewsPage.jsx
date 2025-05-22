// src/pages/NewsPage.jsx
import React from "react";

function NewsPage() {
	// Placeholder news items.
	const newsItems = [
		{
			id: 0,
			date: "May 22, 2025",
			title: "Download PDFs of Your Stories!",
			content:
				'You can now download your stories as PDFs! Just go to the "My Stories" section and click on the download button next to your story.',
		},
		{
			id: 1,
			date: "May 20, 2025",
			title: "New Feature: Explore Public Stories!",
			content:
				'You can now explore stories shared by other users. Head over to the "Explore" section to discover new content.',
		},
		{
			id: 2,
			date: "May 15, 2025",
			title: "Improved Vocabulary Practice",
			content:
				'We\'ve enhanced the vocabulary practice feature with FSRS integration for better learning effectiveness. Check your progress in the new "Vocabulary" section.',
		},
		{
			id: 3,
			date: "May 10, 2025",
			title: "UI Enhancements and Bug Fixes",
			content:
				"Several UI improvements have been rolled out for a smoother experience. We've also squashed some pesky bugs reported by our users.",
		},
		{
			id: 4,
			date: "May 1, 2025",
			title: "Welcome to DuoBook!",
			content:
				"Thank you for joining DuoBook. We are excited to help you on your language learning journey through interactive story generation!",
		},
	];

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-8 text-center">
				Latest News & Updates
			</h1>
			<div className="space-y-8">
				{newsItems
					.sort((a, b) => new Date(b.date) - new Date(a.date))
					.map((item) => (
						<article
							key={item.id}
							className="p-6 bg-white shadow-lg rounded-lg border border-gray-200"
						>
							<h2 className="text-2xl font-semibold mb-2 text-gray-800">
								{item.title}
							</h2>
							<p className="text-sm text-gray-500 mb-3">{item.date}</p>
							<p className="text-gray-700 leading-relaxed">{item.content}</p>
						</article>
					))}
			</div>
			<p className="text-center mt-12 text-gray-600">
				Stay tuned for more updates!
			</p>
		</div>
	);
}

export default NewsPage;
