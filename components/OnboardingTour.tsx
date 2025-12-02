
import { driver, DriveStep } from "driver.js";

// Define the steps for the tour
const tourSteps: DriveStep[] = [
  {
    element: '#tour-upload-section',
    popover: {
      title: 'Digitize Your Music',
      description: 'Start here! Drag & drop sheet music images or PDFs, or type a description to generate music from scratch using AI.',
      side: "right",
      align: 'start'
    }
  },
  {
    element: '#tour-model-select',
    popover: {
      title: 'Select Your Model',
      description: 'Choose from the latest Gemini models. We recommend <strong>Gemini 3 Pro</strong> for the highest accuracy on complex scores.',
      side: "top",
      align: 'start'
    }
  },
  {
    element: '#tour-generate-btn',
    popover: {
      title: 'Generate',
      description: 'Click here to start the magic. Resonote will analyze the image and transcribe it into editable ABC notation.',
      side: "left",
      align: 'start'
    }
  },
  {
    element: '#tour-editor-toolbar',
    popover: {
      title: 'Edit & Refine',
      description: 'Use the code editor to tweak notes. Use tools here to <strong>Transpose</strong> instantly or fix key signatures.',
      side: "bottom",
      align: 'start'
    }
  },
  {
    element: '#tour-visualizer-panel',
    popover: {
      title: 'Interactive Preview',
      description: 'See your music come to life! This panel renders the score in real-time. You can play it back, mute tracks, and export.',
      side: "left",
      align: 'start'
    }
  }
];

export const startTour = (force = false) => {
  // Check if tour has been seen
  const hasSeenTour = localStorage.getItem('resonote_tour_seen');
  
  if (hasSeenTour && !force) return;

  const driverObj = driver({
    showProgress: true,
    steps: tourSteps,
    animate: true,
    allowClose: true,
    doneBtnText: 'Finish',
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    // Inject custom "Skip" button functionality
    onPopoverRendered: (popover) => {
      const footer = popover.wrapper.querySelector('.driver-popover-footer');
      const existingSkip = footer?.querySelector('.driver-popover-skip-btn');
      
      if (footer && !existingSkip) {
        const skipBtn = document.createElement('button');
        skipBtn.innerText = 'Skip Tour';
        skipBtn.className = 'driver-popover-skip-btn';
        skipBtn.onclick = () => {
          driverObj.destroy();
          localStorage.setItem('resonote_tour_seen', 'true');
        };
        // Prepend to be on the left
        footer.prepend(skipBtn);
      }
    },
    onDestroyed: () => {
        if (!hasSeenTour) {
            localStorage.setItem('resonote_tour_seen', 'true');
        }
    }
  });

  driverObj.drive();
};
