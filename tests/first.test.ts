import { expect, test, afterEach, beforeAll, afterAll } from 'vitest'
import fs from 'node:fs'
import packPlugin, { Options } from '../src'
const packInfo = {
	name: 'name',
	barnch: 'barnch',
	commitAuthor: 'commitAuthor',
	commitTime: 'commitTime',
	commitId: 'commitId',
	commitMsg: 'commitMsg',
	buildTime: 'buildTime',
	version: 'version'
}

beforeAll(async () => {
	if (fs.existsSync('tests/dist'))
		await fs.promises.rm("tests/dist", { force: true, recursive: true })
	if (fs.existsSync('tests/outDist'))
		await fs.promises.rm("tests/outDist", { force: true, recursive: true })
	await CreateDumpFiles()
})

afterAll(async () => {
	if (fs.existsSync('tests/dist'))
		fs.rmSync("tests/dist", { force: true, recursive: true })
	if (fs.existsSync('tests/outDist'))
		await fs.promises.rm("tests/outDist", { force: true, recursive: true })
})

afterEach(async () => {
	if (fs.existsSync('tests/dist/robin.json'))
		await fs.promises.rm('tests/dist/robin.json')
})

async function CreateDumpFiles() {
	await fs.promises.mkdir('tests/dist')
	await fs.promises.writeFile('tests/dist/a.js', 'a')
	await fs.promises.writeFile('tests/dist/b.ts', 'b')
	await fs.promises.writeFile('tests/dist/package.json', '{"p": "p"}')
	await fs.promises.mkdir('tests/dist/assets/')
	await fs.promises.writeFile('tests/dist/assets/c.txt', 'c')
	const content = JSON.stringify(packInfo, null, 2)
	await fs.promises.writeFile('tests/dist/robin.json', content)
}

async function GetFileInfo(filePath: string) {
	const content = await fs.promises.readFile(filePath, 'utf8')
  const json = JSON.parse(content)
	return json
}

test('meta check', async () => {
	const inst: any = packPlugin()

	expect(inst).not.toBeNull()
	expect(inst.name).toBe('vite-plugin-pack-info')
	expect(inst.apply).toBe('build')
	expect(inst.enforce).toBe('post')
	expect(inst.closeBundle.handler).instanceOf(Function)
})

const options = () => ({ inDir: 'tests/dist', outDir: 'tests/dist', outFileName: "robin.json", done: () => { } } as Options)

test('build info', async () => {
	const inst: any = packPlugin(options())
	await inst.closeBundle.handler()
	expect(fs.existsSync('tests/dist/robin.json')).toBeTruthy()
})

test('generated info output', async () => {
	const inst: any = packPlugin(options())
	await inst.closeBundle.handler()
	const zipStats = await fs.promises.stat('tests/dist/robin.json')
	expect(zipStats.size).greaterThan(11)

	const info = await GetFileInfo('tests/dist/robin.json')
	expect(info.name).not.toBeNull()
	expect(info.commitAuthor).not.toBeNull()
	expect(info.commitTime).not.toBeNull()
	expect(info.commitId).not.toBeNull()
	expect(info.commitMsg).not.toBeNull()
	expect(info.buildTime).not.toBeNull()
	expect(info.version).not.toBeNull()
})

test('call done callback', async () => {
	let isCalled = false
	function done() { isCalled = true }
	const op = options()
	op.done = done
	const inst: any = packPlugin(op)
	await inst.closeBundle.handler()
	await fs.promises.access('tests/dist/robin.json')
	expect(fs.existsSync('tests/dist/robin.json')).toBeTruthy()
	expect(isCalled).toBeTruthy()
})

test('call done callback with error', async () => {
	let hadError = false
	const op = options()
	op.inDir = 'undefined'
	op.done = (ex: Error | undefined) => { hadError = Boolean(ex) }
	const inst: any = packPlugin(op)
	await inst.closeBundle.handler()
	expect(!fs.existsSync('tests/dist/robin.json')).toBeTruthy()
	expect(hadError).toBeTruthy()
})

test('other filename', async () => {
	const op = options()
	op.outFileName = 'version.json'
	const inst: any = packPlugin(op)
	await inst.closeBundle.handler()
	expect(fs.existsSync('tests/dist/version.json')).toBeTruthy()
})

test('other output path', async () => {
	const op = options()
	op.outDir = 'tests/outDist'
	const inst: any = packPlugin(op)
	await inst.closeBundle.handler()
	expect(fs.existsSync('tests/outDist/robin.json')).toBeTruthy()
})
