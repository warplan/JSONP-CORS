# 跨域
本文主要介绍JSONP、CORS两种跨域方式，后端采用Koa模拟后台，真正的目标是理解整个跨域流程的实现。Let`s start!

# JSONP
JSONP 是一种利用浏览器对带有src标签的能力实现访问跨域数据的小技巧（像img、link标签等不存在跨域问题）。

前端代码实现：
```javascript
<!DOCTYPE html>
<html>
<head>
  <title>模拟JSONP跨域请求</title>
</head>
<body>
  <script type="text/javascript">
    var message = 'hello world';
    function doSomething(data) {
      // 处理返回的数据
      document.write(data);
    }
  </script>
  <script src="http://127.0.0.1:3000/jsonp?callback=doSomething&msg=message"></script>
</body>
</html>
```
后端代码实现
```javascript
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

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000);
```

当后端的请求完成之后，会回调callback函数，并传入相应的message参数，执行doSomething函数。

## JSONP的优缺点
优点：兼容性好
缺点：
- JSONP只支持GET请求
- XMLHttpRequest相对于JSONP有着更好的错误处理机制


