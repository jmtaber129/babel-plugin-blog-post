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

        if (!parent) {
          return;
        }
      },
    },
  };
}

module.exports = transform;
