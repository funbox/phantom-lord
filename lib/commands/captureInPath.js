const fse = require('fs-extra');
const path = require('path');
const debug = require('../utils/debug');
const checkCmd = require('../utils/checkCommand');

const projectPath = path.resolve(require.resolve('funbox-phantom-lord'), '../../../'); // найти директорию node_modules и подняться на уровень выше

module.exports = async function captureInPath(pathArg) {
  let p = pathArg;
  p = p.split('/');
  const dir = p.slice(0, p.length - 1).join('/');
  await fse.ensureDir(path.join(projectPath, dir));
  const fname = p.join('/');

  checkCmd.call(this, { name: 'captureInPath', params: { pathArg } });

  try {
    const buffer = await this.page.screenshot({
      fullPage: true,
    });
    fse.writeFileSync(path.join(projectPath, fname), buffer);
  } catch (e) {
    debug(e.message);
  }
};
