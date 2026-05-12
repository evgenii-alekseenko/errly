import http from 'node:http';

const pages = {
  '/error.html': `<!doctype html>
<html><body>
<h1>Network fixture</h1>
<script>fetch('/missing').catch(()=>{});</script>
</body></html>`,

  '/throw.html': `<!doctype html>
<html><body>
<h1>Runtime throw fixture</h1>
<script>
  setTimeout(() => { throw new Error('boom-from-throw'); }, 50);
</script>
</body></html>`,

  '/reject.html': `<!doctype html>
<html><body>
<h1>Runtime reject fixture</h1>
<script>
  setTimeout(() => { Promise.reject(new Error('boom-from-reject')); }, 50);
</script>
</body></html>`,
};

const server = http.createServer((req, res) => {
  const url = req.url ?? '/';
  if (url in pages) {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(pages[url]);
    return;
  }
  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('not found');
});

const port = Number(process.env.PORT ?? 3210);
server.listen(port, () => {
  console.log(`fixture server listening on ${port}`);
});
