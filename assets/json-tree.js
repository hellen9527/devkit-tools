(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DevKitJSONTree = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Native validation supplies the grammar; literal tokens supply the model so
  // duplicate keys, key order and numeric/string spellings remain untouched.
  function parse(raw) {
    raw = String(raw);
    JSON.parse(raw);
    const tokens = /"(?:[^"\\]|\\.)*"|[{}\[\],:]|true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
    const stack = [];
    let root;
    let match;
    while ((match = tokens.exec(raw))) {
      const token = match[0];
      if (token === ',' || token === ':') continue;
      if (token === '}' || token === ']') {
        stack.pop();
        continue;
      }
      const parent = stack[stack.length - 1];
      if (parent && parent.node.type === 'object' && parent.key === null) {
        parent.key = token;
        continue;
      }
      let node;
      if (token === '{' || token === '[') {
        node = { type: token === '{' ? 'object' : 'array', children: [] };
      } else {
        const type = token[0] === '"' ? 'string'
          : token === 'null' ? 'null'
            : token === 'true' || token === 'false' ? 'boolean' : 'number';
        node = { type, raw: token };
      }
      if (parent) {
        parent.node.children.push({ key: parent.key, node });
        parent.key = null;
      } else root = node;
      if (node.children) stack.push({ node, key: null });
    }
    return root;
  }

  function mount(container, model, tr) {
    const document = container.ownerDocument;
    const translate = tr || ((key, ...args) => key.replace(/\{(\d+)\}/g, (_, index) => args[index]));
    const batchSize = 100;
    const previewLength = 160;

    function element(tag, className, text) {
      const result = document.createElement(tag);
      result.className = className;
      if (text !== undefined) result.textContent = text;
      return result;
    }

    function render(node, key, index, isRoot) {
      const isContainer = !!node.children;
      const isLong = !isContainer && node.raw.length > previewLength;
      const expandable = isContainer || isLong;
      const row = element(expandable ? 'details' : 'div',
        (isRoot ? 'json-tree-root' : 'json-tree-row') +
        (isContainer ? ' json-tree-node' : isLong ? ' json-tree-long-value' : ''));
      row.tabIndex = -1;
      const heading = expandable ? element('summary', 'json-tree-summary') : row;
      if (expandable) row.appendChild(heading);
      if (!isRoot) {
        heading.appendChild(element('span', key === null ? 'json-tree-index' : 'json-tree-key',
          (key === null ? index : key) + ': '));
      }
      if (!isContainer) {
        heading.appendChild(element('span', 'json-tree-value json-tree-' + node.type +
          (isLong ? ' json-tree-preview' : ''), isLong ? node.raw.slice(0, previewLength) + '…' : node.raw));
        if (isLong) {
          heading.appendChild(element('span', 'json-tree-count', ' ' + translate('Show full value')));
          let full;
          row.addEventListener('toggle', () => {
            if (row.open && !full) {
              full = element('div', 'json-tree-full-value json-tree-value json-tree-' + node.type, node.raw);
              row.appendChild(full);
            } else if (!row.open && full) {
              full.remove();
              full = null;
            }
          });
        }
        return row;
      }

      const isArray = node.type === 'array';
      heading.appendChild(element('span', 'json-tree-value', isArray
        ? (node.children.length ? '[…]' : '[]')
        : (node.children.length ? '{…}' : '{}')));
      heading.appendChild(element('span', 'json-tree-count', ' ' +
        translate(isArray ? '{0} items' : '{0} properties', node.children.length)));
      const children = element('div', 'json-tree-children');
      row.appendChild(children);
      const more = element('button', 'json-tree-more');
      more.type = 'button';
      let rendered = 0;

      function nextBatch() {
        const moveFocus = document.activeElement === more;
        more.remove();
        const end = Math.min(rendered + batchSize, node.children.length);
        let firstNewRow;
        while (rendered < end) {
          const child = node.children[rendered];
          const childRow = render(child.node, child.key, rendered, false);
          if (!firstNewRow) firstNewRow = childRow;
          children.appendChild(childRow);
          rendered++;
        }
        const remaining = node.children.length - rendered;
        if (remaining) {
          more.textContent = translate('Show next {0} ({1} remaining)', Math.min(batchSize, remaining), remaining);
          children.appendChild(more);
        }
        if (moveFocus && firstNewRow) {
          const target = firstNewRow.tagName === 'DETAILS' ? firstNewRow.children[0] : firstNewRow;
          target.focus();
        }
      }
      more.addEventListener('click', nextBatch);
      row.addEventListener('toggle', () => {
        if (row.open && !rendered) nextBatch();
        else if (!row.open) {
          children.replaceChildren();
          rendered = 0;
        }
      });
      if (isRoot) {
        row.open = true;
        nextBatch();
      }
      return row;
    }

    function reset() {
      const restoreFocus = container.contains(document.activeElement);
      const root = render(model, null, 0, true);
      container.replaceChildren(root);
      if (restoreFocus) (root.tagName === 'DETAILS' ? root.children[0] : root).focus();
    }
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', translate('JSON tree'));
    reset();
    return { reset };
  }

  return { parse, mount };
});
