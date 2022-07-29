const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const program = require('commander');
const inquirer = require('inquirer');
const downloadRepo = promisify(require('download-git-repo'));
const open = require('open');

const log = require('../utils/log');
const terminal = require('../utils/terminal');
const { ejsCompile, writeFile, mkdirSync } = require('../utils/file');
const repoConfig = require('../config/repo_config');
const urlConfig = require('../config/url_config');
const { action } = require('commander');
const create = async (project, clone) => {
  const { version } = await inquirer.prompt([
    {
      name: 'version',
      type: 'list',
      message: `Please pick an version:`,
      choices: [
        { name: 'Vue2', value: 'vueGitRepo' },
        { name: 'Vue3', value: 'vue3GitRepo' },
        { name: 'React18', value: 'react18GitRepo' },
      ],
    },
  ]);
  const fse = require('fs-extra');
  const tmpdir = path.resolve(project);
  if (fse.existsSync(tmpdir)) {
    const { action } = await inquirer.prompt([
      {
        name: 'action',
        type: 'list',
        message: `Target directory ${tmpdir} already exists. Pick an action:`,
        choices: [
          { name: 'Overwrite', value: 'overwrite' },
          { name: 'Merge', value: 'merge' },
          { name: 'Cancel', value: false },
        ],
      },
    ]);
    if (!action) {
      return false;
    } else if (action === 'overwrite') {
      console.log(`\nRemoving ${tmpdir}...`);
      await fse.remove(tmpdir);
    }
  }
  log.hint('The project will be created at ' + tmpdir);
  await downloadRepo(repoConfig[version], project, { clone });
  return action;
};
const createProject = async (project, otherArg) => {
  // 2.clone项目从仓库
  const result = await create(project, true);

  if (!result) {
    return;
  }
  if (result === 'React18') {
    return;
  }

  log.hint(
    'The fingard start to install some packages,it may take a long time,please wait patiently~ '
  );
  // 3.执行终端命令npm install
  // terminal.exec('npm install', {cwd: `./${project}`});
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

  await terminal.spawn(npm, ['install'], { cwd: `./${project}` });

  // 4.打开浏览器
  //open('http://localhost:8080/');

  // 5.运行项目
  //await terminal.spawn(npm, ['run', 'serve'], { cwd: `./${project}` });
};

const handleEjsToFile = async (name, dest, template, pageCode, filename) => {
  // 1.获取模块引擎的路径
  const templatePath = path.resolve(__dirname, template);
  const result = await ejsCompile(templatePath, {
    name,
    lowerName: name.toLowerCase(),
    pageCode,
  });

  // 2.写入文件中
  // 判断文件不存在,那么就创建文件
  mkdirSync(dest);
  const targetPath = path.resolve(dest, filename);
  writeFile(targetPath, result);
};

const handleChoose = async () => {
  let url = urlConfig.vue2_default_url;
  const { action } = await inquirer.prompt([
    {
      name: 'action',
      type: 'list',
      message: `Please select the type of component you want to create. Pick an action:`,
      choices: [
        { name: 'ReactPage', value: 'Page' },
        { name: 'Form', value: 'Form' },
        { name: 'Table', value: 'Table' },
        { name: 'Default', value: 'Default' },
      ],
    },
  ]);
  if (action === 'Form') {
    url = urlConfig.vue2_form_url;
  } else if (action === 'Table') {
    url = urlConfig.vue2_table_url;
  } else if (action === 'Page') {
    url = urlConfig.react18_page_url;
  }
  return { url, action };
};

const addComponent = async (name, dest, pageCode) => {
  const { url, action } = await handleChoose();
  let fileType = 'vue';
  if (action === 'Page') {
    fileType = 'tsx';
  }
  if (!dest) {
    if (action === 'Page') {
      dest = `src/pages/main/${name}`;
    } else {
      dest = `src/pages/${name}`;
    }
  }
  handleEjsToFile(name, dest, url, pageCode, `${name}.${fileType}`);
};

const typeHandle = (name, dest, pos, typeUrl) => {
  let nums = pos.split(',');
  for (let p of nums) {
    handleEjsToFile(name[p], dest, typeUrl, `${name[p]}.vue`);
  }
};

const addComponentList = async (name, dest, type, pageCode) => {
  if (!Array.isArray(name)) {
    log.error('The arguments must be an Array,exit code 0');
  }
  if (!type || JSON.stringify(type) === '{}') {
    const { url, action } = await handleChoose();
    let fileType = 'vue';
    if (action === 'Page') {
      fileType = 'tsx';
    }
    name.map((item) => {
      let currentDest = '';
      if (!dest) {
        if (action === 'Page') {
          currentDest = `src/pages/main/${name}`;
        } else {
          currentDest = `src/pages/${name}`;
        }
      }
      handleEjsToFile(item, currentDest, url, pageCode, `${item}.${fileType}`);
    });
    return;
  }
  type = JSON.parse(type);
  if (type.table) {
    typeHandle(name, dest, type.table, urlConfig.vue2_table_url);
  }
  if (type.form) {
    typeHandle(name, dest, type.form, urlConfig.vue2_form_url);
  }
  if (type.default) {
    typeHandle(name, dest, type.default, urlConfig.vue2_default_url);
  }
};

const addPage = async (name, dest, pageCode) => {
  addComponent(name, dest, pageCode);
  //handleEjsToFile(name, dest, '../template/vue-router.js.ejs', 'router.js');
};

const addPageList = async (name, dest, type, pageCode) => {
  addComponentList(name, dest, type, pageCode);
  //handleEjsToFile(name[0], dest, '../template/vue-router.js.ejs', 'router.js');
};

const addStore = async (name, dest) => {
  handleEjsToFile(name, dest, '../template/vue-store.js.ejs', 'index.js');
  //handleEjsToFile(name, dest, '../template/vue-types.js.ejs', 'types.js')
};

module.exports = {
  createProject,
  addComponent,
  addComponentList,
  addPage,
  addPageList,
  addStore,
};
