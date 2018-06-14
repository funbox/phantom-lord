const fse = require('fs-extra');
const path = require('path');
const debug = require('../utils/debug');
const checkCmd = require('../utils/checkCommand');
const projectPath = require('../utils').projectPath;

/**
 * @param {!RemoteBrowser=} context
 * @param {string} pathArg
 * @returns {Promise<void>}
 */
module.exports = async function captureInPath(context, pathArg) {
  let p = pathArg;
  p = p.split('/');
  const dir = p.slice(0, p.length - 1).join('/');
  await fse.ensureDir(path.join(projectPath, dir));
  const fname = p.join('/');

  checkCmd(context, 'captureInPath', pathArg);

  try {
    const buffer = await context.page.screenshot({
      fullPage: true,
    });
    fse.writeFileSync(path.join(projectPath, fname), buffer);
  } catch (e) {
    debug(e.message);
  }
};
