/* eslint-disable */
const fs = require('fs')

const filesToCopy = [
  'README.md',
  'LICENSE.md',
  'rko-logo.svg',
  'rko-logo-shadow.svg',
]

filesToCopy.forEach((file) => {
  fs.copyFile(`../../${file}`, `./${file}`, (err) => {
    if (err) throw err
  })
})
