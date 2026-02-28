import {examples} from './examples.js';
import {getContent, setContent, setupEditor} from './editor.js';
import {renderCanvas, renderSVG} from './renderer.js';

// DOM elements
const examplesSelect = document.querySelector('#examples');
const editorPane = document.querySelector('#editor-pane');
const svgPreview = document.querySelector('#svg-preview');
const canvasWrap = document.querySelector('#canvas-wrap');
const canvasPreview = document.querySelector('#canvas-preview');
const errorDisplay = document.querySelector('#error-display');
const tabSvg = document.querySelector('#tab-svg');
const tabCanvas = document.querySelector('#tab-canvas');
const dlWsd = document.querySelector('#dl-wsd');
const dlSvg = document.querySelector('#dl-svg');

// State
let activeTab = 'svg';
let renderTimer = null;

// Populate examples dropdown
for (const ex of examples) {
  const opt = document.createElement('option');
  opt.value = ex.label;
  opt.textContent = ex.label;
  examplesSelect.appendChild(opt);
}

// Setup editor with first example
const initialContent = examples[0].content;
setupEditor(editorPane, initialContent, () => scheduleRender());

// Example picker
examplesSelect.addEventListener('change', () => {
  const ex = examples.find(e => e.label === examplesSelect.value);
  if (ex) {
    setContent(ex.content);
  }
});

// Tab switching
tabSvg.addEventListener('click', () => {
  activeTab = 'svg';
  tabSvg.classList.add('active');
  tabCanvas.classList.remove('active');
  svgPreview.hidden = false;
  canvasWrap.hidden = true;
  render();
});

tabCanvas.addEventListener('click', () => {
  activeTab = 'canvas';
  tabCanvas.classList.add('active');
  tabSvg.classList.remove('active');
  svgPreview.hidden = true;
  canvasWrap.hidden = false;
  render();
});

// Debounced render
function scheduleRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(render, 300);
}

function showError(msg) {
  errorDisplay.textContent = msg;
  errorDisplay.hidden = false;
  svgPreview.hidden = true;
  canvasWrap.hidden = true;
  dlSvg.removeAttribute('href');
  dlSvg.hidden = true;
}

function clearError() {
  errorDisplay.hidden = true;
  errorDisplay.textContent = '';
}

function render() {
  const input = getContent();

  // Update WSD download link
  if (dlWsd.href) {
    URL.revokeObjectURL(dlWsd.href);
  }
  dlWsd.href = URL.createObjectURL(
    new Blob([input], {type: 'text/plain', endings: 'native'})
  );

  if (activeTab === 'svg') {
    const result = renderSVG(input);
    if (result.error) {
      showError(result.error);
      return;
    }
    clearError();
    svgPreview.hidden = false;
    canvasPreview.hidden = true;
    svgPreview.innerHTML = result.svg;

    // SVG download
    if (dlSvg.href) {
      URL.revokeObjectURL(dlSvg.href);
    }
    const blob = new Blob([result.svg], {type: 'image/svg+xml'});
    dlSvg.href = URL.createObjectURL(blob);
    dlSvg.hidden = false;
  } else {
    const ctx = canvasPreview.getContext('2d');
    const result = renderCanvas(input, ctx);
    if (result.error) {
      showError(result.error);
      return;
    }
    clearError();
    svgPreview.hidden = true;
    canvasWrap.hidden = false;
    dlSvg.hidden = true;
  }
}

// Initial render
render();
