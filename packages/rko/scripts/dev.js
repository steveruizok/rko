/* eslint-disable */
const fs = require('fs')
const esbuild = require('esbuild')

const name = process.env.npm_package_name || ''

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
    external: ['react', 'react-dom'],
    outdir: 'dist/esm',
    minify: false,
    bundle: true,
    format: 'esm',
    target: 'es6',
    tsconfig: './tsconfig.json',
    watch: {
      onRebuild(error) {
        if (error) {
          console.log(`× ${name}: An error in prevented the rebuild.`)
          return
        }
        console.log(`✔ ${name}: Rebuilt.`)
      },
    },
  })
}

main()
