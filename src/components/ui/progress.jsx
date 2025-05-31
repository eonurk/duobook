import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

function Progress({ className, value, ...props }) {
	return (
		<ProgressPrimitive.Root
			data-slot="progress"
			className={cn(
				"bg-gray-300 dark:bg-gray-600 relative h-3 w-full overflow-hidden rounded-full border border-gray-400 dark:border-gray-500",
				className
			)}
			{...props}
		>
			<ProgressPrimitive.Indicator
				data-slot="progress-indicator"
				className="bg-gradient-to-r from-blue-500 to-blue-600 h-full w-full flex-1 transition-all duration-500 ease-out rounded-full"
				style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
			/>
		</ProgressPrimitive.Root>
	);
}

export { Progress };
