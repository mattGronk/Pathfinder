import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";
import { createRequire } from "node:module";
const require=createRequire(import.meta.url);
const mock={state:null,writes:[],invalidated:[],fail:false};
globalThis.__pathfinderPersistenceTest=mock;
const bundle=await build({entryPoints:["src/app/dashboard/actions.ts"],bundle:true,platform:"node",format:"cjs",write:false,logLevel:"silent",plugins:[{
  name:"isolated-account-storage",
  setup(b){
    b.onResolve({filter:/^(@\/lib\/workspace-server|next\/cache)$/},args=>({path:args.path,namespace:"test"}));
    b.onLoad({filter:/.*/,namespace:"test"},args=>({contents:args.path==="next/cache"?`export function revalidatePath(path){globalThis.__pathfinderPersistenceTest.invalidated.push(path)}`:`export async function readWorkspace(){return globalThis.__pathfinderPersistenceTest.state} export async function updateOwnedMetadata(id,values){const m=globalThis.__pathfinderPersistenceTest;if(m.fail)throw new Error("Test storage failure");if(id!==m.state.user.id)throw new Error("Wrong owner");m.writes.push(values);m.state.results=values.pathfinder_results;}`,loader:"js"}));
  },
}]});
const module={exports:{}};
new Function("module","exports","require",bundle.outputFiles[0].text)(module,module.exports,require);
const {saveSuiteResult}=module.exports;
const answers=Array.from({length:30},(_,i)=>`q${i+1}-o1`);
test("saving enforces entitlements, preserves old results and refreshes both pages",async()=>{
  mock.state={tier:"free",user:{id:"test-account"},results:[]};
  assert.ok((await saveSuiteResult({id:"career",answers})).error);assert.equal(mock.writes.length,0);
  mock.state.tier="start";
  assert.ok((await saveSuiteResult({id:"eq",answers})).error);assert.equal(mock.writes.length,0);
  const old={id:"career",total:16,answers:["social"],scores:[],completedAt:"2026-09-01T12:00:00Z"};mock.state.results=[old];
  assert.ok((await saveSuiteResult({id:"subjects",answers})).message);
  assert.equal(mock.state.results.length,2);assert.deepEqual(mock.state.results[0],old);
  assert.equal(mock.state.results[1].total,30);assert.ok(mock.invalidated.includes("/dashboard"));assert.ok(mock.invalidated.includes("/assessments"));
  assert.ok((await saveSuiteResult({id:"subjects",answers})).message);assert.equal(mock.state.results.length,2);
  assert.ok((await saveSuiteResult({id:"career",answers:answers.slice(1)})).error);
  mock.fail=true;assert.ok((await saveSuiteResult({id:"career",answers})).error);assert.deepEqual(mock.state.results[0],old);mock.fail=false;
  mock.state.tier="full";
  for(const id of ["career","leadership","personality","learning","eq","values","enterprise","study","decisions"]){assert.ok((await saveSuiteResult({id,answers})).message,id);}
  assert.equal(mock.state.results.length,10);
});
