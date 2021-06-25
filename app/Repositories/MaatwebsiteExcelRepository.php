<?php namespace App\Repositories;

use App\Contracts\ExcelInterface;
use \Excel;

class MaatwebsiteExcelRepository implements ExcelInterface
{

    /**
     * Creates a file based on given data.
     *
     * @param  string $filename
     * @param  array $rows
     * @param  array $args
     * @return object
     */
    public function create($filename, $rows, $args = [])
    {
        $args['title']       = $this->getTitle($args);
        $args['creator']     = $this->getCreator($args);
        $args['company']     = $this->getCompany($args);
        $args['description'] = $this->getDescription($args);
        $args['keywords']    = $this->getKeywords($args);

        $filenameParts = pathinfo($filename);
        $filename      = $filenameParts['filename'];

        return Excel::create($filename, function ($excel) use ($rows, $args) {
            $excel->setTitle($args['title']);
            $excel->setCreator($args['creator']);
            $excel->setCompany($args['company']);
            $excel->setDescription($args['description']);
            $excel->setKeywords($args['keywords']);

            if (count($rows) === 0) {
                $rows[0] = [];
            }

            $excel->sheet('sheet1', function ($sheet) use ($rows) {

                // Make the header row bold.
                $sheet->cells('1:1', function ($cells) {
                    $cells->setFontWeight('bold');
                });

                if (!empty($rows[0])) {

                    // Make sure all columns in the rows are strings.
                    foreach ($rows as $rowIndex => $row) {
                        if (!empty($row) && is_array($row)) {
                            $rows[$rowIndex] = array_map('strval', $row);
                        } else {
                            $rows[$rowIndex] = $row;
                        }
                    }
                }

                $sheet->fromArray($rows);
            });

            // Create an empty second sheet, which is the default for most excel files.
            $excel->sheet('sheet2', function ($sheet) use ($rows) {

            });

        });
    }

    /**
     * Creates a file with multiple sheets based on given data.
     *
     * @param  string $filename
     * @param  array $sheets
     * @param  array $args
     * @return object
     */
    public function withMultipleSheets($filename, $sheets, $args = null)
    {
        if(empty($args)){
            $args = [];
        }

        $args['title']       = $this->getTitle($args);
        $args['creator']     = $this->getCreator($args);
        $args['company']     = $this->getCompany($args);
        $args['description'] = $this->getDescription($args);
        $args['keywords']    = $this->getKeywords($args);

        $filenameParts = pathinfo($filename);
        $filename      = $filenameParts['filename'];

        return Excel::create($filename, function ($excel) use ($sheets, $args) {
            $excel->setTitle($args['title']);
            $excel->setCreator($args['creator']);
            $excel->setCompany($args['company']);
            $excel->setDescription($args['description']);
            $excel->setKeywords($args['keywords']);

            foreach ($sheets as $data) {
                $excel->sheet($data['title'], function ($sheet) use ($data) {
                    // Make the header row bold.
                    $sheet->cells('1:1', function ($cells) {
                        $cells->setFontWeight('bold');
                    });

                    $sheet->fromArray($data['rows']);
                });
            }
        });
    }

    /**
     * Stores a file created with the create()-method.
     *
     * @param  object $file
     * @param  string $filepath
     * @param  string $format
     * @return void
     */
    public function store($file, $filepath, $format = 'xlsx')
    {
        $file->store($format, $filepath);
    }

    /**
     * Creates and stores an excel file in the app/temp-folder.
     * Basically a shortcut for the create() and store()-methods combined.
     *
     * @param  string $filename
     * @param  array $rows
     * @param  array $args
     * @return boolean
     */
    public function createAndStore($filename, $rows, $args = [])
    {
        $this->store($this->create($filename, $rows, $args), storage_path('app/temp'));

        return true;
    }

    /**
     * Downloads a file with the given format.
     * This file should be created first with the create()-method.
     *
     * @param  object $file
     * @param  string $format
     * @return response
     */
    public function download($file, $format = 'csv')
    {
        $file->download($format);
    }

    /**
     * Reads an excel file and returns the result as a collection.
     *
     * @param  string $filepath
     * @return Maatwebsite\Excel\Collections\RowCollection
     */
    public function read($filepath)
    {
        return Excel::load($filepath)->get();
    }

    /**
     * Returns the rows from the first sheet without the header.
     *
     * @param  string $filepath
     * @return collection
     */
    public function getFirstSheetRows($filepath)
    {
        $sheets = Excel::load($filepath, function ($reader) {
            $reader->noHeading();
        })->skip(1)->get();

        if(get_class($sheets->first()) === "Maatwebsite\Excel\Collections\RowCollection"){
            $sheets = $sheets->first();
        }

        return collect($sheets->toArray());
    }

    /**
     * @param  array $args
     * @return string
     */
    private function getTitle($args)
    {
        return (!empty($args['title'])) ? $args['title'] : 'Webshooter';
    }

    /**
     * @param  array $args
     * @return string
     */
    private function getCreator($args)
    {
        return (!empty($args['creator'])) ? $args['creator'] : 'Webshooter';
    }

    /**
     * @param  array $args
     * @return string
     */
    private function getCompany($args)
    {
        return (!empty($args['company'])) ? $args['company'] : 'Webshooter';
    }

    /**
     * @param  array $args
     * @return string
     */
    private function getDescription($args)
    {
        return (!empty($args['description'])) ? $args['description'] : '';
    }

    /**
     * @param  array $args
     * @return string
     */
    private function getKeywords($args)
    {
        return (!empty($args['keywords'])) ? $args['keywords'] : 'Webshooter';
    }

}
