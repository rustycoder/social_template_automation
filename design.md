# Design System: Kinetic Logic

## Overview
A clean, high-contrast, modern SaaS aesthetic designed for productivity and clarity. The system prioritizes functional whitespace, crisp borders, and a professional indigo-based color palette.

## Visual Language

### Color Palette
- **Primary:** `#4f46e5` (Indigo-600) - Used for primary actions, active states, and brand highlights.
- **Surface:** `#fcf8ff` (Zinc-50) - Primary background color for the application shell.
- **Surface Dim:** `#dcd8e5` (Zinc-200) - Used for subtle backgrounds and grouping.
- **Text Primary:** `#09090b` (Zinc-950) - High-contrast text for headlines and body copy.
- **Text Secondary:** `#71717a` (Zinc-500) - Low-emphasis text for labels and secondary information.
- **Outline:** `#e4e4e7` (Zinc-200) - Crisp borders for cards and inputs.

### Typography (Google Sans Flex)
- **Headlines:** Semi-bold/Bold, tight tracking, Zinc-950.
- **Body:** Regular/Medium, Google Sans Flex, Zinc-900.
- **Labels:** Medium, uppercase or small caps for hierarchy, Zinc-500.

### Shape & Spacing
- **Roundness:** `ROUND_EIGHT` (8px border-radius) applied to cards, buttons, and inputs.
- **Elevation:** Flat design with subtle shadows for interactive elements on hover.
- **Padding:** Consistent 24px (p-6) margin for containers; 16px (p-4) for internal card spacing.

---

## Layout Architecture

### Global Shell
- **Header:** Fixed height (64px). Contains Brand Logo, Step Indicator, and User Profile.
- **Footer:** Fixed height (60px). Contains contextual actions (Back, Next, Export).
- **Body:** Scrollable area between Header and Footer. Uses a max-width container (approx 1280px) centered on the page.

---

## Component Specifications

### 1. TopNavBar
- **Structure:** [Logo] | [Step Indicator] | [Actions/Profile]
- **Style:** Border-bottom, high-contrast text, active step highlighted with background pill.

### 2. Template Cards (Masonry)
- **Visual:** Rich preview image, aspect ratio label, hover overlay with "Select" intent.
- **Grid:** Fluid 3-4 column grid depending on screen width.

### 3. Data Entry Forms
- **Inputs:** Labeled, outlined fields with 8px radius. 
- **Tabs:** Segmented switcher for "Single" vs "Bulk" modes.

### 4. Interactive Footer
- **Logic:** Primary action on the right, secondary/navigation on the left.
- **Shadow:** Top-border separation from content.

---

## User Flow

### Step 1: Select Template
- **Goal:** User chooses a visual layout and aspect ratio.
- **Actions:** Search, Filter by Category, Select Aspect Ratio (Square, Portrait, Story, Landscape).

### Step 2: Input Data
- **Goal:** Populate the template with content.
- **Layout:** Two-column split. Left: Input form. Right: Sticky real-time preview.

### Step 3: Export Content
- **Goal:** Review generated assets and download.
- **Actions:** Batch selection via checkboxes, Individual download, Bulk Export.