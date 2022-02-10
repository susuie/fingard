const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const program = require('commander');
const inquirer = require("inquirer");
const downloadRepo = promisify(require('download-git-repo'));
const open = require('open');

const log = require('../utils/log');
const terminal = require('../utils/terminal');
const { ejsCompile, writeFile, mkdirSync } = require('../utils/file');
const repoConfig = require('../config/repo_config');
const create = async (project,clone)=>{
  const fse = require('fs-extra')
  const tmpdir = path.resolve(project)
  if(fse.existsSync(tmpdir)){
    const { action } = await inquirer.prompt([
      {
        name: 'action',
        type: 'list',
        message: `Target directory ${tmpdir} already exists. Pick an action:`,
        choices: [
          { name: 'Overwrite', value: 'overwrite' },
          { name: 'Merge', value: 'merge' },
          { name: 'Cancel', value: false }
        ]
      }
    ])
    if (!action) {
      return false;
    } else if (action === 'overwrite') {
      console.log(`\nRemoving ${tmpdir}...`)
      await fse.remove(tmpdir)
    }
  }
  log.hint("The project will be created at " + tmpdir);
  await downloadRepo(repoConfig.vueGitRepo, project, { clone });
  return true;
}
const createProject = async (project, otherArg) => {
  // 1.提示信息
  log.hint('The fingard is helping you to create your project, please wait a moment~');

  // 2.clone项目从仓库
  const result = await create(project,true);

  if(!result){
    return;
  }

  log.hint('The fingard start to install some packages,it may take a long time,please wait patiently~ ');
  // 3.执行终端命令npm install
  // terminal.exec('npm install', {cwd: `./${project}`});
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  await terminal.spawn(npm, ['install'], { cwd: `./${project}` });

  // 4.打开浏览器
  //open('http://localhost:8080/');

  // 5.运行项目
  //await terminal.spawn(npm, ['run', 'serve'], { cwd: `./${project}` });
}

const handleEjsToFile = async (name, dest, template, filename) => {
  // 1.获取模块引擎的路径
  const templatePath = path.resolve(__dirname, template);
  const result = await ejsCompile(templatePath, {name, lowerName: name.toLowerCase()});

  // 2.写入文件中
  // 判断文件不存在,那么就创建文件
  mkdirSync(dest);
  const targetPath = path.resolve(dest, filename);
  writeFile(targetPath, result);
}

const addComponent = async (name, dest) => {
  let url = '../template/component.vue.ejs';
  const { action } = await inquirer.prompt([
    {
      name: 'action',
      type: 'list',
      message: `Please select the type of component you want to create. Pick an action:`,
      choices: [
        { name: 'Form', value: 'Form' },
        { name: 'Table', value: 'Table' },
        { name: 'Default', value: 'Default' }
      ]
    }
  ])
  if (action === 'Form') {
    url = '../template/form-component.vue.ejs';
  } else if (action === 'Table') {
    url = '../template/table-component.vue.ejs';
  }
  handleEjsToFile(name, dest, url, `${name}.vue`);
}

const addPage = async (name, dest) => {
  addComponent(name, dest);
  handleEjsToFile(name, dest, '../template/vue-router.js.ejs', 'router.js')
}

const addStore = async (name, dest) => {
  handleEjsToFile(name, dest, '../template/vue-store.js.ejs', 'index.js')
  //handleEjsToFile(name, dest, '../template/vue-types.js.ejs', 'types.js')
}

module.exports = {
  createProject,
  addComponent,
  addPage,
  addStore
}