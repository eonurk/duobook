import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import Login from '@/components/Auth/Login'; // Import Login
import Signup from '@/components/Auth/Signup'; // Import Signup
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription // Added DialogDescription
 } from "@/components/ui/dialog"; // Import Dialog components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, } from "@/components/ui/card"; // Import Card components
import duobookImg from '../assets/duobook.jpg';
// Common languages for selection
const languages = [
    { value: 'Afrikaans', label: 'Afrikaans' },
    { value: 'Albanian', label: 'Albanian' },
    { value: 'Amharic', label: 'Amharic' },
    { value: 'Arabic', label: 'Arabic' },
    { value: 'Armenian', label: 'Armenian' },
    { value: 'Azerbaijani', label: 'Azerbaijani' },
    { value: 'Basque', label: 'Basque' },
    { value: 'Belarusian', label: 'Belarusian' },
    { value: 'Bengali', label: 'Bengali' },
    { value: 'Bosnian', label: 'Bosnian' },
    { value: 'Bulgarian', label: 'Bulgarian' },
    { value: 'Catalan', label: 'Catalan' },
    { value: 'Cebuano', label: 'Cebuano' },
    { value: 'Chinese (Simplified)', label: 'Chinese (Simplified)' },
    { value: 'Chinese (Traditional)', label: 'Chinese (Traditional)' },
    { value: 'Corsican', label: 'Corsican' },
    { value: 'Croatian', label: 'Croatian' },
    { value: 'Czech', label: 'Czech' },
    { value: 'Danish', label: 'Danish' },
    { value: 'Dutch', label: 'Dutch' },
    { value: 'English', label: 'English' },
    { value: 'Esperanto', label: 'Esperanto' },
    { value: 'Estonian', label: 'Estonian' },
    { value: 'Filipino (Tagalog)', label: 'Filipino (Tagalog)' },
    { value: 'Finnish', label: 'Finnish' },
    { value: 'French', label: 'French' },
    { value: 'Frisian', label: 'Frisian' },
    { value: 'Galician', label: 'Galician' },
    { value: 'Georgian', label: 'Georgian' },
    { value: 'German', label: 'German' },
    { value: 'Greek', label: 'Greek' },
    { value: 'Gujarati', label: 'Gujarati' },
    { value: 'Haitian Creole', label: 'Haitian Creole' },
    { value: 'Hausa', label: 'Hausa' },
    { value: 'Hawaiian', label: 'Hawaiian' },
    { value: 'Hebrew', label: 'Hebrew' },
    { value: 'Hindi', label: 'Hindi' },
    { value: 'Hmong', label: 'Hmong' },
    { value: 'Hungarian', label: 'Hungarian' },
    { value: 'Icelandic', label: 'Icelandic' },
    { value: 'Igbo', label: 'Igbo' },
    { value: 'Indonesian', label: 'Indonesian' },
    { value: 'Irish', label: 'Irish' },
    { value: 'Italian', label: 'Italian' },
    { value: 'Japanese', label: 'Japanese' },
    { value: 'Javanese', label: 'Javanese' },
    { value: 'Kannada', label: 'Kannada' },
    { value: 'Kazakh', label: 'Kazakh' },
    { value: 'Khmer', label: 'Khmer' },
    { value: 'Kinyarwanda', label: 'Kinyarwanda' },
    { value: 'Korean', label: 'Korean' },
    { value: 'Kurdish', label: 'Kurdish' },
    { value: 'Kyrgyz', label: 'Kyrgyz' },
    { value: 'Lao', label: 'Lao' },
    { value: 'Latin', label: 'Latin' },
    { value: 'Latvian', label: 'Latvian' },
    { value: 'Lithuanian', label: 'Lithuanian' },
    { value: 'Luxembourgish', label: 'Luxembourgish' },
    { value: 'Macedonian', label: 'Macedonian' },
    { value: 'Malagasy', label: 'Malagasy' },
    { value: 'Malay', label: 'Malay' },
    { value: 'Malayalam', label: 'Malayalam' },
    { value: 'Maltese', label: 'Maltese' },
    { value: 'Maori', label: 'Maori' },
    { value: 'Marathi', label: 'Marathi' },
    { value: 'Mongolian', label: 'Mongolian' },
    { value: 'Myanmar (Burmese)', label: 'Myanmar (Burmese)' },
    { value: 'Nepali', label: 'Nepali' },
    { value: 'Norwegian', label: 'Norwegian' },
    { value: 'Nyanja (Chichewa)', label: 'Nyanja (Chichewa)' },
    { value: 'Odia (Oriya)', label: 'Odia (Oriya)' },
    { value: 'Pashto', label: 'Pashto' },
    { value: 'Persian', label: 'Persian' },
    { value: 'Polish', label: 'Polish' },
    { value: 'Portuguese', label: 'Portuguese' },
    { value: 'Punjabi', label: 'Punjabi' },
    { value: 'Romanian', label: 'Romanian' },
    { value: 'Russian', label: 'Russian' },
    { value: 'Samoan', label: 'Samoan' },
    { value: 'Scots Gaelic', label: 'Scots Gaelic' },
    { value: 'Serbian', label: 'Serbian' },
    { value: 'Sesotho', label: 'Sesotho' },
    { value: 'Shona', label: 'Shona' },
    { value: 'Sindhi', label: 'Sindhi' },
    { value: 'Sinhala (Sinhalese)', label: 'Sinhala (Sinhalese)' },
    { value: 'Slovak', label: 'Slovak' },
    { value: 'Slovenian', label: 'Slovenian' },
    { value: 'Somali', label: 'Somali' },
    { value: 'Spanish', label: 'Spanish' },
    { value: 'Sundanese', label: 'Sundanese' },
    { value: 'Swahili', label: 'Swahili' },
    { value: 'Swedish', label: 'Swedish' },
    { value: 'Tagalog (Filipino)', label: 'Tagalog (Filipino)' },
    { value: 'Tajik', label: 'Tajik' },
    { value: 'Tamil', label: 'Tamil' },
    { value: 'Tatar', label: 'Tatar' },
    { value: 'Telugu', label: 'Telugu' },
    { value: 'Thai', label: 'Thai' },
    { value: 'Turkish', label: 'Turkish' },
    { value: 'Turkmen', label: 'Turkmen' },
    { value: 'Ukrainian', label: 'Ukrainian' },
    { value: 'Urdu', label: 'Urdu' },
    { value: 'Uyghur', label: 'Uyghur' },
    { value: 'Uzbek', label: 'Uzbek' },
    { value: 'Vietnamese', label: 'Vietnamese' },
    { value: 'Welsh', label: 'Welsh' },
    { value: 'Xhosa', label: 'Xhosa' },
    { value: 'Yiddish', label: 'Yiddish' },
    { value: 'Yoruba', label: 'Yoruba' },
    { value: 'Zulu', label: 'Zulu' },
];
// Map numeric values to labels
const difficultyMap = ['Beginner', 'Intermediate', 'Advanced'];
const difficultyLabels = ['Beginner (A1/A2)', 'Intermediate (B1/B2)', 'Advanced (C1/C2)'];
const lengthMap = ['Short', 'Medium', 'Long'];
const lengthLabels = [
    'Short (~3-4 paragraphs)',
    'Medium (~5-7 paragraphs)',
    'Long (~8-10+ paragraphs)' // Increased target for Long
];
// Examples Array
const storyExamples = [
    "A lost puppy looking for its owner in a busy city.",
    "A cooking competition where the main ingredient is magical mushrooms.",
    "A lonely robot on Mars who discovers a hidden garden.",
];
function InputForm({ onSubmit, isLoading }) {
    const { currentUser } = useAuth(); // Get current user
    const [description, setDescription] = useState('');
    const [sourceLang, setSourceLang] = useState('English'); // Default source: English
    const [targetLang, setTargetLang] = useState('Spanish'); // Default target: Spanish
    // Use numeric state for sliders, map back to string for submission
    const [difficultyIndex, setDifficultyIndex] = useState(0); // 0: Beginner, 1: Intermediate, 2: Advanced
    const [lengthIndex, setLengthIndex] = useState(0); // 0: Short, 1: Medium, 2: Long
    const [showAuthDialog, setShowAuthDialog] = useState(false); // State for dialog
    const handleSubmit = (e) => {
        e.preventDefault();
        // Check if user is logged in
        if (!currentUser) {
            setShowAuthDialog(true); // Show login/signup dialog
            return; // Stop submission
        }
        // If logged in, proceed with original submission logic
        if (description.trim() && !isLoading) {
            // Get string values from map using current index
            const difficulty = difficultyMap[difficultyIndex];
            const storyLength = lengthMap[lengthIndex];
            onSubmit(description, sourceLang, targetLang, difficulty, storyLength);
        }
    };
    // Function to handle example button click
    const handleExampleClick = (exampleText) => {
        setDescription(exampleText);
    };
    return (_jsxs(_Fragment, { children: [_jsxs("form", { onSubmit: handleSubmit, className: "input-form", children: [_jsxs("p", { style: { textAlign: 'center', fontSize: '1rem', color: '#666', marginBottom: '1.5rem' }, children: ["Craft ", _jsx("b", { children: "your story" }), " to learn a language"] }), _jsx("img", { src: duobookImg, alt: "DuoBook", style: {
                            display: 'block', // Needed for auto margins to work
                            maxWidth: '80%', // Adjust percentage as needed
                            margin: '0 auto 1.5rem auto' // Center horizontally, keep bottom margin
                        } }), _jsxs("fieldset", { className: "form-section", children: [_jsx("legend", { className: "form-section-title", children: "Story Idea" }), _jsx("label", { htmlFor: "storyDescription", className: "form-label visually-hidden", children: "Story Description:" }), _jsx("textarea", { id: "storyDescription", value: description, onChange: (e) => setDescription(e.target.value), placeholder: "Describe the story or click an example below...", rows: 4, disabled: isLoading, className: "input-textarea", "aria-describedby": "story-helper-text story-examples" }), _jsx("div", { id: "story-examples", className: "form-examples", children: _jsx("ul", { className: "example-list", children: storyExamples.map((example, index) => (_jsx("li", { className: "example-list-item", onClick: () => !isLoading && handleExampleClick(example), role: "button", tabIndex: isLoading ? -1 : 0, onKeyDown: (e) => {
                                            if (!isLoading && (e.key === 'Enter' || e.key === ' ')) {
                                                handleExampleClick(example);
                                            }
                                        }, children: example }, index))) }) })] }), _jsxs("fieldset", { className: "form-section", children: [_jsx("legend", { className: "form-section-title", children: "Languages" }), _jsxs("div", { className: "language-select-container", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "sourceLang", className: "form-label", children: "Your Language:" }), _jsx("select", { id: "sourceLang", value: sourceLang, onChange: (e) => setSourceLang(e.target.value), className: "input-select", disabled: isLoading, children: languages.map(lang => (_jsx("option", { value: lang.value, children: lang.label }, lang.value))) })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "targetLang", className: "form-label", children: "Language to Learn:" }), _jsx("select", { id: "targetLang", value: targetLang, onChange: (e) => setTargetLang(e.target.value), className: "input-select", disabled: isLoading, children: languages.filter(lang => lang.value !== sourceLang).map(lang => (_jsx("option", { value: lang.value, children: lang.label }, lang.value))) })] })] })] }), _jsxs("fieldset", { className: "form-section", children: [_jsx("legend", { className: "form-section-title", children: "Story Settings" }), _jsxs("div", { className: "slider-container", children: [_jsxs("div", { className: "slider-item", children: [_jsxs("label", { htmlFor: "difficulty", className: "form-label", children: ["Difficulty: ", _jsx("span", { className: "slider-value", children: difficultyLabels[difficultyIndex] })] }), _jsx("input", { type: "range", id: "difficulty", min: "0", max: "2", step: "1", value: difficultyIndex, onChange: (e) => setDifficultyIndex(parseInt(e.target.value, 10)), className: "input-range", disabled: isLoading })] }), _jsxs("div", { className: "slider-item", children: [_jsxs("label", { htmlFor: "storyLength", className: "form-label", children: ["Story Length: ", _jsx("span", { className: "slider-value", children: lengthLabels[lengthIndex] })] }), _jsx("input", { type: "range", id: "storyLength", min: "0", max: "2", step: "1", value: lengthIndex, onChange: (e) => setLengthIndex(parseInt(e.target.value, 10)), className: "input-range", disabled: isLoading })] })] })] }), _jsx("button", { type: "submit", disabled: isLoading || !description.trim() || sourceLang === targetLang, className: "button button-primary submit-button", children: isLoading ? 'Generating...' : 'Create Book' })] }), _jsx(Dialog, { open: showAuthDialog, onOpenChange: setShowAuthDialog, children: _jsx(DialogContent, { className: "sm:max-w-[425px] p-0", children: _jsxs(Card, { className: "border-none shadow-none bg-amber-50", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx(CardTitle, { children: "Authentication Required" }), _jsx(CardDescription, { children: "Please sign in or create an account to generate a story." })] }), _jsxs(CardContent, { className: "grid gap-4", children: [_jsx(Login, { onSuccess: () => setShowAuthDialog(false) }), _jsx("div", { className: "text-center text-muted-foreground text-sm", children: "or" }), _jsx(Signup, { onSuccess: () => setShowAuthDialog(false) })] })] }) }) })] }));
}
export default InputForm;
