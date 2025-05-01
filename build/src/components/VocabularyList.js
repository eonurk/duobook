import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import './VocabularyList.css'; // We'll create this CSS file next
function VocabularyList({ vocabulary }) {
    if (!vocabulary || vocabulary.length === 0) {
        return null; // Don't render if no vocabulary
    }
    return (_jsxs("div", { className: "vocabulary-section", children: [_jsx("h4", { className: "vocabulary-title", children: "Key Vocabulary" }), _jsx("ul", { className: "vocabulary-list", children: vocabulary.map((item, index) => (_jsxs("li", { className: "vocabulary-item", children: [_jsxs("span", { className: "vocab-word", children: [item.word, ":"] }), _jsx("span", { className: "vocab-translation", children: item.translation })] }, index))) })] }));
}
export default VocabularyList;
