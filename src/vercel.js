const { createDeployment } = require('@vercel/client');

async function deploy(folderPath, name) {
  let deployment;

  console.log('deploy starting');
  for await (const event of createDeployment(
    {
      token: '53GmEUmiXGPw4SuhsKkof3OZ',
      path: folderPath,
    },
    {
      projectSettings: {
        framework: null,
        // installCommand: null,
        // buildCommand: null,
        // outputDirectory: null,
      },
      name,
      target: 'production',
    }
  )) {
    if (event.type === 'ready') {
      deployment = event.payload;
      break;
    }

    if (event.type === 'error') {
      console.log(event);
    }
  }

  return deployment;
}

module.exports = { deploy };
