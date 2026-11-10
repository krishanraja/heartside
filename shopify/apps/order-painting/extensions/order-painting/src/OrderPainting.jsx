import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {paintingFor} from './painting.js';

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const painting = paintingFor(shopify.target.value);
  if (!painting) return null;
  const alt = painting.dog
    ? shopify.i18n.translate('alt', {dog: painting.dog})
    : shopify.i18n.translate('altNoName');
  return (
    <s-stack direction="block" gap="small-200">
      <s-text type="strong">{shopify.i18n.translate('heading')}</s-text>
      <s-box maxInlineSize="240px" borderRadius="base">
        <s-image src={painting.src} alt={alt} aspectRatio="1/1" inlineSize="fill" objectFit="cover" />
      </s-box>
    </s-stack>
  );
}
