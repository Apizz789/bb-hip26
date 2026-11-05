import type { ReactNode } from 'react';
import { SPRITE_MARKUP } from './sprite';

/** Decorative sprite symbol. Names: "i-home", "bm-light", etc. */
export function Icon({ name, className = 'ico', size }: { name: string; className?: string; size?: number }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false"
      style={size ? { width: size, height: size } : undefined}>
      <use href={'#' + name} />
    </svg>
  );
}

/** Renders the hidden sprite once at the top of the app. Static markup, no user input. */
export function SpriteSheet(): ReactNode {
  return <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false"
    dangerouslySetInnerHTML={{ __html: SPRITE_MARKUP }} />;
}

/** Growth Garden brand mark. */
export function BrandMark({ variant = 'light', className = 'bm', size }: { variant?: 'light' | 'dark'; className?: string; size?: number }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" focusable="false"
      style={size ? { width: size, height: size } : undefined}>
      <use href={variant === 'light' ? '#bm-light' : '#bm-dark'} />
    </svg>
  );
}
