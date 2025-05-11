## include()

在 cmake 中引入模块就相当于在 C++ 的引入头文件，通常用于引入一些**工具模块**。

例如，我们在工作目录下创建一个 `cmake` 目录，里面专门放一些辅助我们编写 `CMakeLists.txt` 的工具宏：

```
.
├── build/
├── cmake/
├── CMakeLists.txt
└── src/
```

然后我们创建一个 `utils.cmake`，里面定义了一个宏：

```cmake
# utils.cmake
function(my_custom_function)
    message(STATUS "This is a custom function!")
endfunction()
```

用 `include()` 引入这个模块后，我们就可以在 `CMakeLists.txt` 中使用这个宏：

```cmake
include(${CMAKE_CURRENT_SOURCE_DIR}/cmake/utils.cmake)
my_custom_function() # 输出：This is a custom function!
```

### 作用域

上面提到，`include()` 引入模块就像 C++ 引入头文件，cmake 在运行时遇到 `include()` 就直接加载对应文件，相当于在调用处直接插入代码，所以模块不会有自己的作用域。

例如，我们定义一个 `cmake/set.cmake`：

```cmake
set(VAR 123)
```

然后我们在主 `CMakeLists.txt` 引入这个包：

```cmake
include(${CMAKE_CURRENT_SOURCE_DIR}/cmake/set.cmake)
message(${VAR}) # 输出：123，这个变量是set.cmake新建的
```

### include() 的搜索路径

`include()` 的搜索顺序是：

- 首先搜索 `CMAKE_MODULE_PATH`；
- 再搜索 cmake 的默认模块路径，一般是 cmake 安装目录下的 `Modules` 目录（我的是 `/usr/share/cmake-3.16/Modules`）。

##### 自定义搜索路径

如果你想设置 `include()` 的搜索路径，可以这样写：

```cmake
set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} "/path/to/modules1")
set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} "/path/to/modules2")
```

每个路径会自动以 `;` 分隔：`CMAKE_MODULE_PATH = /path/to/modules1;/path/to/modules2`。

> 注意：如果你用上面的方法设置了 `CMAKE_MODULE_PATH`，那么引入时不要加后缀 `.cmake` ：`include(module_name)`，不然会找不到。

## find_package()

`find_package()` 有两种主要工作模式：Module Mode 和 Config Mode。

### Module Mode（模块模式）

该模式下 `find_package()` 会匹配名为 `Find<PackageName>.cmake` 的文件。

##### 搜索路径

搜索路径和 `include()` 一样：

- 首先搜索 `CMAKE_MODULE_PATH`；
- 再搜索 cmake 的默认模块路径，一般是 cmake 安装目录下的 `Modules` 目录（我的是 `/usr/share/cmake-3.16/Modules`）。

> 但是注意，这里要匹配的是 `Find<PackageName>.cmake`，例如：
>
> ```cmake
> find_package(set REQUIRED) # 只能匹配 "Findset.cmake"
> ```

##### 主要用途

`Find<PackageName>.cmake` 文件通常是由 CMake 官方或者社区编写的脚本，用来**猜测**和**探测**系统上可能安装了哪些版本的库、库文件在哪里、头文件在哪里等等

>这种模式是为那些没有提供自己 CMake 配置文件的库准备的，所以要靠 cmake 自己去猜它们在哪里。

### Config Mode（配置模式）

该模式下会匹配 `<PackageName>Config.cmake` 和 `<packagename>-config.cmake`。

例如我们找一个不存在的包：

```cmake
find_package(set CONFIG REQUIRED)
# 报错：
# Could not find a package configuration file provided by "set" with any of
# the following names:
# setConfig.cmake
# set-config.cmake
```

##### 搜索路径

一般的搜索路径有：

- `/usr/lib/cmake/<PackageName>`；
- `/usr/share/cmake/<PackageName>`；
- `/usr/local/lib/cmake/<PackageName>`；
- `/usr/local/share/cmake/<PackageName>`。

你也可以通过设置 `CMAKE_PREFIX_PATH` 变量告诉 CMake 应该去哪找：

```
cmake -DCMAKE_INSTALL_PREFIX=/path/to/<PackageName>Config.cmake <path/to/CMakeLists.txt>
```

##### 主要用途

`<PackageName>Config.cmake` 通常是**库项目自身在安装时生成的**，它们会告诉 cmake 库在哪里、头文件在哪里、依赖哪些其他库、提供了哪些 CMake 目标 (targets) 等等。

### find_dependency()

和 `find_package()` 功能上相似，但是：

- `find_dependency()` 是一个宏，好像主要用于主项目；
- `find_package()` 是内置命令，好像主要用在模块的配置文件中。

### 为什么推荐使用 CONFIG 模式（如果库支持的话）？

- **更准确和健壮：** Config 文件是由库项目自身提供的，相比于 Find 模块的“猜测”，Config 模式更不容易出错。
- **提供现代 CMake 目标：** 使用 Config 模式找到的包通常会定义并导出 CMake 目标（比如 `protobuf::libprotobuf`, `grpc::grpc++`）。在 `target_link_libraries()` 中使用这些目标是链接库的现代、推荐方式。CMake 会自动处理链接所需的头文件路径、库文件路径以及其他依赖关系。

## INTERFACE 和 IMPORTED 标志

在 CMake 中，`add_library()` 和 `add_executable()` 命令用于定义构建目标。除了 `STATIC` (静态库)、`SHARED` (动态库)、`MODULE` (模块库) 和可执行文件这些类型外，还有一些特殊的标志或概念来描述目标的性质和使用方式。`IMPORTED` 和 `INTERFACE` 就是其中非常重要的两个。

