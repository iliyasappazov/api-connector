import http from 'http';
import url from 'url';
import net from 'net';

export function getFreePort() {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(() => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

/**
 * Creates an http server.
 * Server simply returns request info in the following format: `{url, method, params, data}`.
 * If `status` url parameter is given - its value will be used as response status code.
 * If `timeout` url parameter is given - its value will be used to determine response time
 *
 * @param {number} port
 * @return {http.Server}
 */
export function createServer(port) {
  const server = http.createServer((req, res) => {
    const response = {
      url: req.url,
      method: req.method,
      params: url.parse(req.url, true).query,
    };
    let body = [];
    req.on('data', (chunk) => {
      body.push(chunk);
    });

    req.on('end', () => {
      if (body.length > 0) {
        body = Buffer.concat(body).toString();
        try {
          response.data = JSON.parse(body);
        } catch (e) {
          response.data = body;
        }
      }
      setTimeout(() => {
        res.writeHead(response.params.status || 200);
        res.write(JSON.stringify(response));
        res.end();
      }, response.params.timeout || 0);
    });
  });
  server.listen(port, 'localhost');
  return server;
}
