const { lstatSync, readdirSync, readFileSync } = require('fs')
const { join, sep } = require('path')

const countryData = ['england', 'germany']

const isDirectory = source => lstatSync(source).isDirectory()
const getDirectories = source =>
  readdirSync(source).map(name => join(source, name)).filter(isDirectory)

function readDirectory(ctryData) {
  let ctryLength = ctryData.length 
  let leagueList = []

  for (let x = 0; x < ctryLength; ++x) {
    let leagueDirs = getDirectories(ctryData[x])
    leagueList = [...leagueList, ...leagueDirs]
  }

  return leagueList
}

function readSummaryFile(seasonDir) {
  let seasonLength = seasonDir.length
  const ftblSumm = {};

  for (let x = 0; x < seasonLength; ++x) {
    const lds = seasonDir[x].split(sep)
    
    if (!(ftblSumm.hasOwnProperty(lds[0]))) {
      ftblSumm[lds[0]] = {}
    }

    if(!(ftblSumm[lds[0]].hasOwnProperty(lds[1]))) {
      ftblSumm[lds[0]][lds[1]] = {}
    }

    if(!(ftblSumm[lds[0]][lds[1]].hasOwnProperty(lds[2]))) {
      ftblSumm[lds[0]][lds[1]][lds[2]] = {}
    }

    const seasonRecord = ftblSumm[lds[0]][lds[1]][lds[2]]

    let summaryFile = join(seasonDir[x], 'summary.json')
    let resultsFile = join(seasonDir[x], 'matches.json')
    let summaryData
    let resultsData

    try {
      summaryData = readFileSync(summaryFile, 'utf-8')
    } catch (err) {
      seasonRecord.teams = 20
    } finally {
      if (summaryData) {
        let summaryJSON = JSON.parse(summaryData)
        seasonRecord.teams = summaryJSON.teams
      }
    }

    try {
      resultsData = readFileSync(resultsFile, 'utf-8')
    } catch (err) {
      
    } finally {
      if (resultsData) {
        console.log(resultsData)
      }
    }

    seasonRecord.matches = seasonRecord.teams * (seasonRecord.teams - 1)
  }

  console.log(JSON.stringify(ftblSumm))
}

const leagues = readDirectory(countryData)
const seasonData = readDirectory(leagues)
readSummaryFile(seasonData)