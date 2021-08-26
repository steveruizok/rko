/* eslint-disable */
import { copyFile } from 'fs'

const filesToCopy = ['README.md', 'rko-logo-shadow.svg', 'rko-logo.svg']

filesToCopy.forEach((file) => {
  copyFile(`./packages/rko/${file}`, `./${file}`, (err) => {
    if (err) throw err
  })
})
