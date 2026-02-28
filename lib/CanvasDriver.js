/* eslint-disable class-methods-use-this */
import Driver from './driver.js';
import {Point} from './point.js';

/**
 * @extends {Driver<null>}
 */
export default class CanvasDriver extends Driver {
  /**
   * @param {import('./ast.js').Diagram} diag
   * @param {import('./index.js').DrawOptions} argv
   */
  constructor(diag, argv) {
    super(diag, argv);

    /**
     * @type {CanvasRenderingContext2D|null}
     */
    this.ctx = null;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @returns {CanvasRenderingContext2D}
   */
  draw(ctx) {
    this.ctx = ctx;
    const dpr = this.argv.dpr ?? 1;
    ctx.canvas.width = this.width * dpr;
    ctx.canvas.height = this.height * dpr;
    if (ctx.canvas.style) {
      ctx.canvas.style.width = `${this.width}px`;
      ctx.canvas.style.height = `${this.height}px`;
    }
    if (dpr !== 1) {
      ctx.scale(dpr, dpr);
    }
    super.draw(ctx);
    return ctx;
  }

  // eslint-disable-next-line no-unused-vars
  meta(_pjson) {
    // no-op for canvas
  }

  // eslint-disable-next-line no-unused-vars
  home_link(_pjson) {
    // no-op for canvas
  }

  clear() {
    const {ctx} = this;
    ctx.fillStyle = this.props.background;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  draw_group(_name) {
    return null;
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} theta Angle in radians
   * @param {() => void} func
   */
  transform(x, y, theta, func) {
    const {ctx} = this;
    ctx.save();
    if (x || y) {
      ctx.translate(x, y);
    }
    if (theta) {
      ctx.rotate(theta);
    }
    func.call(this);
    ctx.restore();
  }

  /**
   * @param {import('./point.js').Point} p
   * @param {string} str
   * @param {string} klass
   * @param {number} [angle]
   */
  draw_label(p, str, klass, angle) {
    if (!str || str.length === 0) {
      return;
    }
    const {ctx} = this;
    ctx.save();
    ctx.font = `${this.props.text_size}px ${this.props.font}`;
    ctx.fillStyle = this.props.text_color;
    ctx.textBaseline = 'middle';

    const classes = klass ? klass.split(/\s+/) : [];
    if (classes.includes('end')) {
      ctx.textAlign = 'right';
    } else if (classes.includes('center') || classes.includes('rung_label')) {
      ctx.textAlign = 'center';
    } else {
      ctx.textAlign = 'left';
    }

    if (angle) {
      ctx.translate(p.x, p.y);
      ctx.rotate(Point.deg(angle) * (Math.PI / 180));
      ctx.fillText(str, 0, 0);
    } else {
      ctx.fillText(str, p.x, p.y);
    }
    ctx.restore();
  }

  /**
   * @param {string|(string|import('./point.js').Point)[]} cmds
   * @param {string} klasses
   */
  draw_path(cmds, klasses) {
    const d = super.draw_path(cmds, klasses);
    if (!d) {
      return;
    }

    const {ctx} = this;
    const classes = klasses ? klasses.split(/\s+/) : [];

    ctx.save();
    ctx.beginPath();

    // Defaults
    ctx.strokeStyle = this.props.line_color;
    ctx.lineWidth = this.props.line_width;
    ctx.setLineDash([]);
    ctx.lineCap = 'butt';

    let doFill = false;
    let doStroke = true;

    if (classes.includes('rung')) {
      ctx.strokeStyle = this.props.rung_color;
      ctx.lineWidth = this.props.rung_width;
    } else if (classes.includes('block_tab')) {
      ctx.fillStyle = this.props.block_tab_fill;
      doFill = true;
      doStroke = false;
    } else if (classes.includes('block')) {
      ctx.strokeStyle = this.props.block_stroke;
      ctx.setLineDash([2, 1]);
    } else if (classes.includes('closed')) {
      ctx.fillStyle = this.props.arrow_color;
      ctx.strokeStyle = this.props.arrow_color;
      doFill = true;
    } else if (classes.includes('open')) {
      ctx.strokeStyle = this.props.arrow_color;
    }

    if (classes.includes('dashed')) {
      ctx.setLineDash([6, 2]);
    }

    if (classes.includes('solid')) {
      ctx.lineCap = 'round';
    }

    this._executePath(d);

    if (doFill) {
      ctx.fill();
    }
    if (doStroke) {
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Parse and execute an SVG-style path string on the canvas context.
   *
   * @param {string} d Path string like "M x y L x y Z"
   */
  _executePath(d) {
    const {ctx} = this;
    const tokens = d.trim().split(/\s+/);
    let i = 0;
    while (i < tokens.length) {
      const cmd = tokens[i++];
      switch (cmd) {
        case 'M':
          ctx.moveTo(parseFloat(tokens[i++]), parseFloat(tokens[i++]));
          break;
        case 'L':
          ctx.lineTo(parseFloat(tokens[i++]), parseFloat(tokens[i++]));
          break;
        case 'Z':
          ctx.closePath();
          break;
        default:
          // Unknown command, skip
          break;
      }
    }
  }
}
