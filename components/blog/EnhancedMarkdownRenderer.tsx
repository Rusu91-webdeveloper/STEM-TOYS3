"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface EnhancedMarkdownRendererProps {
  content: string;
}

export default function EnhancedMarkdownRenderer({
  content,
}: EnhancedMarkdownRendererProps) {
  // Check if content contains HTML tags
  const hasHtmlTags = /<[^>]*>/g.test(content);

  // If content contains HTML tags, render it as HTML
  if (hasHtmlTags) {
    return (
      <div
        className="enhanced-blog-content"
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
    <div className="enhanced-blog-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 mt-12 first:mt-0 leading-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 mt-16 first:mt-0 leading-tight border-l-4 border-blue-500 pl-6">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-6 mt-12 leading-tight">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4 mt-10 leading-tight">
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 mt-8 leading-tight">
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-base md:text-lg font-semibold text-gray-800 mb-3 mt-6 leading-tight">
              {children}
            </h6>
          ),
          p: ({ children }) => (
            <p className="text-gray-700 leading-8 mb-8 text-lg font-normal">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-gray-900 bg-gradient-to-r from-blue-50 to-indigo-50 px-1 rounded">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-800 font-medium">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="my-8 space-y-4">
              {React.Children.map(children, (child, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-3"></div>
                  <div className="flex-1 text-gray-700 leading-7 text-lg">
                    {child}
                  </div>
                </li>
              ))}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-8 space-y-4 list-decimal list-inside">
              {React.Children.map(children, (child, index) => (
                <li
                  key={index}
                  className="text-gray-700 leading-7 text-lg marker:text-blue-500 marker:font-bold"
                >
                  {child}
                </li>
              ))}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-700 leading-7 text-lg">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-8 py-6 my-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-r-2xl italic text-gray-800 text-xl font-medium relative">
              <div className="absolute top-4 right-6 text-blue-400 text-4xl">
                "
              </div>
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-gray-100 px-3 py-1 rounded-lg text-sm font-mono text-gray-800 border border-gray-200">
                  {children}
                </code>
              );
            }
            return (
              <code className="bg-gray-100 px-3 py-1 rounded-lg text-sm font-mono text-gray-800 border border-gray-200">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 rounded-2xl overflow-x-auto my-8 font-mono text-sm shadow-2xl border border-gray-700">
              {children}
            </pre>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-blue-600 hover:text-blue-800 underline decoration-blue-300 hover:decoration-blue-600 transition-all duration-300 font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <div className="my-12">
              <img
                src={src}
                alt={alt}
                className="rounded-2xl shadow-2xl max-w-full h-auto mx-auto border-4 border-white"
              />
              {alt && (
                <p className="text-center text-gray-600 mt-4 text-sm italic">
                  {alt}
                </p>
              )}
            </div>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-12">
              <table className="w-full border-collapse border border-gray-300 rounded-2xl overflow-hidden shadow-lg">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 font-bold px-6 py-4 text-left border-b border-gray-300">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-6 py-4 border-b border-gray-200 text-gray-700">
              {children}
            </td>
          ),
          tr: ({ children, ...props }) => {
            return (
              <tr
                className="hover:bg-gray-50 transition-colors duration-200"
                {...props}
              >
                {children}
              </tr>
            );
          },
          hr: () => (
            <hr className="my-16 border-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
          ),
        }}
      >
        {cleanContent}
      </ReactMarkdown>
    </div>
  );
}
