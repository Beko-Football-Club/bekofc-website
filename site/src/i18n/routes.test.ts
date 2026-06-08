import { describe, it, expect } from 'vitest';
import { routeFor, equivalentRoute, type Lang, type PageKey } from './routes';

describe('routeFor', () => {
  it('returns FR slug for FR pages', () => {
    expect(routeFor('news', 'fr')).toBe('/fr/actualites');
    expect(routeFor('team', 'fr')).toBe('/fr/equipe');
    expect(routeFor('matches', 'fr')).toBe('/fr/matchs');
    expect(routeFor('gallery', 'fr')).toBe('/fr/galerie');
    expect(routeFor('sponsors', 'fr')).toBe('/fr/partenaires');
    expect(routeFor('join', 'fr')).toBe('/fr/rejoindre');
    expect(routeFor('donate', 'fr')).toBe('/fr/don');
    expect(routeFor('contact', 'fr')).toBe('/fr/contact');
    expect(routeFor('privacy', 'fr')).toBe('/fr/confidentialite');
    expect(routeFor('home', 'fr')).toBe('/fr');
  });

  it('returns EN slug for EN pages', () => {
    expect(routeFor('news', 'en')).toBe('/en/news');
    expect(routeFor('team', 'en')).toBe('/en/team');
    expect(routeFor('matches', 'en')).toBe('/en/matches');
    expect(routeFor('gallery', 'en')).toBe('/en/gallery');
    expect(routeFor('sponsors', 'en')).toBe('/en/sponsors');
    expect(routeFor('join', 'en')).toBe('/en/join');
    expect(routeFor('donate', 'en')).toBe('/en/donate');
    expect(routeFor('contact', 'en')).toBe('/en/contact');
    expect(routeFor('privacy', 'en')).toBe('/en/privacy');
    expect(routeFor('home', 'en')).toBe('/en');
  });
});

describe('equivalentRoute', () => {
  it('maps FR home to EN home', () => {
    expect(equivalentRoute('/fr/', 'en')).toBe('/en/');
    expect(equivalentRoute('/fr', 'en')).toBe('/en/');
  });

  it('maps FR top-level pages to EN equivalents', () => {
    expect(equivalentRoute('/fr/actualites/', 'en')).toBe('/en/news/');
    expect(equivalentRoute('/fr/equipe/', 'en')).toBe('/en/team/');
    expect(equivalentRoute('/fr/matchs/', 'en')).toBe('/en/matches/');
    expect(equivalentRoute('/fr/galerie/', 'en')).toBe('/en/gallery/');
    expect(equivalentRoute('/fr/partenaires/', 'en')).toBe('/en/sponsors/');
    expect(equivalentRoute('/fr/rejoindre/', 'en')).toBe('/en/join/');
    expect(equivalentRoute('/fr/don/', 'en')).toBe('/en/donate/');
    expect(equivalentRoute('/fr/contact/', 'en')).toBe('/en/contact/');
    expect(equivalentRoute('/fr/confidentialite/', 'en')).toBe('/en/privacy/');
  });

  it('maps EN top-level pages to FR equivalents', () => {
    expect(equivalentRoute('/en/news/', 'fr')).toBe('/fr/actualites/');
    expect(equivalentRoute('/en/team/', 'fr')).toBe('/fr/equipe/');
    expect(equivalentRoute('/en/privacy/', 'fr')).toBe('/fr/confidentialite/');
  });

  it('preserves news detail slug across locales', () => {
    expect(equivalentRoute('/fr/actualites/match-vs-yaounde/', 'en')).toBe('/en/news/match-vs-yaounde/');
    expect(equivalentRoute('/en/news/match-vs-yaounde/', 'fr')).toBe('/fr/actualites/match-vs-yaounde/');
  });

  it('falls back to other-lang home for unknown routes', () => {
    expect(equivalentRoute('/fr/unknown-path/', 'en')).toBe('/en/');
    expect(equivalentRoute('/some-stray-path', 'en')).toBe('/en/');
  });
});
