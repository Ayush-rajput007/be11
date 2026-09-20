import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product' | 'profile';
  noindex?: boolean;
  jsonLd?: Record<string, any> | Record<string, any>[];
}

const DEFAULT_TITLE = 'BE11 – Sports Venue Booking, Live Matches & Cricket in Faridabad';
const DEFAULT_DESCRIPTION = 'BE11 is a sports platform for booking cricket grounds, joining live matches, finding certified coaches, shopping sports gear, and designing custom jerseys in Faridabad.';
const BASE_URL = 'https://be11.in';
const DEFAULT_OG_IMAGE = `${BASE_URL}/be11_logo.png`;

function updateMetaTag(attrName: 'name' | 'property', attrValue: string, content: string | null) {
  let element = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
  if (content === null) {
    if (element) {
      element.remove();
    }
    return;
  }
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function updateCanonical(url: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

function updateStructuredData(jsonLd?: Record<string, any> | Record<string, any>[]) {
  const existingScript = document.getElementById('be11-dynamic-jsonld');
  if (existingScript) {
    existingScript.remove();
  }

  if (!jsonLd) return;

  const script = document.createElement('script');
  script.id = 'be11-dynamic-jsonld';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(jsonLd);
  document.head.appendChild(script);
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonical,
  ogImage,
  ogType = 'website',
  noindex = false,
  jsonLd,
}) => {
  const location = useLocation();

  useEffect(() => {
    // 1. Title
    const finalTitle = title ? `${title}` : DEFAULT_TITLE;
    document.title = finalTitle;

    // 2. Meta description
    const finalDescription = description || DEFAULT_DESCRIPTION;
    updateMetaTag('name', 'description', finalDescription);

    // 3. Robots
    const robotsContent = noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
    updateMetaTag('name', 'robots', robotsContent);
    updateMetaTag('name', 'googlebot', robotsContent);

    // 4. Canonical URL (clean URL without search/query params)
    let finalCanonical = canonical;
    if (!finalCanonical) {
      const cleanPath = location.pathname === '/' ? '' : location.pathname.replace(/\/+$/, '');
      finalCanonical = `${BASE_URL}${cleanPath || '/'}`;
    } else if (finalCanonical.startsWith('/')) {
      finalCanonical = `${BASE_URL}${finalCanonical}`;
    }
    updateCanonical(finalCanonical);

    // 5. Open Graph
    const finalOgImage = ogImage ? (ogImage.startsWith('http') ? ogImage : `${BASE_URL}${ogImage}`) : DEFAULT_OG_IMAGE;
    updateMetaTag('property', 'og:title', finalTitle);
    updateMetaTag('property', 'og:description', finalDescription);
    updateMetaTag('property', 'og:url', finalCanonical);
    updateMetaTag('property', 'og:type', ogType);
    updateMetaTag('property', 'og:image', finalOgImage);
    updateMetaTag('property', 'og:site_name', 'BE11');
    updateMetaTag('property', 'og:locale', 'en_IN');

    // 6. Twitter Cards
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', finalTitle);
    updateMetaTag('name', 'twitter:description', finalDescription);
    updateMetaTag('name', 'twitter:image', finalOgImage);
    updateMetaTag('name', 'twitter:site', '@be11sports');

    // 7. Structured Data (JSON-LD)
    updateStructuredData(jsonLd);

    return () => {
      const script = document.getElementById('be11-dynamic-jsonld');
      if (script) {
        script.remove();
      }
    };
  }, [title, description, canonical, ogImage, ogType, noindex, jsonLd, location.pathname]);

  return null;
};
