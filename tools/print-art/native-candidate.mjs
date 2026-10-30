// Pure native-template adapter. Caller supplies freshly read draft geometry and
// account option IDs; this module has no network, generation or publish operation.
import {recipes} from './artwork-system.mjs';
import {briefFields, briefPrompt} from './artwork-system.mjs';
// Native Teeinblue prompt, recipes v10 (29 Oct): the growth session's directed brief. The saved
// prompt is a short fixed frame per format (briefPrompt); the storefront fills its three hidden
// fields with the brief for this dog (briefFields; hs2.js answer() writes the same text,
// artwork-integration.test.mjs holds them equal): Energy carries the identity line, Tone
// direction the scene the tone stages, Style direction the medium. Personality is still filled
// (quoted facts JSON, for the order record) but the prompt no longer reads it.
// tools/print-art/teeinblue/PROMPT-SPEC-2026-10-29.md carries this exact text.
// PROMPT-SPEC-2026-10-28.md stays as the record of the rulebook prompts it replaces.
export function nativePrompt(format) {
  if (!Object.hasOwn(recipes.formats, format)) throw new Error('Unknown format');
  return briefPrompt(format);
}
export function nativeFieldValues(input) {
  return briefFields(input);
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
