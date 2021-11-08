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

  esbuild.build({
    entryPoints: ['./src/index.ts'],
    outdir: 'dist/esm',
    minify: false,
    bundle: true,
    format: 'esm',
    target: 'es5',
    tsconfig: './tsconfig.json',
    external: Object.keys(pkg.dependencies).concat(
      Object.keys(pkg.peerDependencies)
    ),
    watch: {
      onRebuild(error) {
        if (error) {
          console.log(`× ${pkg.name}: An error in prevented the rebuild.`)
          return
        }
        console.log(`✔ ${pkg.name}: Rebuilt.`)
      },
    },
  })
}

main()
