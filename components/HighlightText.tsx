import React from 'react';

interface HighlightTextProps {
    text: string;
    highlight: string;
    className?: string;
}

export const HighlightText: React.FC<HighlightTextProps> = ({ text, highlight, className = '' }) => {
    if (!highlight || !text) {
        return <span className={className}>{text}</span>;
    }

    // Escape special characters in the highlight string to prevent regex errors
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));

    return (
        <span className={className}>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <span key={i} className="bg-bronze-500/20 text-bronze-100 font-semibold rounded-[2px] px-0.5 shadow-[0_0_10px_rgba(217,119,6,0.1)]">
                        {part}
                    </span>
                ) : (
                    part
                )
            )}
        </span>
    );
};
