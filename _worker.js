import { connect } from 'cloudflare:sockets';

const UUID = 'a3f1b2c4-d5e6-7890-b1c2-d3e4f5a6b7c8';

function checkUUID(bytes) {
  const ref = UUID.replace(/-/g,'').match(/.{2}/g).map(h=>parseInt(h,16));
  for (let i=0;i<16;i++) if (bytes[i]!==ref[i]) return false;
  return true;
}

export default {
  async fetch(request) {
    if (request.headers.get('Upgrade')==='websocket') return handleWS(request);
    return new Response('OK');
  }
};

async function handleWS(request) {
  const [client, server] = Object.values(new WebSocketPair());
  server.accept();
  let ready=false, socket=null, writer=null, queue=[];

  server.addEventListener('message', async ({data}) => {
    const buf = data instanceof ArrayBuffer ? data : data.buffer;
    if (!ready) {
      ready=true;
      const v = new DataView(buf);
      let o=0;
      o++; // version
      if (!checkUUID(new Uint8Array(buf,o,16))) { server.close(); return; }
      o+=16;
      o+=v.getUint8(o)+1; // addon
      const cmd=v.getUint8(o++);
      if (cmd!==1) { server.close(); return; }
      const port=v.getUint16(o,false); o+=2;
      const at=v.getUint8(o++);
      let host='';
      if (at===1) { host=Array.from(new Uint8Array(buf,o,4)).join('.'); o+=4; }
      else if (at===2) { const l=v.getUint8(o++); host=new TextDecoder().decode(new Uint8Array(buf,o,l)); o+=l; }
      else if (at===3) { const b=new Uint8Array(buf,o,16); host=`${b[0].toString(16).padStart(2,'0')}${b[1].toString(16).padStart(2,'0')}:${b[2].toString(16).padStart(2,'0')}${b[3].toString(16).padStart(2,'0')}:${b[4].toString(16).padStart(2,'0')}${b[5].toString(16).padStart(2,'0')}:${b[6].toString(16).padStart(2,'0')}${b[7].toString(16).padStart(2,'0')}:${b[8].toString(16).padStart(2,'0')}${b[9].toString(16).padStart(2,'0')}:${b[10].toString(16).padStart(2,'0')}${b[11].toString(16).padStart(2,'0')}:${b[12].toString(16).padStart(2,'0')}${b[13].toString(16).padStart(2,'0')}:${b[14].toString(16).padStart(2,'0')}${b[15].toString(16).padStart(2,'0')}`; o+=16; }
      server.send(new Uint8Array([0,0]).buffer);
      socket=connect({hostname:host,port});
      writer=socket.writable.getWriter();
      const payload=buf.slice(o);
      if (payload.byteLength>0) await writer.write(new Uint8Array(payload));
      for (const d of queue) await writer.write(new Uint8Array(d));
      const reader=socket.readable.getReader();
      (async()=>{ try { while(true){const{done,value}=await reader.read();if(done)break;server.send(value.buffer);} }catch{} server.close(); })();
    } else {
      if (writer) await writer.write(new Uint8Array(buf));
      else queue.push(buf);
    }
  });
  server.addEventListener('close',()=>socket?.close());
  return new Response(null,{status:101,webSocket:client});
}