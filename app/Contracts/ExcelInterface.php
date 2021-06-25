<?php

namespace App\Contracts;

interface ExcelInterface
{
    public function create($filename, $rows, $args = []);

    public function withMultipleSheets($filename, $sheets, $args = null);

    public function store($file, $filepath, $format = 'xlsx');

    public function createAndStore($filename, $rows, $args = []);

    public function download($file, $format = 'csv');

    public function read($filepath);

    public function getFirstSheetRows($filepath);
}
