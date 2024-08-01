import { PluginOption } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import {execSync } from 'node:child_process'

export interface infoOptions {
  name: string;
  barnch: string;
  commitAuthor: string;
  commitTime: string;
  commitId: string;
  commitMsg: string;
  buildTime: string;
}

export interface Options {
  /**
   * Input Directory
   * @default `dist`
   */
  inDir?: string
  /**
   * Output Directory
   * @default `dist`
   */
  outDir?: string
  /**
   * file Name
   * @default `robin.json`
   */
  outFileName?: string
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

const PLUGIN_NAME = 'vite-plugin-pack-info'

export default function infoPack(options?: Options): PluginOption {
  const inDir = options?.inDir || 'dist'
  const outDir = options?.outDir || 'dist'
  const outFileName = options?.outFileName || 'robin.json'
  const version = options?.version || 'robin.json'
  const done = options?.done || function (){}

  function _isGit(): boolean {
    try {
      execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' })
      return true
    } catch (error: any) {
      return false
    }
  }

  function _formatDate (time: { getFullYear: () => any; getMonth: () => number; getDate: () => any; getDay: () => number; getHours: () => any; getMinutes: () => any; getSeconds: () => any }) {
    const year = time.getFullYear()
    const month = _appendZero(time.getMonth() + 1)
    const date = _appendZero(time.getDate())
    const week = '日一二三四五六'.charAt(time.getDay())
    const hour = _appendZero(time.getHours())
    const minute = _appendZero(time.getMinutes())
    const second = _appendZero(time.getSeconds())
    return `${year}-${month}-${date}(周${week}) ${hour}:${minute}:${second}`
  }

  function _appendZero(num: number): string {
    if (num < 10) {
      return `0${num}`
    }
    return `${num}`
  }

  function _parseStdout(cmd: string){
    try {
      let res = execSync(cmd, { encoding: 'utf8', cwd: process.cwd() })
      return res
    } catch (error) {
      return ''
    }
  }
  function _getGitInfo(): infoOptions {
    const url = _parseStdout('git ls-remote --get-url origin').split('/')
    const name = url[url.length - 1].replace(/\n|\r|.git/g, '')
    const commitId = _parseStdout('git rev-parse HEAD').trim()
    const commitAuthor = _parseStdout(`git log --pretty=format:%cn ${commitId} -1`).trim()
    const commitDate = _parseStdout(`git log --pretty=format:%ci ${commitId} -1`).trim()
    const dateArr = commitDate.split(' ')
    dateArr.pop()
    const commitMsg  = _parseStdout(`git log --pretty=format:%s  ${commitId} -1`).trim()
    let barnch  = _parseStdout('git rev-parse --abbrev-ref HEAD').replace(/\s+/, '')
    if (barnch === 'HEAD') {
      barnch = _parseStdout('git name-rev --name-only HEAD').replace(/\s+/, '')
    }
    const now = new Date()
    const buildTime = _formatDate(now)
    const commitTime = dateArr.join(' ')

    return { name, barnch, commitAuthor, commitTime, commitId, commitMsg, buildTime }
  }
  async function _createPackInfo(packInfo: infoOptions): Promise<void> {
    const fileName = path.join(outDir, outFileName)

    if (fs.existsSync(fileName)) {
      await fs.promises.unlink(fileName)
    }
    const content = JSON.stringify({...packInfo, version: version}, null, 2)
    await fs.promises.writeFile(fileName, content)
    done(undefined)
  }

  return {
    name: PLUGIN_NAME,
    apply: 'build',
    enforce: 'post',
    closeBundle: {
      sequential: true,
      async handler() {
        try {
          console.log('\x1b[36m%s\x1b[0m', `Info packing(${PLUGIN_NAME}) - '${inDir}' folder :`)

          if (!fs.existsSync(inDir)) {
            throw new Error(` - '${inDir}' folder does not exist!`)
          }

          if (!fs.existsSync(outDir)) {
            await fs.promises.mkdir(outDir, { recursive: true })
          }

          let packInfo:infoOptions = {
            name: '',
            barnch: '',
            commitAuthor: '',
            commitTime: '',
            commitId: '',
            commitMsg: '',
            buildTime: ''
          }
          // 检测当前是不是git 环境
          if (!_isGit()) {
            console.log('\x1b[32m%s\x1b[0m', '  - No git environment information exists for the project.')
          } else {
            console.log('\x1b[32m%s\x1b[0m', '  - Preparing Get the last git information.')
            packInfo = await _getGitInfo()
          }

          console.log('\x1b[32m%s\x1b[0m', '  - Creating info file.')
          await _createPackInfo(packInfo)

          console.log('\x1b[32m%s\x1b[0m', '  - Done.')
        } catch (error: any) {
          if (error) {
            console.log(
                '\x1b[31m%s\x1b[0m',
                `  - ${error}`
            )
          }

          console.log(
              '\x1b[31m%s\x1b[0m',
              '  - Something went wrong while building info file!'
          )
          done(error)
        }
      }
    },
  }
}
