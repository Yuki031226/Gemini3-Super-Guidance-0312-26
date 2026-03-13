import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
});

export default function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && chart) {
      ref.current.innerHTML = '';
      mermaid.render(`mermaid-${Math.random().toString(36).substring(7)}`, chart).then(({ svg }) => {
        if (ref.current) {
          ref.current.innerHTML = svg;
        }
      }).catch(e => console.error(e));
    }
  }, [chart]);

  return <div ref={ref} className="flex justify-center overflow-auto" />;
}
