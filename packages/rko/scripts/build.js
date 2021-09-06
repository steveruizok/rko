/* eslint-disable */
const fs = require('fs')
const esbuild = require('esbuild')

const name = process.env.npm_package_name || ''

async function main() {
  try {
    esbuild.buildSync({
      entryPoints: ['./src/index.ts'],
      external: ['react', 'react-dom'],
      outdir: 'dist/cjs',
      minify: true,
      bundle: true,
      format: 'cjs',
      target: 'es6',
      tsconfig: './tsconfig.build.json',
    })

    esbuild.buildSync({
      entryPoints: ['./src/index.ts'],
      external: ['react', 'react-dom'],
      outdir: 'dist/esm',
      minify: true,
      bundle: true,
      format: 'esm',
      target: 'es6',
      tsconfig: './tsconfig.build.json',
    })

    console.log(`✔ ${name}: Built package.`)
  } catch (e) {
    console.log(`× ${name}: Build failed due to an error.`)
    console.log(e)
  }
}

main()
