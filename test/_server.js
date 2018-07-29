import http from "http";
import url from "url";

export const port = 8080;

/**
 * Creates an http server.
 * Server simply returns request info in the following format: `{url, method, params, data}`.
 * If `status` url parameter is given - its value will be used as response status code.
 *
 * @return {module:http.Server | module:http2.Http2Server}
 */
export function createServer()
{
    const server = http.createServer((req, res) => {
        const response = {
            url: req.url,
            method: req.method,
            params: url.parse(req.url, true).query
        };
        req.on("data", function (data) {
            response.data = data;
        });

        req.on("end", function () {
            res.writeHead(response.params.status || 200);
            res.write(JSON.stringify(response));
            res.end();
        });
    });
    server.listen(port, 'localhost');
    return server;
}
