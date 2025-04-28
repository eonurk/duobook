import React from 'react';

export function SiteFooter() {
  return (
    <footer className="py-6 md:px-8 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
          DuoBook is a language learning tool that allows you to create your own story and learn a language at the same time.
        </p>
      </div>
    </footer>
  );
}

export default SiteFooter; 