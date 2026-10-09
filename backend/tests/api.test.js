import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';

const dataDir = mkdtempSync(join(tmpdir(), 'marketplace-test-'));
process.env.DATA_DIR = dataDir;
process.env.JWT_SECRET = 'test-only-secret-never-use-in-production-123456';
const { createApp } = await import('../src/app.js');
const { initializeStorage, readCollection, writeCollection } = await import('../src/storage/jsonStore.js');
let server, base, seller, buyer, outsider;
const covered = new Set();
async function request(method, route, token, body, expected = 200) {
  covered.add(method + ' ' + route.replace(/\/(?:prod_|rent_|chat_|lf_|notif_)[^/]+/g, '/:id'));
  const response = await fetch(base + route, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  assert.equal(response.status, expected, method + ' ' + route + ': ' + JSON.stringify(data));
  return data;
}
async function signup(username) {
  return request('POST', '/api/signup', null, { username, email: username+'@example.test', password:'Password123!' }, 201);
}
async function product() {
  return (await request('POST','/api/products',seller.token,{ name:'Book', price:100, contact:'1234567890', category:'Books' },201)).product;
}
async function rental() {
  return (await request('POST','/api/rents',seller.token,{ name:'Calculator', rentPerDay:20, deposit:50, contact:'1234567890', category:'Electronics' },201)).rentItem;
}
before(async () => {
  initializeStorage();
  server=createApp().listen(0,'127.0.0.1');
  await once(server,'listening');
  base='http://127.0.0.1:'+server.address().port;
  seller=await signup('seller'); buyer=await signup('buyer'); outsider=await signup('outsider');
});
after(async () => {
  if(server) await new Promise(resolve=>server.close(resolve));
  rmSync(dataDir,{recursive:true,force:true});
});

test('health, authentication, input errors, and JSON API errors', async () => {
  assert.equal((await request('GET','/api/health')).status,'ok');
  const login=await request('POST','/api/login',null,{username:'seller',password:'Password123!'});
  assert.equal(login.user.id,seller.user.id);
  assert.equal((await request('GET','/api/profile',login.token)).user.username,'seller');
  await request('GET','/api/profile',null,undefined,401);
  await request('GET','/api/profile','invalid',undefined,401);
  await request('POST','/api/login',null,{username:'seller',password:'wrong'},400);
  await request('POST','/api/signup',null,{username:{},email:'x',password:42},400);
  await request('POST','/api/signup',null,{username:'seller',email:'new@example.test',password:'Password123!'},400);
  await request('GET','/api/not-a-route',null,undefined,404);
  const invalid=await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'});
  assert.equal(invalid.status,400); assert.match((await invalid.json()).message,/JSON/);
});

test('purchase request, private chat, notifications, approval and orders', async () => {
  const p=await product();
  await request('POST',`/api/products/${p.id}/buy-request`,seller.token,{},400);
  const req=await request('POST',`/api/products/${p.id}/buy-request`,buyer.token,{message:'Can we meet?'});
  assert.equal(req.product.status,'pending');
  const chat=await request('GET','/api/chats/'+req.chatId,seller.token);
  assert.equal(chat.messages[0].text,'Can we meet?');
  assert.equal(chat.buyerId,buyer.user.id);
  await request('GET','/api/chats/'+req.chatId,outsider.token,undefined,403);
  await request('POST',`/api/chats/${req.chatId}/message`,outsider.token,{text:'intrusion'},403);
  assert.deepEqual(await request('GET','/api/chats',outsider.token),[]);
  await request('POST',`/api/chats/${req.chatId}/message`,buyer.token,{text:' '},400);
  await request('POST',`/api/chats/${req.chatId}/message`,buyer.token,{text:42},400);
  const reply=await request('POST',`/api/chats/${req.chatId}/message`,seller.token,{text:' Yes, at noon. '});
  assert.equal(reply.msg.text,'Yes, at noon.');
  assert.equal((await request('GET','/api/chats/'+req.chatId,buyer.token)).messages.length,2);
  const buyerNotes=await request('GET','/api/notifications',buyer.token);
  assert.ok(buyerNotes.some(n=>n.type==='chat_message' && n.userId===buyer.user.id));
  assert.deepEqual(await request('GET','/api/notifications',outsider.token),[]);
  await request('POST',`/api/products/${p.id}/approve-sale`,outsider.token,{},403);
  const approved=await request('POST',`/api/products/${p.id}/approve-sale`,seller.token);
  assert.equal(approved.product.status,'sold'); assert.equal(approved.order.buyerId,buyer.user.id);
  const orders=await request('GET','/api/orders',buyer.token);
  assert.ok(orders.some(o=>o.itemId===p.id));
  assert.deepEqual(await request('GET','/api/orders',outsider.token),[]);
  const activity=await request('GET','/api/user/activity',seller.token);
  assert.ok(activity.activities.some(a=>a.rawId===p.id && a.status==='sold'));
  const notes=await request('GET','/api/notifications',seller.token);
  const note=notes.find(n=>n.type==='buy_request' && n.productId===p.id);
  assert.ok(note);
  await request('PATCH',`/api/notifications/${note.id}/read`,outsider.token,{},404);
  await request('PATCH',`/api/notifications/${note.id}/read`,seller.token);
  await request('PATCH','/api/notifications/read-all',seller.token);
  assert.ok((await request('GET','/api/notifications',seller.token)).every(n=>n.isRead));
  await request('DELETE','/api/notifications/'+note.id,seller.token);
  assert.ok(!(await request('GET','/api/notifications',seller.token)).some(n=>n.id===note.id));
});

test('purchase rejection reuses conversation and listing deletion enforces ownership', async () => {
  const p=await product();
  const first=await request('POST',`/api/products/${p.id}/buy-request`,buyer.token,{});
  await request('POST',`/api/products/${p.id}/reject-sale`,seller.token);
  const second=await request('POST',`/api/products/${p.id}/buy-request`,buyer.token,{});
  assert.equal(first.chatId,second.chatId);
  assert.equal((await request('GET','/api/chats/'+first.chatId,buyer.token)).messages.length,2);
  await request('POST',`/api/products/${p.id}/reject-sale`,seller.token);
  await request('DELETE','/api/products/'+p.id,outsider.token,undefined,403);
  await request('DELETE','/api/products/'+p.id,seller.token);
  assert.ok(!(await request('GET','/api/products')).some(x=>x.id===p.id));
});

test('rental chat, rejection/reuse, approval, pricing and private orders', async () => {
  const r=await rental();
  const first=await request('POST',`/api/rents/${r.id}/rent-request`,buyer.token,{days:3});
  await request('GET','/api/chats/'+first.chatId,outsider.token,undefined,403);
  await request('POST',`/api/rents/${r.id}/approve-rent`,outsider.token,{},403);
  await request('POST',`/api/rents/${r.id}/reject-rent`,seller.token);
  const second=await request('POST',`/api/rents/${r.id}/rent-request`,buyer.token,{days:3,message:'Three days please'});
  assert.equal(first.chatId,second.chatId);
  const chat=await request('GET','/api/chats/'+first.chatId,seller.token);
  assert.equal(chat.rentId,r.id); assert.equal(chat.messages.length,2);
  await request('POST',`/api/chats/${first.chatId}/message`,seller.token,{text:'Agreed'});
  const approved=await request('POST',`/api/rents/${r.id}/approve-rent`,seller.token);
  assert.equal(approved.item.status,'rented'); assert.equal(approved.order.totalAmount,110);
  assert.ok((await request('GET','/api/notifications',buyer.token)).some(n=>n.type==='rent_approved' && n.rentId===r.id));
  assert.ok((await request('GET','/api/rents')).some(x=>x.id===r.id));
  const disposable=await rental();
  await request('DELETE','/api/rents/'+disposable.id,buyer.token,undefined,403);
  await request('DELETE','/api/rents/'+disposable.id,seller.token);
});

test('legacy direct buy and direct rent endpoints still work', async () => {
  const p=await product();
  const bought=await request('POST',`/api/products/${p.id}/buy`,buyer.token,{contact:'12345'});
  assert.equal(bought.product.status,'sold'); assert.equal(bought.order.price,100);
  await request('POST',`/api/products/${p.id}/buy`,outsider.token,{},400);
  const r=await rental();
  const rented=await request('POST',`/api/rents/${r.id}/rent`,buyer.token,{days:2});
  assert.equal(rented.item.status,'rented'); assert.equal(rented.order.totalAmount,90);
});

test('lost and found create, filter, claim, and delete', async () => {
  const {item}=await request('POST','/api/lostfound',seller.token,{name:'Keys',location:'Library',contact:'12345'},201);
  assert.ok((await request('GET','/api/lostfound?location=Library')).some(x=>x.id===item.id));
  const claimed=await request('PATCH',`/api/lostfound/${item.id}/claim`,buyer.token);
  assert.equal(claimed.item.status,'claimed');
  await request('DELETE','/api/lostfound/'+item.id,buyer.token,undefined,403);
  await request('DELETE','/api/lostfound/'+item.id,seller.token);
});

test('concurrent signups retain all users and reject duplicate names', async () => {
  const users=await Promise.all(['parallel1','parallel2','parallel3'].map(signup));
  assert.equal(new Set(users.map(u=>u.user.id)).size,3);
  for(const u of users) assert.equal((await request('GET','/api/profile',u.token)).user.id,u.user.id);
  const responses=await Promise.all([1,2].map(i=>fetch(base+'/api/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'duplicate',email:`duplicate${i}@example.test`,password:'Password123!'})})));
  assert.deepEqual(responses.map(r=>r.status).sort(),[201,400]);
});

test('data survives application restart and corrupt JSON is never silently overwritten', async () => {
  const beforeRestart=await request('GET','/api/chats',buyer.token);
  await new Promise(resolve=>server.close(resolve));
  initializeStorage();
  server=createApp().listen(0,'127.0.0.1'); await once(server,'listening');
  base='http://127.0.0.1:'+server.address().port;
  assert.deepEqual(await request('GET','/api/chats',buyer.token),beforeRestart);
  const file=join(dataDir,'chats.json'); const saved=readFileSync(file,'utf8');
  try {
    writeFileSync(file,'{broken');
    assert.throws(()=>readCollection('chats'));
    assert.equal(readFileSync(file,'utf8'),'{broken');
  } finally { writeFileSync(file,saved); }
  assert.throws(()=>writeCollection('../escape',[]));
  assert.throws(()=>writeCollection('chats',{}));
  assert.ok(covered.size>=31,'Expected coverage of every original endpoint');
});
