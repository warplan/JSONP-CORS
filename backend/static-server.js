const koa = require('koa');
const app = new koa();

const Router = require('koa-router');
const router = new Router();

const serve = require('koa-static');

const path = require('path');

const staticPath = path.resolve(__dirname, '../CORS');

// 设置静态服务
const staticServe = serve(staticPath);
app.use(staticServe);

app.listen(3300);
console.log('koa server is listening port 3300');