### INTERFACE（接口）

`INTERFACE` 可以用来描述两种情况：

#### INTERFACE 库目标（INTERFACE Library Target）

##### 库目标定义

使用 `add_library(<target_name> INTERFACE)` 命令创建的库目标。

##### 特点

- **不生成任何构建输出文件**，比如 `.a`, `.so`, `.dll`，只存在于构建系统中。

##### 主要用途

用来分组和封装一组供其他目标使用的使用要求（Usage Requirements），其中使用要求包含：

- 要包含的目录；
- 要链接的其他库；
- 要添加的编译定义（例如添加 `#define`）和编译选项。

**如何使用：**

```cmake
target_include_directories(<target_name> INTERFACE ...)
target_link_libraries(<target_name> INTERFACE ...)
target_compile_definitions(<target_name> INTERFACE ...)
target_compile_options(<target_name> INTERFACE ...)
```

上面的命令可以为这个 `INTERFACE` 目标设置使用要求。

**如何依赖：**

其他目标（无论是静态库、动态库还是可执行文件）可以通过下面的命令来“链接”到这个 `INTERFACE` 目标。

```cmake
target_link_libraries(<another_target> PUBLIC|PRIVATE|INTERFACE <target_name>)
```

这里的“链接”不是传统的二进制链接，而是表示 `<another_target>` 将继承 `<target_name>` 定义的所有 `INTERFACE` 使用要求。

##### 应用示例

**纯头文件库 (Header-Only Libraries)：**

比如很多现代 C++ 模板库。它们只有头文件，不需要编译成 `.o` 文件或库文件。你可以

```cmake
# 定义目标
add_library(MyHeaderOnlyLib INTERFACE)

# 指定头文件路径
target_include_directories(MyHeaderOnlyLib INTERFACE ${MyHeaderOnlyLib_SOURCE_DIR}/include)

### 其他库只要写下面这个命令，它们的包含目录就会自动加上 MyHeaderOnlyLib 的头文件路径
target_link_libraries(<another_target> PUBLIC MyHeaderOnlyLib)
```

**打包一组编译器标志或定义：**

创建一个 `INTERFACE` 目标，为其设置一组特定的编译定义或选项，然后让需要这些选项的其他目标链接到它。

**分组外部依赖：**

创建一个 `INTERFACE` 目标来代表一个概念上的功能模块，然后用 `target_link_libraries(<target_name> INTERFACE <dependency1> <dependency2> ...)` 将其链接到多个实际的库目标。其他目标只需链接这个 `INTERFACE` 目标，就会自动链接到其所有依赖的库。

#### INTERFACE 属性（INTERFACE Properties）

除了用于定义 `INTERFACE` 库目标外，`INTERFACE` 关键字还用在：

- `target_include_directories`；
- `target_compile_definitions`；
- `target_link_libraries`。

例如：

```cmake
target_include_directories(MyLib PUBLIC include PRIVATE src INTERFACE include/public_api)
```

表示：

- `PUBLIC include`：`MyLib` 自身需要编译 `include` 目录下的文件，并且任何链接到 `MyLib` 的目标也需要这个包含路径。
- `PRIVATE src`：`MyLib` 自身需要编译 `src` 目录下的文件，但这个路径不会传递给链接它的目标。
- `INTERFACE include/public_api`：`MyLib` 自身不需要这个包含路径，但任何链接到 `MyLib` 的目标都需要这个包含路径。

### IMPORTED（导入）

`IMPORTED` 标志用于描述那些**不是由当前 CMake 项目构建**，而是**预先存在于系统上**或由**其他构建过程生成的**目标。

##### 定义

通常用下面的命令来定义一个导入目标。这里的 `<type>` 可以是 `STATIC`, `SHARED`, `MODULE`。

```cmake
add_library(<target_name> <type> IMPORTED)
add_executable(<target_name> IMPORTED)
```

##### 主要用途

在当前 CMake 项目中创建一个对外部已存在二进制文件（库或可执行文件）的**引用**或**代理**。这样当前项目就可以使用 CMake 的目标管理机制来链接和依赖这些外部二进制文件，就像它们是在当前项目中构建的一样。

##### 应用示例

导入外部库时，通过 `find_package(<PackageName> CONFIG ...)` 命令加载的 `<PackageName>Config.cmake` 文件，会自动定义一个或多个 `IMPORTED` 目标。

这些由 `find_package` 创建的导入目标通常带有双冒号 `::` (例如 `Protobuf::libprotobuf`, `grpc::grpc++`)，表示这是一个**别名或导入目标**。

在定义了导入目标后，需要设置它的位置以及使用要求。例如：

```cmake
# 定义目标
add_library(<target_name> STATIC IMPORTED)

# 设置导入库的实际文件路径
SET_TARGET_PROPERTY(<target_name> IMPORTED_LOCATION /path/to/the/library/file)

# 设置链接该导入目标时需要添加的包含目录
SET_TARGET_PROPERTY(<target_name> INTERFACE_INCLUDE_DIRECTORIES /path/to/its/include/dir)

# 设置该导入目标本身依赖的其他库
SET_TARGET_PROPERTY(<target_name> IMPORTED_LINK_INTERFACE_LIBRARIES "dependency1;dependency2")
```

**如何使用：** 其他目标可以通过下面的命令，来链接这个 `IMPORTED` 目标。

```cmake
# CMake 会根据导入目标的属性，自动添加正确的链接器标志、库路径和包含路径。
target_link_libraries(<another_target> PUBLIC|PRIVATE|INTERFACE <target_name>)
```

