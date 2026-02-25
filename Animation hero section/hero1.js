document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const CONFIG = {
        lerpEase: 0.1,          // Smoothness of scroll interpolation (0-1)
        scrollThreshold: 50,    // Pixels to scroll before parallax kicks in strongly
        statDuration: 2000      // Duration for stats count-up animation in ms
    };

    // --- Element Selection ---
    const visual = document.getElementById('visual');
    const rings = document.querySelectorAll('.visual-ring');
    const letters = document.querySelectorAll('.letter');
    const subtitle = document.getElementById('subtitle');
    const statCards = document.querySelectorAll('.stat-card');
    const scrollIndicator = document.getElementById('scrollIndicator');
    const orbs = document.querySelectorAll('.bg-orb');

    // --- State ---
    let targetScrollY = 0;
    let currentScrollY = 0;
    let animationFrameId = null;
    let hasStatsAnimated = false;

    // --- Utility Functions ---
    
    // Linear Interpolation for smooth animations
    const lerp = (start, end, factor) => start + (end - start) * factor;
    
    // Clamp value between min and max
    const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
    
    // Map a value from one range to another
    const mapRange = (val, inMin, inMax, outMin, outMax) => {
        return clamp(outMin + (outMax - outMin) * ((val - inMin) / (inMax - inMin)), outMin, outMax);
    };

    // --- 1. Entrance Animations (On Load) ---
    const runEntranceAnimations = () => {
        // 1. Animate Letters
        letters.forEach((letter, i) => {
            // Set initial state via JS (ensures it works even if CSS is minimal)
            letter.style.opacity = '0';
            letter.style.transform = 'translateY(40px) rotateX(-90deg)';
            letter.style.transition = 'none'; // Disable transition for immediate JS set

            // Trigger reflow
            letter.offsetHeight; 

            // Apply transitions for entrance
            letter.style.transition = `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 40}ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 40}ms`;
            
            // Animate to final state
            requestAnimationFrame(() => {
                letter.style.opacity = '1';
                letter.style.transform = 'translateY(0) rotateX(0)';
            });
        });

        // 2. Animate Subtitle
        setTimeout(() => {
            subtitle.style.opacity = '0';
            subtitle.style.transform = 'translateY(20px)';
            subtitle.offsetHeight;
            subtitle.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            requestAnimationFrame(() => {
                subtitle.style.opacity = '1';
                subtitle.style.transform = 'translateY(0)';
            });
        }, 400);

        // 3. Animate Stat Cards
        statCards.forEach((card, i) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.offsetHeight;
            card.style.transition = `opacity 0.5s ease ${i * 100}ms, transform 0.5s ease ${i * 100}ms`;
            
            requestAnimationFrame(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            });
        });

        // Remove entrance transition styles after animation completes to not conflict with scroll
        setTimeout(() => {
            letters.forEach(l => l.style.transition = '');
            subtitle.style.transition = '';
            statCards.forEach(c => c.style.transition = '');
        }, 2000);
    };

    // --- 2. Statistics Counter Logic ---
    const animateStatsCounter = (el) => {
        const target = parseInt(el.dataset.count);
        const duration = CONFIG.statDuration;
        const startTime = performance.now();

        const updateCount = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            el.textContent = Math.floor(easeProgress * target);
            
            if (progress < 1) {
                requestAnimationFrame(updateCount);
            } else {
                el.textContent = target; // Ensure exact number at end
            }
        };
        requestAnimationFrame(updateCount);
    };

    const triggerStatsAnimation = () => {
        if (hasStatsAnimated) return;
        hasStatsAnimated = true;
        
        statCards.forEach(card => {
            const valueEl = card.querySelector('.stat-value');
            if(valueEl) animateStatsCounter(valueEl);
        });
    };

    // --- 3. Main Scroll Loop ---
    const onScroll = () => {
        targetScrollY = window.scrollY;
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(updateAnimation);
        }
    };

    const updateAnimation = () => {
        // Smooth interpolation of scroll value
        currentScrollY = lerp(currentScrollY, targetScrollY, CONFIG.lerpEase);

        const vh = window.innerHeight;
        const scrollProgress = clamp(currentScrollY / vh, 0, 1); // 0.0 to 1.0

        // A. Visual Container (Logo) Parallax & Scale
        // Move up faster than scroll, scale down, fade out
        const visualY = currentScrollY * 1.2;
        const visualScale = mapRange(currentScrollY, 0, vh * 0.5, 1, 0.5);
        const visualOpacity = mapRange(currentScrollY, 0, vh * 0.4, 1, 0);
        
        visual.style.transform = `translateY(-${visualY}px) scale(${visualScale})`;
        visual.style.opacity = visualOpacity;

        // B. Rings Rotation (Gyroscope Effect)
        // Rotate rings at different speeds based on scroll
        rings.forEach((ring, i) => {
            const speed = [0.15, 0.1, 0.2][i] || 0.1;
            const direction = i % 2 === 0 ? 1 : -1;
            const rotation = currentScrollY * speed * direction;
            // Prepend existing rotation if you have CSS keyframes, here we override
            ring.style.transform = `rotate(${rotation}deg)`;
        });

        // C. Headline Letters Parallax
        letters.forEach((letter, i) => {
            // Create a wave-like effect based on index
            const depth = 0.1 + (i % 5) * 0.05;
            const letterY = currentScrollY * depth;
            const letterOpacity = mapRange(currentScrollY, 0, vh * 0.3, 1, 0);
            
            letter.style.transform = `translateY(-${letterY}px)`;
            letter.style.opacity = letterOpacity;
        });

        // D. Subtitle Parallax
        const subtitleY = currentScrollY * 1.5;
        subtitle.style.transform = `translateY(-${subtitleY}px)`;
        subtitle.style.opacity = mapRange(currentScrollY, 0, vh * 0.2, 1, 0);

        // E. Background Orbs Parallax (Deep background)
        orbs.forEach((orb, i) => {
            const speed = [0.3, 0.2, 0.15][i] || 0.2;
            // Move down as we scroll down (or up depending on preference)
            // Parallax usually moves background slower, so it feels "stuck"
            orb.style.transform = `translateY(${currentScrollY * speed}px)`;
        });

        // F. Scroll Indicator
        scrollIndicator.style.opacity = mapRange(currentScrollY, 0, 100, 1, 0);
        scrollIndicator.style.transform = `translateY(${currentScrollY * 0.5}px)`;

        // G. Trigger Stats Animation when near top
        if (currentScrollY < vh * 0.1 && !hasStatsAnimated) {
            // Trigger slightly after load/entrance
             setTimeout(triggerStatsAnimation, 800);
        }

        // Continue Loop
        if (Math.abs(targetScrollY - currentScrollY) > 0.5) {
            animationFrameId = requestAnimationFrame(updateAnimation);
        } else {
            animationFrameId = null;
        }
    };

    // --- Initialize ---
    window.addEventListener('scroll', onScroll, { passive: true });
    
    // Run load animations
    runEntranceAnimations();
});