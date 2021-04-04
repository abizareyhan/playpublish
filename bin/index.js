#!/usr/bin/env node

const publishApp = require('../lib/publishApp');
const prompts = require('prompts');
const fs = require('fs');

(async () => {
  const questions = [
    {
      type: 'text',
      name: 'packageName',
      message: 'What is your application packageName',
      validate: value => value != "" ? true : "Please enter your package name"
    },
    {
      type: 'text',
      name: 'keyPath',
      message: 'Where is your service account json located? Please provide the right path',
      validate: value => value != "" && fs.existsSync(`${process.cwd()}/${value}`) ? true : "Please provide the right path"
    },
    {
      type: 'text',
      name: 'apkPath',
      message: 'Where is your apk/bundle located? Please provide the right path',
      validate: value => value != "" && fs.existsSync(`${process.cwd()}/${value}`) ? true : "Please provide the right path"
    },
    {
      type: 'select',
      name: 'releaseTrack',
      message: 'Choose the track you want to release',
      choices: [
        { title: 'Internal', value: 'internal' },
        { title: 'Alpha', value: 'alpha'},
        { title: 'Beta', value: 'beta' },
        { title: 'Production', value: 'production' }
      ]
    },
    {
      type: 'number',
      name: 'inAppUpdatePriority',
      message: 'Choose the In App Update Priority (0-5)',
      validate: value => value > 0 && value <= 5 ? true : `Invalid In App Update Priority`
    }
  ];

  const onCancel = prompt => {
    return false;
  }

  const response = await prompts(questions, { onCancel });

  if(response.packageName && response.keyPath && response.apkPath && response.releaseTrack && response.inAppUpdatePriority) {
    let fullKeyPath = `${process.cwd()}/${response.keyPath}`
    let fullApkPath = `${process.cwd()}/${response.apkPath}`

    publishApp.publishApp(
      response.packageName,
      require(fullKeyPath),
      fullApkPath,
      response.releaseTrack,
      response.inAppUpdatePriority,
      null
    )
  }
})();
