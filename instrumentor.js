function transform() {
  return {
    visitor: {
      ObjectProperty(path) {
        if (path.node.key.name !== 'touchableHandlePress') {
          // Not our target node.
          return;
        }
      },
    },
  };
}

module.exports = transform;
