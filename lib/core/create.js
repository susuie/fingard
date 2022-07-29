const program = require('commander'); //引入命令工具

const {
  createProject,
  addComponent,
  addComponentList,
  addPage,
  addPageList,
  addStore,
} = require('./actions');

const createCommands = () => {
  // 创建项目指令
  program
    .command('create <project> [otherArgs...]')
    .description('clone a repository into a newly created directory')
    .action(createProject);

  program
    .command('addcpn <name>')
    .description(
      'add vue component, 例如: fingard addcpn NavBar [-d src/components]'
    )
    .action((name) => addComponent(name, program.dest || 'src/components'));

  program
    .command('addcpnlist')
    .arguments('<names...>')
    .description(
      'add vue components, 例如: fingard addcpnlist "NavBar","Head" [-d src/components] [-t {table:"1,2,3",form:"2"}]'
    )
    .action((names) =>
      addComponentList(names, program.dest || 'src/components', program.type)
    );

  program
    .command('addpage <name>')
    .description(
      'add vue page, 例如: fingard addpage Home [-d dest] [-p pageCode]'
    )
    .action((name) => {
      addPage(name, program.dest, program.pageCode ?? 'demo');
    });

  program
    .command('addpagelist')
    .arguments('<names...>')
    .description(
      'add vue pages, 例如: fingard addpagelist ["NavBar","Head"] [-d src/components] [-t {table:"1,2,3",form:"2"}] [-p [pageCode]]'
    )
    .action((names) =>
      addPageList(names, program.dest, program.type, program.pageCode ?? 'demo')
    );

  program
    .command('addstore <name>')
    .description('add vue store, 例如: fingard addstore favor [-d dest]')
    .action((name) => {
      addStore(name, program.dest || `src/store/modules/${name.toLowerCase()}`);
    });

  program.command('test').action(() => {
    // terminal.spawn("npm", ['--version']);
    // terminal.exec("npm --version");
    // open('http://localhost:8080/');`
  });
};

module.exports = createCommands;
