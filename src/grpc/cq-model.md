本文使用的是 `gRPC v1.71.0`。使用的是官方的 `grpc/examples/cpp/helloworld` 中的示例。

gRPC 有 2 种异步模型，一个是 Callback API，还有一个就是 CompletionQueue API。

### CompletionQueue 是什么

我们可以将 CompletionQueue 等效为一个由 gRPC 管理的消息队列，一个基本的服务端模型如下图所示（简略版）：

```mermaid
sequenceDiagram
	ServerImpl.HandleRpcs()->>cd1: new CallData()
	cd1->>cd1.Proceed(): cd1.status_ = CREATE
	cd1.Proceed()->>service_.RequestSayHello(): register cd1 to service_
	loop Forever
		ServerImpl.HandleRpcs()->>cq_.Next(): block here and waiting for request
		cq_.Next()->>ServerImpl.HandleRpcs(): a request coming in, return it
		ServerImpl.HandleRpcs()->>cd1.Proceed(): process the request, cd1.status_ = PROCESS
		cd1.Proceed()->>cd2: create a new CallData cd2
        cd2->>cd2.Proceed(): cd2.status_ = CREATE
        cd2.Proceed()->>service_.RequestSayHello(): register cd2 to service_
		cd1.Proceed()->>responder_.Finish(): prepare the reply and call the Async Finish()
		responder_.Finish()->>cd1.Proceed(): status = FINISH
        cd1.Proceed()->>cd1: delete cd1
        ServerImpl.HandleRpcs()->>cq_.Next(): block here and waiting for request
		cq_.Next()->>ServerImpl.HandleRpcs(): a request coming in, return it
		ServerImpl.HandleRpcs()->>cd2.Proceed(): process the request, cd2.status_ = PROCESS
		cd2.Proceed()->>cd3: create a new CallData cd3...
	end
```

在服务器启动后（`ServerImpl.Run()` 调用 `ServerImpl.HandleRpcs()` 进入循环），通过不断生成 `CallData` 实例来处理数据。

> `service_` 指的是 `AsyncService` 实例。
>
> 这里的 `cd1`、`cd2` 等仅用于指代不同的 `CallData` 实例，实际上我们并不会在 `HandleRpcs()` 中保存 `new` 出来的 `CallData` 实例，而是直接将其注册到 `AsyncService` 由 gRPC 来接管。

对应的客户端模型：

```mermaid
sequenceDiagram
	SayHello()->>stub_.AsyncSayHello(): send Async request
	SayHello()->>rpc.Finish(): regi
	cd1->>cd1.Proceed(): cd1.status_ = CREATE
	cd1.Proceed()->>service_.RequestSayHello(): register cd1 to service_
    ServerImpl.HandleRpcs()->>cq_.Next(): block here and waiting for request
    cq_.Next()->>ServerImpl.HandleRpcs(): a request coming in, return it

```

### 如何实现线程池

在 gRPC 中，我们将多个 CQ（CompletionQueue）注册到 `service_` 之后，当有新的请求到达时，gRPC 会自行决定将这个请求投递到哪一个 CQ。

知道了这一点，我们只需要创建 N 个 CQ 和 N 个线程，每个线程负责一个 CQ，当有新的请求到达一个线程自己的 CQ 时，处理这个请求的资源（`CallData` 实例）都在这个线程的栈上，不会造成数据竞争。

这里我们以一个拥有 2 个线程的线程池为例，并且分别创建 2 个 CQ：`cq1_`、`cq2_`：

```mermaid
sequenceDiagram
	par thread1
        ServerImpl.HandleRpcs()->>cd1_q1: new CallData()
        cd1_q1->>cd1_q1.Proceed(): cd1_q1.status_ = CREATE
        cd1_q1.Proceed()->>service_.RequestSayHello(): register cd1_q1 to service_
	loop Forever
		ServerImpl.HandleRpcs()->>cq1_.Next(): block here and waiting for request
		cq1_.Next()->>ServerImpl.HandleRpcs(): a request coming in, return it
		ServerImpl.HandleRpcs()->>cd1_q1.Proceed(): process the request, cd1_q1.status_ = PROCESS
		cd1_q1.Proceed()->>cd2_q1: create a new CallData cd2_q1
        cd2_q1->>cd2_q1.Proceed(): cd2_q1.status_ = CREATE
        cd2_q1.Proceed()->>service_.RequestSayHello(): register cd2_q1 to service_
		cd1_q1.Proceed()->>responder_.Finish(): prepare the reply and call the Async Finish()
		responder_.Finish()->>cd1_q1.Proceed(): status = FINISH
        cd1_q1.Proceed()->>cd1_q1: delete cd1_q1
	end
	and thread2
        ServerImpl.HandleRpcs()->>cd1_q2: new CallData()
        cd1_q2->>cd1_q2.Proceed(): cd1_q2.status_ = CREATE
        cd1_q2.Proceed()->>service_.RequestSayHello(): register cd1_q2 to service_
    end
    loop Forever
		ServerImpl.HandleRpcs()->>cq2_.Next(): block here and waiting for request
		cq2_.Next()->>ServerImpl.HandleRpcs(): a request coming in, return it
		ServerImpl.HandleRpcs()->>cd1_q2.Proceed(): process the request, cd1_q2.status_ = PROCESS
		cd1_q2.Proceed()->>cd2_q2: create a new CallData cd2_q2
        cd2_q2->>cd2_q2.Proceed(): cd2_q2.status_ = CREATE
        cd2_q2.Proceed()->>service_.RequestSayHello(): register cd2_q2 to service_
		cd1_q2.Proceed()->>responder_.Finish(): prepare the reply and call the Async Finish()
		responder_.Finish()->>cd1_q2.Proceed(): status = FINISH
        cd1_q2.Proceed()->>cd1_q2: delete cd1_q2
	end
```

可以看到，2 个线程分别调用 `cq1_.Next()` 和 `cq2_.Next()` 来获取请求，并分别进入各自的工作流程，互不干扰。
