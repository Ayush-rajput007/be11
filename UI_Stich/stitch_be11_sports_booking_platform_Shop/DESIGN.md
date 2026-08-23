---
name: Athletic Elegance
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#444650'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#747781'
  outline-variant: '#c4c6d2'
  surface-tint: '#415c9e'
  primary: '#001a49'
  on-primary: '#ffffff'
  primary-container: '#0a2e6e'
  on-primary-container: '#7d98de'
  inverse-primary: '#b1c5ff'
  secondary: '#8f4e00'
  on-secondary: '#ffffff'
  secondary-container: '#fe9832'
  on-secondary-container: '#683700'
  tertiary: '#012300'
  on-tertiary: '#ffffff'
  tertiary-container: '#023b00'
  on-tertiary-container: '#44af33'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b1c5ff'
  on-primary-fixed: '#001947'
  on-primary-fixed-variant: '#274484'
  secondary-fixed: '#ffdcc2'
  secondary-fixed-dim: '#ffb77a'
  on-secondary-fixed: '#2e1500'
  on-secondary-fixed-variant: '#6d3a00'
  tertiary-fixed: '#8dfc75'
  tertiary-fixed-dim: '#72de5c'
  on-tertiary-fixed: '#012200'
  on-tertiary-fixed-variant: '#035300'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-hero:
    fontFamily: Montserrat
    fontSize: 72px
    fontWeight: '800'
    lineHeight: 80px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  section-gap: 80px
  container-padding: 24px
  gutter: 20px
  card-inner: 24px
---

## Brand & Style

The design system is a high-performance fusion of sports energy and editorial refinement. It balances the aggressive, motion-driven aesthetics of premium athletic brands with the airy, spacious, and human-centric layouts of world-class booking platforms. 

The personality is **Elite yet Accessible**. It evokes the feeling of a VIP stadium lounge—sophisticated, clean, and technologically advanced, but charged with the vibrant spirit of competition. The visual language uses "Motion-Glass"—a combination of sharp typography, generous whitespace, and translucent glass layers that allow abstract, paint-textured gradients of Saffron and Green to breathe behind the interface.

**Design Pillars:**
- **Minimalist Structure:** A rigid grid that provides a premium, organized "Apple-like" feel.
- **Dynamic Energy:** Large, impactful hero type and high-contrast color blocking inspired by Nike.
- **Glassmorphism:** Substrate layers use backdrop blurs to maintain legibility over complex, textured backgrounds.

## Colors

The palette is anchored by a deep **Navy (#0A2E6E)**, used for primary actions and structural identity. This is contrasted against a pristine **Light Background (#F8FAFC)** to ensure the interface feels modern and premium.

**The Tricolor Expression:**
Instead of flat blocks, Saffron and Green are treated as **"Aura Gradients."** They should appear as soft, painterly textures in the background or as subtle glows behind featured content. 
- **Saffron:** Used for highlights, active states, and energy-focused elements.
- **Green:** Reserved for success states, "Available" indicators, and high-conversion booking buttons.
- **Gold:** Used sparingly for "Pro" tiers, verified venues, or premium rewards.

**Neutral Scale:**
- Use a cool-toned slate for secondary text and borders to maintain the crispness of the Navy primary.

## Typography

The typography system relies on a high-contrast pairing. **Montserrat** (substituted for Poppins to provide a more "athletic/geometric" edge) handles all headlines with heavy weights and tight letter-spacing for a commanding presence. **Inter** provides a highly legible, neutral counterpoint for all functional UI and body copy.

**Key Rules:**
- **Hero Sections:** Use `display-hero` with Navy text. For high-impact areas, apply a subtle text-shadow or place it over a blurred glass container.
- **Hierarchy:** Use `label-bold` in Navy or Saffron for category tags above headlines to establish clear context (e.g., "CRICKET • MUMBAI").
- **Optical Sizing:** On mobile, ensure `headline-lg` scales down to the `mobile` variant to prevent awkward line breaks on narrow devices.

## Layout & Spacing

This design system utilizes a **12-column Fluid Grid** for desktop and a **4-column Grid** for mobile. The layout philosophy is built on "Generous Breathability"—avoiding information density in favor of a premium, curated experience.

**Layout Principles:**
- **Desktop:** 1200px max-width container, centered.
- **Margins:** 24px on mobile, scaling to 64px+ on desktop to create a focused "stage" for the content.
- **Vertical Rhythm:** Large vertical gaps (80px - 120px) between major sections to emphasize the "Editorial" feel.
- **Stacking:** Elements within cards should follow an 8px base grid, using 24px padding for internal card spacing.

## Elevation & Depth

Hierarchy is established through a combination of **Ambient Shadows** and **Glassmorphism**.

- **Level 1 (Base):** Light Background (#F8FAFC).
- **Level 2 (Cards):** White Surface with a very soft, diffused shadow: `0px 10px 30px rgba(10, 46, 110, 0.04)`.
- **Level 3 (Overlays/Nav):** Glassmorphic surfaces. Use `backdrop-filter: blur(20px)` with a White background at 70% opacity. This is used for sticky headers, filter bars, and modal backgrounds.
- **Depth Cues:** Use the Navy color for primary depth; shadows should have a slight Navy tint rather than pure black to maintain brand cohesion.

## Shapes

The shape language is "Hyper-Rounded," emphasizing comfort and modern premium aesthetics.

- **Large Components (Cards, Containers):** 24px corner radius. This applies to venue cards, profile sections, and search modals.
- **Interactive Elements (Buttons, Inputs):** 14px corner radius. This creates a distinct visual difference between "containers" and "actions."
- **Small Elements (Chips, Badges):** Full pill-shape (999px) to denote status or categories.

## Components

### Buttons
- **Primary:** Navy background, White text, 14px radius. On hover, translate -2px with a slightly deeper shadow.
- **Secondary:** White background with 1px Navy border.
- **Booking CTA:** Emerald Green (#138808) background, used only for final conversion points to draw the eye.

### Cards (Venue & Event)
- **Structure:** 24px radius. Top half is a high-resolution image; bottom half is a white content area. 
- **Detailing:** Use `label-bold` for price and "Inter-bold" for the venue title.
- **Glass Tags:** Place venue ratings in a glassmorphic badge (blur + white 80%) in the top-right corner of the card image.

### Input Fields
- **Search Bar:** Large, 24px radius, subtle shadow, and a glassmorphic background if placed over hero images. Use Navy for the magnifying glass icon.
- **Form Fields:** 14px radius, Light Grey (#EDF2F7) background, transition to a 2px Navy border on focus.

### Chips & Tags
- **Status:** Pill-shaped. "Available" (Green), "Fast Filling" (Saffron), "Sold Out" (Navy).
- **Interaction:** Selectable chips should use a Navy background when active and White/Bordered when inactive.

### Progress Indicators
- Use a thin Saffron line for progress bars to represent the "energy" of the booking flow.