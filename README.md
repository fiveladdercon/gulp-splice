# gulp-splice

Splices one file into another in a gulp pipeline.

## Install

```
> npm install gulp-splice
```

## Usage

The **inner** file is spliced into the **outer** file by replacing the first occurancy of the **key** in the outer file
with the contents of the inner file:

```
outer.txt

This is outer file content.
<#key#>
This is outer file content.
```

```
inner.txt

This is inner file content.
```

```javascript
var splice = require('gulp-splice');

gulp.src(['inner.txt','outer.txt']).pipe(splice('<#key#>'))
```

```
outer.txt

This is outer file content.
This is inner file content.
This is outer file content.
```

In the above, both files entered through the pipe.  But you can also specify inner
or outer files that do not enter through the pipe:

```javascript
gulp.src('outer.txt').pipe(splice({key:'<#key#>', inner:'inner.txt'}))

gulp.src('inner.txt').pipe(splice({key:'<#key#>', outer:'outer.txt'}))

gulp.src().pipe(splice({key:'<#key#>', inner:'inner.txt', outer:'outer.txt' }))
```

And all three produce the same result as the original:

```
outer.txt

This is outer file content.
This is inner file content.
This is outer file content.
```

You can also send more than two files in through the pipe:

```javascript
gulp.src('*.txt').pipe(splice('<#key#>'))
```

In the absence of inner and outer options all *non-outer files are concatinated* to form 
a single inner file and spliced into the outer file, which is the first file that contains
the key:

```
outer.txt

This is outer file content.
This is non-outer file 1 content.
This is non-outer file 2 content.
This is non-outer file 3 content.
...
This is outer file content.
```

Adding an inner option disables the concatination of non-outer files, and all other files
not involved in the splice are passed through:

```javascript
gulp.src('*.txt').pipe(splice({key: '<#key#>', inner:'file1.txt'))
```

```
outer.txt

This is outer file content.
This is file 1 content.
This is outer file content.
```
```
file2.txt

...
```
```
file3.txt

...
```
```
...
```

## API

```javascript
splice('key') 
splice(options)
```

#### options.key : string

The key is a string that identifies the insertion point in the outer file.  Only the first 
occurance in the outer file is replaced with the contents of the inner file.

#### options.outer : string

If the outer option is present, the outer file is the file specified by the option.  If the file
arrives down the pipe it is plucked from the file stream, otherwise it is opened from the file
system.  If the outer option is absent, the outer file is the first file arriving down the pipe
that contains the key.

#### options.inner : string

If the inner option is present, the inner file is the file specified by the option.  If the file
arrives down the pipe it is plucked from the file stream, otherwise it is opened from the file
system.  If the inner option is absent, all non-outer files ariving down the pipe are concatinated
to form the inner file.



## Example

Here's an example that inlines HTML view templates into the bottom of the index.html:

```
index.html

<html>
<body>
<h1>Main</h1>
##views##
</body>
</html>
```

```
partial-A.html

<h1>View A</h1>
```

```
partial-B.html

<h1>View B</h1>
```

```
partial-C.html

<h1>View C</h1>
```

```javascript
gulp.src('*.html')
	.pipe(htmlmin())
	.pipe(splice('##views##'))
	.dest('dist/')
```

```
dist/index.html

<html><body><h1>Main</h1><h1>View A</h1><h1>View B</h1><h1>View C</h1></body></html>
```

### Test

```
> npm test
```
