# 跨域
本文主要介绍JSONP、CORS两种跨域方式，后端采用Koa模拟后台，真正的目标是理解整个跨域流程的实现。
至于什么是跨域和浏览器同源策略的问题，就自行百度吧。

## JSONP
JSONP 是一种trick, 利用浏览器对带有src标签的能力实现访问跨域数据的小技巧（像img、link标签等不存在跨域问题）。

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

### JSONP的优缺点
优点：兼容性好

缺点：
- JSONP只支持GET请求
- XMLHttpRequest相对于JSONP有着更好的错误处理机制

## CORS
MDN：跨域资源共享(CORS) 是一种机制，它使用额外的 HTTP 头来告诉浏览器  让运行在一个 origin (domain) 上的Web应用被准许访问来自不同源服务器上的指定的资源。当一个资源从与该资源本身所在的服务器不同的域、协议或端口请求一个资源时，资源会发起一个跨域 HTTP 请求。

需要注意的是，针对CORS，异步请求会被分为简单请求和非简单请求，非简单请求会先发起一次preflight，也就是我们所说的预检。

### 简单请求
使用下列方法之一：
 - GET
 - HEAD
 - POST
HTTP请求头仅限于以下：
 - Accept
 - Accept-Language
 - Content-Language
 - Content-Type
 - DPR
 - Downlink
 - Save-Data
 - Viewport-Width
 - Width
Content-Type的值仅限于下列三者之一:
 - text/plain
 - multipart/form-data
 - application/x-www-form-urlencoded
 
 看上去十分复杂，我们怎么来理解？其实简单请求就是HTML form原生表单不依赖脚本可以发出的请求，我们来看一下表单的enctype属性：

 #### enctype
 - application/x-www-form-urlencoded：未指定属性时的默认值。
 - multipart/form-data：当表单包含 type=file 的 <input> 元素时使用此值。
 - text/plain

其实简单请求还分为原生form请求（不依赖脚本）和 脚本模拟提交表单的简单请求，我们先来看一下原生的form请求：

```html
<!DOCTYPE html>
<html>
<head>
  <title>CORS-form</title>
</head>
<body>
  <form action="http://127.0.0.1:3000/cors/form-request" method="get" class="form-example">
    <div class="form-example">
      <label for="name">Enter your name: </label>
      <input type="text" name="name" id="name">
    </div>
    <div class="form-example">
      <label for="email">Enter your email: </label>
      <input type="email" name="email" id="email">
    </div>
    <div class="form-example">
      <input type="submit" value="Subscribe!">
    </div>
  </form>
</body>
</html>
```

```javascript
var Koa = require('koa');
var Router = require('koa-router');
 
var app = new Koa();
var router = new Router();

router.get('/', (ctx, next) => {
  ctx.body = 'Hello World!';
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
```

![avatar](http://baidu.com/pic/doge.png)

我们看到原生表单不存在跨域的情况，我们再来看下用脚本来模拟表单提交：

```html
<!DOCTYPE html>
<html>
<head>
  <title>cors</title>
  <script src="https://cdn.bootcss.com/axios/0.18.0/axios.min.js"></script>
</head>
<body>
  <script>
    function easyRequest() {
       axios({
        method: 'get',
        url: 'http://127.0.0.1:3000/cors/form-request',
        params: {
          username: 'test',
          email: "test.com"
        },
        headers: {
            'Content-type': 'application/x-www-form-urlencoded'
        }
      }).then((res)=> {
        document.write(res.data)
      })
    }
    easyRequest();
  </script>
</body>
</html>
```
![avatar](http://baidu.com/pic/doge.png)

 浏览器为什么要区分简单请求和非简单请求呢？

