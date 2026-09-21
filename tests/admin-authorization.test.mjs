import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const accountId = "10000000-0000-4000-8000-000000000001";
const targetId = "10000000-0000-4000-8000-000000000002";
const productId = "10000000-0000-4000-8000-000000000003";
const state = { signedIn: true, admin: false, roleError: false, calls: [] };
globalThis.__pathfinderAdminTest = state;
const bundle = await build({
  stdin: { contents: 'export {requireAdmin} from "./src/lib/admin-server"; export {grantAccess,revokeAccess} from "./src/app/admin/actions";', resolveDir: process.cwd(), loader: "ts" },
  bundle: true, platform: "node", format: "cjs", write: false, logLevel: "silent",
  plugins: [{ name: "isolated-session-boundary", setup(b) {
    b.onResolve({ filter: /^(server-only|react|next\/navigation|next\/cache|\.\/supabase\/server|\.\/workspace-storage|\.\/supabase\/service)$/ }, args => ({ path: args.path, namespace: "session-test" }));
    b.onLoad({ filter: /.*/, namespace: "session-test" }, args => {
      const sources = {
        "server-only": "",
        "react": "export const cache=fn=>fn;",
        "next/navigation": 'export function redirect(path){throw new Error("REDIRECT:"+path)} export function notFound(){throw new Error("NOT_FOUND")}',
        "next/cache": "export function revalidatePath(){}",
        "./workspace-storage": 'export function loadPrivateRecords(){throw new Error("Unexpected privileged storage read")}',
        "./supabase/service": 'export function createServiceClient(){throw new Error("Unexpected privileged service client")}',
        "./supabase/server": `export async function createAccountClient(){return {auth:{getUser:async()=>({data:{user:globalThis.__pathfinderAdminTest.signedIn?{id:"${accountId}",app_metadata:{is_admin:true},user_metadata:{is_admin:true}}:null},error:null})},rpc:async(name,args)=>{const s=globalThis.__pathfinderAdminTest;s.calls.push({name,args});return name==="pathfinder_is_admin"?{data:s.admin,error:s.roleError?{message:"Database unavailable"}:null}:{data:"saved",error:null}},from(){throw new Error("Unexpected data read")}}}`,
      };
      return { contents: sources[args.path], loader: "js" };
    });
  } }],
});
const module = { exports: {} };
new Function("module", "exports", "require", bundle.outputFiles[0].text)(module, module.exports, require);
const { requireAdmin, grantAccess, revokeAccess } = module.exports;
function reset(values = {}) { Object.assign(state, { signedIn: true, admin: false, roleError: false, calls: [] }, values); }
function grantForm() {
  const form = new FormData();
  for (const [key,value] of Object.entries({user:targetId,product:productId,request:"10000000-0000-4000-8000-000000000004",note:"Test",confirmed:"yes",granted_by:"forged",source:"payment",is_admin:"true"})) form.set(key,value);
  return form;
}
test("signed-out admin requests redirect before any data or mutation", async () => {
  reset({signedIn:false});
  await assert.rejects(requireAdmin(), /REDIRECT:\/account\?next=\/admin/);
  await assert.rejects(grantAccess({}, grantForm()), /REDIRECT:/);
  assert.equal(state.calls.length,0);
});
test("normal users cannot invoke grant or revoke even with forged role fields", async () => {
  reset();
  await assert.rejects(requireAdmin(), /REDIRECT:\/account$/);
  await assert.rejects(grantAccess({}, grantForm()), /REDIRECT:\/account$/);
  await assert.rejects(revokeAccess({}, grantForm()), /REDIRECT:\/account$/);
  assert.ok(state.calls.every(c => c.name === "pathfinder_is_admin"));
});
test("role lookup failures fail closed", async () => {
  reset({admin:true,roleError:true});
  await assert.rejects(grantAccess({},grantForm()), /could not be verified/);
  assert.equal(state.calls.length,1);
});
test("admin grant forwards only validated fields; actor and source are database derived", async () => {
  reset({admin:true});
  const result = await grantAccess({},grantForm());
  assert.ok(result.message);
  const mutation = state.calls.find(c => c.name === "pathfinder_grant_access");
  assert.deepEqual(Object.keys(mutation.args).sort(), ["p_expires","p_note","p_product","p_request","p_user"]);
  assert.equal(mutation.args.p_user,targetId);
  assert.equal(mutation.args.p_expires,null);
});
test("a fresh action rechecks membership after a previous authorized action", async () => {
  reset({admin:true});
  assert.ok((await grantAccess({},grantForm())).message);
  state.admin=false;
  await assert.rejects(grantAccess({},grantForm()), /REDIRECT:\/account$/);
  assert.equal(state.calls.filter(c => c.name === "pathfinder_grant_access").length,1);
});
test("missing confirmation, invalid identifiers and past expiry never mutate", async () => {
  reset({admin:true});
  const form=grantForm();form.delete("confirmed");assert.ok((await grantAccess({},form)).error);
  form.set("confirmed","yes");form.set("user","invalid");assert.ok((await grantAccess({},form)).error);
  form.set("user",targetId);form.set("expires","2000-01-01T00:00:00Z");assert.ok((await grantAccess({},form)).error);
  assert.ok(state.calls.every(c=>c.name==="pathfinder_is_admin"));
});
