import React from 'react';
import Canvas from './canvas';
import Customizer from './pages/Customizer';
import Home from './pages/Home';
import { SEO } from '../../components/common/SEO.js';
import { AEO_KNOWLEDGE } from '../../config/aeoKnowledge.js';
import './index.css';

export const JerseyBuilder = () => {
  return (
    <main className="jb-app transition-all ease-in">
      <SEO
        title="Custom Cricket Jersey Builder | 3D Team Kit Customizer | BE11"
        description="Design custom sublimated cricket jerseys and team sports kits online with 3D live preview, custom names, numbers, and sponsor logos on BE11."
        canonical="/jersey-builder"
        faqJsonLd={AEO_KNOWLEDGE.services['jersey-builder'].faqs}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: 'https://be11.in/',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Jersey Builder',
              item: 'https://be11.in/jersey-builder',
            },
          ],
        }}
      />
      <Home />
      <Canvas />
      <Customizer />
    </main>
  );
};

export default JerseyBuilder;
