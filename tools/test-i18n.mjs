import assert from 'node:assert/strict';
import { resolveLang } from '../assets/js/i18n.js';
assert.equal(resolveLang({ query: 'en', stored: 'es', nav: 'es-ES' }), 'en');   // ?lang gana
assert.equal(resolveLang({ query: 'xx', stored: 'en', nav: 'es-ES' }), 'en');   // query inválida → stored
assert.equal(resolveLang({ query: null, stored: null, nav: 'en-GB' }), 'en');
assert.equal(resolveLang({ query: null, stored: null, nav: 'fr-FR' }), 'es');   // Foco 1
assert.equal(resolveLang({ query: null, stored: null, nav: '' }), 'es');
assert.equal(resolveLang({ query: null, stored: 'de', nav: 'de-DE' }), 'es');   // stored inválido
assert.equal(resolveLang({ query: null, stored: null, nav: 'fr-FR', fallback: 'en' }), 'en');
assert.equal(resolveLang({ query: null, stored: null, nav: 'es-MX', fallback: 'en' }), 'es');
assert.equal(resolveLang({ query: null, stored: null, nav: '', fallback: 'en' }), 'en');
assert.equal(resolveLang({ query: 'es', stored: 'en', nav: 'ja-JP', fallback: 'en' }), 'es');
console.log('i18n OK');
