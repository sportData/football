const assert = require('assert')
const config = require('config')
const { readFileSync, writeFileSync } = require('fs')
const { join } = require('path')
const minimist = require('minimist')

const assertCheck = fnData => assert(fnData.errNo === 0, fnData.errMsg)
const consoleError = msg => console.error('\x1b[31m%s\x1b[0m', msg)
const consoleGreen = msg => console.log('\x1b[32m%s\x1b[0m', msg)
const consoleInfo = msg => console.log('\x1b[36m%s\x1b[0m', msg)

const rawInputData = checkInput()
assertCheck(rawInputData)

const processedData = processRawInput(rawInputData)
assertCheck(processedData)

const inputData = processedData.cliArgs

const fileContents = readFile(inputData)
assertCheck(fileContents)

outputSummaryFile(fileContents.data, inputData)

function checkInput() {
  const cliArgs = minimist(process.argv.slice(2));
  cliArgs.errMsg = ''
  cliArgs.errNo = 0
  
  if (!(cliArgs.hasOwnProperty('f'))) {
    consoleError(`ERROR => Please enter argument --f to process`)
    consoleError(`USAGE => file should be placed in the temp folder`)
    cliArgs.errMsg = `ERROR => Argument --f (file) not supplied`
    cliArgs.errNo = -1
  } else if(!(cliArgs.hasOwnProperty('c'))) {
    consoleError(`ERROR => Please enter argument --c to process`)
    consoleError(`USAGE => country name list is in README`)
    cliArgs.errMsg = `ERROR => Argument --c (country) not supplied`
    cliArgs.errNo = -2
  } else if(!(cliArgs.hasOwnProperty('l'))) {
    consoleError(`ERROR => Please enter argument --l to process`)
    consoleError(`USAGE => league list is in README`)
    cliArgs.errMsg = `ERROR => Argument --l (league) not supplied`
    cliArgs.errNo = -3
  } else if(!(cliArgs.hasOwnProperty('s'))) {
    consoleError(`ERROR => Please enter argument --s to process`)
    consoleError(`USAGE => season list is in README`)
    cliArgs.errMsg = `ERROR => Argument --s (season) not supplied`
    cliArgs.errNo = -4
  }

  return cliArgs
}

function processRawInput(rawInput) {
  let outData = {}
  outData.errMsg = ''
  outData.errNo = 0

  const cliArgs = rawInput
  const cliConfig = config.cli
  const rgxYear = /^\d{4}$/

  // Check if the entered value for country is correct
  if (!(cliConfig.country.hasOwnProperty(cliArgs.c))) {
    consoleError(`ERROR => Country ${cliArgs.c} not found, check config/default.json`)
    consoleError(`USAGE => Determine correct country code => npm run config`)
    outData.errMsg = `ERROR => Argument --c (country) Invalid value`
    outData.errNo = -1
  // Check if the entered value for league is correct
  } else if (!(cliConfig.league[cliArgs.c].hasOwnProperty(cliArgs.l))) {
    consoleError(`ERROR => League ${cliArgs.l} not found, check config/default.json`)
    consoleError(`USAGE => Determine correct league code => npm run config`)
    outData.errMsg = `ERROR => Argument --l (league) Invalid value`
    outData.errNo = -1
  // Check if the entered value for season is correct  
  } else if (!(rgxYear.test(cliArgs.s))) {
    consoleError(`ERROR => Season ${cliArgs.s} not a valid year, expected XXXX`)
    consoleError(`USAGE => Enter correct season as a valid year, expected XXXX`)
    outData.errMsg = `ERROR => Argument --s (season) Invalid value`
    outData.errNo = -1
  }

  outData.cliArgs = {}
  let seasonYear = parseInt(cliArgs.s, 10)

  outData.cliArgs.file = cliArgs.f
  outData.cliArgs.country = cliConfig.country[cliArgs.c]
  outData.cliArgs.league = cliConfig.league[cliArgs.c][cliArgs.l]
  outData.cliArgs.season = `${seasonYear}-${++seasonYear}`

  return outData
}

function outputSummaryFile(inData, cliArgs) {
  let outData = {}
  outData.errMsg = ''
  outData.errNo = 0

  let fileString = `{\n`
  fileString += `  ` + `"name": "${cliArgs.league.name} ${cliArgs.season} Season",\n`
  fileString += `  ` + `"teams": ${inData.length}, \n`

  const inDataLength = inData.length

  fileString += `  ` + `"table": [ \n`
  for (let x = 0; x < inDataLength; ++x) {
    fileString += `    ` + JSON.stringify(inData[x]) + `,\n`
  }

  fileString = fileString.slice(0, -2) + `\n`
  fileString += `  ` + `] \n`
  fileString += `}`

  let writeFileFlag = true

  try {
    writeFileSync(join(cliArgs.country, cliArgs.league.dir, cliArgs.season, 'summary.json'), fileString)
  } catch (err) {
    writeFileFlag = false
    consoleError(err)
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