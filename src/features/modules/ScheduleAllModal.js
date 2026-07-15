/**
 * @file features/modules/ScheduleAllModal.js
 * @description Modal to collect bulk schedule rules (platforms, frequency, slots, weekdays, start).
 */

import {
  SCHEDULE_ALL_PLATFORMS,
  WEEKDAY_OPTIONS,
  defaultSlotsForFrequency,
  planSchedules,
  summarizeSchedule,
  toLocalYmd,
} from '../domain/schedulePlanner.js';
import { setButtonText } from '../shared/uiIcons.js';

const DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5]; // Mon–Fri

/**
 * @param {HTMLElement | null} el
 * @param {boolean} hidden
 */
function setHidden(el, hidden) {
  if (!el) return;
  el.classList.toggle('hidden', hidden);
}

export class ScheduleAllModal {
  /**
   * @param {{ onConfirm: (plan: { platforms: string[], scheduledDates: Date[] }) => void | Promise<void> }} opts
   */
  constructor({ onConfirm }) {
    this.onConfirm = onConfirm;
    this.postCount = 0;
    this._slotValues = defaultSlotsForFrequency(1);

    this.overlay = document.getElementById('schedule-all-modal-overlay');
    this.form = document.getElementById('schedule-all-form');
    this.closeBtn = document.getElementById('schedule-all-modal-close');
    this.cancelBtn = document.getElementById('schedule-all-cancel');
    this.submitBtn = document.getElementById('schedule-all-submit');
    this.errorEl = document.getElementById('schedule-all-error');
    this.previewEl = document.getElementById('schedule-all-preview');
    this.descEl = document.getElementById('schedule-all-desc');
    this.platformsEl = document.getElementById('schedule-all-platforms');
    this.weekdaysEl = document.getElementById('schedule-all-weekdays');
    this.slotsEl = document.getElementById('schedule-all-slots');
    this.frequencyInput = document.getElementById('schedule-all-frequency');
    this.startDateInput = document.getElementById('schedule-all-start-date');

    this._renderPlatforms();
    this._renderWeekdays();
    this._bind();
  }

