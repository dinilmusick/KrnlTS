<?php
declare(strict_types=1);
$root=dirname(__DIR__);$rii=new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root));
$errors=[];
foreach($rii as $file){if(!$file->isFile()||$file->getExtension()!=='php'||str_contains($file->getPathname(),DIRECTORY_SEPARATOR.'vendor'.DIRECTORY_SEPARATOR))continue;
  $lines=count(file($file->getPathname()));if($lines>200)$errors[]=$file->getPathname().": $lines lines";
  exec('php -l '.escapeshellarg($file->getPathname()),$out,$code);if($code!==0)$errors[]=$file->getPathname().': syntax error';
}
if($errors){fwrite(STDERR,implode(PHP_EOL,$errors).PHP_EOL);exit(1);}
echo "PHP syntax + 200-line validation passed.".PHP_EOL;
