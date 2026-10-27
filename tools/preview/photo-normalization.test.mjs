import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {transformSync} from 'esbuild';

const source=readFileSync(new URL('../../shopify/assets/hs-artwork-photo.js',import.meta.url),'utf8');
for(const minified of [false,true]) test(`${minified?'minified':'source'}: real decoder removes source metadata without resizing or changing decoded pixels`,async()=>{
  const browser=await chromium.launch({headless:true});
  try {
    const page=await browser.newPage();
    await page.route('**/*',route=>route.request().url()==='http://localhost/'?route.fulfill({contentType:'text/html',body:'<!doctype html><title>Local photo normalization test</title>'}):route.abort());
    await page.goto('http://localhost/');
    await page.addScriptTag({content:minified?transformSync(source,{minify:true}).code:source});
    const result=await page.evaluate(async()=>{
      const canvas=document.createElement('canvas');canvas.width=64;canvas.height=32;
      const context=canvas.getContext('2d');context.fillStyle='#3166a1';context.fillRect(0,0,64,32);context.clearRect(4,5,7,8);
      const originalPixels=Array.from(context.getImageData(0,0,64,32).data);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
      const bytes=new Uint8Array(await blob.arrayBuffer());
      const payload=new TextEncoder().encode('Comment\0synthetic-private-location');
      const chunk=new Uint8Array(payload.length+12), view=new DataView(chunk.buffer);
      view.setUint32(0,payload.length);chunk.set(new TextEncoder().encode('tEXt'),4);chunk.set(payload,8);
      let crc=0xffffffff;
      for(const byte of chunk.slice(4,-4)){crc^=byte;for(let j=0;j<8;j++)crc=crc&1?(crc>>>1)^0xedb88320:crc>>>1;}
      view.setUint32(chunk.length-4,(crc^0xffffffff)>>>0);
      const file=new File([bytes.slice(0,-12),chunk,bytes.slice(-12)],'private-original.png',{type:'image/png'});
      const prepared=await window.HSArtworkPhoto.prepare(file);
      const output=new Uint8Array(await prepared.file.arrayBuffer());
      window.HSArtworkPhoto.checkPNG(output.buffer);
      const bitmap=await createImageBitmap(prepared.file);context.clearRect(0,0,64,32);context.drawImage(bitmap,0,0);bitmap.close();
      return {width:prepared.width,height:prepared.height,metadataRemoved:prepared.photo.metadataRemoved,
        distinctHashes:/^[a-f0-9]{64}$/.test(prepared.photo.originalHash)&&prepared.photo.originalHash!==prepared.photo.uploadHash,
        pixelsEqual:JSON.stringify(originalPixels)===JSON.stringify(Array.from(context.getImageData(0,0,64,32).data)),
        sourceTextRemains:new TextDecoder().decode(output).includes('synthetic-private-location'),name:prepared.file.name};
    });
    assert.deepEqual(result,{width:64,height:32,metadataRemoved:true,distinctHashes:true,pixelsEqual:true,sourceTextRemains:false,name:'dog-artwork-source.png'});
  } finally {await browser.close();}
});
