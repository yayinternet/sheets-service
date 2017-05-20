//
// Author: vrk (github.com/vrk)
// Helper lib that makes the requests to the Google API.
//

const google = require('googleapis');
const googleAuth = require('google-auth-library');

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive'
];

function printError(err) {
  console.log('The API returned an error: ' + err);
}

function getKeyPath() {
  return process.cwd() + '/privateSettings.json';
}

function authenticate() {
  const key = require(getKeyPath());
  return new Promise((resolve, error) => {
    const auth = new googleAuth();
    const jwt = new google.auth.JWT(
      key.client_email,
      null,
      key.private_key,
      SCOPES);
    jwt.authorize(function(err, result) {
      if (err) {
        printError(err);
        error(err);
      } else {
        resolve(jwt);
      }
    });
  });
};

function verifyHasKey() {
  try {
    const key = require(getKeyPath());
    return true;
  } catch (error) {
    return false;
  }
}

function getSpreadsheets() {
  return new Promise((resolve) => {
    authenticate().then((auth) => {
      const service = google.drive('v3');
      service.files.list({
        q: "mimeType='application/vnd.google-apps.spreadsheet'",
        auth: auth,
        pageSize: 1000,
        fields: "files(id, name)"
      }, function(err, response) {
        if (err) {
          printError(err);
          resolve(err);
        }
        resolve(response.files);
      });
    });
  });
}

function deleteFile(fileId) {
  return new Promise((resolve) => {
    authenticate().then((auth) => {
      const service = google.drive('v3');
      service.files.delete({
        auth: auth,
        fileId: fileId
      }, function(err, response) {
        if (err) {
          printError(err);
          resolve({error: err});
        }
        resolve({success: true});
      });
    });
  });
}

function addPermission(fileId, emailAddress) {
  return new Promise((resolve) => {
    authenticate().then((auth) => {
      const service = google.drive('v3');
      const userPermission = {
          'type': 'user',
          'role': 'writer',
          'emailAddress': emailAddress
      };
      service.permissions.create({
        auth: auth,
        resource: userPermission,
        sendNotificationEmail: false,
        fileId: fileId
      }, function(err, response) {
        if (err) {
          printError(err);
          resolve({error: err});
        }
        resolve({success: true});
      });
    });
  });
}

function create(title) {
  return new Promise((resolve) => {
    authenticate().then((auth) => {
      const sheets = google.sheets('v4');
      sheets.spreadsheets.create({
        auth: auth,
        resource: {
          properties: {
            title: title
          }
        }
      }, function(err, response) {
        if (err) {
          printError(err);
          resolve({error: err});
        }
        resolve({response: response});
      });
    });
  });
}

module.exports = {};
module.exports.verifyHasKey = verifyHasKey;
module.exports.deleteFile = deleteFile;
module.exports.create = create;
module.exports.addPermission = addPermission;
module.exports.deleteFile = deleteFile;
module.exports.getSpreadsheets = getSpreadsheets;
