# ace.js

If you want to add a new language in the backend and get the auto completion feature for this language, you just have to copy the `mode-<language>.js` file from `ace/src-min-nonconflict` (download it yourself on GitHub for the build version, I'm using `ace-builds-1.5.0`) to `js/` and add it to the `book.toml`:

```toml
additional-js = [
    "js/mode-<language>.js",
]
```

and `index.hbs`:

```handlebars
<script src="{{ resource "js/mode-<language>.js" }}"></script>
```

> Note that you must remove the original code in `index.hbs` because we are adding them all by hand:
> ```handlebars
> {{#each additional_js}}
> <script src="{{ resource this }}"></script>
> {{/each}}
> ```

# highlight.js

For language support add the `all-languages.min.js` to the `js/`, `book.toml` and `index.hbs`.

Tht `all-languages.min.js` is obtained by concat all js in `https://github.com/highlightjs/cdn-release/tree/11.11.1/build/languages`:

```bash
cat $(find ./languages -maxdepth 1 -type f ! -name 'all-languages.min.js') > all-languages.min.js
```

### Some examples

bash:

```bash
some=hhh
if [ -n dir ]; do
    echo ${some}
fi
```

python:

```python
for i in range(1,20):
    while i < 10:
        print(123)
```

# mdBook features

### classList of code block

If you create a code block like:

````
```cpp
int main() {}
```
````

then in the HTML mdBook generates, there will be a code element:

```html
<code class="language-cpp ...">...</code>
```

# Grammar

### Link

We can write like:

```
[link1](#link)
```

it will be rendered as: [link1](#link).

or we could write like:

```
[link2](#editable-code)
```

rendered as: [link2](#editable-code).

As you can see, the H3 header as `Editable Code` is given the link `editable-code` after mdBook rendered it to HTML.

> Actually, the rules are:
> - keep the `-`;
> - convert uppercase letters to lowercase;
> - convert single or multi "space" to `-`;
> - delete all `&` `,` `.` `?` `!` `:` `;` `*` `^` `%` `(` `)`.
>
> Let's say we have a header like:
> ### &,.?!:;*^%()Complex Header
> and the actual link is:
> ```
> [link3](#complex-header)
> ```
> rendered as:
> [link3](#complex-header)


##### 中文 标题

```
[中文链接](#中文-标题)
```

rendered as: [中文链接](#中文-标题)

# Format

The format features of mdBook you can use.

## Code

For code format, go check this chapter: [CPP Playground](./cpp-playground.md).

### Mermaid

```mermaid
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
```

## Including Files

This is `src/SUMMARY.md` in my mdBook project, and I just use:

```
\{{#include ./SUMMARY.md}}
```

in this md file to include it, it will be rendered as:

```md
{{#include ./SUMMARY.md}}
```


## Math

### Inline

Inline equations must use `\\(` and `\\)`:

```
\\( \int x dx = \frac{x^2}{2} + C \\)
```

and this will be rendered as: \\( \int x dx = \frac{x^2}{2} + C \\).

### Block

Block equations must use `\\[` and `\\]`:

```
\\[ \mu = \frac{1}{N} \sum_{i=0} x_i \\]
```

and this will be rendered as:

\\[ \mu = \frac{1}{N} \sum_{i=0} x_i \\]


