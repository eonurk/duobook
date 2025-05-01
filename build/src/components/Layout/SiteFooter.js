import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { Link } from 'react-router-dom';
export function SiteFooter() {
    return (_jsx("footer", { className: "border-t border-border/40 py-6 md:py-0 px-4", children: _jsxs("div", { className: "container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row", children: [_jsxs("p", { className: "text-balance text-center text-xs text-muted-foreground md:text-left", children: ["\u00A9 ", new Date().getFullYear(), " DuoBook. All rights reserved."] }), _jsxs("nav", { className: "flex gap-4 items-center", children: [_jsx(Link, { to: "/privacy-policy", className: "text-xs hover:underline underline-offset-4 text-muted-foreground", children: "Privacy Policy" }), _jsx(Link, { to: "/terms-of-service", className: "text-xs hover:underline underline-offset-4 text-muted-foreground", children: "Terms of Service" })] })] }) }));
}
export default SiteFooter;
