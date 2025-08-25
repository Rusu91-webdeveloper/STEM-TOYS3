"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Check if content contains HTML tags
  const hasHtmlTags = /<[^>]*>/g.test(content);

  // If content contains HTML tags, render it as HTML
  if (hasHtmlTags) {
    return (
      <div
        className="blog-content"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Clean the content to ensure no raw markdown characters are left
  const cleanContent = content
    .replace(/\\#/g, "#") // Unescape escaped hashes
    .replace(/\\\*/g, "*") // Unescape escaped asterisks
    .replace(/\\`/g, "`") // Unescape escaped backticks
    .trim();

  // Otherwise, render as markdown
  return (
    <div className="blog-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold text-gray-800 mb-6 mt-8 first:mt-0 border-b border-gray-200 pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-12 border-b border-gray-200 pb-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-8">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-lg font-semibold text-gray-800 mb-3 mt-6">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-gray-700 leading-7 mb-6 text-lg">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-800">{children}</em>
          ),
          ul: ({ children }) => <ul className="my-6 space-y-2">{children}</ul>,
          ol: ({ children }) => (
            <ol className="my-6 space-y-2 list-decimal list-inside">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-700 leading-6 relative pl-6">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-6 py-4 my-8 bg-blue-50 rounded-r-lg italic text-gray-700">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
                  {children}
                </code>
              );
            }
            return (
              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto my-6 font-mono text-sm">
              {children}
            </pre>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-blue-600 hover:text-blue-800 underline decoration-blue-300 hover:decoration-blue-600 transition-colors duration-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt}
              className="rounded-lg shadow-lg my-8 max-w-full h-auto"
            />
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-8">
              <table className="w-full border-collapse border border-gray-300 rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="bg-gray-100 text-gray-900 font-semibold px-4 py-3 text-left border-b border-gray-300">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 border-b border-gray-200 text-gray-700">
              {children}
            </td>
          ),
          tr: ({ children, ...props }) => {
            const isLast = React.Children.count(children) === 0;
            return (
              <tr className={isLast ? "" : ""} {...props}>
                {children}
              </tr>
            );
          },
          hr: () => <hr className="my-8 border-gray-300" />,
        }}
      >
        {cleanContent}
      </ReactMarkdown>
    </div>
  );
}
