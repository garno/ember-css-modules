import Ember from 'ember';

const { getOwner, computed } = Ember;
const { dasherize } = Ember.String;

const LOCALCLASSNAMESCP = '__local_class_names_cp';

export default Ember.Mixin.create({
  localClassNames: null,
  localClassNameBindings: null,

  concatenatedProperties: ['localClassNames', 'localClassNameBindings'],

  init() {
    this._super();

    if (this.tagName === '') return;

    this.classNameBindings = [
      ...this.classNameBindings,
      ...localClassNames(this),
      // ...localClassNameBindings(this)
      LOCALCLASSNAMESCP,
    ];

    this.set(LOCALCLASSNAMESCP, buildLocalClassNameBindingsCp(this.localClassNameBindings, this.get('__styles__')));
  },

  __styles__: Ember.computed(function() {
    // If styles is an explicitly set hash, defer to it. Otherwise, use the resolver.
    if (this.styles && Object.getPrototypeOf(this.styles) === Object.prototype) {
      return this.styles;
    }

    let key = this._debugContainerKey;
    if (!key) { return; }

    return getOwner(this).resolveRegistration(`styles:components/${key.substring(key.indexOf(':') + 1)}`);
  })
});

function localClassNames(component) {
  return component.localClassNames.map(className => `__styles__.${className}`);
}

function buildLocalClassNameBindingsCp(localClassNameBindings, styles) {
  const bindings = localClassNameBindings
    .map(c => c.split(':'))
    .map(([property, trueStyle, falseStyle]) => {
      const trueClasses = (styles[trueStyle || dasherize(property)] || '').split(/\s+/);
      const falseClasses = (styles[falseStyle] || '').split(/\s+/);
      const isBoolean = !!trueStyle;
      return {property,trueClasses,falseClasses,isBoolean};
    });

  return computed(...bindings.map(b => b.property), function() {
    return bindings.map(binding => {
      const value = this.get(binding.property);
      if(!binding.isBoolean && (typeof value === 'string')) {
        return value.split(' ').map(c => styles[c]);
      }

      return value ? binding.trueClasses : binding.falseClasses;
    }).reduce((a, b) => [...a, ...b], []).join(' ');
  });
}
