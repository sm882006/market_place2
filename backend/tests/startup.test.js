import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
import { createServer } from 'node:net';

const root=fileURLToPath(new URL('../../',import.meta.url));
test('all three startup commands work from another directory and serve the frontend build', async () => {
  const dataDir=mkdtempSync(join(tmpdir(),'marketplace-startup-'));
  try {
    for(const entry of ['backend/src/server.js','server/server.js','server.js']) {
      const reservation=createServer().listen(0,'127.0.0.1');
      await once(reservation,'listening');
      const port=reservation.address().port;
      await new Promise(resolve=>reservation.close(resolve));
      const child=spawn(process.execPath,[join(root,entry)],{
        cwd:dataDir,
        env:{...process.env,PORT:String(port),DATA_DIR:dataDir,JWT_SECRET:'startup-test-only-secret-1234567890123456789'},
        stdio:['ignore','pipe','pipe'],windowsHide:true,
      });
      const closed=once(child,'close');
      let output=''; child.stderr.on('data',chunk=>{output+=chunk;});
      try {
        await new Promise((resolve,reject)=>{
          const timeout=setTimeout(()=>reject(new Error('Startup timed out: '+output)),10000);
          child.once('error',error=>{clearTimeout(timeout);reject(error);});
          child.once('exit',code=>{clearTimeout(timeout);reject(new Error('Startup exited '+code+': '+output));});
          child.stdout.on('data',chunk=>{
            if(String(chunk).includes('Backend server running')) {clearTimeout(timeout);resolve();}
          });
        });
        const base='http://127.0.0.1:'+port;
        const health=await fetch(base+'/api/health');
        assert.equal(health.status,200);assert.equal((await health.json()).status,'ok');
        if(existsSync(join(root,'dist/index.html'))) {
          const page=await fetch(base+'/profile',{headers:{Accept:'text/html'}});
          assert.equal(page.status,200);assert.match(await page.text(),/<div id="root">/);
          const missing=await fetch(base+'/api/unknown',{headers:{Accept:'text/html'}});
          assert.equal(missing.status,404);assert.match(missing.headers.get('content-type'),/json/);
        }
      } finally { child.kill();await closed; }
    }
  } finally { rmSync(dataDir,{recursive:true,force:true}); }
});
