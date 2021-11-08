/* eslint-disable */
const fs = require('fs')
const esbuild = require('esbuild')
const pkg = require('../package.json')

async function main() {
  if (fs.existsSync('./dist')) {
    fs.rmSync('./dist', { recursive: true }, (e) => {
      if (e) {
        throw e
      }
    })
  }

  console.log(
    Object.keys(pkg.dependencies).concat(Object.keys(pkg.peerDependencies))
  )

  try {
    esbuild.buildSync({
      entryPoints: ['./src/index.ts'],
      outdir: 'dist/cjs',
      minify: false,
      bundle: true,
      format: 'cjs',
      target: 'es5',
      tsconfig: './tsconfig.build.json',
      external: Object.keys(pkg.dependencies).concat(
        Object.keys(pkg.peerDependencies)
      ),
    })

    esbuild.buildSync({
      entryPoints: ['./src/index.ts'],
      outdir: 'dist/esm',
      minify: false,
      bundle: true,
      format: 'esm',
      target: 'es5',
      tsconfig: './tsconfig.build.json',
      external: Object.keys(pkg.dependencies).concat(
        Object.keys(pkg.peerDependencies)
      ),
    })

    console.log(`✔ ${pkg.name}: Built package.`)
  } catch (e) {
    console.log(`× ${pkg.name}: Build failed due to an error.`)
    console.log(e)
  }
}

main()
