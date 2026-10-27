// Local provider stand-in only. Never loaded by Shopify.
(function () {
  var data = {}, uploads = 0;
  window.teeinblueCampaign = {productId:'candidate-fixture'};
  window.teeinblue = Object.assign(window.teeinblue || {}, {getCurrentCustomization:function(){return Object.assign({},data);}});
  document.addEventListener('DOMContentLoaded', function () {
    var form = document.createElement('div'); form.className = 'tee-customization-form';
    function field(id,label,body) { return '<div class="tee-field" id="tee-field--'+id+'"><div class="tee-field__heading"><span>'+label+'</span></div>'+body+'</div>'; }
    function picker(id,options) { return '<select name="'+id+'">'+options.map(function(o){return '<option value="'+o[0]+'">'+o[1]+'</option>';}).join('')+'</select>'; }
    form.innerHTML = field('fixture-style','Artwork style',picker('fixture-style',[['cinematic','Cinematic'],['painterly','Painterly'],['screenprint','Vintage screenprint'],['comic','Comic book'],['collage','Cut-paper collage'],['ink','Fine ink drawing']]))
      + field('fixture-tone','Artwork tone',picker('fixture-tone',[['sentimental','Sentimental'],['warm','Warm with a wink'],['hilarious','Hilarious']]))
      + field('fixture-facts','Personality','<input name="fixture-facts" type="text">')
      + (document.querySelector('[data-hs2-blanket-art-preview]') ? '' : field('fixture-note','Line 4','<input name="fixture-note" type="text">'))
      + '<div class="tee-field tee-field--photo"><input type="file"></div><button id="teeAtcButton">Add to cart</button>';
    form.addEventListener('input',function(e){data[e.target.name]=e.target.value;});
    form.addEventListener('change',function(e){if(e.target.type==='file')uploads++;});
    document.querySelector('[data-hs2-answers]').after(form);
    var status = document.createElement('pre');status.id='fixture-native-result';status.style.cssText='font:11px monospace;white-space:pre-wrap';
    document.body.appendChild(status);
    function report(){status.textContent=JSON.stringify({nativeStyle:form.querySelector('[name="fixture-style"]').value,nativeTone:form.querySelector('[name="fixture-tone"]').value,factsHidden:getComputedStyle(form.querySelector('[name="fixture-facts"]').parentElement).display==='none',uploads:uploads});}
    document.dispatchEvent(new Event('teeinblue-event-component-injected'));
    setInterval(report,200);report();
  });
}());
