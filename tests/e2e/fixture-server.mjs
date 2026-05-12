import http from 'node:http';

const PAGE = `<!doctype html>
<html><body>
<h1>Fixture</h1>
<script>fetch('/missing').catch(()=>{});</script>
</body></html>`;

const server = http.createServer((req, res) => {
  if (req.url === '/error.html') {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(PAGE);
    return;
  }
  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('not found');
});

const port = Number(process.env.PORT ?? 3210);
server.listen(port, () => {
  console.log(`fixture server listening on ${port}`);
});
