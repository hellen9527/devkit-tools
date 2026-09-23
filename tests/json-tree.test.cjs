const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const modulePath = path.join(__dirname, '../assets/json-tree.js');
const tree = fs.existsSync(modulePath) ? require(modulePath) : {};

test('JSON tree exposes its parser', () => {
  assert.equal(typeof tree.parse, 'function');
});

test('parser preserves source property order, duplicates and exact scalar tokens', () => {
  const root = tree.parse('{"10":900719925474099312345,"2":-0,"10":1.2300e+400,"escape":"a\\n\\u0062\\\""}');
  assert.equal(root.type, 'object');
  assert.deepEqual(root.children.map(child => child.key), ['"10"', '"2"', '"10"', '"escape"']);
  assert.deepEqual(root.children.map(child => child.node.raw), ['900719925474099312345', '-0', '1.2300e+400', '"a\\n\\u0062\\\""']);
});

test('parser supports empty containers and every primitive at the root', () => {
  for (const [raw, type] of [['{}', 'object'], ['[]', 'array'], ['null', 'null'], ['true', 'boolean'], ['false', 'boolean'], ['0', 'number'], ['""', 'string']]) {
    const model = tree.parse(` \n${raw}\t`);
    assert.equal(model.type, type);
    if (model.children) assert.deepEqual(model.children, []);
    else assert.equal(model.raw, raw);
  }
  const root = tree.parse('[{}, [], {"": [false, null]}]');
  assert.equal(root.children[2].node.children[0].key, '""');
  assert.equal(root.children[2].node.children[0].node.children[1].node.type, 'null');
});

test('parser validates malformed JSON with the native grammar', () => {
  for (const raw of ['', '{', '[1,]', '{"a":1,}', '01', 'NaN', 'undefined', '"\\x00"', 'true false']) {
    assert.throws(() => tree.parse(raw), SyntaxError);
  }
});

test('parser handles 5000 nested containers without recursive traversal', () => {
  let node = tree.parse('['.repeat(5000) + '-0' + ']'.repeat(5000));
  for (let depth = 0; depth < 5000; depth++) {
    assert.equal(node.type, 'array');
    node = node.children[0].node;
  }
  assert.equal(node.raw, '-0');
});

test('parser keeps malicious keys and strings as literal data', () => {
  const raw = '{"__proto__":"</script><img src=x onerror=alert(1)>","constructor":"<&>"}';
  assert.equal(tree.parse(raw).children[0].node.raw, '"</script><img src=x onerror=alert(1)>"');
});

// Minimal DOM surface: text-only writes, native detail toggles, and focus. Any
// accidental HTML insertion fails instead of silently hiding an XSS regression.
class Element {
  constructor(tag, document) {
    this.tagName = tag.toUpperCase();
    this.ownerDocument = document;
    this.children = [];
    this.attributes = {};
    this.listeners = {};
    this.className = '';
    this.open = false;
    this._text = '';
  }
  set innerHTML(_) { throw new Error('HTML insertion is forbidden'); }
  set textContent(value) { this._text = String(value); this.replaceChildren(); }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  appendChild(child) {
    if (child.parentNode) child.remove();
    child.parentNode = this;
    this.children.push(child);
    return child;
  }
  replaceChildren(...children) {
    for (const child of this.children) child.parentNode = null;
    this.children = [];
    for (const child of children) this.appendChild(child);
  }
  remove() {
    if (!this.parentNode) return;
    this.parentNode.children.splice(this.parentNode.children.indexOf(this), 1);
    this.parentNode = null;
  }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); }
  dispatch(type) { for (const listener of this.listeners[type] || []) listener({ target: this }); }
  contains(element) { return this === element || this.children.some(child => child.contains(element)); }
  focus() { this.ownerDocument.activeElement = this; }
}

function dom() {
  const document = { createElement(tag) { return new Element(tag, this); }, activeElement: null };
  return { document, container: document.createElement('div') };
}
function byClass(element, className) {
  return [element, ...element.children.flatMap(child => byClass(child, className))]
    .filter(child => child.className.split(' ').includes(className));
}
function toggle(details, open) { details.open = open; details.dispatch('toggle'); }

test('renderer opens the root while child containers stay lazy and close releases their DOM', () => {
  const { container } = dom();
  tree.mount(container, tree.parse('{"a":{"hidden":{"value":42}},"b":[],"c":true}'));
  const root = container.children[0];
  assert.equal(root.tagName, 'DETAILS');
  assert.equal(root.open, true);
  const branch = byClass(root, 'json-tree-node')[1];
  assert.equal(branch.open, false);
  assert.equal(container.textContent.includes('hidden'), false);
  toggle(branch, true);
  assert.equal(container.textContent.includes('hidden'), true);
  assert.equal(container.textContent.includes('value'), false);
  toggle(branch, false);
  assert.equal(container.textContent.includes('hidden'), false);
});

test('renderer batches wide branches and localizes counts and remaining items', () => {
  const { container } = dom();
  const calls = [];
  const tr = (key, ...args) => { calls.push([key, ...args]); return key.replace(/\{(\d+)\}/g, (_, n) => args[n]); };
  tree.mount(container, tree.parse(JSON.stringify(Array.from({ length: 205 }, (_, n) => n))), tr);
  assert.equal(byClass(container, 'json-tree-row').length, 100);
  assert.deepEqual(calls.find(call => call[0] === '{0} items'), ['{0} items', 205]);
  const more = byClass(container, 'json-tree-more')[0];
  assert.equal(more.textContent, 'Show next 100 (105 remaining)');
  more.dispatch('click');
  assert.equal(byClass(container, 'json-tree-row').length, 200);
  assert.equal(more.textContent, 'Show next 5 (5 remaining)');
  more.dispatch('click');
  assert.equal(byClass(container, 'json-tree-row').length, 205);
  assert.equal(byClass(container, 'json-tree-more').length, 0);
});

test('renderer defers full long scalar text and never inserts markup', () => {
  const { container } = dom();
  const value = '<img src=x onerror=alert(1)>'.repeat(100);
  const raw = JSON.stringify(value);
  tree.mount(container, tree.parse(raw));
  assert.ok(container.textContent.length < 220);
  assert.equal(byClass(container, 'json-tree-full-value').length, 0);
  const details = container.children[0];
  toggle(details, true);
  assert.equal(byClass(container, 'json-tree-full-value')[0].textContent, raw);
  toggle(details, false);
  assert.equal(byClass(container, 'json-tree-full-value').length, 0);
});

test('reset returns to the root overview and preserves an external reset button focus', () => {
  const { container, document } = dom();
  const controller = tree.mount(container, tree.parse('{"a":{"deep":true}}'));
  const reset = document.createElement('button');
  toggle(byClass(container, 'json-tree-node')[1], true);
  reset.focus();
  controller.reset();
  assert.equal(document.activeElement, reset);
  assert.equal(container.children[0].open, true);
  assert.equal(container.textContent.includes('deep'), false);
});

test('rendering a deeply nested model only builds the root and its immediate child', () => {
  const { container } = dom();
  tree.mount(container, tree.parse('['.repeat(5000) + 'true' + ']'.repeat(5000)));
  assert.equal(byClass(container, 'json-tree-node').length, 2);
});
