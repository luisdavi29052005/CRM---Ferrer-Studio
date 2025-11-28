import React, { useEffect, useRef } from 'react';

export const GridBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: -1000, y: -1000 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let dots: Dot[] = [];
        let orbs: Orb[] = [];

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initGrid();
        };

        class Orb {
            x: number;
            y: number;
            vx: number;
            vy: number;
            radius: number;

            constructor() {
                this.radius = Math.random() * 150 + 100; // Effect radius
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 3; // Speed
                this.vy = (Math.random() - 0.5) * 3;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                // Bounce off edges with a buffer
                const buffer = this.radius;
                if (this.x < -buffer || this.x > canvas.width + buffer) this.vx = -this.vx;
                if (this.y < -buffer || this.y > canvas.height + buffer) this.vy = -this.vy;
            }
        }

        class Dot {
            x: number;
            y: number;
            baseX: number;
            baseY: number;
            size: number;
            baseAlpha: number;
            color: string;

            constructor(x: number, y: number) {
                this.x = x;
                this.y = y;
                this.baseX = x;
                this.baseY = y;
                this.size = 1.5;
                this.baseAlpha = 0.1; // Very dim by default
                this.color = '217, 119, 6'; // Bronze rgb
            }

            draw(orbs: Orb[]) {
                if (!ctx) return;

                // Mouse Repulsion
                let dx = mouseRef.current.x - this.x;
                let dy = mouseRef.current.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                let maxDistance = 200;

                if (distance < maxDistance) {
                    const force = (maxDistance - distance) / maxDistance;
                    const angle = Math.atan2(dy, dx);
                    const moveDistance = force * 40; // Max repulsion distance
                    this.x = this.baseX - Math.cos(angle) * moveDistance;
                    this.y = this.baseY - Math.sin(angle) * moveDistance;
                } else {
                    // Return to base
                    this.x += (this.baseX - this.x) * 0.1;
                    this.y += (this.baseY - this.y) * 0.1;
                }

                // Calculate Brightness based on Orbs
                let alpha = this.baseAlpha;
                orbs.forEach(orb => {
                    const dxOrb = orb.x - this.x;
                    const dyOrb = orb.y - this.y;
                    const distOrb = Math.sqrt(dxOrb * dxOrb + dyOrb * dyOrb);
                    if (distOrb < orb.radius) {
                        // Increase alpha based on proximity to orb center
                        const intensity = 1 - (distOrb / orb.radius);
                        // Use a curve for smoother falloff
                        const smoothIntensity = intensity * intensity;
                        alpha += smoothIntensity * 0.8;
                    }
                });

                // Cap alpha
                if (alpha > 1) alpha = 1;

                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${this.color}, ${alpha})`;
                ctx.fill();
            }
        }

        const initGrid = () => {
            dots = [];
            orbs = [];
            const spacing = 35; // Grid spacing
            for (let x = 0; x < canvas.width; x += spacing) {
                for (let y = 0; y < canvas.height; y += spacing) {
                    dots.push(new Dot(x, y));
                }
            }

            // Create a few orbs
            for (let i = 0; i < 4; i++) {
                orbs.push(new Orb());
            }
        };

        const animate = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update Orbs
            orbs.forEach(orb => orb.update());

            // Draw Dots
            dots.forEach(dot => dot.draw(orbs));

            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('mousemove', (e) => {
            mouseRef.current.x = e.clientX;
            mouseRef.current.y = e.clientY;
        });

        resizeCanvas();
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
        />
    );
};
