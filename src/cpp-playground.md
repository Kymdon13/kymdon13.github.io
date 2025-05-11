# Runnable code block

Add `run` tag to the language declaration of the code block to enable running:

````
```cpp, run
#include <iostream>
int main() {
    std::cout << "good" << std::endl;
    std::cout << "hello from cpp!" << std::endl;
    return 0;
}
```
````

rendered as:

```cpp, run
#include <iostream>
int main() {
    std::cout << "good" << std::endl;
    std::cout << "hello from cpp!" << std::endl;
    return 0;
}
```

# Editable code

Add `editable` to enable editing:

````
```cpp, editable, run
#include <iostream>
int main() {
    std::cout << "hello from cpp!" << std::endl;
    return 0;
}
```
````

rendered as:

```cpp, editable, run
#include <iostream>
int main() {
    std::cout << "hello from cpp!" << std::endl;
    return 0;
}
```

or you prefer rust:

```rust, editable
fn main() {
    let number = 5;
    print!("{}", number);
}
```

# Hide lines in code block

Sometimes we just want the reader to focus on the important part of the code.

> Note:
> - Editable code blocks can not use this feature.

### Rust

In rust, we can use `#` at the beginning of the line to automatically ignore that line:

````
```rust
# #![allow(unused)]
# fn main() {
println!("Hello, World!");
# }
```
````

rendered as:

```rust
# #![allow(unused)]
# fn main() {
println!("Hello, World!");
# }
```

### C++

In C++, we use `~ ` (note that there is a space after `~`) at the beginning of the line to automatically ignore that line:

````
```cpp
~ #include <iostream>
~ int main() {
std::cout << "hello from cpp with hidden lines!" << std::endl;
~ return 0;
~ }
```
````

```cpp
~ #include <iostream>
~ int main() {
std::cout << "hello from cpp with hidden lines!" << std::endl;
~ return 0;
~ }
```

# Edition

Edition in the language identifier is used to specify which C++ standard you want to use for the compiler (default is C++11).

You can use:

````
```cpp, run, edition17
#include <iostream>
#include <string>
#include <optional>
int main() {
    std::optional<std::string> maybeName;
    maybeName = "Tom";
    if (maybeName) {
        std::cout << "Optional has value: " << *maybeName << "\n";
    }
    return 0;
}
```
````

to specify the standard as C++17, and it will be rendered as:

```cpp, run, edition17
#include <iostream>
#include <string>
#include <optional>
int main() {
    std::optional<std::string> maybeName;
    maybeName = "Tom";
    if (maybeName) {
        std::cout << "Optional has value: " << *maybeName << "\n";
    }
    return 0;
}
```

and if you use C++11, it is expected that you see some compile error:

```cpp, run, edition11
#include <iostream>
#include <string>
#include <optional>
int main() {
    std::optional<std::string> maybeName;
    maybeName = "Tom";
    if (maybeName) {
        std::cout << "Optional has value: " << *maybeName << "\n";
    }
    return 0;
}
```

# Exception

There are some exceptions you might run into:

### Timeout

The time limit is set to 2 seconds of each process.

So this is ok:

```cpp, run
#include <unistd.h>
int main() {
    sleep(1);
    return 0;
}
```

while this is not:

```cpp, run
#include <unistd.h>
int main() {
    sleep(2);
    return 0;
}
```

### Out of memory

The heap memory limit is set to 20 MiB.

So this is not ok:

```cpp, run
#include <vector>
int main() {
    // int is 4 bytes on the server
    std::vector<int> vec = std::vector<int>(5 * 1024 * 1024);
    return 0;
}
```

Actually, `std::vector<int>(4 * 1024 * 1024);` also not working, though I don't know why. I use the `setrlimit` in the `<sys/resource.h>` to set the limit, maybe there is some soft limit & hard limit thing?

### Privilege violation

There is a limit to restrict you from directly manipulating the OS.

This is not ok:

```cpp, run
#include <cstdlib>
int main() {
    system("ls");
    return 0;
}
```