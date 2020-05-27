const t = require('babel-types');
const template = require('babel-template');

function transform() {
  return {
    visitor: {
      ObjectProperty(path) {
        if (path.node.key.name !== 'touchableHandlePress') {
          // Not our target node.
          return;
        }

        const parent = path.findParent(path => {
          return (
            path.isCallExpression() && path.node.callee.name === 'createReactClass'
          );
        });

        if (!(parent && hasTouchableMixin(path))) {
          return;
        }

        const callOriginalFunctionExpression = t.memberExpression(
          path.node.value, // The actual function is the 'value' of the ObjectProperty.
          t.identifier('call')
        );

        const calledFunction = t.callExpression(callOriginalFunctionExpression, [
          t.identifier('this'), // 't.thisExpression()' doesn't give the correct identifier here.
          t.identifier('e'), // The event argument.
        ]);

        const autotrackExpression = buildAutotrackExpression({
          THIS_EXPRESSION: t.identifier('this'),
        });

        const functionBody = buildFunctionWrapper({
          AUTOTRACK_EXPRESSION: autotrackExpression,
          ORIGINAL_FUNCTION_CALL: calledFunction,
        });

        const replacementFunction = t.arrowFunctionExpression([t.identifier('e')], functionBody);

        path.get('value').replaceWith(replacementFunction);
      },
    },
  };
}

const hasTouchableMixin = path => {
  return !!path.container.find((node, i) => {
    if (
      node.type === 'ObjectProperty' &&
      node.key.name === 'mixins' &&
      node.value.type === 'ArrayExpression'
    ) {
      const state = { hasTouchableMixin: false };
      path.getSibling(i).traverse(identifierVisitor, { visitorState: state });
      return state.hasTouchableMixin;
    }
  });
};

const identifierVisitor = {
  Identifier(path) {
    if (path.node.name === 'Touchable') {
      this.visitorState.hasTouchableMixin = true;
    }
  },
};

// Creates a 'CallExpression' node.
const buildAutotrackExpression = template(`
  Heap.captureTouchablePress(THIS_EXPRESSION, e);
`);

// Creates a 'BlockStatement' node.
const buildFunctionWrapper = template(`{
  const Heap = require('babel-plugin-blog-post/Heap').default;

  AUTOTRACK_EXPRESSION
  ORIGINAL_FUNCTION_CALL
}`);

module.exports = transform;
