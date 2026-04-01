/**
 * @fileoverview Bootstrap entry point — initializes the application.
 *
 * Waits for DOMContentLoaded, then starts the App and PatientManager.
 * This file must be loaded last, after all module files.
 *
 * @memberof DRC
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize landing page first (will show for first-time users)
    if (DRC.LandingPage) {
        DRC.LandingPage.init();
    }

    DRC.App.init();
    DRC.PatientManager.init();

    const tutorialBtn   = document.getElementById('tutorialBtn');
    const tutorialPrev  = document.getElementById('tutorialPrevBtn');
    const tutorialNext  = document.getElementById('tutorialNextBtn');
    const tutorialClose = document.getElementById('tutorialCloseBtn');
    if (tutorialBtn) {
        tutorialBtn.addEventListener('click', () => {
            if (DRC.Tutorial.isActive()) {
                DRC.Tutorial.stop();
            } else {
                DRC.Tutorial.start();
            }
        });
    }
    if (tutorialPrev)  tutorialPrev.addEventListener('click', () => DRC.Tutorial.prev());
    if (tutorialNext)  tutorialNext.addEventListener('click', () => DRC.Tutorial.next());
    if (tutorialClose) tutorialClose.addEventListener('click', () => DRC.Tutorial.stop());
});
