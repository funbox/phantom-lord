const fse = require('fs-extra');
const path = require('path');
const debug = require('../utils/debug');
const projectPath = require('../utils').projectPath;

/**
 * @param {!RemoteBrowser=} context
 * @param {string} filename
 * @returns {Promise<void>}
 */
module.exports = async function capture(context, filename) {
  const formattedFilename = filename.replace(/[<>:"|?*]/g, '');
  const filepath = formattedFilename.split('/');
  const dir = filepath.slice(0, filepath.length - 1).join('/');
  const fullDir = path.join(projectPath, dir);
  await fse.ensureDir(fullDir);

  try {
    const buffer = await context.page.screenshot({
      fullPage: true,
    });
    fse.writeFileSync(path.join(projectPath, formattedFilename), buffer);
  } catch (e) {
    debug(e.message, 'error');
  }
};

module.exports.skipBrowserErrorsCheck = true;
