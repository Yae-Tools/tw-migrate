import chalk from 'chalk';

export function exitMessage() {
  console.log('\n');
  console.log(chalk.green.bold('Thank you for using TW Migrate!'));
  console.log(
    chalk.blue('If you found this tool helpful, please consider starring the repository:'),
  );
  console.log(chalk.underline.blue('https://github.com/Yae-Tools/tw-migrate'));
  console.log(chalk.green('Your support helps us continue improving and maintaining the tool!'));
  console.log(chalk.green('Happy coding 😊'));
  process.exit(0);
}
