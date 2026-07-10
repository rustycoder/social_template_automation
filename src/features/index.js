/**
 * @file features/index.js
 * @description Public barrel exports for the Content Studio feature module.
 * @dependencies All feature subfolders.
 * @state None.
 */

// App bootstrap
export { App, bootstrapApp } from './App.js';

// Workflow shell (step navigation, data entry, selection)
export { LayoutModule } from './modules/LayoutModule.js';
export { DataEntryModule, UploadStep } from './modules/DataEntryModule.js';
export { SelectionModule } from './modules/SelectionModule.js';

// Page controllers
export { TemplatePage } from './pages/TemplatePage.js';
export { DataPage } from './pages/DataPage.js';
export { ExportPage } from './pages/ExportPage.js';

// UI components
export * from './components/Layout.js';
export * from './components/PostCard.js';
export * from './shared/constants.js';

// Domain (templates, data, validation)
export { TemplateStore } from './domain/templateStore.js';
export { DataSource } from './domain/dataSource.js';
export * from './domain/templateFields.js';
export { getSampleRowForTemplate } from './domain/templateSampleData.js';
export { downloadSampleExcel } from './domain/sampleExcelExport.js';

// Rendering (preview, export pipeline)
export { PostPreview, getDefaultDimensionsForBucket } from './rendering/preview.js';
export { ExportGrid } from './rendering/exportGrid.js';
export { exportBulkPosts, exportSinglePostPresets } from './rendering/exporter.js';
export { renderGalleryPreview } from './rendering/templateGalleryPreview.js';
export * from './rendering/socialFormats.js';

// Auth & billing
export { api, ApiError } from './auth/api.js';
export { authService } from './auth/auth.js';
export { tokenStorage } from './auth/tokenStorage.js';
export { handleCheckoutReturn, launchMpgsCheckout } from './auth/checkout.js';
export { AuthUI } from './auth/authUI.js';
export { SubscriptionUI } from './auth/subscriptionUI.js';
export { BillingUI } from './auth/billingUI.js';
