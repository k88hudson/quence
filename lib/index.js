import CanvasDriver from './CanvasDriver.js';
import json from './JSONDriver.js';
import {parse} from './grammar.js';
import svg from './SVGDriver.js';

export {SyntaxError} from './grammar.js';

const outputs = {
  js: json,
  json,
  svg,
};

export const VALID_OUTPUTS = Object.keys(outputs).sort();

/**
 * Is the given output type supported?
 *
 * @param {string} output_type
 * @returns {boolean}
 */
export function supported(output_type) {
  return Object.prototype.hasOwnProperty.call(outputs, output_type);
}

/**
 * @typedef {object} DrawOptions
 * @property {keyof outputs} output Desired output type.
 * @property {string} [fileName] The filename that the text was read from.
 * @property {string[]} [property] Extra diagram properties from command line
 * @property {string} [CSS] Ensure CSS file isn't read, use this text instead.
 * @property {boolean} [nolink=false] Do not put Quence link in the output.
 */

/**
 *
 * @param {string} input
 * @param {keyof outputs|DrawOptions} argv
 * @param {import('stream').Writable} outstream
 * @returns {import('stream').Writable}
 */
export function draw(input, argv, outstream) {
  if (typeof argv === 'string') {
    argv = {output: argv};
  }
  const output_type = argv.output;
  if (!supported(output_type)) {
    throw new Error(`Invalid output type: "${output_type}"`);
  }
  const Driver = outputs[output_type];
  const parsed = parse(input, {
    grammarSource: argv.fileName,
  });
  const driver = new Driver(parsed, argv);
  return driver.draw(outstream);
}

/**
 * Draw a diagram and return the SVG string directly.
 *
 * @param {string} input WSD source text
 * @param {DrawOptions} [options]
 * @returns {string} SVG string
 */
export function drawSVGString(input, options = {}) {
  let result = '';
  draw(input, {...options, output: 'svg'}, {end(s) { result = s; }});
  return result;
}

/**
 * Draw a diagram to an HTML5 Canvas context.
 *
 * @param {string} input WSD source text
 * @param {CanvasRenderingContext2D} ctx Canvas 2D context
 * @param {DrawOptions} [options]
 * @returns {CanvasRenderingContext2D}
 */
export function drawToCanvas(input, ctx, options = {}) {
  const parsed = parse(input, {grammarSource: options.fileName});
  const driver = new CanvasDriver(parsed, options);
  return driver.draw(ctx);
}
