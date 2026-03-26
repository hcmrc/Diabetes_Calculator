/**
 * @fileoverview Interactive Tutorial Module
 *
 * Guides users through 7 interface sections with simultaneous small
 * explanation cards connected by SVG lines to their target elements.
 * Global nav bar handles Prev/Next/Close. Fully i18n-aware.
 *
 * Uses a two-pass rendering approach to avoid card overlaps:
 *  1. Render all cards hidden to measure their actual rendered heights.
 *  2. Compute positions using real dimensions.
 *  3. Run multi-directional collision resolution (3 passes).
 *  4. Apply positions and make visible.
 *
 * @module Tutorial
 * @memberof DRC
 */

'use strict';

window.DRC = window.DRC || {};

DRC.Tutorial = (() => {

    // ─── Step Definitions ──────────────────────────────────────────────
    // Each step highlights one sectionSelector and shows cards for each item.
    // titleKey/textKey: looked up via DRC.I18n.t().
    const STEPS = [
        {
            sectionSelector: 'nav.top-nav',
            titleKey: 'tutorial.steps.nav.title',
            items: [
                {
                    selector: '#resetBtn',
                    titleKey: 'tutorial.steps.nav.resetBtn.title',
                    textKey:  'tutorial.steps.nav.resetBtn.text'
                },
                {
                    selector: '#timelineToggleBtn',
                    titleKey: 'tutorial.steps.nav.timelineBtn.title',
                    textKey:  'tutorial.steps.nav.timelineBtn.text'
                },
                {
                    selector: '#patientMenuBtn',
                    titleKey: 'tutorial.steps.nav.patientBtn.title',
                    textKey:  'tutorial.steps.nav.patientBtn.text'
                },
                {
                    selector: '#settingsBtn',
                    titleKey: 'tutorial.steps.nav.settingsBtn.title',
                    textKey:  'tutorial.steps.nav.settingsBtn.text'
                }
            ]
        },
        {
            sectionSelector: '#risk-score-card',
            titleKey: 'tutorial.steps.hero.title',
            items: [
                {
                    selector: '#risk-percentage',
                    titleKey: 'tutorial.steps.hero.percentage.title',
                    textKey:  'tutorial.steps.hero.percentage.text'
                },
                {
                    selector: '#expandHeroBtn',
                    titleKey: 'tutorial.steps.hero.expand.title',
                    textKey:  'tutorial.steps.hero.expand.text'
                }
            ]
        },
        {
            sectionSelector: '#timeline-expandable',
            titleKey: 'tutorial.steps.timeline.title',
            items: [
                {
                    selector: '#snapshotBtn',
                    titleKey: 'tutorial.steps.timeline.snapshot.title',
                    textKey:  'tutorial.steps.timeline.snapshot.text'
                },
                {
                    selector: '#compareScenarioBtn',
                    titleKey: 'tutorial.steps.timeline.baseline.title',
                    textKey:  'tutorial.steps.timeline.baseline.text'
                },
                {
                    selector: '#timeline-chart',
                    titleKey: 'tutorial.steps.timeline.chart.title',
                    textKey:  'tutorial.steps.timeline.chart.text'
                }
            ]
        },
        {
            sectionSelector: '#panel-input',
            titleKey: 'tutorial.steps.input.title',
            items: [
                {
                    selector: '#panel-input h2',
                    titleKey: 'tutorial.steps.input.demographic.title',
                    textKey:  'tutorial.steps.input.demographic.text'
                },
                {
                    selector: '#age-slider',
                    titleKey: 'tutorial.steps.input.sliders.title',
                    textKey:  'tutorial.steps.input.sliders.text'
                },
                {
                    selector: '#age-value',
                    titleKey: 'tutorial.steps.input.valuebox.title',
                    textKey:  'tutorial.steps.input.valuebox.text'
                },
                {
                    selector: '.toggle-switch',
                    titleKey: 'tutorial.steps.input.toggle.title',
                    textKey:  'tutorial.steps.input.toggle.text'
                }
            ]
        },
        {
            sectionSelector: '#panel-model',
            titleKey: 'tutorial.steps.model.title',
            items: [
                {
                    selector: '.model-tabs',
                    titleKey: 'tutorial.steps.model.tabs.title',
                    textKey:  'tutorial.steps.model.tabs.text'
                },
                {
                    selector: '#contribution-chart',
                    titleKey: 'tutorial.steps.model.contributions.title',
                    textKey:  'tutorial.steps.model.contributions.text'
                },
                {
                    selector: '#causality-chain',
                    titleKey: 'tutorial.steps.model.causality.title',
                    textKey:  'tutorial.steps.model.causality.text'
                }
            ]
        },
        {
            sectionSelector: '#panel-treatment',
            titleKey: 'tutorial.steps.treatment.title',
            items: [
                {
                    selector: '.tov-title',
                    titleKey: 'tutorial.steps.treatment.cards.title',
                    textKey:  'tutorial.steps.treatment.cards.text'
                },
                {
                    selector: '.btn-simulate-treatment',
                    titleKey: 'tutorial.steps.treatment.simulate.title',
                    textKey:  'tutorial.steps.treatment.simulate.text'
                }
            ]
        }
    ];

    // ─── Constants ─────────────────────────────────────────────────────
    const CARD_W         = 220;
    const CARD_MARGIN    = 44;   // gap between card and its target element
    const EDGE_PAD       = 10;   // minimum distance from viewport edges
    const OVERLAP_PAD    = 14;   // gap enforced between cards
    const RESOLVE_PASSES = 6;    // collision-resolution iterations (card↔card)
    const TARGET_PASSES  = 4;    // collision-resolution iterations (card↔targets)

    // ─── State ─────────────────────────────────────────────────────────
    let _currentStep  = 0;
    let _active       = false;
    let _cardEls      = [];
    let _resizeTimer  = null;
    let _escHandler   = null;
    let _langUnsub    = null;

    // ─── Cached DOM references (set in start()) ─────────────────────────
    let _overlayEl = null;
    let _svgEl     = null;
    let _navBarEl  = null;
    let _prevBtn   = null;
    let _nextBtn   = null;
    let _stepLabel = null;

    // ─── Helpers ───────────────────────────────────────────────────────
    const _t  = (key) => (DRC.I18n ? DRC.I18n.t(key) : key);
    const _el = (selector) => document.querySelector(selector);

    // ─── Card Positioning ──────────────────────────────────────────────
    /**
     * Compute {left, top} for a card of given dimensions relative to targetRect.
     * Preference order: right → left → below → above.
     * Always clamps to viewport with EDGE_PAD clearance.
     *
     * @param {DOMRect} targetRect
     * @param {number}  cardW
     * @param {number}  cardH
     * @returns {{ left: number, top: number }}
     */
    const _computeCardPos = (targetRect, cardW, cardH) => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        const clampLeft = (l) => Math.min(Math.max(l, EDGE_PAD), vw - cardW - EDGE_PAD);
        const clampTop  = (t) => Math.min(Math.max(t, EDGE_PAD), vh - cardH - EDGE_PAD);

        // Center card vertically on the target's midpoint (right/left placements)
        const tCy = targetRect.top + targetRect.height / 2;
        const centeredTop  = clampTop(tCy - cardH / 2);

        // Center card horizontally on the target's midpoint (above/below placements)
        const tCx = targetRect.left + targetRect.width / 2;
        const centeredLeft = clampLeft(tCx - cardW / 2);

        // ── Nav / top-of-viewport elements (e.g. sticky nav bar) ──
        // Always place the card BELOW so the line is short and vertical,
        // not a long diagonal across the page.
        const isTopElement = targetRect.bottom < 80;
        if (isTopElement) {
            if (targetRect.bottom + CARD_MARGIN + cardH <= vh - EDGE_PAD) {
                return { top: targetRect.bottom + CARD_MARGIN, left: centeredLeft, dir: 'below' };
            }
            // If somehow there is no room below (very small viewport), fall back below anyway
            return { top: clampTop(targetRect.bottom + 8), left: centeredLeft, dir: 'below' };
        }

        // ── General elements ──
        // Try right
        if (targetRect.right + CARD_MARGIN + cardW <= vw - EDGE_PAD) {
            return { left: targetRect.right + CARD_MARGIN, top: centeredTop, dir: 'right' };
        }
        // Try left
        if (targetRect.left - CARD_MARGIN - cardW >= EDGE_PAD) {
            return { left: targetRect.left - CARD_MARGIN - cardW, top: centeredTop, dir: 'left' };
        }
        // Try below
        if (targetRect.bottom + CARD_MARGIN + cardH <= vh - EDGE_PAD) {
            return { top: targetRect.bottom + CARD_MARGIN, left: centeredLeft, dir: 'below' };
        }
        // Fallback: above
        return {
            top:  clampTop(targetRect.top - CARD_MARGIN - cardH),
            left: centeredLeft,
            dir:  'above'
        };
    };

    /**
     * Multi-directional collision resolution.
     * Runs RESOLVE_PASSES iterations, nudging overlapping cards in the
     * direction that requires the least movement (up, down, left, or right).
     *
     * @param {{ left: number, top: number, w: number, h: number }[]} positions
     * @returns {typeof positions}
     */
    const _resolveOverlaps = (positions) => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        for (let pass = 0; pass < RESOLVE_PASSES; pass++) {
            for (let i = 0; i < positions.length; i++) {
                for (let j = i + 1; j < positions.length; j++) {
                    const a = positions[i];
                    const b = positions[j];
                    if (!a || !b) continue;

                    const xOverlap = a.left < b.left + b.w && a.left + a.w > b.left;
                    const yOverlap = a.top  < b.top  + b.h && a.top  + a.h > b.top;

                    if (!xOverlap || !yOverlap) continue;

                    // Compute overlap depths in all four directions
                    const overlapRight  = (a.left + a.w) - b.left;           // push b right
                    const overlapLeft   = (b.left + b.w) - a.left;           // push b left
                    const overlapDown   = (a.top  + a.h) - b.top;            // push b down
                    const overlapUp     = (b.top  + b.h) - a.top;            // push b up

                    const minOverlap = Math.min(overlapRight, overlapLeft, overlapDown, overlapUp);

                    if (minOverlap === overlapDown) {
                        // Nudge b downward
                        b.top = a.top + a.h + OVERLAP_PAD;
                        b.top = Math.min(b.top, vh - b.h - EDGE_PAD);
                    } else if (minOverlap === overlapUp) {
                        // Nudge b upward
                        b.top = a.top - b.h - OVERLAP_PAD;
                        b.top = Math.max(b.top, EDGE_PAD);
                    } else if (minOverlap === overlapRight) {
                        // Nudge b rightward
                        b.left = a.left + a.w + OVERLAP_PAD;
                        b.left = Math.min(b.left, vw - b.w - EDGE_PAD);
                    } else {
                        // Nudge b leftward
                        b.left = a.left - b.w - OVERLAP_PAD;
                        b.left = Math.max(b.left, EDGE_PAD);
                    }
                }
            }
        }

        return positions;
    };

    /**
     * Push cards away from ALL target element rects (not just their own).
     * Prevents a card from sitting on top of a button it is not explaining.
     *
     * @param {{ left, top, w, h }[]} positions
     * @param {DOMRect[]}             targetRects
     * @returns {typeof positions}
     */
    const _resolveTargetOverlaps = (positions, targetRects) => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const buf = OVERLAP_PAD + 6;   // extra buffer around each target

        for (let pass = 0; pass < TARGET_PASSES; pass++) {
            for (let i = 0; i < positions.length; i++) {
                const card = positions[i];
                if (!card) continue;

                for (let j = 0; j < targetRects.length; j++) {
                    const tr = targetRects[j];
                    if (!tr) continue;

                    // Expand target bounding box by buffer
                    const tLeft   = tr.left   - buf;
                    const tTop    = tr.top    - buf;
                    const tRight  = tr.right  + buf;
                    const tBottom = tr.bottom + buf;

                    const xOvlp = card.left < tRight  && card.left + card.w > tLeft;
                    const yOvlp = card.top  < tBottom && card.top  + card.h > tTop;

                    if (!xOvlp || !yOvlp) continue;

                    // Overlap depths (how far each edge intrudes)
                    const dRight  = (card.left + card.w) - tLeft;   // push card left
                    const dLeft   = tRight  - card.left;             // push card right
                    const dBottom = (card.top  + card.h) - tTop;    // push card up
                    const dTop    = tBottom - card.top;              // push card down

                    const minD = Math.min(dRight, dLeft, dBottom, dTop);

                    if (minD === dBottom) {
                        card.top = tTop - card.h - buf;
                        card.top = Math.max(card.top, EDGE_PAD);
                    } else if (minD === dTop) {
                        card.top = tBottom + buf;
                        card.top = Math.min(card.top, vh - card.h - EDGE_PAD);
                    } else if (minD === dRight) {
                        card.left = tLeft - card.w - buf;
                        card.left = Math.max(card.left, EDGE_PAD);
                    } else {
                        card.left = tRight + buf;
                        card.left = Math.min(card.left, vw - card.w - EDGE_PAD);
                    }
                }
            }
        }

        return positions;
    };

    // ─── SVG Lines ─────────────────────────────────────────────────────
    /**
     * Draw pointer lines from each card edge to its target element center.
     *
     * @param {{ selector: string }[]} items
     */
    const _drawLines = (items) => {
        if (!_svgEl) return;
        while (_svgEl.firstChild) _svgEl.removeChild(_svgEl.firstChild);

        const ns = 'http://www.w3.org/2000/svg';

        items.forEach((item, i) => {
            const card   = _cardEls[i];
            const target = _el(item.selector);
            if (!card || !target) return;

            const cRect = card.getBoundingClientRect();
            const tRect = target.getBoundingClientRect();

            // Skip invisible elements (e.g. inside collapsed panels)
            if (tRect.width === 0 && tRect.height === 0) return;

            // Target center
            const tx = tRect.left + tRect.width  / 2;
            const ty = tRect.top  + tRect.height / 2;

            // Nearest point on card edge toward target (line exits card cleanly)
            const x1 = Math.min(Math.max(tx, cRect.left), cRect.right);
            const y1 = Math.min(Math.max(ty, cRect.top),  cRect.bottom);

            // Dashed line – no arrowhead, terminates at target dot
            const line = document.createElementNS(ns, 'line');
            line.setAttribute('x1',               x1);
            line.setAttribute('y1',               y1);
            line.setAttribute('x2',               tx);
            line.setAttribute('y2',               ty);
            line.setAttribute('stroke',           '#3b82f6');
            line.setAttribute('stroke-width',     '1.75');
            line.setAttribute('opacity',          '0.7');
            line.setAttribute('stroke-dasharray', '5 3');
            _svgEl.appendChild(line);

            // Filled dot ON the target – clearly marks the pointed-to element
            const dot = document.createElementNS(ns, 'circle');
            dot.setAttribute('cx',      tx);
            dot.setAttribute('cy',      ty);
            dot.setAttribute('r',       '5');
            dot.setAttribute('fill',    '#3b82f6');
            dot.setAttribute('opacity', '0.9');
            _svgEl.appendChild(dot);

            // Subtle highlight ring around the target element
            const ring = document.createElementNS(ns, 'rect');
            ring.setAttribute('x',            tRect.left - 3);
            ring.setAttribute('y',            tRect.top  - 3);
            ring.setAttribute('width',        tRect.width  + 6);
            ring.setAttribute('height',       tRect.height + 6);
            ring.setAttribute('rx',           '6');
            ring.setAttribute('fill',         'none');
            ring.setAttribute('stroke',       '#3b82f6');
            ring.setAttribute('stroke-width', '1.5');
            ring.setAttribute('opacity',      '0.45');
            _svgEl.insertBefore(ring, _svgEl.firstChild);  // rings behind lines/dots
        });
    };

    // ─── Card Rendering ────────────────────────────────────────────────
    const _clearCards = () => {
        _cardEls.forEach(el => el && el.parentNode && el.parentNode.removeChild(el));
        _cardEls = [];
        if (_svgEl) while (_svgEl.firstChild) _svgEl.removeChild(_svgEl.firstChild);
    };

    /**
     * Two-pass card builder.
     *
     * Pass 1 — Insert all cards with visibility:hidden so the browser
     *           can compute their actual rendered dimensions.
     * Pass 2 — Read getBoundingClientRect() for real heights, compute
     *           placement using actual dimensions, resolve collisions,
     *           apply positions, then reveal cards.
     *
     * @param {{ sectionSelector: string, items: object[] }} step
     */
    const _buildCards = (step) => {
        _clearCards();

        const targetRects = step.items.map(item => {
            const target = _el(item.selector);
            if (!target) return null;
            const rect = target.getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0) return null;
            return rect;
        });

        // ── Pass 1: Create hidden cards and append to DOM ───────────────
        step.items.forEach((item, i) => {
            if (!targetRects[i]) {
                _cardEls.push(null);
                return;
            }

            const card = document.createElement('div');
            card.className = 'tutorial-card';
            card.style.width      = CARD_W + 'px';
            card.style.position   = 'fixed';
            card.style.zIndex     = '9000';
            card.style.visibility = 'hidden';
            card.style.opacity    = '0';
            // Place offscreen temporarily so it doesn't cause scrollbars
            card.style.left = '-9999px';
            card.style.top  = '-9999px';

            const title = document.createElement('div');
            title.className   = 'tutorial-card-title';
            title.textContent = _t(item.titleKey);

            const text = document.createElement('p');
            text.className   = 'tutorial-card-text';
            text.textContent = _t(item.textKey);

            card.appendChild(title);
            card.appendChild(text);
            document.body.appendChild(card);
            _cardEls.push(card);
        });

        // ── Pass 2: Measure actual heights, compute positions, resolve ──
        const positions = step.items.map((item, i) => {
            const card       = _cardEls[i];
            const targetRect = targetRects[i];
            if (!card || !targetRect) return null;

            const cardRect = card.getBoundingClientRect();
            const cardH    = cardRect.height || 120; // safe fallback

            const pos = _computeCardPos(targetRect, CARD_W, cardH);
            return { left: pos.left, top: pos.top, w: CARD_W, h: cardH };
        });

        _resolveOverlaps(positions);
        _resolveTargetOverlaps(positions, targetRects);
        _resolveOverlaps(positions);   // card↔card pass after target avoidance

        // ── Final anti-cycle stack pass ────────────────────────────────
        // Sort cards top→bottom and push any horizontally-overlapping cards
        // strictly downward — no upward moves, so no cycles.
        const _finalStack = () => {
            const vhFS = window.innerHeight;
            const flat = positions
                .map((p, idx) => (p ? { ...p, idx } : null))
                .filter(Boolean)
                .sort((a, b) => a.top - b.top);

            for (let fi = 0; fi < flat.length; fi++) {
                const a = flat[fi];
                for (let fj = fi + 1; fj < flat.length; fj++) {
                    const b = flat[fj];
                    const xOvlp = a.left < b.left + b.w && a.left + a.w > b.left;
                    if (!xOvlp) continue;
                    const minTop = a.top + a.h + OVERLAP_PAD;
                    if (b.top < minTop) {
                        b.top = Math.min(minTop, vhFS - b.h - EDGE_PAD);
                        positions[b.idx].top = b.top;
                    }
                }
            }
        };
        _finalStack();

        // Apply computed positions and fade cards in
        step.items.forEach((item, i) => {
            const card = _cardEls[i];
            const pos  = positions[i];
            if (!card || !pos) return;

            card.style.left       = pos.left + 'px';
            card.style.top        = pos.top  + 'px';
            card.style.visibility = 'visible';
            // Trigger fade-in on next frame so the position is applied first
            requestAnimationFrame(() => { card.style.opacity = '1'; });
        });

        // Draw lines after cards are positioned (getBoundingClientRect is accurate now)
        _drawLines(step.items);
    };

    // ─── Section Highlighting ──────────────────────────────────────────
    const _highlight = (step) => {
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
        const section = _el(step.sectionSelector);
        if (section) {
            section.classList.add('tutorial-highlight');
            section.scrollIntoView({ behavior: 'instant', block: 'nearest' });
        }
    };

    // ─── Nav Bar Update ────────────────────────────────────────────────
    const _updateNav = () => {
        const step   = STEPS[_currentStep];
        const n      = _currentStep + 1;
        const total  = STEPS.length;
        const isLast = _currentStep === STEPS.length - 1;

        if (_stepLabel) {
            _stepLabel.textContent = _t('tutorial.stepLabel')
                .replace('{n}',     String(n))
                .replace('{total}', String(total))
                .replace('{title}', _t(step.titleKey));
        }

        if (_prevBtn) _prevBtn.disabled = (_currentStep === 0);

        if (_nextBtn) {
            const textSpan = _nextBtn.querySelector('[data-i18n]') || _nextBtn.querySelector('span');
            if (textSpan) {
                textSpan.textContent = isLast ? _t('tutorial.finish') : _t('tutorial.next');
                textSpan.removeAttribute('data-i18n');
            }
        }
    };

    // ─── Step Rendering ────────────────────────────────────────────────
    const _renderStep = (index) => {
        _currentStep = index;
        const step   = STEPS[index];

        // Ensure timeline panel is open before rendering its step;
        // elements inside collapsed panels have zero-size bounding rects.
        if (step.sectionSelector === '#timeline-expandable') {
            const timelineEl = _el('#timeline-expandable');
            if (timelineEl && !timelineEl.classList.contains('open')) {
                timelineEl.classList.add('open');
            }
        }

        _highlight(step);
        _updateNav();
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (_active) _buildCards(step);
            });
        });
    };

    // ─── Resize Handler ────────────────────────────────────────────────
    const _onResize = () => {
        clearTimeout(_resizeTimer);
        _resizeTimer = setTimeout(() => {
            if (_active) _renderStep(_currentStep);
        }, 100);
    };

    // ─── Public API ────────────────────────────────────────────────────
    const start = () => {
        if (_active) return;

        _overlayEl = document.getElementById('tutorialOverlay');
        _svgEl     = document.getElementById('tutorialLines');
        _navBarEl  = document.getElementById('tutorialNav');
        _prevBtn   = document.getElementById('tutorialPrevBtn');
        _nextBtn   = document.getElementById('tutorialNextBtn');
        _stepLabel = document.getElementById('tutorialStepLabel');

        if (!_overlayEl || !_svgEl || !_navBarEl) return;

        _active      = true;
        _currentStep = 0;

        _overlayEl.style.display = 'block';
        _svgEl.style.display     = 'block';
        _navBarEl.style.display  = 'flex';
        document.body.classList.add('tutorial-active');

        if (DRC.UIHelpers && DRC.UIHelpers.refreshIcons) DRC.UIHelpers.refreshIcons();

        _escHandler = (e) => { if (e.key === 'Escape') stop(); };
        document.addEventListener('keydown', _escHandler);

        if (DRC.I18n && DRC.I18n.onLanguageChange) {
            _langUnsub = DRC.I18n.onLanguageChange(() => {
                if (_active) _renderStep(_currentStep);
            });
        }

        window.addEventListener('resize', _onResize);

        _renderStep(0);
    };

    const stop = () => {
        if (!_active) return;
        _active = false;

        _clearCards();
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
        document.body.classList.remove('tutorial-active');

        if (_overlayEl) _overlayEl.style.display = 'none';
        if (_svgEl)     _svgEl.style.display     = 'none';
        if (_navBarEl)  _navBarEl.style.display  = 'none';

        if (_escHandler) {
            document.removeEventListener('keydown', _escHandler);
            _escHandler = null;
        }
        if (_langUnsub) {
            _langUnsub();
            _langUnsub = null;
        }
        window.removeEventListener('resize', _onResize);
        _currentStep = 0;
    };

    const next = () => {
        if (!_active) return;
        if (_currentStep >= STEPS.length - 1) { stop(); return; }
        _renderStep(_currentStep + 1);
    };

    const prev = () => {
        if (!_active || _currentStep <= 0) return;
        _renderStep(_currentStep - 1);
    };

    const isActive = () => _active;

    return { start, stop, next, prev, isActive };
})();
