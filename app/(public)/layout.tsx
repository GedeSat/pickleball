// app/(public)/layout.tsx
import React from "react";
import Navbar from "../../components/navbar"; 
import Footer from "../../components/footer"; 

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="public">
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var theme = localStorage.getItem('theme');
                var dark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (dark) document.documentElement.classList.add('dark');
              } catch(e) {}
            })();
          `,
        }}
      />
      <Navbar />
      <div className="min-h-screen pt-20 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">{children}</div>
      <Footer />
    </div>
  );
}