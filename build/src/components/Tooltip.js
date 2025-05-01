import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import './Tooltip.css'; // We'll create this CSS file next
function Tooltip({ content, position, visible }) {
    if (!visible || !content) {
        return null;
    }
    const style = {
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        // Add transform later for better centering above the word
        transform: 'translate(-50%, -110%)', // Adjust based on final styling
    };
    return (_jsx("div", { className: "tooltip", style: style, children: content }));
}
export default Tooltip;
