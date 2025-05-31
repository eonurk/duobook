import React from "react";
import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";

export function SiteFooter() {
	return (
		<footer className="border-t border-border/40 py-6 md:py-0 px-4">
			<div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
				<p className="text-balance text-center text-xs text-muted-foreground md:text-left">
					© {new Date().getFullYear()} DuoBook. All rights reserved.
				</p>
				<nav className="flex gap-4 items-center">
					<a
						href="https://www.instagram.com/duobook.co"
						target="_blank"
						rel="noopener noreferrer"
						className="text-xs hover:underline underline-offset-4 text-muted-foreground flex items-center"
					>
						<Instagram className="h-4 w-4 mr-1" />
					</a>
					<Link
						to="/contact"
						className="text-xs hover:underline underline-offset-4 text-muted-foreground"
					>
						Contact Us
					</Link>
					<Link
						to="/privacy"
						className="text-xs hover:underline underline-offset-4 text-muted-foreground"
					>
						Privacy Policy
					</Link>
					<Link
						to="/terms"
						className="text-xs hover:underline underline-offset-4 text-muted-foreground"
					>
						Terms of Service
					</Link>
				</nav>
			</div>
		</footer>
	);
}

export default SiteFooter;
