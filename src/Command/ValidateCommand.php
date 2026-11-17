<?php

declare(strict_types=1);

namespace SkipoWP\Command;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\{InputArgument,InputInterface};
use Symfony\Component\Console\Output\OutputInterface;

final class ValidateCommand extends Command {
    protected static $defaultName='validate';
    protected function configure(): void { $this->addArgument('path',InputArgument::REQUIRED); }
    protected function execute(InputInterface $input,OutputInterface $output): int {
        $path=(string)$input->getArgument('path'); $file=$path.'/skipo.json';
        if(!is_file($file)){ $output->writeln('<error>Missing skipo.json</error>'); return Command::FAILURE; }
        $data=json_decode((string)file_get_contents($file),true);
        if(!is_array($data)){ $output->writeln('<error>Invalid skipo.json</error>'); return Command::FAILURE; }
        $output->writeln('<info>SkipoWP manifest valid.</info>'); return Command::SUCCESS;
    }
}