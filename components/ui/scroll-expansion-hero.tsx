'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import Image from 'next/image';
import { animate, useReducedMotion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

interface ScrollExpandMediaProps {
  mediaSrc: string;
  /** Describe la foto central para lectores de pantalla. */
  mediaAlt: string;
  bgImageSrc: string;
  title?: string;
  date?: string;
  /** Texto del botón que abre la portada (también funciona con rueda, dedo o teclado). */
  scrollToExpand?: string;
  children?: ReactNode;
}

const MOBILE_QUERY = '(max-width: 767px)';
const EXPAND_KEYS = new Set(['ArrowDown', 'PageDown', ' ', 'End']);

function subscribeToMobile(onChange: () => void) {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);

/**
 * Portada que se abre al desplazarse: la foto central crece hasta ocupar la
 * pantalla y después la página se desplaza con normalidad.
 *
 * Mientras está cerrada, el desplazamiento de la página queda bloqueado y la
 * rueda, el dedo, el teclado o el botón hacen avanzar la apertura. Con
 * "reducir movimiento" no hay bloqueo ni animación: la página se desplaza normal.
 */
const ScrollExpandMedia = ({
  mediaSrc,
  mediaAlt,
  bgImageSrc,
  title,
  date,
  scrollToExpand,
  children,
}: ScrollExpandMediaProps) => {
  const reduce = useReducedMotion();
  const isMobile = useSyncExternalStore(
    subscribeToMobile,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );

  const [progress, setProgress] = useState(0);
  const [expanded, setExpanded] = useState(false);

  // Los listeners leen estas refs para no volver a registrarse en cada avance.
  const progressRef = useRef(0);
  const expandedRef = useRef(false);
  const touchStartY = useRef(0);
  const scrollToContentOnExpand = useRef(false);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const applyProgress = useCallback((next: number) => {
    const value = clamp01(next);
    progressRef.current = value;
    setProgress(value);
    if (value >= 1 && !expandedRef.current) {
      expandedRef.current = true;
      setExpanded(true);
    }
  }, []);

  const collapse = useCallback(() => {
    expandedRef.current = false;
    setExpanded(false);
  }, []);

  /** Abre la portada con una transición corta (botón y teclado). */
  const expand = useCallback(
    (thenScrollToContent: boolean) => {
      if (reduce) {
        if (thenScrollToContent) contentRef.current?.scrollIntoView({ block: 'start' });
        return;
      }
      if (expandedRef.current) {
        if (thenScrollToContent) contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      scrollToContentOnExpand.current = thenScrollToContent;
      animate(progressRef.current, 1, {
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1],
        onUpdate: applyProgress,
      });
    },
    [applyProgress, reduce],
  );

  // Bloqueo del desplazamiento mientras la portada está cerrada.
  useEffect(() => {
    if (reduce) return;
    const root = document.documentElement;
    let frame = 0;

    if (expanded) {
      root.style.overflow = '';
      if (scrollToContentOnExpand.current) {
        scrollToContentOnExpand.current = false;
        contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (window.scrollY > 5) {
      // La página llegó ya desplazada (recarga o "atrás"): se respeta y se abre.
      frame = requestAnimationFrame(() => applyProgress(1));
    } else {
      window.scrollTo(0, 0);
      root.style.overflow = 'hidden';
    }

    return () => {
      cancelAnimationFrame(frame);
      root.style.overflow = '';
    };
  }, [expanded, reduce, applyProgress]);

  // Rueda, dedo y teclado hacen avanzar la apertura.
  useEffect(() => {
    if (reduce) return;

    const onWheel = (e: WheelEvent) => {
      if (expandedRef.current) {
        if (e.deltaY < 0 && window.scrollY <= 5) {
          e.preventDefault();
          collapse();
        }
        return;
      }
      e.preventDefault();
      applyProgress(progressRef.current + e.deltaY * 0.0009);
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchStartY.current) return;
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY.current - touchY;

      if (expandedRef.current) {
        if (deltaY < -20 && window.scrollY <= 5) {
          e.preventDefault();
          collapse();
        }
        return;
      }
      e.preventDefault();
      applyProgress(progressRef.current + deltaY * (deltaY < 0 ? 0.008 : 0.005));
      touchStartY.current = touchY;
    };

    const onTouchEnd = () => {
      touchStartY.current = 0;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (expandedRef.current || e.defaultPrevented || !EXPAND_KEYS.has(e.key)) return;
      // Espacio sobre un botón o enlace debe activarlo, no abrir la portada.
      if (e.key === ' ' && e.target instanceof HTMLElement && e.target.closest('button, a, input, textarea, select')) return;
      e.preventDefault();
      expand(false);
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [applyProgress, collapse, expand, reduce]);

  const mediaWidth = 300 + progress * (isMobile ? 650 : 1250);
  const mediaHeight = 400 + progress * (isMobile ? 200 : 400);
  const textTranslateX = progress * (isMobile ? 180 : 150);

  const [firstWord, ...restWords] = title ? title.split(' ') : [''];
  const restOfTitle = restWords.join(' ');

  return (
    <div className='overflow-x-hidden bg-brand-red'>
      <section className='relative flex min-h-[100dvh] flex-col items-center justify-start'>
        <div className='relative flex min-h-[100dvh] w-full flex-col items-center'>
          {/* Fondo: se desvanece conforme la foto central crece */}
          <div aria-hidden className='absolute inset-x-0 top-0 z-0 h-[100dvh]' style={{ opacity: 1 - progress }}>
            <Image src={bgImageSrc} alt='' fill sizes='100vw' className='object-cover' priority />
            <div className='absolute inset-0 bg-brand-red/60 mix-blend-multiply' />
          </div>

          <div className='container relative z-10 mx-auto flex flex-col items-center justify-start'>
            <div className='relative flex h-[100dvh] w-full flex-col items-center justify-center'>
              {/* Foto central que se expande */}
              <div
                className='absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-4 border-brand-yellow/30 shadow-[0_30px_60px_-20px_rgba(74,12,10,0.75)]'
                style={{
                  width: `${mediaWidth}px`,
                  height: `${mediaHeight}px`,
                  maxWidth: '95vw',
                  maxHeight: '85vh',
                }}
              >
                <div className='relative h-full w-full overflow-hidden rounded-xl'>
                  <Image
                    src={mediaSrc}
                    alt={mediaAlt}
                    fill
                    sizes='(max-width: 767px) 95vw, 1280px'
                    className='object-cover'
                    priority
                  />
                  {/* Velo rojo oscuro: da contraste al título y se retira al abrir */}
                  <div aria-hidden className='absolute inset-0 bg-brand-red-deep' style={{ opacity: 0.45 * (1 - progress) }} />
                </div>

                <div className='relative z-10 mt-4 flex flex-col items-center gap-2 text-center'>
                  {date && (
                    <p className='rounded-full bg-brand-red-dark/85 px-4 py-1 text-xl font-black uppercase tracking-widest text-white md:text-2xl' style={{ transform: `translateX(-${textTranslateX}vw)` }}>
                      {date}
                    </p>
                  )}
                  {scrollToExpand && (
                    <button
                      type='button'
                      onClick={() => expand(true)}
                      className='flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full bg-brand-red-dark/85 px-4 py-2 text-sm font-bold text-brand-yellow underline-offset-4 hover:underline md:text-base'
                      style={{ transform: `translateX(${textTranslateX}vw)` }}
                    >
                      <ArrowDown aria-hidden size={18} strokeWidth={3} className='shrink-0' />
                      {scrollToExpand}
                      <ArrowDown aria-hidden size={18} strokeWidth={3} className='shrink-0' />
                    </button>
                  )}
                </div>
              </div>

              {/* Título: cada palabra sale hacia un lado al abrir */}
              <h1 className='pointer-events-none relative z-10 flex w-full flex-col items-center justify-center gap-2 text-center text-5xl font-black leading-none tracking-[-0.04em] drop-shadow-[0_6px_16px_rgba(74,12,10,0.65)] md:gap-4 md:text-7xl lg:text-8xl'>
                <span className='block text-brand-yellow' style={{ transform: `translateX(-${textTranslateX}vw)` }}>
                  {firstWord}
                </span>{' '}
                <span className='block text-white' style={{ transform: `translateX(${textTranslateX}vw)` }}>
                  {restOfTitle}
                </span>
              </h1>
            </div>

            {/* Contenido bajo la portada. Si el foco llega aquí con la portada cerrada, se abre. */}
            <div
              ref={contentRef}
              onFocusCapture={() => {
                if (!reduce && !expandedRef.current) applyProgress(1);
              }}
              className='z-20 flex w-full scroll-mt-4 flex-col bg-brand-red px-4 py-10 md:px-16 lg:py-20'
            >
              {children}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ScrollExpandMedia;