  _bind() {
    this.closeBtn?.addEventListener('click', () => this.close());
    this.cancelBtn?.addEventListener('click', () => this.close());
    this.overlay?.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
    this.form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this._handleSubmit();
    });
    this.frequencyInput?.addEventListener('change', () => this._onFrequencyChange());
    this.frequencyInput?.addEventListener('input', () => this._onFrequencyChange());
    this.startDateInput?.addEventListener('change', () => this._updatePreview());
    this.weekdaysEl?.addEventListener('change', () => this._updatePreview());
    this.platformsEl?.addEventListener('change', () => this._clearError());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay && !this.overlay.classList.contains('hidden')) {
        this.close();
      }
    });
  }

  _renderPlatforms() {
    if (!this.platformsEl) return;
    this.platformsEl.innerHTML = SCHEDULE_ALL_PLATFORMS.map(
      (p) => `
      <label class="platform-chip">
        <input type="checkbox" name="schedule-all-platform" value="${p.id}" />
        <span>${p.label}</span>
      </label>`
    ).join('');
  }

  _renderWeekdays() {
    if (!this.weekdaysEl) return;
    this.weekdaysEl.innerHTML = WEEKDAY_OPTIONS.map(
      (d) => `
      <label class="platform-chip schedule-weekday-chip">
        <input type="checkbox" name="schedule-all-weekday" value="${d.id}" ${
          DEFAULT_WEEKDAYS.includes(d.id) ? 'checked' : ''
        } />
        <span>${d.short}</span>
      </label>`
    ).join('');
  }

  _onFrequencyChange() {
    const freq = Math.max(1, Math.min(24, Math.floor(Number(this.frequencyInput?.value)) || 1));
    if (this.frequencyInput) this.frequencyInput.value = String(freq);

    const prev = this._collectSlotValues();
    if (prev.length === freq) {
      this._slotValues = prev;
    } else if (prev.length > 0 && prev.length < freq) {
      const extras = defaultSlotsForFrequency(freq).slice(prev.length);
      this._slotValues = [...prev, ...extras];
    } else {
      this._slotValues = defaultSlotsForFrequency(freq);
    }
    this._renderSlots();
    this._updatePreview();
  }

  _renderSlots() {
    if (!this.slotsEl) return;
    const slots = this._slotValues.length
      ? this._slotValues
      : defaultSlotsForFrequency(Number(this.frequencyInput?.value) || 1);

    this.slotsEl.innerHTML = slots
      .map(
        (value, i) => `
      <div class="form-group schedule-slot-field">
        <label for="schedule-all-slot-${i}">Time slot ${i + 1}</label>
        <input type="time" id="schedule-all-slot-${i}" class="text-input schedule-all-slot" value="${value}" required />
      </div>`
      )
      .join('');

    this.slotsEl.querySelectorAll('.schedule-all-slot').forEach((input) => {
      input.addEventListener('change', () => {
        this._slotValues = this._collectSlotValues();
        this._updatePreview();
      });
    });
  }

  /**
   * @returns {string[]}
   */
  _collectSlotValues() {
    if (!this.slotsEl) return [...this._slotValues];
    return [...this.slotsEl.querySelectorAll('.schedule-all-slot')].map((el) => el.value);
  }

  /**
   * @returns {string[]}
   */
  _selectedPlatforms() {
    return [...(this.platformsEl?.querySelectorAll('input[name="schedule-all-platform"]:checked') ?? [])].map(
      (el) => el.value
    );
  }

  /**
   * @returns {number[]}
   */
  _selectedWeekdays() {
    return [...(this.weekdaysEl?.querySelectorAll('input[name="schedule-all-weekday"]:checked') ?? [])].map(
      (el) => Number(el.value)
    );
  }

  _clearError() {
    if (this.errorEl) {
      this.errorEl.textContent = '';
      setHidden(this.errorEl, true);
    }
  }

  /**
   * @param {string} message
   */
  _showError(message) {
    if (!this.errorEl) return;
    this.errorEl.textContent = message;
    setHidden(this.errorEl, false);
  }

  /**
   * @returns {{ platforms: string[], startDate: string, weekdays: number[], slots: string[], frequency: number }}
   */
  _snapshot() {
    return {
      platforms: this._selectedPlatforms(),
      weekdays: this._selectedWeekdays(),
      slots: this._collectSlotValues().filter(Boolean),
      startDate: this.startDateInput?.value?.trim() || '',
      frequency: Math.max(1, Math.floor(Number(this.frequencyInput?.value)) || 1),
    };
  }

  /**
   * @param {ReturnType<ScheduleAllModal['_snapshot']>} snap
   * @returns {string | null} Error message, or null if valid.
   */
  _validate(snap) {
    if (snap.platforms.length === 0) return 'Select at least one platform.';
    if (snap.frequency < 1) return 'Frequency must be at least 1.';
    if (snap.slots.length !== snap.frequency) {
      return `Enter ${snap.frequency} time slot${snap.frequency === 1 ? '' : 's'}.`;
    }
    if (snap.slots.some((s) => !/^\d{1,2}:\d{2}$/.test(s))) {
      return 'Each time slot must be a valid time.';
    }
    if (snap.weekdays.length === 0) return 'Select at least one day of the week.';
    if (!snap.startDate) return 'Choose a start date.';
    return null;
  }

  _updatePreview() {
    if (!this.previewEl || this.postCount <= 0) return;

    const snap = this._snapshot();
    if (snap.weekdays.length === 0 || snap.slots.length === 0 || !snap.startDate) {
      this.previewEl.textContent = '';
      return;
    }

    try {
      const dates = planSchedules({
        count: this.postCount,
        startDate: snap.startDate,
        weekdays: snap.weekdays,
        slots: snap.slots,
      });
      const summary = summarizeSchedule(dates);
      if (!summary) {
        this.previewEl.textContent = '';
        return;
      }
      this.previewEl.textContent =
        `${this.postCount} post${this.postCount === 1 ? '' : 's'} · ` +
        `${summary.daySpan} day${summary.daySpan === 1 ? '' : 's'} · ` +
        `first ${summary.firstLabel} → last ${summary.lastLabel}`;
    } catch {
      this.previewEl.textContent = '';
    }
  }

  /**
   * @param {{ postCount: number }} opts
   */
  open({ postCount }) {
    this.postCount = Math.max(0, postCount);
    this._clearError();

    if (this.descEl) {
      this.descEl.textContent =
        this.postCount === 1
          ? 'Assign a platform and schedule time for the selected post.'
          : `Assign platforms and schedule times across all ${this.postCount} selected posts.`;
    }

    if (this.frequencyInput) this.frequencyInput.value = '1';
    this._slotValues = defaultSlotsForFrequency(1);
    this._renderSlots();

    this.platformsEl
      ?.querySelectorAll('input[name="schedule-all-platform"]')
      .forEach((el) => {
        el.checked = false;
      });

    this.weekdaysEl?.querySelectorAll('input[name="schedule-all-weekday"]').forEach((el) => {
      el.checked = DEFAULT_WEEKDAYS.includes(Number(el.value));
    });

    if (this.startDateInput) {
      this.startDateInput.min = toLocalYmd(new Date());
      this.startDateInput.value = toLocalYmd(new Date());
    }

    if (this.submitBtn) {
      setButtonText(
        this.submitBtn,
        this.postCount === 1 ? 'Schedule post' : `Schedule ${this.postCount} posts`
      );
    }

    setHidden(this.overlay, false);
    this._updatePreview();
    this.frequencyInput?.focus();
  }

  close() {
    setHidden(this.overlay, true);
    this._clearError();
  }

  async _handleSubmit() {
    const snap = this._snapshot();
    const error = this._validate(snap);
    if (error) {
      this._showError(error);
      return;
    }

    let scheduledDates;
    try {
      scheduledDates = planSchedules({
        count: this.postCount,
        startDate: snap.startDate,
        weekdays: snap.weekdays,
        slots: snap.slots,
      });
    } catch (err) {
      this._showError(err?.message || 'Could not build schedule. Try different days or times.');
      return;
    }

    this.close();
    await this.onConfirm({
      platforms: snap.platforms,
      scheduledDates,
    });
  }
}
