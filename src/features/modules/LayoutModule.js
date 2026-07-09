/**
 * @file features/modules/LayoutModule.js
 * @description Manages viewport shell mechanics: step navigation, panel visibility, sticky footer
 *              switching, and scrollable main-content constraints for the 3-page workflow.
 * @dependencies features/components/Layout.js
 * @state currentStep (number), onStepChange callback, getMaxAccessibleStep resolver.
 */

import {
  activateStepPanel,
  bindStepNavigation,
  enhanceFooterSlots,
  syncFooterPanel,
  syncStepIndicator,
} from '../components/Layout.js';

export class LayoutModule {
  /**
   * @description Initializes layout shell bindings against the static index.html structure.
   * @param {object} [options]
   * @param {number} [options.initialStep=1] Starting workflow step.
   * @param {() => number} [options.getMaxAccessibleStep] Resolver for gated step navigation.
   * @param {(step: number) => void} [options.onStepChange] Fired after a step transition completes.
   */
  constructor(options = {}) {
    /** @type {number} */
    this.currentStep = options.initialStep ?? 1;

    /** @type {() => number} */
    this.getMaxAccessibleStep = options.getMaxAccessibleStep ?? (() => 3);

    /** @type {(step: number) => void} */
    this.onStepChange = options.onStepChange ?? (() => {});

    enhanceFooterSlots();
    this._bindNavigation();
    this.goToStep(this.currentStep, { silent: true });
  }

  /**
   * @description Wires header step-node clicks to guarded navigation.
   * @returns {void}
   * @private
   */
  _bindNavigation() {
    bindStepNavigation((step) => this.goToStep(step), () => this.getMaxAccessibleStep());

    document.getElementById('btn-back-template')?.addEventListener('click', () => this.goToStep(1));
    document.getElementById('btn-back-data')?.addEventListener('click', () => this.goToStep(2));
  }

  /**
   * @description Returns the active workflow step.
   * @returns {number}
   */
  getCurrentStep() {
    return this.currentStep;
  }

  /**
   * @description Transitions the shell to a workflow step, updating header, panels, and footer.
   * @param {number} step Target step (1, 2, or 3).
   * @param {object} [options]
   * @param {boolean} [options.silent=false] When true, skips onStepChange callback (bootstrap only).
   * @returns {void}
   */
  goToStep(step, { silent = false } = {}) {
    this.currentStep = step;

    activateStepPanel(step);
    syncStepIndicator(step, this.getMaxAccessibleStep());
    syncFooterPanel(step);

    if (!silent) {
      this.onStepChange(step);
    }
  }
}
