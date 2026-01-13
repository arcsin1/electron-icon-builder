# electron-icon-builder

An icon generator to generate all the icon files needed for electron packaging  

✨ **No PhantomJS dependency** - Uses the latest Sharp library for high-performance image processing

## Global usage

Install globally using

```
npm install -g @arcsin1/electron-icon-builder
```

To use

```
@arcsin1/electron-icon-builder --input=/absolute/path/file.png --output=./relative/path/to/folder
```


```
// Highly suggest！ 
npx @arcsin1/electron-icon-builder --input=/absolute/path/file.png --output=./relative/path/to/folder
```

## Local usage

Install locally
```
npm install --save-dev @arcsin1/electron-icon-builder
```

To use
```
./node_modules/.bin/@arcsin1/electron-icon-builder --input=/absolute/path/file.png --output=./relative/path/to/folder
```

## Arguments

```
--output, -o = [String] Folder to create files
--input, -i = [String] Path to PNG file
--flatten, -f  Flatten output structure
```

## Recommendations

Input file should be 1024px x 1024px or larger. Make sure it is a 1 to 1 aspect ratio on width to height.

## Output structure

```
[output dir]
    -[icons]
        -[mac]
            - icon.icns
        -[png]
            - 16x16.png
            - 24x24.png
            ...
            ...
            - 512x512.png
            - 1024x1024.png
        -[win]
            -icon.ico
```
When flatten option is enabled
```
[output dir]
    -[icons]
        - icon.icns
        - icon.ico
        - 16x16.png
        - 24x24.png
        ...
        ...
        - 512x512.png
        - 1024x1024.png
```
