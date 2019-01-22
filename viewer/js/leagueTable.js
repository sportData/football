document.addEventListener("DOMContentLoaded", function(event) {
  const leagueData = ['england/premierLeague/1992-1993/summary.json']
  readRecord(leagueData)
});

function readRecord(leagueData) {
  const xhr = new XMLHttpRequest();
  let leagueFile

  if (leagueData.size === 0) {
    console.log('Check Line 2 of the code')
  } else {
    leagueFile = '../' + leagueData[0]
  }

  xhr.open('GET', leagueFile);
  xhr.onload = function() {
    if (xhr.status === 200) {
      const leagueInfo = JSON.parse(xhr.response)
      createTable(leagueInfo)
    } else {

    }
  };
  xhr.send();
}

function createTable(leagueData) {
  const tableTitle = document.getElementById('tableTitle')
  tableTitle.innerHTML = leagueData.name

  let leagueTable = leagueData.table
  const tableBody = document.getElementById('tableBody')

  for (let r of leagueTable) {
    const tableRow = document.createElement('tr')
    const x = `</td><td>`

    let t = `<td>${r.R}${x}${r.T}${x}${r.G}${x}${r.W}${x}${r.D}</td>`
    t = `${t}<td>${r.L}${x}${r.F}${x}${r.A}${x}${r.E}${x}${r.P}</td>`

    tableRow.innerHTML = t
    tableBody.append(tableRow)
  }
}