import React from "react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	LabelList,
} from "recharts";

// Data based on the provided benchmark (RMSE - Lower is Better)
const rmseData = [
	{ name: "SM-2", rmse: 0.3276, fill: "#cecece" },
	{ name: "FSRS", rmse: 0.2426, fill: "#8884d8" },
];

const chartCardStyle = "bg-card text-card-foreground p-4 sm:p-6 rounded-lg"; // Responsive padding
const chartTitleStyle =
	"text-lg text-slate-700 mb-1 text-center max-w-2xl mx-auto";

const FsrsEffectivenessCharts = () => {
	return (
		<section className="mt-16 pt-12 border-t">
			<h2 className="text-3xl font-bold text-center mb-8">
				Smarter Vocabulary Practice with FSRS
			</h2>
			<p className={chartTitleStyle}>
				We use latest science-based scheduling (FSRS) to make your vocabulary
				practice more effective and efficient.
			</p>
			<div className="grid grid-cols-1 md:grid-cols-1 gap-8 max-w-2xl mx-auto mt-8">
				<div className={chartCardStyle}>
					<ResponsiveContainer width="100%" height={320}>
						{" "}
						{/* Increased height slightly for angled labels */}
						<BarChart
							data={rmseData}
							margin={{ top: 20, right: 20, left: -10, bottom: 25 }} // Adjusted margins for labels
						>
							{/* <CartesianGrid strokeDasharray="3 3" /> */}
							<XAxis
								dataKey="name"
								interval={0}
								angle={0} // Angle the labels
								textAnchor="middle" // Anchor them at the end
								height={10} // Allocate space for angled labels
							/>
							<YAxis
								unit=""
								domain={[0, 0.4]}
								label={{
									value: "RMSE",
									angle: -90,
									position: "insideLeft",
									offset: 0, // Adjusted offset
									style: { textAnchor: "middle" },
								}}
							/>
							<Tooltip
								formatter={(value) => `Error: ${Number(value).toFixed(2)}`}
							/>
							<Bar dataKey="rmse" radius={[2, 2, 0, 0]}>
								<LabelList
									dataKey="RMSE"
									position="top"
									formatter={(value) => `${Number(value).toFixed(2)}`}
								/>
							</Bar>
						</BarChart>
					</ResponsiveContainer>
					<p className="text-xs text-slate-500 mt-4 text-justify px-2">
						Lower RMSE means better timing. FSRS helps you review words at the
						best time. This chart shows FSRS makes fewer mistakes than older
						methods, so you learn and remember words better.
					</p>
				</div>
			</div>
		</section>
	);
};

export default FsrsEffectivenessCharts;
