import CanvasDriver from '../lib/CanvasDriver.js';
import {drawToCanvas} from '../lib/index.js';
import {parse} from '../lib/grammar.js';
import test from 'ava';

/**
 * Creates a minimal mock CanvasRenderingContext2D for testing.
 *
 * @returns {{canvas: {width: number, height: number}, calls: string[], ctx: object}}
 */
function mockCtx() {
  const calls = [];
  const canvas = {width: 0, height: 0};
  const ctx = {
    canvas,
    save() { calls.push('save'); },
    restore() { calls.push('restore'); },
    translate(x, y) { calls.push(`translate(${x},${y})`); },
    rotate(a) { calls.push(`rotate(${a})`); },
    fillRect(x, y, w, h) { calls.push(`fillRect(${x},${y},${w},${h})`); },
    fillText(s, x, y) { calls.push(`fillText(${s},${x},${y})`); },
    beginPath() { calls.push('beginPath'); },
    moveTo(x, y) { calls.push(`moveTo(${x},${y})`); },
    lineTo(x, y) { calls.push(`lineTo(${x},${y})`); },
    closePath() { calls.push('closePath'); },
    stroke() { calls.push('stroke'); },
    fill() { calls.push('fill'); },
    setLineDash(arr) { calls.push(`setLineDash(${arr})`); },
    get strokeStyle() { return this._strokeStyle; },
    set strokeStyle(v) { this._strokeStyle = v; },
    get fillStyle() { return this._fillStyle; },
    set fillStyle(v) { this._fillStyle = v; },
    get font() { return this._font; },
    set font(v) { this._font = v; },
    get textAlign() { return this._textAlign; },
    set textAlign(v) { this._textAlign = v; },
    get textBaseline() { return this._textBaseline; },
    set textBaseline(v) { this._textBaseline = v; },
    get lineWidth() { return this._lineWidth; },
    set lineWidth(v) { this._lineWidth = v; },
    get lineCap() { return this._lineCap; },
    set lineCap(v) { this._lineCap = v; },
  };
  return {canvas, calls, ctx};
}

test('CanvasDriver renders simple diagram', t => {
  const diag = parse('a->b: hello');
  const {ctx, canvas} = mockCtx();
  const driver = new CanvasDriver(diag, {});
  const result = driver.draw(ctx);
  t.is(result, ctx);
  t.true(canvas.width > 0);
  t.true(canvas.height > 0);
});

test('CanvasDriver draw_group returns null', t => {
  const diag = parse('a->b');
  const driver = new CanvasDriver(diag, {});
  t.is(driver.draw_group('test'), null);
});

test('CanvasDriver meta and home_link are no-ops', t => {
  const diag = parse('a->b');
  const driver = new CanvasDriver(diag, {});
  t.notThrows(() => driver.meta({}));
  t.notThrows(() => driver.home_link({}));
});

test('drawToCanvas convenience export', t => {
  const {ctx, canvas} = mockCtx();
  const result = drawToCanvas('a->b: test', ctx);
  t.is(result, ctx);
  t.true(canvas.width > 0);
});

test('CanvasDriver handles all arrow types', t => {
  const input = [
    'a->b: solid closed',
    'a-->b: dashed',
    'a->>b: open forward',
    'a-#b: hash end',
    'a<->b: bidir',
  ].join('\n');
  const {ctx} = mockCtx();
  t.notThrows(() => drawToCanvas(input, ctx));
});

test('CanvasDriver handles blocks and notes', t => {
  const input = [
    'a->b',
    'loop foo',
    'b->a',
    'end',
    'note a: side note',
  ].join('\n');
  const {ctx} = mockCtx();
  t.notThrows(() => drawToCanvas(input, ctx));
});

test('CanvasDriver handles title', t => {
  const input = 'title My Diagram\na->b';
  const {ctx, calls} = mockCtx();
  drawToCanvas(input, ctx);
  t.true(calls.some(c => c.startsWith('fillText(My Diagram')));
});
