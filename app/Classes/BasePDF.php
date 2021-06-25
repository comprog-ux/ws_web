<?php

namespace App\Classes;

class BasePDF extends \TCPDF
{

    public function getLogoDimensions($logotype)
    {
        $logoDimensions = getimagesize($logotype);

        // Width larger than height.
        if ($logoDimensions[0] > $logoDimensions[1]) {
            $logoWidth  = 50;
            $logoHeight = 0;
        }
        // Height larger than width or equal.
        else {
            $logoWidth  = 0;
            $logoHeight = 15;
        }

        return ['width' => $logoWidth, 'height' => $logoHeight];
    }

    public function addFooterLogotype($pdf)
    {
        $logotype = public_path() . '/img/webshooter-logo.png';
        $pdf->Image($logotype, (210 - 60), 273, 50);
    }

}
