const fse = require('fs-extra');
const path = require('path');
const debug = require('../utils/debug');
const checkCmd = require('../utils/checkCommand');

const projectPath = path.resolve(require.resolve('funbox-phantom-lord'), '../../../'); // найти директорию node_modules и подняться на уровень выше

module.exports = async function capture(filename) {
  const filepath = filename.split('/');
  const dir = filepath.slice(0, filepath.length - 1).join('/');
  const fullDir = path.join(projectPath, dir);
  await fse.ensureDir(fullDir);

  checkCmd.call(this, { name: 'capture', params: { filename } });

  try {
    const buffer = await this.page.screenshot({
      fullPage: true,
    });
    fse.writeFileSync(path.join(projectPath, filename), buffer);
  } catch (e) {
    debug(e.message);
  }
};
