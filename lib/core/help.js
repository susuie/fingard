const program = require('commander');

const helpOptions = () => {
  program.option('-w --why', 'a fingard option');

  program.option('-s --src <src>', 'a source folder');
  program.option(
    '-d --dest <dest>',
    'a destination folder, 例如: -d src/pages, 错误/src/pages'
  );
  program.option('-f --framework <framework>', 'your framework name');
  program.option('-t --type <type>', 'types of new pages');
  program.option('-p --pageCode <pageCode>', 'pageCode of new pages');

  program.on('--help', function () {
    console.log('');
    console.log('usage');
    console.log('   fingard -v');
    console.log('   fingard -version');
  });
};

module.exports = helpOptions;
