import React from "react";
import { CheckCircle, XCircle } from "lucide-react"; // Using lucide-react for icons

const PricingPage = () => {
	const features = {
		free: [
			{ text: "Access to a limited selection of stories", included: true },
			{ text: "Basic vocabulary highlighting", included: true },
			{ text: "3 story generations per day", included: true },
			{ text: "Standard TTS voices", included: true },
			{ text: "Priority Support", included: false },
			{ text: "PDF Downloads", included: false },
			{ text: "Advanced Story Analytics", included: false },
		],
		pro: [
			{ text: "Unlimited access to all stories", included: true },
			{ text: "Much longer story generation", included: true },
			{
				text: "10 story generations per day",
				included: true,
			},
			{ text: "Priority Support", included: true },
			{ text: "PDF Downloads", included: true },
			{ text: "Advanced Story Analytics", included: true },
			{
				text: "Exclusive content & early access to new features",
				included: true,
			},
		],
	};

	const FeatureItem = ({ text, included }) => (
		<li
			className={`flex items-center space-x-2 ${
				included
					? "text-gray-800 dark:text-gray-200"
					: "text-gray-500 dark:text-gray-400 line-through"
			}`}
		>
			{included ? (
				<CheckCircle className="w-5 h-5 text-green-500" />
			) : (
				<XCircle className="w-5 h-5 text-red-400" />
			)}
			<span>{text}</span>
		</li>
	);

	return (
		<div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 text-white">
			<div className="max-w-4xl mx-auto">
				<h1 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-4">
					Choose Your Plan
				</h1>
				<p className="text-lg text-slate-700 text-center mb-12">
					Unlock the full potential of your language learning journey with
					DuoBook.
				</p>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					{/* Free Plan Card */}
					<div className="rounded-xl shadow-2xl p-8 flex flex-col">
						<h2 className="text-3xl font-semibold text-slate-500 mb-1">
							DuoBook Free
						</h2>
						<p className="text-xl text-slate-400 mb-6">For casual learners</p>
						<ul className="space-y-3 mb-8 flex-grow">
							{features.free.map((feature, index) => (
								<FeatureItem
									key={index}
									text={feature.text}
									included={feature.included}
								/>
							))}
						</ul>
						<button
							className="w-full mt-auto bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 ease-in-out text-lg"
							onClick={() => alert("Manage your Free plan (placeholder)")}
						>
							Current Plan
						</button>
					</div>

					{/* Pro Plan Card */}
					<div className="bg-gradient-to-br from-amber-300 to-purple-300 rounded-xl shadow-2xl p-8 flex flex-col ring-2 ring-amber-400 relative">
						<div className="absolute top-0 right-0 -mt-4 -mr-2 bg-amber-400 text-purple-800 text-xs font-bold px-3 py-1 rounded-full shadow-md">
							MOST POPULAR
						</div>
						<h2 className="text-3xl font-semibold text-amber-600 mb-1">
							DuoBook PRO
						</h2>
						<p className="text-xl text-white mb-6">For dedicated learners</p>
						<ul className="space-y-3 mb-8 flex-grow">
							{features.pro.map((feature, index) => (
								<FeatureItem
									key={index}
									text={feature.text}
									included={feature.included}
								/>
							))}
						</ul>
						<button
							className="w-full mt-auto bg-amber-400 hover:bg-amber-500 text-amber-800 font-semibold py-3 px-6 rounded-lg transition duration-200 ease-in-out text-lg shadow-lg"
							onClick={() => alert("Go to PRO subscription page (placeholder)")}
						>
							Upgrade to PRO
						</button>
					</div>
				</div>

				<div className="mt-16 text-center">
					<p className="text-slate-400">
						Questions?{" "}
						<a href="/contact" className="text-amber-400 hover:underline">
							Contact Support
						</a>
					</p>
				</div>
			</div>
		</div>
	);
};

export default PricingPage;
