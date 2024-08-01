## vite-plugin-pack-info
[![npm](https://img.shields.io/npm/v/vite-plugin-zip-pack)](https://www.npmjs.com/package/vite-plugin-zip-pack)

此插件为 **vite** 的扩展，用于在 **vite build** 命令执行的最后阶段，对构建产出目录之后进行生成相应的包的指纹信息或者版本信息，打包出来的文件名默认为robin-pack.json，里面包含git的信息 比如最后一次的提交信息，其中里面的version为package.json的version

## Install

```bash
 npm/yarn/pnpm i -D vite-plugin-pack-info
```

## Usage

```ts
// vite.config.js

import { defineConfig } from 'vite'
import packInfo from 'vite-plugin-pack-info'

export default defineConfig({
  plugins: [packInfo()],
})
```

## Options

```ts
export interface Options {
  /**
   * Input Directory
   * @default `dist`
   */
  inDir?: string;
  /**
   * Output Directory
   * @default `robin-json`
   */
  outDir?: string;
  /**
   * file Name
   * @default `robin.json`
   */
  outFileName?: string;
  /**
   * version 
   * @default `timeStamp`
   */
  version?: string| number;
  /**
   * Callback, which is executed after the zip file was created
   * err is only defined if the save function fails
   */
  done?: (err: Error | undefined) => void
}
```
## License

MIT, see [the license file](./LICENSE)