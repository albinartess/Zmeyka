import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=readFileSync('index.html','utf8');
assert.ok(html.startsWith('<!doctype html>'));
const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
new vm.Script(script);
const core=script.slice(script.indexOf('const k=21'),script.indexOf('const F='));
vm.runInNewContext(core+`
const diff=I('normal');let run=O(diff);run.status='playing';
if(q(run,'left'))throw Error('reverse');
run.food={x:6,y:10};if(!te(run,diff).ate||run.score!==10||run.snake.length!==4)throw Error('food');
run.snake=[{x:20,y:10},{x:19,y:10},{x:18,y:10}];if(!te(run,diff).died)throw Error('wall');
run=O(diff);run.snake=[{x:5,y:5},{x:5,y:6},{x:6,y:6},{x:6,y:5},{x:7,y:5}];if(!te(run,diff).died)throw Error('self');
if($('normal')!==0||ne()!==false)throw Error('storage');oe('normal',100);ie(true);
`,{localStorage:{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}}});
console.log('PASS: HTML, JS syntax, reverse prevention, food/growth/score, wall/self collision, blocked storage');
