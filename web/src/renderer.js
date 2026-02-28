import SvgCss from '../../lib/svg.css?raw';
import {SyntaxError, drawSVGString, drawToCanvas} from 'quence';

/**
 * Render input as SVG string.
 *
 * @param {string} input WSD source
 * @returns {{svg: string}|{error: string, location: object|null}}
 */
export function renderSVG(input) {
  try {
    const svg = drawSVGString(input, {CSS: SvgCss, fileName: 'web'});
    return {svg};
  } catch (er) {
    return {
      error: er.message,
      location: er instanceof SyntaxError ? er.location : null,
    };
  }
}

/**
 * Render input to a canvas context.
 *
 * @param {string} input WSD source
 * @param {CanvasRenderingContext2D} ctx
 * @returns {{ok: true}|{error: string, location: object|null}}
 */
export function renderCanvas(input, ctx) {
  const dpr = window.devicePixelRatio || 1;
  try {
    drawToCanvas(input, ctx, {dpr});

    // Scale the displayed canvas to fit the container, preserving aspect ratio
    const container = ctx.canvas.parentElement;
    if (container) {
      const logicalW = ctx.canvas.width / dpr;
      const logicalH = ctx.canvas.height / dpr;
      const maxW = container.clientWidth - 16;
      const maxH = container.clientHeight - 16;
      const scale = Math.min(1, maxW / logicalW, maxH / logicalH);
      ctx.canvas.style.width = `${logicalW * scale}px`;
      ctx.canvas.style.height = `${logicalH * scale}px`;
    }

    return {ok: true};
  } catch (er) {
    return {
      error: er.message,
      location: er instanceof SyntaxError ? er.location : null,
    };
  }
}
