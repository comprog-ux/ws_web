<?php
namespace App\Classes;
use App\Models\Invoice;
use App\Models\Club;

class MyPdf extends BasePDF {

    /**
     * Invoice footer
     * @param object
     * @return void
     */
    public function Footer()
    {
        $this->line(10, 270, 200, 270, ['width'=>0.1,'color'=>[200,200,200]]);
        $this->SetXY(10, 272);
        $this->SetFont('helvetica', '', 8);

        $this->SetXY(10, 272);
        $this->cell(70, 6, _('© Webshooter LM AB - webshooter.se'), 0, 0, 'L', false );
        $this->SetXY(10, 272);
        $this->Cell(200, 6, _('Sida ').$this->getPageNumGroupAlias().'/'.$this->getPageGroupAlias(), '', 0, 'C');
        $this->SetX(190);

        $this->addFooterLogotype($this);
    }
}

class pdfInvoiceList {

    protected $invoices;

    public function __construct($invoices) {
        $this->invoices = $invoices;
        $this->leftMargin = 10;
        $this->topMargin = 20;
        $this->footerMargin = 30;
        $this->fontSize = 10;
        $this->fontColor = '70';
        $this->borderRadius = 2;
        $this->fillColor = [240,240,240];
        $this->lineColor = [200,200,200];
        $this->lineWidth = 0.1;
        $this->color1 = '#ffffff';
        $this->color2 = '#f0f0f0';
        $this->itemCells = [24, 26, 46, 16, 24, 24, 12, 24];
    }

    /**
     * Init the pdf
     */
    private function pdfSettings($pdf)
    {
        $pdf->SetPrintHeader(false);
        $pdf->SetPrintFooter(true);
        $pdf->SetHeaderMargin($this->topMargin);
        $pdf->setFooterMargin($this->footerMargin);
        $pdf->setLeftMargin($this->leftMargin);
        $pdf->setRightMargin($this->leftMargin);
        $pdf->SetAutoPageBreak(true, $this->footerMargin);
        $pdf->SetAuthor('Author');
        $pdf->SetDisplayMode('real', 'default');
        $pdf->SetFont('helvetica', '', $this->fontSize);
        $pdf->SetTextColor($this->fontColor);
    }

    public function create()
    {   
        $this->pdf = new MyPdf();
        $this->pdfSettings($this->pdf);
        
        $this->destination = 'I';
        $this->listHeader($this->pdf);

        $this->invoices($this->pdf);
        
        return $this->pdf->Output(_('Fakturalista').'.pdf','I');
    }
    
    public function listHeader($pdf)
    {
        $pdf->startPageGroup();
        $pdf->AddPage();
        $pdf->SetFont('helvetica', '', $this->fontSize+10);
        $logotype = public_path().'/img/webshooter-logo.png';
        
        $pdf->Image($logotype, $pdf->GetX(), $pdf->GetY(), 0, 15);

        $pdf->SetFont('helvetica', '', 20);
        $pdf->RoundedRect(108, 10, 92, 18, 2, '1111', 'F',null, [240,240,240]);
        $pdf->SetXY(110, 14);
        $pdf->cell(88, 0, _('Fakturalista'), '', 0, 'L');

        $pdf->SetFont('helvetica', '', $this->fontSize);
    }

    /**
     * List invoice items
     * @param object
     * @return void
     */
    private function invoices($pdf)
    {
        //items
        $pdf->RoundedRect($this->leftMargin, 35, 190, 8, $this->borderRadius, '1111', 'F',null ,$this->fillColor);
        $pdf->SetXY($this->leftMargin+2, 36);
        //Items Header
        $pdf->cell($this->itemCells[0], 6, _('Datum'), '', 0, 'L' );
        $pdf->cell($this->itemCells[1], 6, _('Fakturanr'), '', 0, 'L' );
        $pdf->cell($this->itemCells[2], 6, _('Mottagare'), '', 0, 'L' );
        $pdf->cell($this->itemCells[3], 6, _('Status'), '', 0, 'L' );
        $pdf->cell($this->itemCells[4], 6, _('Betaldatum'), '', 0, 'L' );
        $pdf->cell($this->itemCells[5], 6, _('Anmälningar'), '', 0, 'L' );
        $pdf->cell($this->itemCells[6], 6, _('Lag'), '', 0, 'L' );
        $pdf->cell($this->itemCells[7], 6, _('Summa'), '', 0, 'L' );
        // Start item listing
        $pdf->SetFont('helvetica', '', $this->fontSize-1);
        $row_count = 0;

        $posY = $pdf->GetY()+10;

        foreach($this->invoices as $row){
            $pdf->SetXY($this->leftMargin+2, $posY);
            $currentY = $posY;

            $pdf->cell($this->itemCells[0], 4, $row->invoice_date);
            $pdf->cell($this->itemCells[1], 4, $row->invoice_reference);
            $pdf->cell($this->itemCells[2], 4, $row->recipient_name);
            $pdf->cell($this->itemCells[3], 4, $row->payment_status);

            if($row->paid_at){
                $pdf->cell($this->itemCells[4], 4, date('Y-m-d', strtotime($row->paid_at)));    
            } else {
                $pdf->cell($this->itemCells[4], 4, '');
            }

            $pdf->cell($this->itemCells[5], 4, $row->signups_count);
            $pdf->cell($this->itemCells[6], 4, $row->teams_count);
            $pdf->cell($this->itemCells[7], 4, $row->amount);
            
            $posY = $pdf->GetY()+6;
        }
    }
}