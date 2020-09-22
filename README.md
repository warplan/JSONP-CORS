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

其实简单请求还分为原生form请求（不依赖脚本）和 通过脚本发起的简单请求，我们先来看一下原生的form请求：

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

![avatar](https://github.com/warplan/JSONP-CORS/blob/master/images/form.jpg)

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
![avatar](https://github.com/warplan/JSONP-CORS/blob/master/images/request.jpg)

我们会发现Request Headers头里面添加了Origin标签, 浏览器会根据后端接口的设置去校验跨域是否生效，不生效的话则会抛错。No 'Access-Control-Allow-Origin' header is present on the requested resource。

### 非简单请求

下面我们再来看一下非简单请求：

```javascript
<!DOCTYPE html>
<html>
<head>
  <title>cors</title>
  <script src="https://cdn.bootcss.com/axios/0.18.0/axios.min.js"></script>
</head>
<body>
  <script>
    function request() {
      axios({
        method: 'put',
        url: 'http://127.0.0.1:3000/cors/request',
        params: {
          msg: 'hello cors'
        },
        headers: {
            'Content-type': 'application/x-www-form-urlencoded'
        }
      }).then((res)=> {
        document.write(res.data)
      })
    }
    setInterval(request, 5000);
  </script>
</body>
</html>
```
我们会发现多了一次OPTIONS请求，这个就是我们所说的预检功能。浏览器会询问服务器，当前网页所在的域名是否在服务器的许可名单之中，以及可以使用哪些HTTP动词和头信息字段。只有得到了肯定答复，浏览器才会发出正式的XMLHttpRequest请求，否则就报错。

如果Origin指定的域名在许可范围内，服务器返回的响应，会多出几个头信息字段。
- Access-Control-Allow-Headers: 首部字段用于预检请求的响应。其指明了实际请求中允许携带的首部字段。
- Access-Control-Allow-Methods: 首部字段用于预检请求的响应。其指明了实际请求所允许使用的 HTTP 方法。
- Access-Control-Allow-Origin: 参数的值指定了允许访问该资源的外域 URI

一旦服务器通过了"预检"请求，以后每次浏览器正常的CORS请求，就都跟简单请求一样，会有一个Origin头信息字段。我们可以通过设置Access-Control-Max-Age来控制"预检"请求的时效性。

![avatar](https://github.com/warplan/JSONP-CORS/blob/master/images/Options.jpg)


 浏览器为什么要区分简单请求和非简单请求呢？
 - 服务器端无法区分

