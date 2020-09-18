var Koa = require('koa');
var Router = require('koa-router');
 
var app = new Koa();
var router = new Router();

router.get('/', (ctx, next) => {
  ctx.body = 'Hello World!';
});

// jsonp跨域请求
router.get('/jsonp', (ctx, next) => {
  // 获取参数
  const query = ctx.request.query;
  ctx.body = `${query.callback}(${query.msg})`
})

// 设置CORS
app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Methods', 'GET,POST,PUT');
  ctx.set('Access-Control-Allow-Headers', 'x-requested-with, Content-Type');
  ctx.set('Access-Control-Max-Age', 10);

  if (ctx.request.method == 'OPTIONS') {
    ctx.body = 200; 
  } else {
    await next();
  }
});

// CORS跨域非简单请求
router.put('/cors/request', (ctx, next) => {
  ctx.body = "Hello world!";
});

// CORS简单请求
router.get('/cors/easy-request', (ctx, next) => {
  ctx.body = "Hello easy world!";
});

// CORS原生表单请求
router.get('/cors/form-request', (ctx, next) => {
  console.log("form request");
  ctx.body = "Hello easy form!";
});

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000);