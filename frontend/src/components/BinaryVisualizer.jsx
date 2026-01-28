import React, { useEffect, useRef } from 'react';

const BinaryVisualizer = ({ active, width = 300, height = 200, color = '#10b981' }) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        canvas.width = width;
        canvas.height = height;

        const fontSize = 14;
        const columns = width / fontSize;
        const drops = [];

        for (let x = 0; x < columns; x++) {
            drops[x] = 1;
        }

        const chars = '01';

        const draw = () => {
            if (!active) {
                // Dim effect when inactive
                ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                ctx.fillRect(0, 0, width, height);
                return;
            }

            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; // Trail effect
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = color;
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = chars.charAt(Math.floor(Math.random() * chars.length));
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > height && Math.random() > 0.975) {
                    drops[i] = 0;
                }

                drops[i]++;
            }

            animationRef.current = requestAnimationFrame(draw);
        };

        if (active) {
            draw();
        } else {
            // Draw static grid when inactive
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, width, height);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let x = 0; x < width; x += 20) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
            for (let y = 0; y < height; y += 20) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
            ctx.stroke();
        }

        return () => cancelAnimationFrame(animationRef.current);
    }, [active, width, height, color]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                borderRadius: '8px',
                boxShadow: active ? `0 0 20px ${color}40` : 'none',
                transition: 'box-shadow 0.3s'
            }}
        />
    );
};

export default BinaryVisualizer;
