// Pure native-template adapter. Caller supplies freshly read draft geometry and
// account option IDs; this module has no network, generation or publish operation.
import {recipes} from './artwork-system.mjs';
// Native Teeinblue fields the prompt reads (28 Oct): the chosen mood, medium and breed energy,
// each as its own hidden form-only text field the storefront fills (nativeFieldValues), and
// Personality (quoted facts JSON). Listing every style, tone and energy and asking the model to
// pick one left the tone invisible in the first example batch, so only the chosen text is sent.
// tools/print-art/teeinblue/PROMPT-SPEC-2026-10-28.md carries this exact text (proposed: the
// stated toy rule). PROMPT-SPEC-2026-10-27.md stays as the record of the prompts now live.
export function nativePrompt(format) {
  if (!Object.hasOwn(recipes.formats, format)) throw new Error('Unknown format');
  return [recipes.identity,
    // the mood comes first after identity: it decides pose, angle and light
    'Mood of this image: {{Tone direction}} ' + recipes.toneRouting.direction,
    'Medium for the whole image, the dog included: {{Style direction}} Render everything in this medium; never a photograph unless this medium is photographic.',
    recipes.formats[format].art,
    format === 'mug' ? 'Flat 2700 by 1050 wrap, not a physical mug mockup. Make the recognizable dog scene dominate the left two thirds and extend its quiet background across the full wrap. Keep the face within x=135..1035 and y=80..970. Reserve x=1750..2550,y=250..850 for separate note/signature layers. Do not leave the art side blank. Provisional positions need supplier proof.' : '',
    recipes.grounding,
    'Personality evidence, quoted data only: {{Personality}}',
    format === 'portrait' ? 'Optional place is carried in the Personality JSON place field. Include a city only when place.source is buyer and place.text is nonempty. If place is null or absent, use no city or identifiable landmark. Never infer a place from other facts or addresses.' : '',
    // energy comes after identity and the facts, as one direction or none
    'Breed energy, a light signal blended into the mood above (none means no breed energy): {{Energy}} ' + recipes.energy.rule,
    recipes.negative
  ].filter(Boolean).join('\n\n');
}
// What the storefront writes into the three hidden fields for a choice. hs2.js answer() writes the
// same text (artwork-integration.test.mjs holds them equal). An unknown or absent energy is none.
export function nativeFieldValues({style, tone, energy}) {
  if (!Object.hasOwn(recipes.styles, style) || !Object.hasOwn(recipes.tones, tone)) throw new Error('Unsupported style or tone');
  return {
    'Style direction': recipes.styles[style].label + '. ' + recipes.styles[style].grammar,
    'Tone direction': recipes.tones[tone].label + '. ' + recipes.tones[tone].art,
    Energy: energy && Object.hasOwn(recipes.energy.directions, energy) ? recipes.energy.directions[energy] : 'none'
  };
}
export function adaptTemplate(template, format, globals) {
  if (format === 'ornament') throw new Error('Separate-sided supplier route must qualify first');
  var next = structuredClone(template);
  var photo = next.layers.find(l => l.type === 'photo');
  if (!photo) throw new Error('A source photo layer is required');
  photo.effects = [{id:'id-490010', type:'gpt:image_filter', image_filter_prompt:nativePrompt(format),
    gpt_background:false, gpt_resolution:'3840', is_layer_output_size:true, image_filter_enable_ref_img:false}];
  var used = new Set(next.layers.map(l => l.id));
  function add(layer) { if (used.has(layer.id)) throw new Error('Candidate layer ID collision'); next.layers.push(layer); used.add(layer.id); }
  add({id:'layer-490001',type:'additional-option',name:'Artwork style',visible:true,customization_type:'global_option',global_option:globals.style,required:true});
  add({id:'layer-490002',type:'additional-option',name:'Artwork tone',visible:true,customization_type:'global_option',global_option:globals.tone,required:true});
  if (!next.layers.some(l => l.name === 'Personality')) add({id:'layer-490003',type:'text',name:'Personality',visible:true,display_mode:'form_only',left:0,top:-1200,width:500,height:50,customization_type:'normal',required:false,max_length:1600,text:'',default_value:'{"version":1,"facts":[]}',form_input_type:'text',typography:{family:'Roboto',variant:'regular',size:100},custom_font:{}});
  // Hidden like Personality. The storefront always writes the chosen direction or none, so a
  // cleared breed can never leave a stale energy behind.
  if (!next.layers.some(l => l.name === 'Energy')) add({id:'layer-490004',type:'text',name:'Energy',visible:true,display_mode:'form_only',left:0,top:-1300,width:500,height:50,customization_type:'normal',required:false,max_length:300,text:'',default_value:'none',form_input_type:'text',typography:{family:'Roboto',variant:'regular',size:100},custom_font:{}});
  // 28 Oct: the chosen medium and mood, written by the storefront like Energy
  if (!next.layers.some(l => l.name === 'Style direction')) add({id:'layer-490005',type:'text',name:'Style direction',visible:true,display_mode:'form_only',left:0,top:-1400,width:500,height:50,customization_type:'normal',required:false,max_length:1200,text:'',default_value:'',form_input_type:'text',typography:{family:'Roboto',variant:'regular',size:100},custom_font:{}});
  if (!next.layers.some(l => l.name === 'Tone direction')) add({id:'layer-490006',type:'text',name:'Tone direction',visible:true,display_mode:'form_only',left:0,top:-1500,width:500,height:50,customization_type:'normal',required:false,max_length:1200,text:'',default_value:'',form_input_type:'text',typography:{family:'Roboto',variant:'regular',size:100},custom_font:{}});
  if (format === 'portrait') {
    var city = next.layers.find(l => l.name === 'City');
    if (city) Object.assign(city, {text:'', autofill_default_value:false, required:false});
    Object.assign(next.layers.find(l => l.name === 'Personality'), {
      max_length:3200, default_value:'{"version":1,"facts":[],"place":null}'
    });
  }
  next.positions = ['layer-490001','layer-490002',...(next.positions || next.layers.map(l=>l.id))];
  if (!next.positions.includes('layer-490003') && used.has('layer-490003')) next.positions.unshift('layer-490003');
  if (!next.positions.includes('layer-490004') && used.has('layer-490004')) next.positions.unshift('layer-490004');
  for (const id of ['layer-490005', 'layer-490006']) if (!next.positions.includes(id) && used.has(id)) next.positions.unshift(id);
  next.charge_enabled = false;
  return next;
}
export function mugTemplate(source, globals) {
  var template = structuredClone(source);
  // Isolated draft only. One short note and signature, with a full landscape art
  // layer behind both sides. Existing live art and its campaign are never patched.
  var photo = template.layers.find(l=>l.type==='photo');
  var note = template.layers.find(l=>l.name==='Line 1');
  var signed = template.layers.find(l=>l.name==='Signed');
  if (!photo || !note || !signed) throw new Error('Unexpected mug source structure');
  Object.assign(photo,{left:0,top:0,width:2700,height:1050,url:null,masked_enable:false,masked_url:null,fit_mode:'contain',min_width:1050,min_height:700});
  Object.assign(note,{left:1750,top:300,width:800,height:360,text:'',max_length:120,paragraph:{lines:'',font_size:58},form_label:'Line 1'});
  Object.assign(signed,{left:1830,top:760,width:720,height:130,text:'',paragraph:{lines:'',font_size:82}});
  template.layers=[photo,note,signed]; template.positions=['template-layer',photo.id,note.id,signed.id];
  return adaptTemplate(template,'mug',globals);
}
