import fs from 'fs';

let content = fs.readFileSync('src/main.tsx', 'utf8');

const target = if (typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child.parentNode !== this) {
      if (console) console.warn('Prevented React Google Translate crash (removeChild)');
      return child;
    }
    return originalRemoveChild.apply(this, arguments as any);
  };
  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (console) console.warn('Prevented React Google Translate crash (insertBefore)');
      return newNode;
    }
    return originalInsertBefore.apply(this, arguments as any);
  };
};

const replacement = if (typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) {
      if (console) console.warn('Prevented React Google Translate crash (removeChild)');
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };
  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(this: Node, newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (console) console.warn('Prevented React Google Translate crash (insertBefore)');
      return newNode;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
};

content = content.replace(target, replacement);
fs.writeFileSync('src/main.tsx', content);
console.log('Patched main.tsx typescript signatures');
