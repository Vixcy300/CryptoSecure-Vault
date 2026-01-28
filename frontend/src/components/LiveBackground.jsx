import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

const LiveBackground = ({ children }) => {
    const canvasRef = useRef(null);
    const { isDark, colors } = useTheme();

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: true });
        let animationFrameId;
        let particles = [];

        // Configuration
        const particleCount = 70;
        const connectionDistance = 140;
        const moveSpeed = 0.4;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * moveSpeed;
                this.vy = (Math.random() - 0.5) * moveSpeed;
                this.size = Math.random() * 2 + 1;
                // Add gentle pulsing effect
                this.pulseSpeed = 0.02 + Math.random() * 0.03;
                this.pulse = Math.random() * Math.PI;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.pulse += this.pulseSpeed;

                // Bounce off edges
                if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
                if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * (1 + 0.3 * Math.sin(this.pulse)), 0, Math.PI * 2);
                ctx.fillStyle = isDark
                    ? `rgba(139, 92, 246, ${0.15 + 0.1 * Math.sin(this.pulse)})` // Purple pulse
                    : `rgba(99, 102, 241, ${0.1 + 0.1 * Math.sin(this.pulse)})`; // Indigo pulse
                ctx.fill();
            }
        }

        const init = () => {
            resize();
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw connections first (behind particles)
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.update();

                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < connectionDistance) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        const opacity = 1 - (distance / connectionDistance);
                        ctx.lineWidth = 1;
                        ctx.strokeStyle = isDark
                            ? `rgba(139, 92, 246, ${opacity * 0.12})` // Violet connections
                            : `rgba(99, 102, 241, ${opacity * 0.08})`; // Indigo connections
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
                p.draw();
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resize);
        init();
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isDark]);

    // Premium Background Gradients
    const bgStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: isDark
            ? 'radial-gradient(circle at 15% 50%, #2e1065 0%, #0f0f12 50%, #000000 100%)' // Deep Violet to Black
            : 'radial-gradient(circle at 50% 50%, #ffffff 0%, #f0f4ff 100%)', // Clean White/Blue
        zIndex: -1,
        overflow: 'hidden'
    };

    return (
        <>
            <div style={bgStyle}>
                <canvas
                    ref={canvasRef}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                    }}
                />
            </div>
            {/* Content Container - Ensure it sits above background */}
            <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
                {children}
            </div>
        </>
    );
};

export default LiveBackground;
