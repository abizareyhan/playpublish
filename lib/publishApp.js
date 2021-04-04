const { google } = require('googleapis');
const { createReadStream } = require('fs');
const { extname } = require('path');
const ora = require('ora');

exports.publishApp = async function(packageName, privateKey, apkPath, track, inAppUpdatePriority, releaseNotes) {
  const spinner = ora('Connecting to Google APIs').start();

  const jwtClient = new google.auth.JWT(
    privateKey.client_email,
    null,
    privateKey.private_key,
    ['https://www.googleapis.com/auth/androidpublisher']
  );

  jwtClient.authorize(function(err, tokens) {
    if (err) {
      spinner.fail("Failed to connect")
      console.log(err.response.data.error_description);
      return
    }
  });

  try {
    const androidpublisher = google.androidpublisher({
      version: 'v3',
      auth: jwtClient
    });

    spinner.succeed("Connected to Google APIs");

    spinner.start("Creating edit instance on Google Play");

    let insertJob = await androidpublisher.edits.insert({
      packageName: packageName
    });

    let editID = insertJob.data.id;

    spinner.succeed(`Edit created with ID ${editID}`);

    const ext = extname(apkPath);

    let uploadJob;

    if(ext === ".apk") {
      spinner.start(`Start uploading APK - ${apkPath}`);

      uploadJob = await androidpublisher.edits.apks.upload({
        editId: editID,
        packageName: packageName,
        media: {
          body: createReadStream(apkPath),
          mimeType: 'application/octet-stream'
        }
      });

      spinner.succeed(`APK Uploaded`);
    } else if(ext === ".aab") {
      spinner.start(`Start uploading App Bundle - ${apkPath}`);

      uploadJob = await androidpublisher.edits.bundles.upload({
        editId: editID,
        packageName: packageName,
        media: {
          body: createReadStream(apkPath),
          mimeType: 'application/octet-stream'
        }
      });

      spinner.succeed(`App Bundle Uploaded`);
    }

    spinner.start(`Updating edit tracks`);

    let updateJob = await androidpublisher.edits.tracks.update({
      editId: editID,
      packageName: packageName,
      requestBody: {
        releases: [
          {
            releaseNotes: {
              "language": "en-Us",
              "text": "Lorem ipsum"
            },
            status: 'completed',
            versionCodes: uploadJob.data.versionCode,
            inAppUpdatePriority: inAppUpdatePriority,
          }
        ],
        track: track
      },
      track: track
    });

    spinner.succeed(`Edit tracks updated to ${track} with versionCodes ${uploadJob.data.versionCode} and inAppUpdatePriority ${inAppUpdatePriority}`);

    spinner.start(`Commiting the changes`)

    let commitJob = await androidpublisher.edits.commit({
      editId: editID,
      packageName: packageName
    });

    spinner.succeed(`Changes commited, check on your google play console`)
  } catch(e) {
    spinner.fail("Failed to complete action")
    if(e.errors) {
      e.errors.forEach(error => console.log(error.message));
    }
  }
}
