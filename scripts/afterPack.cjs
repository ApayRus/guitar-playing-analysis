const fs = require('fs');
const path = require('path');

module.exports = async (context) => {
  // Only run on Linux
  if (context.electronPlatformName !== 'linux') {
    return;
  }

  console.log('  • applying sandbox fix for AppImage');

  const appOutDir = context.appOutDir;
  const productName = context.packager.appInfo.productName;
  const executablePath = path.join(appOutDir, productName);
  const originalExecutablePath = path.join(appOutDir, `${productName}.bin`);

  // Check if the executable exists
  if (!fs.existsSync(executablePath)) {
    console.error(`  • error: executable not found at ${executablePath}`);
    return;
  }

  // Rename the original executable
  fs.renameSync(executablePath, originalExecutablePath);

  // Create the wrapper script
  const wrapperScript = `#!/bin/bash
"\${0%/*}/${productName}.bin" "$@" --no-sandbox --disable-setuid-sandbox
`;

  fs.writeFileSync(executablePath, wrapperScript);

  // Make the wrapper script executable
  fs.chmodSync(executablePath, 0o755);

  console.log('  • sandbox fix applied successfully');
};
