// The painting under each line on the customer-account order status page
// (shopify/apps/order-painting/extensions/order-painting/src/painting.js). Order #1013 showed the example dog there.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {paintingFor} from '../../shopify/apps/order-painting/extensions/order-painting/src/painting.js';

const CHECKOUT = 'https://cdn.shopify.com/s/files/1/x/files/heartside-checkout-abc.jpg?v=1';
const PREVIEW = 'https://cdn.teeinblue.com/customizations/abc.jpg';
const at = o => Object.entries(o).map(([key, value]) => ({key, value}));

test('a painted line shows its checkout picture and names the dog', () => {
  assert.deepEqual(paintingFor({attributes: at({_hs_checkout_image: CHECKOUT, _customization_image: PREVIEW, _hs_answers: 'Dog: Mowgli (he) | For: KJ | home: door'})}), {src: CHECKOUT, dog: 'Mowgli'});
});

test("Teeinblue's preview when there is no checkout picture; a Dog's name field wins", () => {
  assert.deepEqual(paintingFor({attributes: at({_customization_image: PREVIEW, "Dog's name": 'Zoë', _hs_answers: 'Dog: Zoe (she)'})}), {src: PREVIEW, dog: 'Zoë'});
});

test('a bundle line reads its components', () => {
  assert.deepEqual(paintingFor({attributes: [], lineComponents: [{attributes: []}, {attributes: at({_hs_checkout_image: CHECKOUT})}]}), {src: CHECKOUT, dog: ''});
});

test('nothing for a line with no painting, a foreign host, or no line', () => {
  assert.equal(paintingFor({attributes: at({_hs_addon: 'card'})}), null);
  assert.equal(paintingFor({attributes: at({_hs_checkout_image: 'https://evil.example/x.jpg'})}), null);
  assert.equal(paintingFor({attributes: at({_customization_image: 'http://cdn.teeinblue.com/x.jpg'})}), null);
  assert.equal(paintingFor(undefined), null);
});
