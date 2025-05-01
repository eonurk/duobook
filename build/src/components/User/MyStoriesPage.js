import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, } from "@/components/ui/alert-dialog";
import { getStories, deleteStory } from '@/lib/api';
function MyStoriesPage() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [savedStories, setSavedStories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(null);
    const parseStoryData = (storyString) => {
        try {
            return JSON.parse(storyString);
        }
        catch (e) {
            console.error("Failed to parse story JSON:", e);
            return null;
        }
    };
    useEffect(() => {
        if (currentUser) {
            setIsLoading(true);
            setError(null);
            getStories()
                .then(storiesFromApi => {
                storiesFromApi.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setSavedStories(storiesFromApi);
            })
                .catch(err => {
                console.error("Error fetching stories from API:", err);
                setError(err.message || "Failed to load stories.");
            })
                .finally(() => {
                setIsLoading(false);
            });
        }
        else {
            setIsLoading(false);
            setSavedStories([]);
        }
    }, [currentUser]);
    const handleStoryClick = (story) => {
        const storyData = parseStoryData(story.story);
        if (!storyData) {
            alert("Could not load story data. The story format might be invalid.");
            return;
        }
        const params = {
            description: story.description,
            source: story.sourceLanguage,
            target: story.targetLanguage,
            difficulty: story.difficulty,
            length: story.length
        };
        navigate('/story-view', { state: { storyData: storyData, params: params } });
    };
    const performDeleteStory = async (storyIdToDelete) => {
        if (!currentUser || isDeleting === storyIdToDelete)
            return;
        setIsDeleting(storyIdToDelete);
        try {
            await deleteStory(storyIdToDelete);
            setSavedStories(prevStories => prevStories.filter(story => story.id !== storyIdToDelete));
        }
        catch (error) {
            console.error("Error deleting story via API:", error);
            alert(`Failed to delete story: ${error.message}`);
        }
        finally {
            setIsDeleting(null);
        }
    };
    const formatTimestamp = (timestamp) => {
        if (!timestamp)
            return '';
        return new Date(timestamp).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };
    if (isLoading) {
        return (_jsxs("div", { className: "container mx-auto py-10 px-4 text-center", children: [_jsx(Loader2, { className: "h-8 w-8 animate-spin mx-auto mb-2" }), "Loading stories..."] }));
    }
    if (error) {
        return _jsxs("div", { className: "container mx-auto py-10 px-4 text-center text-red-600", children: ["Error: ", error] });
    }
    return (_jsxs("div", { className: "container mx-auto py-10 px-4 max-w-3xl", children: [_jsx("h1", { className: "text-3xl font-bold mb-6", children: "My Saved Stories" }), !currentUser ? (_jsx("p", { className: "text-muted-foreground", children: "Please log in to see your stories." })) : savedStories.length === 0 ? (_jsx("p", { className: "text-muted-foreground", children: "You haven't generated any stories yet." })) : (_jsx("div", { className: "flex flex-col gap-4", children: savedStories.map((story) => {
                    const storyDataPreview = parseStoryData(story.story);
                    const sentenceCount = storyDataPreview?.sentencePairs?.length || 0;
                    return (_jsxs("div", { className: "border rounded-lg p-4 flex justify-between items-center hover:bg-muted/50 transition-colors", children: [_jsxs("div", { className: "flex-grow cursor-pointer mr-2", onClick: () => handleStoryClick(story), role: "button", tabIndex: 0, onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ')
                                    handleStoryClick(story); }, "aria-label": `Open story: ${story.description || "Untitled Story"}`, children: [_jsx("h3", { className: "font-semibold text-lg mb-1", children: story.description || "Untitled Story" }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [story.targetLanguage || 'N/A', " / ", story.sourceLanguage || 'N/A', " (", story.difficulty || 'N/A', ", ", story.length || 'N/A', ") - ", sentenceCount, " sentences"] }), _jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: ["Created: ", formatTimestamp(story.createdAt)] })] }), _jsxs(AlertDialog, { children: [_jsx(AlertDialogTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "icon", className: `text-destructive hover:text-destructive/80 flex-shrink-0 ${isDeleting === story.id ? 'opacity-50 cursor-not-allowed' : ''}`, "aria-label": `Delete story: ${story.description || "Untitled Story"}`, disabled: isDeleting === story.id, children: isDeleting === story.id ? _jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : _jsx(Trash2, { className: "h-4 w-4" }) }) }), _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: "Are you sure?" }), _jsxs(AlertDialogDescription, { children: ["This action cannot be undone. This will permanently delete the story \"", story.description || "Untitled Story", "\"."] })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { children: "Cancel" }), _jsx(AlertDialogAction, { onClick: () => performDeleteStory(story.id), className: "bg-destructive hover:bg-destructive/90", children: "Delete" })] })] })] })] }, story.id));
                }) }))] }));
}
export default MyStoriesPage;
