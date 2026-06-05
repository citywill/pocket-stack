import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
    startOnLoad: true,
    theme: 'default',
    securityLevel: 'loose',
    fontFamily: 'inherit',
});

interface MermaidProps {
    chart: string;
}

const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ref.current && chart) {
            // 清空之前的内容
            ref.current.innerHTML = '';
            const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

            try {
                mermaid.render(id, chart).then(({ svg }: { svg: string }) => {
                    if (ref.current) {
                        ref.current.innerHTML = svg;
                    }
                });
            } catch (error) {
                console.error('Mermaid render error:', error);
                if (ref.current) {
                    ref.current.innerHTML = `<pre class="text-red-500 text-xs">${error}</pre>`;
                }
            }
        }
    }, [chart]);

    return (
        <div
            ref={ref}
            className="flex justify-center my-4 overflow-x-auto bg-slate-50/50 rounded-xl p-4"
        />
    );
};

export default Mermaid;
