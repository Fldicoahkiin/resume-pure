import { MUTED_TEXT_COLOR, createPath } from './context';
import type { ContactVisual, LayoutContext } from './context';

const HEADER_FALLBACK_ICON = 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z';

const CONTACT_MAIL_ICON = 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z';

const CONTACT_PHONE_ICON = 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z';

const CONTACT_GITHUB_ICON = 'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z';

const CONTACT_LINKEDIN_ICON = 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 110-4 2 2 0 010 4z';

const CONTACT_LOCATION_ICON = 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 13a3 3 0 100-6 3 3 0 000 6z';

const CONTACT_GLOBE_OUTER_ICON = 'M12 2A10 10 0 1012 22A10 10 0 1012 2z';

const CONTACT_GLOBE_INNER_ICON = 'M12 2a14.5 14.5 0 000 20 14.5 14.5 0 000-20zM2 12h20';

export const GITHUB_ICON = CONTACT_GITHUB_ICON;

export const STAR_ICON = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';

export const LINK_ICON = 'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z';

export function getContactIconVisual(type: string, iconSize: number): ContactVisual {
  const normalized = type.toLowerCase();
  const strokeWidth = 1.5;

  if (normalized.includes('mail')) {
    return {
      paths: [
        createPath(CONTACT_MAIL_ICON, 0, 0, iconSize, iconSize, undefined, MUTED_TEXT_COLOR, strokeWidth),
      ],
    };
  }

  if (normalized.includes('phone')) {
    return {
      paths: [
        createPath(CONTACT_PHONE_ICON, 0, 0, iconSize, iconSize, undefined, MUTED_TEXT_COLOR, strokeWidth),
      ],
    };
  }

  if (normalized.includes('github')) {
    return {
      paths: [createPath(CONTACT_GITHUB_ICON, 0, 0, iconSize, iconSize, MUTED_TEXT_COLOR)],
    };
  }

  if (normalized.includes('linkedin')) {
    return {
      paths: [
        createPath(CONTACT_LINKEDIN_ICON, 0, 0, iconSize, iconSize, undefined, MUTED_TEXT_COLOR, strokeWidth),
      ],
    };
  }

  if (normalized.includes('map') || normalized.includes('location')) {
    return {
      paths: [
        createPath(CONTACT_LOCATION_ICON, 0, 0, iconSize, iconSize, undefined, MUTED_TEXT_COLOR, strokeWidth),
      ],
    };
  }

  if (normalized.includes('website') || normalized.includes('globe')) {
    return {
      paths: [
        createPath(CONTACT_GLOBE_OUTER_ICON, 0, 0, iconSize, iconSize, undefined, MUTED_TEXT_COLOR, strokeWidth),
        createPath(CONTACT_GLOBE_INNER_ICON, 0, 0, iconSize, iconSize, undefined, MUTED_TEXT_COLOR, strokeWidth),
      ],
    };
  }

  return {
    paths: [createPath(HEADER_FALLBACK_ICON, 0, 0, iconSize, iconSize, undefined, MUTED_TEXT_COLOR, strokeWidth)],
  };
}

export function pushVisualPaths(context: LayoutContext, x: number, y: number, visual: ContactVisual) {
  for (const path of visual.paths) {
    context.drawOps.push({
      ...path,
      x: x + path.x,
      y: y + path.y,
    });
  }
}
