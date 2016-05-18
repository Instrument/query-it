import 'core-js/es6/reflect';

export default function mixin(behaviour, sharedBehaviour = {}) {
  const instanceKeys = Reflect.ownKeys(behaviour);
  const sharedKeys = Reflect.ownKeys(sharedBehaviour);
  const typeTag = Symbol('isa');

  function _mixin(target) {
    for (const property of instanceKeys) {
      Object.defineProperty(target, property, { value: behaviour[property] });
    }

    Object.defineProperty(target, typeTag, { value: true });

    return target;
  }

  for (const property of sharedKeys) {
    Object.defineProperty(_mixin, property, {
      value: sharedBehaviour[property],
      enumerable: sharedBehaviour.propertyIsEnumerable(property),
    });
  }

  Object.defineProperty(_mixin, Symbol.hasInstance, {
    value: (i) => !!i[typeTag],
  });

  return _mixin;
}
