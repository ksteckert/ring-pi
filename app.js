#!/usr/bin/env node

const fs = require('fs')
let readline = require('readline')
var scp2 = require('scp2')
var args = require('minimist')(process.argv.slice(2))
var { RingApi } = require('ring-client-api')

var srv = fs.existsSync(`${__dirname}/srv.json`) ? require(`${__dirname}/srv.json`) : false
var auth = fs.existsSync(`${__dirname}/auth.json`) ? require(`${__dirname}/auth.json`) : false
var ring
var home

if (!auth) args.auth = true

async function updateToken(){
  let pass_auth = {}
  pass_auth.email = await prompt(`e-mail address: `)
  pass_auth.password = await prompt(`password: `)
  return pass_auth
}

function prompt(question = ''){
  let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise ((resolve) => {
    rl.question(question, (response) => {
      resolve(response)
      rl.close()
    })
  })
}

async function copyTokenToServer(){
  if (!srv) srv = {}

  console.log('')
  console.log('Copying refreshToken to server...')
  let host = srv.server || await prompt('dest host/addr: ')
  if (srv.server) console.log('host:', host)
  let dirpath = srv.path || await prompt('project path on dest: ')
  if (srv.path) console.log('project path (on dest):', dirpath)
  let username = srv.username || await prompt('username: ')
  if (srv.username) console.log('user:', username)
  let password = await prompt('password: ')
  let copyResults = await copySCP(username, password, host, dirpath)

  if (args.srv || getArg('srv')){
    let cfg = {server: host, path: dirpath, username}
    let cfg_json = JSON.stringify(cfg, null, 2)
    fs.writeFileSync(`${__dirname}/srv.json`, cfg_json)
  }

  return copyResults
}

function copySCP(u, p, h, d){
  return new Promise(resolve => {
    scp2.scp(`${__dirname}/auth.json`, `${u}:${p}@${h}:${d}/auth.json`, err => {
      let msg
      if (err) {
        msg = 'The new refreshToken was NOT uploaded to the Raspberry Pi.'
      } else {
        msg = 'The refreshToken has been updated on Raspberry Pi'
      }
      console.log('')
      resolve(msg)
    })
  })
}

function getArg(w = ''){
  if (args[w.toLowerCase()]) return true

  let words = args._.map(i => i.toString().toLowerCase())
  let found = words.indexOf(w) != -1
  return found
}

async function main() {

  let promptForCreds = args.auth || getArg('auth')
  if (promptForCreds) auth = await updateToken()

  try {
    ring = new RingApi(auth)
    let locations = await ring.getLocations()
    home = locations[0]
  } catch (error) {
    console.error('Failed To Connect!')
    console.error(error)
    process.exit()
  }

  if (promptForCreds) {
    let token = {refreshToken: ring.restClient.refreshToken}
    let token_json = JSON.stringify(token, null, 2)
    fs.writeFileSync(`${__dirname}/auth.json`, token_json)
    if (srv || args.srv || getArg('srv')) {
      let copyStatus =  await copyTokenToServer()
      console.log(copyStatus)
    }
  }

  let exitAfterConfirm = args.status || getArg('status')

  await home.getSecurityPanel()
  home.securityPanel.onData.subscribe(data => {
    let statuses = {
      all:  'AWAY',
      some: 'HOME',
      none: 'DISARMED'
    }
    status = statuses[data.mode]
    console.log(`Alarm Mode: ${status}`)
    if (exitAfterConfirm) process.exit()
  })

  if (getArg('home')) {
    console.log('Arming...')
    exitAfterConfirm = true
    await home.armHome()
  } else if (getArg('away')) {
    console.log('Arming...')
    exitAfterConfirm = true
    await home.armAway()
  } else if (getArg('disarm')) {
    console.log('Disarming...')
    exitAfterConfirm = true
    await home.disarm()
  }

  return
}
main()

