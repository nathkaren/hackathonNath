"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

interface AnalysisRendererProps {
  content: string;
}

const components: Components = {
  h2: ({ children }) => (
    <h2 className="text-xl font-bold text-white mt-8 mb-3 pb-2 border-b border-[#262626]">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-semibold text-blue-400 mt-6 mb-2">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-base font-semibold text-[#a3a3a3] mt-4 mb-1">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="text-sm text-[#d4d4d4] leading-relaxed mb-3">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="text-white font-semibold">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="text-[#a3a3a3] italic">{children}</em>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside space-y-1 mb-4 text-sm text-[#d4d4d4] ml-2">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside space-y-1 mb-4 text-sm text-[#d4d4d4] ml-2">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  table: ({ children }) => (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-[#1a1a1a] border-b border-[#333333]">
      {children}
    </thead>
  ),
  th: ({ children }) => (
    <th className="text-left text-xs font-semibold text-[#a3a3a3] uppercase tracking-wide px-4 py-2.5">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2 text-[#d4d4d4] border-b border-[#1f1f1f]">
      {children}
    </td>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <pre className="bg-[#0d0d0d] border border-[#262626] rounded-xl p-4 overflow-x-auto mb-4">
          <code className="text-xs text-[#a3a3a3] font-mono">{children}</code>
        </pre>
      );
    }
    return (
      <code className="bg-[#1f1f1f] text-blue-300 text-xs font-mono px-1.5 py-0.5 rounded">
        {children}
      </code>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-blue-500/40 bg-blue-500/5 pl-4 py-2 my-4 rounded-r-lg">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-[#262626] my-6" />,
};

export function AnalysisRenderer({ content }: AnalysisRendererProps) {
  return (
    <div className="prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
