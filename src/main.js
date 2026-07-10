/**
 * @file main.js
 * @description Application entry point — loads global styles and bootstraps the feature App module.
 * @dependencies features/App.js, style.css
 * @state None — delegates to App.bootstrapApp().
 */

import './style.css';
import { bootstrapApp } from './features/App.js';

document.addEventListener('DOMContentLoaded', () => {
  bootstrapApp();
});
