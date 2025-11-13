"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";

export type RichTextEditorProps = {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    hideCharCount?: boolean;
};

export default function RichTextEditor({
                                           value,
                                           onChange,
                                           placeholder = "Describe your project in a few sentences…",
                                           hideCharCount = false,
                                       }: RichTextEditorProps) {
    // Quill only on client
    const QuillEditor = useMemo(
        () =>
            dynamic(() => import("react-quill-new"), {
                ssr: false,
            }),
        []
    );

    // Toolbar config
    const modules = useMemo(
        () => ({
            toolbar: [
                [{ header: [1, 2, false] }],
                ["bold", "italic"],
                [{ list: "ordered" }, { list: "bullet" }],
                ["link"],
                ["clean"],
            ],
        }),
        []
    );

    // character count (strip html tags first)
    const charCount = value.replace(/<[^>]+>/g, "").trim().length;

    return (
        <div
            className="
        group
        rounded-xl border-2 border-gray-200 bg-white
        shadow-sm
        focus-within:border-[#0066CC]
        focus-within:shadow-[0_0_0_4px_rgba(0,102,204,0.15)]
        transition
      "
        >
            {/* neutral header bar with optional counter */}
            <div
                className="
          flex items-center justify-end
          border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100
          px-4 py-2
        "
            >
                {!hideCharCount && (
                    <span className="text-[11px] font-medium text-gray-400">
            {charCount} chars
          </span>
                )}
            </div>

            {/* editor body */}
            <div className="px-4 py-3 text-sm leading-6 text-gray-900">
                <QuillEditor
                    theme="snow"
                    value={value || ""}
                    onChange={onChange}
                    placeholder={placeholder}
                    modules={modules}
                    /* formats prop REMOVED to avoid the register/bullet error */
                    className={`
            text-gray-900

            /* TOOLBAR */
            [&_.ql-toolbar]:!rounded-lg
            [&_.ql-toolbar]:!border
            [&_.ql-toolbar]:!border-gray-200
            [&_.ql-toolbar]:!bg-white
            [&_.ql-toolbar]:px-3
            [&_.ql-toolbar]:py-2
            [&_.ql-toolbar]:shadow-sm
            [&_.ql-toolbar]:ring-1
            [&_.ql-toolbar]:ring-gray-100
            [&_.ql-toolbar]:mb-3

            /* toolbar buttons */
            [&_.ql-toolbar_button]:text-[12px]
            [&_.ql-toolbar_button]:text-gray-600
            [&_.ql-toolbar_button]:rounded-md
            [&_.ql-toolbar_button]:px-2
            [&_.ql-toolbar_button]:py-1
            [&_.ql-toolbar_button:hover]:bg-[#0066CC0d]
            [&_.ql-toolbar_button:hover]:text-[#0066CC]
            [&_.ql-toolbar_button.ql-active]:bg-[#0066CC0f]
            [&_.ql-toolbar_button.ql-active]:text-[#0066CC]
            [&_.ql-toolbar_.ql-picker-label]:text-[12px]
            [&_.ql-toolbar_.ql-picker-label]:text-gray-600
            [&_.ql-toolbar_.ql-picker-label:hover]:text-[#0066CC]
            [&_.ql-toolbar_.ql-picker-options]:rounded-md
            [&_.ql-toolbar_.ql-picker-options]:border
            [&_.ql-toolbar_.ql-picker-options]:border-gray-200
            [&_.ql-toolbar_.ql-picker-options]:shadow-lg
            [&_.ql-toolbar_.ql-picker-options]:ring-1
            [&_.ql-toolbar_.ql-picker-options]:ring-gray-100
            [&_.ql-toolbar_.ql-picker-item]:text-sm
            [&_.ql-toolbar_.ql-picker-item]:text-gray-700
            [&_.ql-toolbar_.ql-picker-item:hover]:bg-gray-50

            /* CONTAINER */
            [&_.ql-container]:!border-0
            [&_.ql-container]:!shadow-none

            /* EDITOR AREA */
            [&_.ql-container_.ql-editor]:min-h-[8rem]
            [&_.ql-container_.ql-editor]:p-0
            [&_.ql-container_.ql-editor]:text-gray-900
            [&_.ql-container_.ql-editor]:leading-relaxed
            [&_.ql-container_.ql-editor]:selection:bg-[#0066CC22]

            /* headings inside editor */
            [&_.ql-container_.ql-editor_h1]:text-2xl
            [&_.ql-container_.ql-editor_h1]:font-bold
            [&_.ql-container_.ql-editor_h1]:tracking-tight
            [&_.ql-container_.ql-editor_h2]:text-xl
            [&_.ql-container_.ql-editor_h2]:font-semibold
            [&_.ql-container_.ql-editor_h2]:tracking-tight

            /* lists inside editor */
            [&_.ql-container_.ql-editor_ul]:list-disc
            [&_.ql-container_.ql-editor_ul]:pl-6
            [&_.ql-container_.ql-editor_ul_li]:mb-1.5
            [&_.ql-container_.ql-editor_ol]:list-decimal
            [&_.ql-container_.ql-editor_ol]:pl-6
            [&_.ql-container_.ql-editor_ol_li]:mb-1.5

            /* paragraphs / spacing */
            [&_.ql-container_.ql-editor_p]:mb-3
            [&_.ql-container_.ql-editor_p:last-child]:mb-0

            /* links */
            [&_.ql-container_.ql-editor_a]:text-[#0066CC]
            [&_.ql-container_.ql-editor_a]:underline
            [&_.ql-container_.ql-editor_a:hover]:text-[#004c99]
          `}
                />
            </div>
        </div>
    );
}
