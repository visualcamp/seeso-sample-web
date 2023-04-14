const Bundler = require('parcel-bundler');
const express = require('express');
const http = require('http');
const open = require('open');
const app = express();

const bundlePath = process.argv[2];
const port = process.argv[3];

app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    next()
})

const bundler = new Bundler(bundlePath);

app.use(bundler.middleware());

const server = http.createServer(app);
server.listen(port);


server.on('error', (err) => console.error(err));
server.on('listening', () => {
    console.info('Server is running');
    console.info(`  NODE_ENV=[${process.env.NODE_ENV}]`);
    console.info(`  Port=[${port}]`);
    open(`http://localhost:${port}`);
});
