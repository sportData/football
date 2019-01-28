const assert = require('assert')
const { readFileSync, writeFileSync } = require('fs')
const { join } = require('path')
const minimist = require('minimist')

const assertCheck = fnData => assert(fnData.errNo === 0, fnData.errMsg)
const consoleError = msg => console.error('\x1b[31m%s\x1b[0m', msg)
const consoleGreen = msg => console.log('\x1b[32m%s\x1b[0m', msg)
const consoleInfo = msg => console.log('\x1b[36m%s\x1b[0m', msg)

const inputData = checkInput();
assertCheck(inputData)

const fileContents = readFile(inputData)
assertCheck(fileContents)

outputSummaryFile(fileContents.data, inputData)

function checkInput() {
  const cliArgs = minimist(process.argv.slice(2));
  cliArgs.errMsg = ''
  cliArgs.errNo = 0
  
  if (!(cliArgs.hasOwnProperty('file'))) {
    consoleError(`ERROR => Please enter argument --file to process`)
    consoleError(`USAGE => file should be placed in the temp folder`)
    cliArgs.errMsg = `ERROR => Argument --file not supplied`
    cliArgs.errNo = -1
  } else if(!(cliArgs.hasOwnProperty('team'))) {
    consoleError(`ERROR => Please enter argument --team to process`)
    consoleError(`USAGE => team name list is in README`)
    cliArgs.errMsg = `ERROR => Argument --team not supplied`
    cliArgs.errNo = -2
  } else if(!(cliArgs.hasOwnProperty('season'))) {
    consoleError(`ERROR => Please enter argument --season to process`)
    consoleError(`USAGE => season list is in README`)
    cliArgs.errMsg = `ERROR => Argument --season not supplied`
    cliArgs.errNo = -3
  }

  return cliArgs
}

function outputSummaryFile(inData, cliArgs) {
  let outData = {}
  outData.errMsg = ''
  outData.errNo = 0

  let fileString = `{\n`
  fileString += `  ` + `"name": "noname",\n`
  fileString += `  ` + `"teams": ${inData.length}, \n`

  const inDataLength = inData.length

  fileString += `  ` + `"table": [ \n`
  for (let x = 0; x < inData.length; ++x) {
    fileString += `    ` + JSON.stringify(inData[x]) + `,\n`
  }

  fileString = fileString.slice(0, -2) + `\n`
  fileString += `  ` + `] \n`
  fileString += `}`

  let writeFileFlag = true

  try {
    writeFileSync(join(cliArgs.team, cliArgs.season, 'summary.json'), fileString)
  } catch (err) {
    writeFileFlag = false
    consoleError(`ERROR => Error in writing the file summary.json for the season`)
  } finally {
    if (writeFileFlag) {
      consoleInfo(`SUCCESS => File was written successfully`)
    }
  }
}

function readFile(inputData) {
  let fileData
  let outputData = {}
  outputData.errMsg = ''
  outputData.errNo = 0

  try {
    fileData = readFileSync(join('temp', inputData.file), 'utf-8')
  } catch (err) {
    consoleError(`ERROR => Unable to read file the ${inputData.file}`)
    consoleError(`USAGE => file should be placed in the temp folder`)
    outputData.errMsg = `ERROR => Unable to read the file ${inputData.file}`
    outputData.errNo = -1
  } finally {
    if (fileData) {
      outputData.data = fileData.split(/\r\n|\r|\n/).filter((r) => r.length > 0)
      const fileLines = outputData.data.length
      const tableContent = []
      
      // Read the first line
      const columnList = outputData.data[0].split('\t')
      const columnListLength = columnList.length
      const sortedOutput = [...columnList].sort((a,b) => {
        if (b === 'T') return -1
        else return 0
      })

      for (let x = 1; x < fileLines; ++x) {
        const rowData = outputData.data[x].split('\t')
        const summaryRow = {}
        const fileRow = {}

        for (let y = 0; y < columnListLength; ++y) {
          if (columnList[y] === 'T') {
            summaryRow[columnList[y]] = rowData[y]    
          } else if (columnList[y] === 'E') {
            summaryRow[columnList[y]] = parseInt(rowData[y].toString().replace("\u2212", "-"), 10)
          } else {
            summaryRow[columnList[y]] = parseInt(rowData[y], 10)
          }
        }

        for (let y = 0; y < columnListLength; ++y) {
          fileRow[sortedOutput[y]] = summaryRow[sortedOutput[y]]
        }

        tableContent.push(fileRow)
      }

      outputData.data = tableContent
    }

    return outputData
  }
}