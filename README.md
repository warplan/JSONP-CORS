# 跨域
本文主要介绍JSONP、CORS两种跨域方式，后台采用Koa模拟，真正的目标是理解整个跨域流程的实现。
至于什么是跨域和浏览器同源策略的问题，就自行百度吧。

## JSONP
JSONP 其实是一种trick, 利用浏览器对带有src标签的能力实现访问跨域数据的小技巧（像img、link标签等不存在跨域问题）。

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

我们会发现Request Headers头里面添加Origin标签。Origin字段用来说明，本次请求来自哪个源（协议 + 域名 + 端口）。服务器会根据这个值，决定是否同意这次请求。 如果Origin指定的源，不在许可范围内，服务器会返回一个正常的HTTP回应。浏览器发现，这个回应的头信息没有包含Access-Control-Allow-Origin字段就知道出错了，从而抛出一个错误，被XMLHttpRequest的onerror回调函数捕获。（注意，这种错误无法通过状态码识别，因为HTTP回应的状态码有可能是200。）

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
```javascript
var Koa = require('koa');
var Router = require('koa-router');
 
var app = new Koa();
var router = new Router();

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

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000);
```
我们会发现多了一次OPTIONS请求，这个就是我们所说的预检请求。浏览器会询问服务器，当前网页所在的域名是否在服务器的许可名单之中，以及可以使用哪些HTTP动词和头信息字段。只有得到了肯定答复，浏览器才会发出正式的XMLHttpRequest请求，否则就报错。

如果Origin指定的域名在许可范围内，服务器返回的响应，会多出几个头信息字段。
- Access-Control-Allow-Headers: 首部字段用于预检请求的响应。其指明了实际请求中允许携带的首部字段。
- Access-Control-Allow-Methods: 首部字段用于预检请求的响应。其指明了实际请求所允许使用的 HTTP 方法。
- Access-Control-Allow-Origin: 参数的值指定了允许访问该资源的外域 URI

一旦服务器通过了"预检"请求，以后每次浏览器正常的CORS请求，就都跟简单请求一样，会有一个Origin头信息字段。我们还可以通过设置Access-Control-Max-Age来控制"预检"请求的时效性。

![avatar](https://github.com/warplan/JSONP-CORS/blob/master/images/Options.jpg)


 至此跨域的实践就全部结束了，我们思考一下浏览器为什么要区分简单请求和非简单请求呢，按照实际的情况，不是区分原生表单请求和非原生表单请求不是更好吗？
 我们来看一下贺师俊老师是怎么解释的：
> 预检这机制只能限于非简单请求。在处理简单请求的时候，如果服务器不打算接受跨源请求，不能依赖 CORS-preflight 机制。因为不通过 CORS，普通表单也能发起简单请求，所以默认禁止跨源是做不到的。

> 既然如此，简单请求发 preflight 就没有意义了，就算发了服务器也省不了后续每次的计算，反而在一开始多了一次 preflight。
有些人把简单请求不需要 preflight 理解为『向下兼容』。这也不能说错。但严格来说，并不是『为了向下兼容』而不能发。理论上浏览器可以区别对待表单请求和非表单请求 —— 对传统的跨源表单提交不发 preflight，从而保持兼容，只对非表单跨源请求发 preflight。

> 但这样做并没有什么好处，反而把事情搞复杂了。比如本来你可以直接用脚本发跨源普通请求，尽管（在服务器默认没有跨源处理的情况下）你无法得到响应结果，但是你的需求可能只是发送无需返回，比如打个日志。但现在如果服务器不理解 preflight 你就干不了这个事情了。

> 而且如果真的这样做，服务器就变成了默认允许跨源表单，如果想控制跨源，还是得（跟原本一样）直接在响应处理中执行跨源计算逻辑；另一方面服务器又需要增加对 preflight 请求的响应支持，执行类似的跨源计算逻辑以控制来自非表单的相同跨源请求。服务器通常没有区分表单/非表单差异的需求，这样搞纯粹是折腾服务器端工程师。

> 所以简单请求不发 preflight 不是因为不能兼容，而是因为兼容的前提下发 preflight 对绝大多数服务器应用来说没有意义，反而把问题搞复杂了。
 

