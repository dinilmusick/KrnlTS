<?php

declare(strict_types=1);

namespace SkipoWP\Command;

use SkipoWP\Manifest;
use SkipoWP\Scaffold;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\{InputArgument,InputInterface};
use Symfony\Component\Console\Output\OutputInterface;

final class ScaffoldCommand extends Command {
    protected static $defaultName='scaffold';
    protected function configure(): void {
        $this->addArgument('path',InputArgument::REQUIRED)->addArgument('name',InputArgument::REQUIRED);
    }
    protected function execute(InputInterface $input,OutputInterface $output): int {
        $manifest=new Manifest((string)$input->getArgument('name'));
        $errors=(new \SkipoWP\Application($manifest))->validate();
        if($errors){foreach($errors as $error)$output->writeln('<error>'.$error.'</error>');return Command::FAILURE;}
        (new Scaffold())->create((string)$input->getArgument('path'),$manifest);
        $output->writeln('<info>SkipoWP application scaffolded.</info>');
        return Command::SUCCESS;
    }
}