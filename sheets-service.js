#! /usr/bin/env node

//
// Author: vrk (github.com/vrk)
// Main script that runs the command-line menu.
//

const readline = require('readline');
const google = require('./lib/google-wrappers.js');

const SHEETS_URL_PREFIX = 'https://docs.google.com/spreadsheets/d/';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(prompt) {
  return new Promise((resolve, error) => {
    rl.question(prompt, (choice) => {
      resolve(choice.trim());
    });
  });
}

async function processChoice(choice) {
  if (choice == 'e') {
    return;
  }

  if (choice == 'c') {
    await createSpreadsheet();
  } else if (choice == 'v') {
    await viewSpreadsheets();
  } else if (choice == 's') {
    await onShareMenu();
  } else if (choice == 'd') {
    await onDeleteMenu();
  } else {
    console.log('Invalid selection; please try again.');
  }
}

async function shareSpreadsheet(fileId) {
  const choice = await askQuestion('Enter your email: (@gmail or @stanford): ');
  if (choice) {
    const response = await google.addPermission(fileId, choice);
    return response.error === undefined;
  }
  return false;
}

async function createSpreadsheet() {
  const choice = await askQuestion('Title of spreadsheet: ');
  const raw = await google.create(choice);
  const fileId = raw.response.spreadsheetId;
  await google.addPermission(fileId, 'cs193xcoursestaff@gmail.com');
  console.log('Spreadsheet shared with cs193xcoursestaff@gmail.com.');
  await shareSpreadsheet(fileId);
  console.log(`Spreadsheet created: ${SHEETS_URL_PREFIX}${fileId}`);
}

async function onShareMenu() {
  const choice = await askQuestion('Spreadsheet id: ');
  if (choice) {
    const shared = await shareSpreadsheet(choice);
    if (shared) {
      console.log(`Spreadsheet shared: ${SHEETS_URL_PREFIX}${choice}`);
    }
  }
}

async function onDeleteMenu() {
  const choice = await askQuestion('Spreadsheet id: ');
  if (choice) {
    const response = await google.deleteFile(choice);
    if (response.error === undefined) {
      console.log(`Spreadsheet deleted: ${choice}`);
    }
  }
}

async function viewSpreadsheets() {
  const files = await google.getSpreadsheets();
  for (const file of files) {
    console.log('File:', file.id, file.name);
  }
}

///////////////////////////////////////
// Script main begins here.          //
///////////////////////////////////////
(() => {

  // First check to make sure that the user has put their private key
  // in the correct file.
  if (!google.verifyHasKey()) {
    console.log('**ERROR**: /privateSettings.json not found!!!');
    console.log();
    console.log('Before you can manage your spreadsheets through this CLI,');
    console.log('you must store your private key json file in the current');
    console.log('directory: ');
    console.log();
    console.log('  ./privateSettings.json');
    console.log();
    rl.close();
    return;
  }

  (async () => {
    let choice = 'e';
    do {
      console.log();
      console.log('What would you like to do?');
      console.log('  (c)reate new spreadsheet');
      console.log('  (v)iew existing spreadsheets');
      console.log('  (s)hare spreadsheet with email');
      console.log('  (d)elete a spreadsheet');
      console.log('  (e)xit');
      console.log();
      choice = await askQuestion('Enter your choice here: ');
      await processChoice(choice);
    } while (choice != 'e');
    rl.close();
  })();
})();
