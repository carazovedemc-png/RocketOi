import { connect } from 'cloudflare:sockets';

const UUID = 'a3f1b2c4-d5e6-7890-b1c2-d3e4f5a6b7c8';

export default {
  async fetch(r) {
    if (r.headers.get('Upgrade') !== 'websocket')
      return new Response('OK');

    const [c, s] = Object.values(new WebSocketPair());
    s.accept();
    handle(s).catch(() => s.close());
    return new Response(null, { status: 101, webSocket: c });
  }
};

async function handle(ws) {
  let buf = null;
  let sock = null;

  ws.addEventListener('message', async ({ data }) => {
    const d = data instanceof ArrayBuffer ? data : data.buffer;
    if (!sock) {
      buf = buf ? concat(buf, d) : d;
      const r = parse(buf);
      if (!r) return;
      buf = null;
      ws.send(new Uint8Array([0, 0]));
      sock = connect({ hostname: r.host, port: r.port });
      if (r.data.byteLength > 0)
        sock.writable.getWriter().write(new Uint8Array(r.data));
      pipe(sock.readable, ws);
    } else {
      const w = sock.writable.getWriter();
      await w.write(new Uint8Array(d));
      w.releaseLock();
    }
  });
  ws.addEventListener('close', () => sock?.close());
}

function parse(buf) {
  try {
    const v = new DataView(buf);
    let o = 1;
    const uid = [...new Uint8Array(buf, o, 16)]
      .map(x => x.toString(16).padStart(2,'0')).join('');
    const expected = UUID.replace(/-/g,'');
    if (uid !== expected) return null;
    o += 16 + v.getUint8(o + 16) + 1 + 1;
    const port = v.getUint16(o, false); o += 2;
    const type = v.getUint8(o++);
    let host = '';
    if (type === 1) {
      host = Array.from(new Uint8Array(buf, o, 4)).join('.'); o += 4;
    } else if (type === 2) {
      const l = v.getUint8(o++);
      host = new TextDecoder().decode(new Uint8Array(buf, o, l)); o += l;
    }
    return { host, port, data: buf.slice(o) };
  } catch { return null; }
}

async function pipe(readable, ws) {
  const reader = readable.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      ws.send(value.buffer);
    }
  } catch {} finally { ws.close(); }
}

function concat(a, b) {
  const r = new Uint8Array(a.byteLength + b.byteLength);
  r.set(new Uint8Array(a)); r.set(new Uint8Array(b), a.byteLength);
  return r.buffer;
}