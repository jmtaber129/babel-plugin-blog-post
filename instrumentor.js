const t = require('babel-types');

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

module.exports = transform;
